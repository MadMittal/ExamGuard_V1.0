-- Fix: Student session termination/completion silently blocked by RLS
-- The sessions_student_update policy requires status = 'ACTIVE' for both
-- USING and WITH CHECK, so changing status to TERMINATED/COMPLETED is rejected.
-- 
-- This RPC runs as SECURITY DEFINER (bypasses RLS) but validates ownership
-- by checking the caller's JWT email matches the session's email.

CREATE OR REPLACE FUNCTION end_student_session(
    session_token UUID,
    new_status TEXT,
    end_reason TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
    caller_email TEXT;
    v_session RECORD;
BEGIN
    -- Get caller's email from JWT
    caller_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
    
    IF caller_email = '' THEN
        RETURN json_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Validate new_status
    IF new_status NOT IN ('TERMINATED', 'COMPLETED') THEN
        RETURN json_build_object('success', false, 'message', 'Invalid status');
    END IF;

    -- Find the session and verify ownership
    SELECT INTO v_session id, email, status
    FROM sessions
    WHERE token = session_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Session not found');
    END IF;

    IF LOWER(TRIM(v_session.email)) != caller_email THEN
        RETURN json_build_object('success', false, 'message', 'Not your session');
    END IF;

    IF v_session.status != 'ACTIVE' THEN
        -- Already ended, that's fine
        RETURN json_build_object('success', true, 'message', 'Session already ended');
    END IF;

    -- Perform the update (bypasses RLS since SECURITY DEFINER)
    UPDATE sessions
    SET status = new_status,
        ended_at = NOW(),
        reason = end_reason
    WHERE token = session_token
      AND status = 'ACTIVE';

    RETURN json_build_object('success', true, 'message', 'Session ended');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
