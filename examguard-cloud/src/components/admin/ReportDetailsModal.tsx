'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { format } from 'date-fns';
import { X, Camera, AlertTriangle, Clock } from 'lucide-react';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ActivityEvent = Database['public']['Tables']['activity_events']['Row'];
type WebcamSnapshot = Database['public']['Tables']['webcam_snapshots']['Row'];

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function ReportDetailsModal({ sessionId, onClose }: Props) {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [snapshots, setSnapshots] = useState<WebcamSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDetails();
  }, [sessionId]);

  const fetchDetails = async () => {
    setLoading(true);
    
    // Fetch session
    const { data: sData } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (sData) setSession(sData);

    // Fetch events
    const { data: eData } = await supabase.from('activity_events').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (eData) setEvents(eData);

    // Fetch snapshots
    const { data: snapData } = await supabase.from('webcam_snapshots').select('*').eq('session_id', sessionId).order('captured_at', { ascending: true });
    
    if (snapData && snapData.length > 0) {
      const paths = snapData.map((s: any) => s.file_path);
      const { data: signedUrls } = await supabase.storage.from('webcam').createSignedUrls(paths, 3600);
      
      const snapshotsWithUrls = snapData.map((snap: any, index: number) => ({
        ...snap,
        signedUrl: signedUrls?.[index]?.signedUrl || ''
      }));
      setSnapshots(snapshotsWithUrls);
    } else {
      setSnapshots([]);
    }

    setLoading(false);
  };



  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 24
    }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 900,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Detailed Session Report</h2>
            {session && <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{session.student_name || session.email} - {session.form_name}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', gap: 24, flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>Loading details...</div>
          ) : !session ? (
            <div style={{ textAlign: 'center', color: 'var(--danger)', padding: 48 }}>Failed to load session</div>
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: 16, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Trust Score</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: session.score >= 80 ? 'var(--success)' : session.score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {session.score}%
                  </div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Total Violations</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{session.violations}</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Status</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: session.status === 'COMPLETED' ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                    {session.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Timeline */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} />
                    Activity Timeline
                  </h3>
                  <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', padding: 16, maxHeight: 400, overflowY: 'auto' }}>
                    {events.length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>No violations recorded.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {events.map((evt) => (
                          <div key={evt.id} style={{ display: 'flex', gap: 12 }}>
                            <div style={{ color: 'var(--muted)', marginTop: 2 }}><Clock size={16} /></div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{evt.event_type.replace(/_/g, ' ').toUpperCase()}</div>
                              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{evt.detail}</div>
                              <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 4 }}>{format(new Date(evt.created_at), 'h:mm:ss a')} (Score: {evt.score_at_event}%)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Snapshots */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={18} />
                    Webcam Snapshots
                  </h3>
                  <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', padding: 16, maxHeight: 400, overflowY: 'auto', marginBottom: 24 }}>
                    {snapshots.filter((s: any) => !s.file_path.includes('screen_')).length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>No webcam snapshots recorded.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {snapshots.filter((s: any) => !s.file_path.includes('screen_')).map((snap) => (
                          <div key={snap.id} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                            <img src={(snap as any).signedUrl} alt="Webcam Snapshot" style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '4px 8px' }}>
                              {format(new Date((snap as any).captured_at), 'h:mm:ss a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={18} />
                    Screen Snapshots
                  </h3>
                  <div style={{ background: 'var(--canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', padding: 16, maxHeight: 400, overflowY: 'auto' }}>
                    {snapshots.filter((s: any) => s.file_path.includes('screen_')).length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>No screen snapshots recorded.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                        {snapshots.filter((s: any) => s.file_path.includes('screen_')).map((snap) => (
                          <div key={snap.id} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                            <img src={(snap as any).signedUrl} alt="Screen Snapshot" style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '4px 8px' }}>
                              {format(new Date((snap as any).captured_at), 'h:mm:ss a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
