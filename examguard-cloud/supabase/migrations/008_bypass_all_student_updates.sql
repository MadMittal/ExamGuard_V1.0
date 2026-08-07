-- Fix: Student session updates failing due to missing auth.jwt() emails
-- This creates/updates RPCs to bypass RLS for session updates, using the UUID token as auth.

-- 1. Heartbeat RPC (for updating score, violations, and last_seen)
CREATE OR REPLACE FUNCTION heartbeat_student_session(
    session_token UUID,
    new_score INTEGER,
    new_violations INTEGER,
    new_summary JSONB
)
RETURNS JSON AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT INTO v_session id, status
    FROM sessions
    WHERE token = session_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Session not found');
    END IF;

    IF v_session.status != 'ACTIVE' THEN
        RETURN json_build_object('success', false, 'message', 'Session is not active');
    END IF;

    UPDATE sessions
    SET score = new_score,
        violations = new_violations,
        violation_summary = new_summary,
        last_seen = NOW()
    WHERE token = session_token
      AND status = 'ACTIVE';

    RETURN json_build_object('success', true, 'message', 'Heartbeat updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. End Session RPC (updated to remove the auth.jwt() dependency)
CREATE OR REPLACE FUNCTION end_student_session(
    session_token UUID,
    new_status TEXT,
    end_reason TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
    v_session RECORD;
BEGIN
    IF new_status NOT IN ('TERMINATED', 'COMPLETED') THEN
        RETURN json_build_object('success', false, 'message', 'Invalid status');
    END IF;

    SELECT INTO v_session id, status
    FROM sessions
    WHERE token = session_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Session not found');
    END IF;

    IF v_session.status != 'ACTIVE' THEN
        RETURN json_build_object('success', true, 'message', 'Session already ended');
    END IF;

    UPDATE sessions
    SET status = new_status,
        ended_at = NOW(),
        reason = end_reason
    WHERE token = session_token
      AND status = 'ACTIVE';

    RETURN json_build_object('success', true, 'message', 'Session ended');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
