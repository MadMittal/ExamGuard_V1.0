-- Insert Screen Snapshots into config
INSERT INTO config (key, value, notes)
VALUES ('Screen Snapshots', 'TRUE', 'Enable periodic screen captures')
ON CONFLICT (key) DO NOTHING;
