'use client';

import { useState, useEffect } from 'react';
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard';
import { DashboardMetrics } from '@/components/admin/DashboardMetrics';
import { ExamSelector } from '@/components/admin/ExamSelector';
import { SessionsGrid } from '@/components/admin/SessionsGrid';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';

type FormRow = Database['public']['Tables']['forms']['Row'];

export default function AdminDashboardPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [loadingForms, setLoadingForms] = useState(true);
  const supabase = createClient();

  const {
    sessions,
    events,
    metrics,
    loading: loadingDashboard,
    error,
    refresh
  } = useRealtimeDashboard(selectedFormId);

  // Fetch active forms for the dropdown
  useEffect(() => {
    async function fetchForms() {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const typedData = data as FormRow[];
        setForms(typedData);
        // Default to the first active form if available
        const firstActive = typedData.find(f => f.active === true);
        if (firstActive) setSelectedFormId(firstActive.id);
      }
      setLoadingForms(false);
    }
    fetchForms();
  }, [supabase]);

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await (supabase.from('sessions') as any)
        .update({
          status: 'TERMINATED',
          reason: 'terminated',
          blocked_message: 'Your session was manually terminated by an administrator.',
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session terminated successfully');
      // Optimistic update isn't strictly necessary due to Realtime, but Realtime will catch it shortly.
    } catch (err: any) {
      toast.error('Failed to terminate session: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            Live Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            Monitor active exam sessions and real-time alerts.
          </p>
        </div>
        
        <ExamSelector 
          forms={forms} 
          selectedFormId={selectedFormId} 
          onSelect={setSelectedFormId}
          loading={loadingForms}
        />
      </div>

      <DashboardMetrics metrics={metrics} />

      {error && (
        <div style={{ padding: 16, background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          {error}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 350px', 
        gap: 24, 
        flex: 1,
        minHeight: 0 // important for flex children to scroll
      }}>
        {/* Left Col: Sessions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Active Sessions</h2>
            <button
              onClick={refresh}
              className="focus-ring"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--muted)',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Refresh Data
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SessionsGrid 
              data={sessions} 
              onTerminateSession={handleTerminateSession}
              loading={loadingDashboard}
            />
          </div>
        </div>

        {/* Right Col: Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ActivityFeed events={events} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
