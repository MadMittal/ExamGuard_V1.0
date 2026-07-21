# ExamGuard Cloud — Backend Schema

**Version**: 1.0  
**Date**: July 21, 2025  
**Author**: Solutions Architect  

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    USER_ROLES ||--o{ SESSIONS : "admin manages"
    FORMS ||--o{ SESSIONS : "hosts"
    STUDENTS ||--o{ SESSIONS : "takes"
    SESSIONS ||--o{ ACTIVITY_EVENTS : "generates"
    SESSIONS ||--o| REPORTS : "summarized in"
    SESSIONS ||--o{ WEBCAM_SNAPSHOTS : "captures"
    CONFIG ||--|| CONFIG : "singleton settings"

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        text email
        text role
        timestamp created_at
    }

    CONFIG {
        text key PK
        text value
        text notes
        timestamp updated_at
    }

    FORMS {
        uuid id PK
        int sort_order
        text form_name
        text google_form_id
        text email_field
        timestamp start_time
        timestamp end_time
        boolean active
        text webcam_override
        timestamp created_at
        timestamp updated_at
    }

    STUDENTS {
        uuid id PK
        text email UK
        text name
        text roll_no
        text section
        boolean allowed
        timestamp created_at
    }

    SESSIONS {
        uuid id PK
        text token UK
        text email
        text student_name
        text roll_no
        text section
        uuid form_id FK
        text form_name
        timestamp started_at
        text status
        int score
        int violations
        timestamp last_seen
        timestamp ended_at
        text reason
        jsonb violation_summary
    }

    ACTIVITY_EVENTS {
        uuid id PK
        uuid session_id FK
        text event_type
        int score_at_event
        text duration
        text detail
        timestamp created_at
    }

    REPORTS {
        uuid id PK
        uuid session_id FK UK
        text student_name
        text email
        text roll_no
        text section
        text form_name
        int score
        int tab_switches
        int focus_losses
        int fullscreen_exits
        int copy_events
        int paste_events
        int right_clicks
        int keyboard_shortcuts
        int idle_events
        text status
        timestamp started_at
        timestamp ended_at
        text violation_summary
        timestamp generated_at
    }

    WEBCAM_SNAPSHOTS {
        uuid id PK
        uuid session_id FK
        text file_path
        int file_size_bytes
        timestamp captured_at
    }
```

---

## 2. Table Definitions

### 2.1 Enumerated Types

```sql
-- Session status enum
CREATE TYPE session_status AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED');

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'ta');

-- Violation event types (matching the 11 types from ExamGuard 2.0)
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
```

### 2.2 User Roles Table

```sql
CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'ta',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

COMMENT ON TABLE user_roles IS 'Maps Supabase Auth users to admin/TA roles. Students do not have entries here.';
```

### 2.3 Config Table

```sql
CREATE TABLE config (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL DEFAULT '',
    notes       TEXT DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE config IS 'Key-value settings store. Maps to EG_Config in the original Sheets system.';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_updated_at
    BEFORE UPDATE ON config
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();
```

### 2.4 Forms Table

```sql
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

COMMENT ON TABLE forms IS 'Google Forms linked for exam delivery. Maps to EG_Forms sheet.';

-- Auto-update timestamp trigger
CREATE TRIGGER forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();
```

### 2.5 Students Table

```sql
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

COMMENT ON TABLE students IS 'Student roster for CLOSED roster mode. Maps to EG_Students sheet.';
```

### 2.6 Sessions Table (Core Table)

```sql
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

COMMENT ON TABLE sessions IS 'Core exam session records. Each row = one student attempt. Maps to EG_Sessions sheet.';
COMMENT ON COLUMN sessions.token IS 'Client-facing session identifier. UUIDv4, used as API key for the session.';
COMMENT ON COLUMN sessions.violation_summary IS 'Denormalized JSONB object: {"tab_switch": 2, "focus_loss": 1, ...}. Updated on each heartbeat.';
COMMENT ON COLUMN sessions.score IS 'Integrity score starting at 100, decremented by violation deductions.';
```

### 2.7 Activity Events Table

```sql
CREATE TABLE activity_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type      event_type NOT NULL,
    score_at_event  INT DEFAULT 100,
    duration        TEXT DEFAULT '',
    detail          TEXT DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE activity_events IS 'Individual violation events. Maps to EG_Activity sheet. High-volume table.';
COMMENT ON COLUMN activity_events.score_at_event IS 'Snapshot of the session score at the moment this event was recorded.';
COMMENT ON COLUMN activity_events.duration IS 'Duration in seconds for time-based events (idle timeout).';
COMMENT ON COLUMN activity_events.detail IS 'Additional context: key combo for keyboard events, etc.';
```

### 2.8 Reports Table

```sql
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

COMMENT ON TABLE reports IS 'Materialized report data. Generated on-demand by admin. Maps to EG_Report sheet.';
```

### 2.9 Webcam Snapshots Table

```sql
CREATE TABLE webcam_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,
    file_size_bytes INT DEFAULT 0,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE webcam_snapshots IS 'Metadata for webcam snapshot files stored in Supabase Storage.';
```

---

## 3. Indexing Strategy

### 3.1 Primary Indexes (Auto-Created)

All `PRIMARY KEY` and `UNIQUE` constraints automatically create B-tree indexes:

| Table | Index | Type |
|-------|-------|------|
| sessions | `sessions_pkey` (id) | B-tree |
| sessions | `sessions_token_key` (token) | B-tree (unique) |
| students | `students_pkey` (id) | B-tree |
| students | `students_email_key` (email) | B-tree (unique) |
| forms | `forms_pkey` (id) | B-tree |
| forms | `forms_google_form_id_key` (google_form_id) | B-tree (unique) |
| activity_events | `activity_events_pkey` (id) | B-tree |
| reports | `reports_session_id_key` (session_id) | B-tree (unique) |

### 3.2 Custom Indexes (Performance-Critical)

```sql
-- Session lookup by email + form (used during session start to check conflicts)
-- This is the hottest query path: called for every student login
CREATE INDEX idx_sessions_email_form 
    ON sessions(email, form_id);

-- Active sessions filter (used by admin dashboard — frequently queried)
CREATE INDEX idx_sessions_status 
    ON sessions(status) 
    WHERE status = 'ACTIVE';

-- Activity events by session (used for report generation)
CREATE INDEX idx_activity_session 
    ON activity_events(session_id);

-- Activity events by session + type (used for violation counting)
CREATE INDEX idx_activity_session_type 
    ON activity_events(session_id, event_type);

-- Forms active lookup (used on every student page load)
CREATE INDEX idx_forms_active 
    ON forms(active) 
    WHERE active = TRUE;

-- Sessions by last_seen (used for stale session detection)
CREATE INDEX idx_sessions_last_seen 
    ON sessions(last_seen) 
    WHERE status = 'ACTIVE';

-- Webcam snapshots by session (used for snapshot retrieval)
CREATE INDEX idx_webcam_session 
    ON webcam_snapshots(session_id);
```

### 3.3 Index Size Estimate

```
Assumption: 500 students × 20 exams/semester = 10,000 session rows

idx_sessions_email_form:    ~400 KB  (composite B-tree, 10K rows)
idx_sessions_status:        ~80 KB   (partial index, only ACTIVE rows)
idx_activity_session:       ~4 MB    (10K sessions × 30 events avg = 300K rows)
idx_activity_session_type:  ~6 MB    (composite on 300K rows)
idx_forms_active:           ~8 KB    (very few rows)
idx_sessions_last_seen:     ~80 KB   (partial, only ACTIVE rows)

Total index overhead:       ~11 MB per semester << 500 MB limit ✅
```

---

## 4. Row-Level Security (RLS) Policies

### 4.1 Enable RLS on All Tables

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webcam_snapshots ENABLE ROW LEVEL SECURITY;
```

### 4.2 Helper Function

```sql
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
```

### 4.3 Policies by Table

#### Config (Admin read/write only)

```sql
CREATE POLICY "config_admin_read" ON config
    FOR SELECT USING (is_admin());

CREATE POLICY "config_admin_write" ON config
    FOR ALL USING (is_admin());

-- Allow anon/students to read specific public settings
CREATE POLICY "config_public_read" ON config
    FOR SELECT USING (
        key IN ('Institution Name', 'Roster Mode', 'Show Score to Student',
                'Monitor Tabs', 'Monitor Focus', 'Require Fullscreen',
                'Monitor Split Screen', 'Monitor Clipboard', 'Monitor Right Click',
                'Monitor Keyboard', 'Webcam Snapshots', 'Webcam Interval (sec)',
                'Idle Timeout (sec)')
    );
```

#### Forms (Public read active, admin write)

```sql
CREATE POLICY "forms_public_read_active" ON forms
    FOR SELECT USING (
        active = TRUE
        AND (start_time IS NULL OR start_time <= NOW())
        AND (end_time IS NULL OR end_time >= NOW())
    );

CREATE POLICY "forms_admin_all" ON forms
    FOR ALL USING (is_admin());
```

#### Students (Public read own email, admin write)

```sql
CREATE POLICY "students_read_own" ON students
    FOR SELECT USING (
        email = LOWER(TRIM(auth.jwt() ->> 'email'))
    );

CREATE POLICY "students_admin_all" ON students
    FOR ALL USING (is_admin());
```

#### Sessions (Core security policies)

```sql
-- Students can read only their own sessions
CREATE POLICY "sessions_student_read" ON sessions
    FOR SELECT USING (
        email = LOWER(TRIM(auth.jwt() ->> 'email'))
    );

-- Students can insert sessions for their own email
CREATE POLICY "sessions_student_insert" ON sessions
    FOR INSERT WITH CHECK (
        email = LOWER(TRIM(auth.jwt() ->> 'email'))
    );

-- Students can update only their own ACTIVE sessions
CREATE POLICY "sessions_student_update" ON sessions
    FOR UPDATE USING (
        email = LOWER(TRIM(auth.jwt() ->> 'email'))
        AND status = 'ACTIVE'
    );

-- Admins have full access
CREATE POLICY "sessions_admin_all" ON sessions
    FOR ALL USING (is_admin());
```

#### Activity Events (Append-only for students)

```sql
-- Students can insert events for their own sessions
CREATE POLICY "activity_student_insert" ON activity_events
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM sessions
            WHERE email = LOWER(TRIM(auth.jwt() ->> 'email'))
            AND status = 'ACTIVE'
        )
    );

-- Students can read their own events
CREATE POLICY "activity_student_read" ON activity_events
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM sessions
            WHERE email = LOWER(TRIM(auth.jwt() ->> 'email'))
        )
    );

-- Admins have full access
CREATE POLICY "activity_admin_all" ON activity_events
    FOR ALL USING (is_admin());
```

#### Reports (Admin-only)

```sql
CREATE POLICY "reports_admin_all" ON reports
    FOR ALL USING (is_admin());
```

#### Webcam Snapshots (Own session insert, admin read)

```sql
CREATE POLICY "webcam_student_insert" ON webcam_snapshots
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM sessions
            WHERE email = LOWER(TRIM(auth.jwt() ->> 'email'))
            AND status = 'ACTIVE'
        )
    );

CREATE POLICY "webcam_admin_read" ON webcam_snapshots
    FOR ALL USING (is_admin());
```

---

## 5. Database Functions

### 5.1 Dashboard Metrics

```sql
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
```

### 5.2 Report Generation

```sql
CREATE OR REPLACE FUNCTION generate_report(target_form_id UUID DEFAULT NULL)
RETURNS INT AS $$
DECLARE
    report_count INT;
BEGIN
    -- Upsert report rows for all sessions (or filtered by form)
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
```

### 5.3 Data Cleanup (Free-Tier Storage Management)

```sql
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

    -- Delete webcam snapshot metadata (files must be cleaned separately)
    DELETE FROM webcam_snapshots
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_snapshots = ROW_COUNT;

    -- Delete activity events
    DELETE FROM activity_events
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_events = ROW_COUNT;

    -- Delete reports
    DELETE FROM reports
    WHERE session_id IN (SELECT id FROM sessions WHERE started_at < cutoff);
    GET DIAGNOSTICS deleted_reports = ROW_COUNT;

    -- Delete sessions
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
```

### 5.4 Session Conflict Check

```sql
CREATE OR REPLACE FUNCTION check_session_conflict(
    student_email TEXT,
    target_form_id UUID
)
RETURNS JSON AS $$
DECLARE
    existing RECORD;
BEGIN
    -- Check for terminated sessions (block permanently)
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
            'message', 'Your exam session was TERMINATED due to academic integrity violations.'
        );
    END IF;

    -- Check for completed sessions (if one-submission mode)
    SELECT INTO existing id, token, status, score
    FROM sessions
    WHERE email = LOWER(TRIM(student_email))
      AND form_id = target_form_id
      AND status = 'COMPLETED'
    LIMIT 1;

    IF FOUND THEN
        -- Check config for one-submission mode
        IF (SELECT value FROM config WHERE key = 'One Email One Submission') = 'TRUE' THEN
            RETURN json_build_object(
                'allowed', false,
                'reason', 'completed',
                'message', 'You have already completed this exam. Only one submission is allowed.'
            );
        END IF;
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
            'token', existing.token,
            'score', existing.score,
            'message', 'Resuming your existing session.'
        );
    END IF;

    -- No conflicts — allow new session
    RETURN json_build_object(
        'allowed', true,
        'reason', 'new',
        'message', 'Ready to start.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Supabase Storage Configuration

### 6.1 Storage Buckets

```sql
-- Create webcam snapshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('webcam', 'webcam', FALSE);
```

### 6.2 Storage Policies

```sql
-- Students can upload to their own folder (email-based path)
CREATE POLICY "webcam_upload_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'webcam'
        AND (storage.foldername(name))[1] = REPLACE(auth.jwt() ->> 'email', '@', '_at_')
    );

-- Admins can read all snapshots
CREATE POLICY "webcam_admin_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'webcam'
        AND EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid()
        )
    );

-- Lifecycle policy: auto-delete files older than 7 days
-- (Configured via Supabase Dashboard > Storage > Policies)
```

### 6.3 File Naming Convention

```
webcam/
  └── student_at_mastersunion_org/
      └── {session_token}_{timestamp}.jpg

Example: webcam/rahul_at_mastersunion_org/abc123_20250721_102345.jpg

File constraints:
  - Format: JPEG only (image/jpeg)
  - Max size: 100 KB per image (enforced client-side via canvas compression)
  - Naming: {email_safe}_{session_token_8chars}_{YYYYMMdd_HHmmss}.jpg
```

---

## 7. Data Migration Mapping

### 7.1 Google Sheets → PostgreSQL Mapping

| Sheets Tab | Sheet Columns | PostgreSQL Table | DB Columns |
|-----------|--------------|-----------------|------------|
| `EG_Config` | Setting, Value, Notes | `config` | key, value, notes |
| `EG_Forms` | #, Form Name, Form ID, Email Field, Start, End, Active, Webcam | `forms` | sort_order, form_name, google_form_id, email_field, start_time, end_time, active, webcam_override |
| `EG_Students` | Email, Name, Roll No, Section, Allowed | `students` | email, name, roll_no, section, allowed |
| `EG_Sessions` | Token, Email, Name, Roll No, Section, Form, Started, Status, Score, Violations, Last Seen, Ended, Reason, Form ID | `sessions` | token, email, student_name, roll_no, section, form_name, started_at, status, score, violations, last_seen, ended_at, reason, form_id |
| `EG_Activity` | Time, Name, Email, Section, Event, Duration, Detail, Form, Score, Token | `activity_events` | created_at, (via session_id join), event_type, duration, detail, (via session_id), score_at_event, (via session_id) |
| `EG_Report` | Name, Email, Roll, Section, Form, Score, Tab, Focus, FS, Copy, Paste, Right Click, Keyboard, Idle, Status, Started, Ended, Reason, Token | `reports` | student_name, email, roll_no, section, form_name, score, tab_switches, focus_losses, fullscreen_exits, copy_events, paste_events, right_clicks, keyboard_shortcuts, idle_events, status, started_at, ended_at, violation_summary |

### 7.2 Key Schema Improvements Over Sheets

| Improvement | Sheets (Before) | PostgreSQL (After) |
|-------------|-----------------|-------------------|
| Data types | All text (no type safety) | Proper types (UUID, INT, TIMESTAMPTZ, ENUM, BOOLEAN) |
| Referential integrity | Manual string matching | Foreign keys with CASCADE/RESTRICT |
| Concurrent writes | Script Lock (30s timeout, serialized) | MVCC (true concurrent writes) |
| Query performance | Full sheet scan every time | B-tree indexes on hot columns |
| Authorization | None (anyone with URL can write) | RLS policies per table per role |
| Data validation | JavaScript in Code.gs | CHECK constraints + Zod schemas |
| Denormalized counts | Recounted from activity on every request | `violation_summary` JSONB updated incrementally |

---

## 8. Storage Budget Analysis

### 8.1 Per-Exam Storage (500 students, no webcam)

```
Sessions table:    500 rows × ~350 bytes/row     = 175 KB
Activity events:   500 × 30 events × ~150 bytes  = 2.25 MB
Reports table:     500 rows × ~500 bytes/row      = 250 KB
Indexes:           ~2 MB
────────────────────────────────────────────────────────
Total per exam:    ~4.7 MB
```

### 8.2 Semester Projection (20 exams)

```
Data:     20 × 4.7 MB                   = 94 MB
Config:   ~5 KB (static)                 = 5 KB
Students: ~500 rows × 100 bytes          = 50 KB
Forms:    ~20 rows × 200 bytes           = 4 KB
────────────────────────────────────────────────────────
Total per semester:                      ≈ 95 MB

Free tier limit:                         500 MB
Headroom:                                ~81% ✅
```

### 8.3 With Webcam Snapshots

```
Without lifecycle management:
  500 students × 60 snapshots × 30 KB   = 900 MB ⚠️ EXCEEDS 1 GB storage limit

With 7-day auto-delete:
  Only current week's exams in storage   ≈ 180 MB per exam (1 exam/week)
  Stays within 1 GB Storage bucket ✅

With reduced frequency (every 60s instead of 30s):
  500 × 30 snapshots × 30 KB            = 450 MB per exam
  With 7-day TTL: manageable ✅
```

---

## 9. Seed Data

### 9.1 Default Settings

```sql
-- Seed script for default configuration (mirrors EG_DEFAULT_SETTINGS from Code.gs)
INSERT INTO config (key, value, notes) VALUES
    ('Institution Name', 'Masters Union', 'Shown on the student portal.'),
    ('Roster Mode', 'OPEN', 'OPEN allows any email. CLOSED requires students table.'),
    ('Show Score to Student', 'TRUE', 'TRUE/FALSE.'),
    ('Auto End on Violations', 'FALSE', 'TRUE/FALSE.'),
    ('Alert Score Threshold', '70', 'Email alert threshold.'),
    ('Idle Timeout (sec)', '300', 'Idle time before logging an idle violation.'),
    ('Monitor Tabs', 'TRUE', 'Detect browser tab/background switches.'),
    ('Monitor Focus', 'TRUE', 'Detect focus loss.'),
    ('One Email One Submission', 'TRUE', 'Allow only one submission per email.'),
    ('Require Fullscreen', 'TRUE', 'Ask student to start in fullscreen.'),
    ('Monitor Split Screen', 'TRUE', 'Block split-screen and window resizing.'),
    ('Monitor Clipboard', 'TRUE', 'Detect copy/paste.'),
    ('Monitor Right Click', 'TRUE', 'Detect context menu.'),
    ('Monitor Keyboard', 'TRUE', 'Detect restricted shortcuts.'),
    ('Webcam Snapshots', 'FALSE', 'Optional JPEG snapshots.'),
    ('Webcam Interval (sec)', '30', 'Snapshot interval when webcam is enabled.'),
    ('Deduct: Tab Switch', '5', 'Score deduction.'),
    ('Deduct: Focus Loss', '5', 'Score deduction.'),
    ('Deduct: Fullscreen', '5', 'Score deduction.'),
    ('Deduct: Copy', '3', 'Score deduction.'),
    ('Deduct: Paste', '3', 'Score deduction.'),
    ('Deduct: Right Click', '1', 'Score deduction.'),
    ('Deduct: Keyboard', '5', 'Score deduction.'),
    ('Deduct: Idle', '5', 'Score deduction.'),
    ('Max: Tab Switches', '3', 'Auto-end limit.'),
    ('Max: Focus Losses', '3', 'Auto-end limit.'),
    ('Max: Fullscreen Exits', '3', 'Auto-end limit.'),
    ('Max: Total Violations', '10', 'Auto-end limit.'),
    ('Min Score for Auto-End', '60', 'Auto-end score floor.'),
    ('Send Start Email', 'FALSE', 'TRUE/FALSE.'),
    ('Send Alert Email', 'FALSE', 'TRUE/FALSE.'),
    ('Send End Email', 'FALSE', 'TRUE/FALSE.')
ON CONFLICT (key) DO NOTHING;
```

---

## 10. Realtime Configuration

### 10.1 Realtime Publication

```sql
-- Enable realtime for tables that admin dashboard subscribes to
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
```

### 10.2 Realtime Channel Design

```typescript
// Admin subscribes to session changes
supabase
  .channel('dashboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sessions',
  }, (payload) => {
    // Update session grid row in-place
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activity_events',
  }, (payload) => {
    // Prepend to activity feed
  })
  .subscribe();
```

> [!IMPORTANT]
> Only admin clients subscribe to Realtime channels. Student clients use standard REST calls (POST for event batches, GET for session status). This keeps WebSocket connections to 5-10 out of the 200 free-tier limit.
