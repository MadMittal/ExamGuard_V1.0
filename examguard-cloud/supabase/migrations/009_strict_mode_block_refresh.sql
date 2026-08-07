-- STRICT MODE: Block resuming active sessions to prevent hard-refresh bypass
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

    -- Check for terminated sessions
    SELECT INTO existing id
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
    SELECT INTO existing id
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

    -- STRICT MODE: Check for active sessions (Prevent Resume on Refresh)
    SELECT INTO existing id
    FROM sessions
    WHERE email = LOWER(TRIM(student_email))
      AND form_id = target_form_id
      AND status = 'ACTIVE'
    LIMIT 1;

    IF FOUND THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'active_conflict',
            'message', 'You already have an active exam session. Refreshing the page or attempting to restart is not allowed. Please contact your instructor.'
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
