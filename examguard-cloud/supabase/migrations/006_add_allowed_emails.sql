-- Add allowed_emails to forms table
ALTER TABLE forms
ADD COLUMN allowed_emails TEXT DEFAULT NULL;

-- Update the check_session_conflict RPC to enforce allowed_emails
CREATE OR REPLACE FUNCTION check_session_conflict(
    student_email TEXT,
    target_form_id UUID
)
RETURNS JSON AS $$
DECLARE
    existing RECORD;
    one_submission BOOLEAN;
    v_allowed_emails TEXT;
BEGIN
    -- Check if form is restricted by email whitelist
    SELECT allowed_emails INTO v_allowed_emails
    FROM forms WHERE id = target_form_id;

    IF v_allowed_emails IS NOT NULL AND TRIM(v_allowed_emails) != '' THEN
        -- Check if student_email is in the comma-separated or newline-separated list
        -- We normalize by replacing newlines with commas, then splitting and trimming.
        IF NOT (
            LOWER(TRIM(student_email)) = ANY (
                SELECT TRIM(unnest) 
                FROM unnest(string_to_array(replace(replace(LOWER(v_allowed_emails), chr(13), ''), chr(10), ','), ','))
                WHERE TRIM(unnest) != ''
            )
        ) THEN
            RETURN json_build_object(
                'allowed', false,
                'reason', 'not_allowed',
                'message', 'You do not have permission to access this exam.'
            );
        END IF;
    END IF;

    -- Check for terminated sessions (permanent block)
    SELECT INTO existing id, token, status, score, started_at
    FROM sessions
    WHERE email = LOWER(TRIM(student_email))
      AND form_id = target_form_id
      AND status = 'TERMINATED'
    LIMIT 1;

    IF FOUND THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'terminated',
            'message', 'Your exam session was TERMINATED due to academic integrity violations. You cannot resume or retake this exam.'
        );
    END IF;

    -- Check one-submission config
    SELECT (value = 'TRUE') INTO one_submission
    FROM config WHERE key = 'One Email One Submission';
    one_submission := COALESCE(one_submission, TRUE);

    -- Check for completed sessions
    SELECT INTO existing id, token, status, score, started_at
    FROM sessions
    WHERE email = LOWER(TRIM(student_email))
      AND form_id = target_form_id
      AND status = 'COMPLETED'
    LIMIT 1;

    IF FOUND AND one_submission THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'completed',
            'message', 'You have already completed and submitted this exam. Only one submission per email address is allowed.'
        );
    END IF;

    -- Check for active sessions (resume)
    SELECT INTO existing id, token, status, score, started_at
    FROM sessions
    WHERE email = LOWER(TRIM(student_email))
      AND form_id = target_form_id
      AND status = 'ACTIVE'
    LIMIT 1;

    IF FOUND THEN
        RETURN json_build_object(
            'allowed', true,
            'reason', 'resume',
            'session_id', existing.id,
            'token', existing.token,
            'score', existing.score,
            'started_at', existing.started_at,
            'message', 'Resuming your existing session.'
        );
    END IF;

    -- Check one-submission with any prior session
    IF one_submission THEN
        SELECT INTO existing id FROM sessions
        WHERE email = LOWER(TRIM(student_email))
          AND form_id = target_form_id
        LIMIT 1;

        IF FOUND THEN
            RETURN json_build_object(
                'allowed', false,
                'reason', 'one_submission',
                'message', 'Only one submission per email address is allowed. You cannot start a new attempt.'
            );
        END IF;
    END IF;

    -- No conflicts
    RETURN json_build_object(
        'allowed', true,
        'reason', 'new',
        'message', 'Ready to start a new session.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
