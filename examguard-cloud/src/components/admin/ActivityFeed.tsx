import { formatDistanceToNow } from 'date-fns';
import { EVENT_META } from '@/lib/utils/constants';
import type { Database } from '@/lib/supabase/types';

type ActivityEventRow = Database['public']['Tables']['activity_events']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];

interface Props {
  events: ActivityEventRow[];
  sessions: SessionRow[];
}

export function ActivityFeed({ events, sessions }: Props) {
  // Map session ID to email for quick lookup
  const sessionMap = new Map(sessions.map(s => [s.id, s.email || 'Anonymous']));

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--soft)',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          Live Activity Feed
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No recent activity
          </div>
        ) : (
          events.map((event) => {
            const meta = EVENT_META[event.event_type as keyof typeof EVENT_META];
            const severityColor = meta?.severity === 'critical' ? 'var(--danger)' : 
                                  meta?.severity === 'warning' ? 'var(--warning)' : 
                                  'var(--brand)';
            const bg = meta?.severity === 'critical' ? 'var(--danger-light)' : 
                       meta?.severity === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 
                       'var(--brand-light)';
            
            return (
              <div 
                key={event.id}
                style={{
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--canvas)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                    {sessionMap.get(event.session_id) || 'Unknown Student'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                  <div style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: bg,
                    color: severityColor,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {meta?.label || event.event_type}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                    {event.detail}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
