import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Fetch all sessions (you might want to limit this or use pagination if there are millions)
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select('id, email, student_name, roll_no, section, form_name, status, score, violations, started_at, ended_at, reason')
      .order('started_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, sessions });

  } catch (err: any) {
    console.error('Export Cron Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
