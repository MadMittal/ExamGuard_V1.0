-- ============================================================================
-- ExamGuard Cloud — Seed Data
-- Inserts default configuration settings matching EG_DEFAULT_SETTINGS
-- ============================================================================

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
    ('Deduct: Tab Switch', '5', 'Score deduction per tab switch.'),
    ('Deduct: Focus Loss', '5', 'Score deduction per focus loss.'),
    ('Deduct: Fullscreen', '5', 'Score deduction per fullscreen exit.'),
    ('Deduct: Copy', '3', 'Score deduction per copy attempt.'),
    ('Deduct: Paste', '3', 'Score deduction per paste attempt.'),
    ('Deduct: Right Click', '1', 'Score deduction per right-click.'),
    ('Deduct: Keyboard', '5', 'Score deduction per keyboard shortcut.'),
    ('Deduct: Idle', '5', 'Score deduction per idle event.'),
    ('Max: Tab Switches', '3', 'Auto-end after this many tab switches.'),
    ('Max: Focus Losses', '3', 'Auto-end after this many focus losses.'),
    ('Max: Fullscreen Exits', '3', 'Auto-end after this many fullscreen exits.'),
    ('Max: Total Violations', '10', 'Auto-end after total violations.'),
    ('Min Score for Auto-End', '60', 'Auto-end when score drops to this.'),
    ('Send Start Email', 'FALSE', 'Send email when student starts exam.'),
    ('Send Alert Email', 'FALSE', 'Send alert when score drops below threshold.'),
    ('Send End Email', 'FALSE', 'Send email when session ends.'),
    ('TA Emails', '', 'Comma-separated TA email addresses for alerts.'),
    ('Faculty Email', '', 'Primary faculty/owner email address.')
ON CONFLICT (key) DO NOTHING;
