-- 1. Fix Race Condition: Prevent multiple ACTIVE sessions for the same email and form
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_one_active 
ON sessions (email, form_id) 
WHERE status = 'ACTIVE';

-- 2. Create Webcam Storage Bucket (If not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('webcam', 'webcam', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies for Webcam Snapshots
-- Allow students to upload snapshots
CREATE POLICY "Allow snapshot uploads" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'webcam');

-- Allow admins to view snapshots
CREATE POLICY "Allow admins to view snapshots" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'webcam' AND is_admin());

-- Ensure the webcam_snapshots table has RLS
ALTER TABLE webcam_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow students to insert metadata
CREATE POLICY "Allow students to insert webcam metadata"
ON webcam_snapshots FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to select metadata
CREATE POLICY "Allow admins to select webcam metadata"
ON webcam_snapshots FOR SELECT
TO public
USING (is_admin());
