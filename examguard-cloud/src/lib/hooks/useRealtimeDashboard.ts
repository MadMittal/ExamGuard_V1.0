import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ActivityEventRow = Database['public']['Tables']['activity_events']['Row'];

export function useRealtimeDashboard(selectedFormId: string | null) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [events, setEvents] = useState<ActivityEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch sessions
      let sessionQuery = supabase
        .from('sessions')
        .select('*')
        .order('last_seen', { ascending: false });
        
      if (selectedFormId) {
        sessionQuery = sessionQuery.eq('form_id', selectedFormId);
      }
      
      const { data: sessionDataRaw, error: sessionError } = await sessionQuery;
      if (sessionError) throw sessionError;
      
      const sessionData = (sessionDataRaw || []) as SessionRow[];
      setSessions(sessionData);

      // 2. Fetch recent events for these sessions
      // (For performance, we just fetch the last 100 events globally, 
      // or scoped by the sessions we just fetched if there's a selected form)
      
      let eventQuery = supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (selectedFormId && sessionData.length > 0) {
        const sessionIds = sessionData.map(s => s.id);
        eventQuery = eventQuery.in('session_id', sessionIds);
      }

      const { data: eventDataRaw, error: eventError } = await eventQuery;
      if (eventError) throw eventError;

      setEvents((eventDataRaw || []) as ActivityEventRow[]);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFormId, supabase]);

  useEffect(() => {
    fetchInitialData();

    // Setup Realtime Subscriptions
    const sessionSub = supabase
      .channel('sessions-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (selectedFormId && (payload.new as SessionRow)?.form_id !== selectedFormId && (payload.old as SessionRow)?.form_id !== selectedFormId) {
            return; // Ignore updates for other forms if filtered
          }

          if (payload.eventType === 'INSERT') {
            setSessions((prev) => [payload.new as SessionRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions((prev) => prev.map((s) => s.id === payload.new.id ? (payload.new as SessionRow) : s));
          } else if (payload.eventType === 'DELETE') {
            setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const eventSub = supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events' },
        (payload) => {
          // If filtered, we need to check if the session_id belongs to the current form
          // Since we don't have form_id on activity_events, we check against our local sessions state
          setSessions((currentSessions) => {
            const isRelevant = !selectedFormId || currentSessions.some(s => s.id === payload.new.session_id);
            if (isRelevant) {
              setEvents((prev) => [payload.new as ActivityEventRow, ...prev].slice(0, 100));
            }
            return currentSessions;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(eventSub);
    };
  }, [fetchInitialData, selectedFormId, supabase]);

  // Aggregate Metrics
  const metrics = {
    active: sessions.filter(s => s.status === 'ACTIVE').length,
    completed: sessions.filter(s => s.status === 'COMPLETED').length,
    terminated: sessions.filter(s => s.status === 'TERMINATED').length,
    alerts: sessions.filter(s => s.score < 60 && s.status === 'ACTIVE').length,
  };

  return {
    sessions,
    events,
    metrics,
    loading,
    error,
    refresh: fetchInitialData
  };
}
