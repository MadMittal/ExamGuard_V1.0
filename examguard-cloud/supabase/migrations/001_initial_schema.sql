-- ============================================================================
-- ExamGuard Cloud — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables, enums, indexes, RLS policies, functions,
--              and seed data for the ExamGuard examination proctoring system.
-- ============================================================================

-- ============================================================================
-- 1. ENUMERATED TYPES
-- ============================================================================

CREATE TYPE session_status AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED');
CREATE TYPE user_role AS ENUM ('admin', 'ta');
CREATE TYPE event_type AS ENUM (
    'tab_switch',
    'tab_return',
    'focus_loss',
    'fullscreen_exit',
    'split_screen',
    'copy',
    'paste',
    'right_click',
    'keyboard_shortcut',
    'devtools',
    'idle',
    'admin_flag'
);

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Auto-update timestamp trigger function (shared by multiple tables)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the current user is an admin or TA
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'ta')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 User Roles
CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'ta',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);
COMMENT ON TABLE user_roles IS 'Maps Supabase Auth users to admin/TA roles. Students do not have entries here.';

-- 3.2 Config (Key-Value Settings)
CREATE TABLE config (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL DEFAULT '',
    notes       TEXT DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE config IS 'Key-value settings store. Mirrors EG_Config from the original Sheets system.';

CREATE TRIGGER config_updated_at
    BEFORE UPDATE ON config
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 3.3 Forms (Google Form Links)
CREATE TABLE forms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order      INT NOT NULL DEFAULT 0,
    form_name       TEXT NOT NULL DEFAULT 'Untitled Exam',
    google_form_id  TEXT NOT NULL,
    email_field     TEXT NOT NULL DEFAULT 'Email Address',
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    webcam_override TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(google_form_id)
);
COMMENT ON TABLE forms IS 'Google Forms linked for exam delivery.';

CREATE TRIGGER forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 3.4 Students (Roster)
CREATE TABLE students (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    name        TEXT DEFAULT '',
    roll_no     TEXT DEFAULT '',
    section     TEXT DEFAULT '',
    allowed     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(email)
);
COMMENT ON TABLE students IS 'Student roster for CLOSED roster mode.';

-- 3.5 Sessions (Core Table)
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token               TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    email               TEXT NOT NULL,
    student_name        TEXT DEFAULT '',
    roll_no             TEXT DEFAULT '',
    section             TEXT DEFAULT '',
    form_id             UUID NOT NULL REFERENCES forms(id) ON DELETE RESTRICT,
    form_name           TEXT DEFAULT '',
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status              session_status NOT NULL DEFAULT 'ACTIVE',
    score               INT NOT NULL DEFAULT 100 CHECK (score >= 0 AND score <= 100),
    violations          INT NOT NULL DEFAULT 0 CHECK (violations >= 0),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,
    reason              TEXT DEFAULT '',
    violation_summary   JSONB DEFAULT '{}'::JSONB,
    UNIQUE(token)
);
COMMENT ON TABLE sessions IS 'Core exam session records. Each row = one student attempt.';
COMMENT ON COLUMN sessions.token IS 'Client-facing session identifier (UUIDv4).';
COMMENT ON COLUMN sessions.violation_summary IS 'Denormalized JSONB: {"tab_switch": 2, "focus_loss": 1, ...}';

-- 3.6 Activity Events (Violation Log)
CREATE TABLE activity_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type      event_type NOT NULL,
    score_at_event  INT DEFAULT 100,
    duration        TEXT DEFAULT '',
    detail          TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE activity_events IS 'Individual violation events. High-volume table.';

-- 3.7 Reports (Materialized Report Data)
CREATE TABLE reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_name        TEXT DEFAULT '',
    email               TEXT NOT NULL,
    roll_no             TEXT DEFAULT '',
    section             TEXT DEFAULT '',
    form_name           TEXT DEFAULT '',
    score               INT DEFAULT 0,
    tab_switches        INT DEFAULT 0,
    focus_losses        INT DEFAULT 0,
    fullscreen_exits    INT DEFAULT 0,
    copy_events         INT DEFAULT 0,
    paste_events        INT DEFAULT 0,
    right_clicks        INT DEFAULT 0,
    keyboard_shortcuts  INT DEFAULT 0,
    idle_events         INT DEFAULT 0,
    status              session_status,
    started_at          TIMESTAMPTZ,
    ended_at            TIMESTAMPTZ,
    violation_summary   TEXT DEFAULT '',
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id)
);
COMMENT ON TABLE reports IS 'Materialized report data. Generated on-demand by admin.';

-- 3.8 Webcam Snapshots (Metadata)
CREATE TABLE webcam_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,
    file_size_bytes INT DEFAULT 0,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE webcam_snapshots IS 'Metadata for webcam snapshot files in Supabase Storage.';

-- ============================================================================
-- 4. INDEXES (Performance-Critical)
-- ============================================================================

-- Session lookup by email + form (hottest query path: every student login)
CREATE INDEX idx_sessions_email_form ON sessions(email, form_id);

-- Active sessions filter (admin dashboard)
CREATE INDEX idx_sessions_active ON sessions(status) WHERE status = 'ACTIVE';

-- Activity events by session (report generation)
CREATE INDEX idx_activity_session ON activity_events(session_id);

-- Activity events by session + type (violation counting)
CREATE INDEX idx_activity_session_type ON activity_events(session_id, event_type);

-- Active forms lookup (every student page load)
CREATE INDEX idx_forms_active ON forms(active) WHERE active = TRUE;

-- Sessions by last_seen (stale session detection)
CREATE INDEX idx_sessions_last_seen ON sessions(last_seen) WHERE status = 'ACTIVE';

-- Webcam snapshots by session
CREATE INDEX idx_webcam_session ON webcam_snapshots(session_id);

-- ============================================================================
-- 5. ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webcam_snapshots ENABLE ROW LEVEL SECURITY;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- User Roles: Admin self-read only
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "user_roles_self_read" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Config: Public read (specific keys), admin write
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "config_public_read" ON config
    FOR SELECT USING (
        key IN (
            'Institution Name', 'Roster Mode', 'Show Score to Student',
            'Monitor Tabs', 'Monitor Focus', 'Require Fullscreen',
            'Monitor Split Screen', 'Monitor Clipboard', 'Monitor Right Click',
            'Monitor Keyboard', 'Webcam Snapshots', 'Webcam Interval (sec)',
            'Idle Timeout (sec)',
            'Deduct: Tab Switch', 'Deduct: Focus Loss', 'Deduct: Fullscreen',
            'Deduct: Copy', 'Deduct: Paste', 'Deduct: Right Click',
            'Deduct: Keyboard', 'Deduct: Idle',
            'Max: Tab Switches', 'Max: Focus Losses', 'Max: Fullscreen Exits',
            'Max: Total Violations', 'Min Score for Auto-End',
            'Auto End on Violations', 'One Email One Submission'
        )
    );

CREATE POLICY "config_admin_read" ON config
    FOR SELECT USING (is_admin());

CREATE POLICY "config_admin_write" ON config
    FOR UPDATE USING (is_admin());

CREATE POLICY "config_admin_insert" ON config
    FOR INSERT WITH CHECK (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Forms: Public read active forms, admin full access
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "forms_public_read_active" ON forms
    FOR SELECT USING (
        active = TRUE
        AND (start_time IS NULL OR start_time <= NOW())
        AND (end_time IS NULL OR end_time >= NOW())
    );

CREATE POLICY "forms_admin_read" ON forms
    FOR SELECT USING (is_admin());

CREATE POLICY "forms_admin_insert" ON forms
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "forms_admin_update" ON forms
    FOR UPDATE USING (is_admin());

CREATE POLICY "forms_admin_delete" ON forms
    FOR DELETE USING (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Students: Read own email, admin full access
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "students_read_own" ON students
    FOR SELECT USING (
        LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
    );

CREATE POLICY "students_admin_read" ON students
    FOR SELECT USING (is_admin());

CREATE POLICY "students_admin_insert" ON students
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "students_admin_update" ON students
    FOR UPDATE USING (is_admin());

CREATE POLICY "students_admin_delete" ON students
    FOR DELETE USING (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Sessions: Students own data, admin full access
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "sessions_student_read" ON sessions
    FOR SELECT USING (
        LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
    );

CREATE POLICY "sessions_student_insert" ON sessions
    FOR INSERT WITH CHECK (
        LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
    );

CREATE POLICY "sessions_student_update" ON sessions
    FOR UPDATE USING (
        LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
        AND status = 'ACTIVE'
    );

CREATE POLICY "sessions_admin_all" ON sessions
    FOR ALL USING (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Activity Events: Students insert for own sessions, admin full access
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "activity_student_insert" ON activity_events
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM sessions
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
            AND status = 'ACTIVE'
        )
    );

CREATE POLICY "activity_student_read" ON activity_events
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );

CREATE POLICY "activity_admin_all" ON activity_events
    FOR ALL USING (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Reports: Admin only
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "reports_admin_all" ON reports
    FOR ALL USING (is_admin());

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Webcam Snapshots: Students insert for own sessions, admin full access
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE POLICY "webcam_student_insert" ON webcam_snapshots
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM sessions
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
            AND status = 'ACTIVE'
        )
    );

CREATE POLICY "webcam_admin_all" ON webcam_snapshots
    FOR ALL USING (is_admin());

-- ============================================================================
-- 6. DATABASE FUNCTIONS (RPC)
-- ============================================================================

-- 6.1 Dashboard Metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(target_form_id UUID DEFAULT NULL)
RETURNS JSON AS $$
    SELECT json_build_object(
        'active',     COUNT(*) FILTER (WHERE status = 'ACTIVE'),
        'completed',  COUNT(*) FILTER (WHERE status = 'COMPLETED'),
        'terminated', COUNT(*) FILTER (WHERE status = 'TERMINATED'),
        'alert',      COUNT(*) FILTER (WHERE status = 'ACTIVE' AND score < 80),
        'total',      COUNT(*)
    )
    FROM sessions
    WHERE (target_form_id IS NULL OR form_id = target_form_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6.2 Report Generation
CREATE OR REPLACE FUNCTION generate_report(target_form_id UUID DEFAULT NULL)
RETURNS INT AS $$
DECLARE
    report_count INT;
BEGIN
    INSERT INTO reports (
        session_id, student_name, email, roll_no, section, form_name,
        score, tab_switches, focus_losses, fullscreen_exits,
        copy_events, paste_events, right_clicks, keyboard_shortcuts,
        idle_events, status, started_at, ended_at, violation_summary, generated_at
    )
    SELECT
        s.id,
        s.student_name,
        s.email,
        s.roll_no,
        s.section,
        s.form_name,
        s.score,
        COALESCE((s.violation_summary->>'tab_switch')::INT, 0),
        COALESCE((s.violation_summary->>'focus_loss')::INT, 0),
        COALESCE((s.violation_summary->>'fullscreen_exit')::INT, 0) +
            COALESCE((s.violation_summary->>'split_screen')::INT, 0),
        COALESCE((s.violation_summary->>'copy')::INT, 0),
        COALESCE((s.violation_summary->>'paste')::INT, 0),
        COALESCE((s.violation_summary->>'right_click')::INT, 0),
        COALESCE((s.violation_summary->>'keyboard_shortcut')::INT, 0),
        COALESCE((s.violation_summary->>'idle')::INT, 0),
        s.status,
        s.started_at,
        s.ended_at,
        s.reason,
        NOW()
    FROM sessions s
    WHERE (target_form_id IS NULL OR s.form_id = target_form_id)
    ON CONFLICT (session_id) DO UPDATE SET
        score = EXCLUDED.score,
        tab_switches = EXCLUDED.tab_switches,
        focus_losses = EXCLUDED.focus_losses,
        fullscreen_exits = EXCLUDED.fullscreen_exits,
        copy_events = EXCLUDED.copy_events,
        paste_events = EXCLUDED.paste_events,
        right_clicks = EXCLUDED.right_clicks,
        keyboard_shortcuts = EXCLUDED.keyboard_shortcuts,
        idle_events = EXCLUDED.idle_events,
        status = EXCLUDED.status,
        ended_at = EXCLUDED.ended_at,
        violation_summary = EXCLUDED.violation_summary,
        generated_at = NOW();

    GET DIAGNOSTICS report_count = ROW_COUNT;
    RETURN report_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Data Cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INT DEFAULT 180)
RETURNS JSON AS $$
DECLARE
    deleted_events INT;
    deleted_reports INT;
    deleted_sessions INT;
    deleted_snapshots INT;
    cutoff TIMESTAMPTZ;
BEGIN
    cutoff := NOW() - (days_old || ' days')::INTERVAL;

    DELETE FROM webcam_snapshots
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_snapshots = ROW_COUNT;

    DELETE FROM activity_events
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_events = ROW_COUNT;

    DELETE FROM reports
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_reports = ROW_COUNT;

    DELETE FROM sessions WHERE started_at < cutoff;
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

    RETURN json_build_object(
        'cutoff_date', cutoff,
        'deleted_sessions', deleted_sessions,
        'deleted_events', deleted_events,
        'deleted_reports', deleted_reports,
        'deleted_snapshots', deleted_snapshots
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Session Conflict Check
CREATE OR REPLACE FUNCTION check_session_conflict(
    student_email TEXT,
    target_form_id UUID
)
RETURNS JSON AS $$
DECLARE
    existing RECORD;
    one_submission BOOLEAN;
BEGIN
    -- Check for terminated sessions (permanent block)
    SELECT INTO existing id, token, status, score
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
    SELECT INTO existing id, token, status, score
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
    SELECT INTO existing id, token, status, score
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

-- ============================================================================
-- 7. REALTIME PUBLICATION
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;

-- ============================================================================
-- 8. STORAGE BUCKET
-- ============================================================================

-- Note: Run this in Supabase dashboard or via API, not directly in SQL
-- INSERT INTO storage.buckets (id, name, public) VALUES ('webcam', 'webcam', FALSE);
