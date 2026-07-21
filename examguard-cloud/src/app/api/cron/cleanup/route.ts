import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. Verify CRON_SECRET to protect this endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Initialize Supabase Admin Client
    // We must use the service role key to bypass RLS for deletion
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // 3. Find sessions older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const { data: oldSessions, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .lt('created_at', cutoffDate);

    if (fetchError) throw fetchError;
    if (!oldSessions || oldSessions.length === 0) {
      return NextResponse.json({ message: 'No old sessions to clean up.' });
    }

    const sessionIds = oldSessions.map(s => s.id);

    // 4. Delete storage objects (images) for these sessions
    // First, find all webcam_snapshots metadata for these sessions
    const { data: snapshots, error: snapError } = await supabaseAdmin
      .from('webcam_snapshots')
      .select('file_path')
      .in('session_id', sessionIds);

    if (snapError) throw snapError;

    let deletedFiles = 0;
    if (snapshots && snapshots.length > 0) {
      const filePaths = snapshots.map(s => s.file_path);
      
      // Supabase storage remove takes a maximum of 100 files at a time usually,
      // but let's batch it just in case there are thousands.
      const BATCH_SIZE = 100;
      for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
        const batch = filePaths.slice(i, i + BATCH_SIZE);
        const { error: deleteStorageError } = await supabaseAdmin.storage
          .from('webcam')
          .remove(batch);
        
        if (deleteStorageError) {
          console.error('Failed to delete storage batch:', deleteStorageError);
        } else {
          deletedFiles += batch.length;
        }
      }
    }

    // 5. Delete the sessions from the database
    // ON DELETE CASCADE will automatically remove activity_events and webcam_snapshots rows
    const { error: deleteSessionsError } = await supabaseAdmin
      .from('sessions')
      .delete()
      .in('id', sessionIds);

    if (deleteSessionsError) throw deleteSessionsError;

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${sessionIds.length} sessions and ${deletedFiles} images.` 
    });

  } catch (err: any) {
    console.error('Cleanup Cron Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
