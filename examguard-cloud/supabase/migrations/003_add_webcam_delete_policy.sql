-- Fix for cascading deletes on sessions
-- Admins need DELETE permission on webcam_snapshots so that deleting a session
-- can successfully cascade down and remove the associated snapshots.

CREATE POLICY "Allow admins to delete webcam metadata"
ON webcam_snapshots FOR DELETE
TO public
USING (is_admin());
