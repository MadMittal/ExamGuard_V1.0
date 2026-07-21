'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { format } from 'date-fns';
import { Download, FileText, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ReportDetailsModal } from '@/components/admin/ReportDetailsModal';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type FormRow = Database['public']['Tables']['forms']['Row'];

export default function ReportsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Filters
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchFormsAndData();
  }, [selectedFormId]);

  const fetchFormsAndData = async () => {
    setLoading(true);
    
    // Fetch forms for the filter
    if (forms.length === 0) {
      const { data: fData } = await supabase.from('forms').select('*').order('created_at', { ascending: false });
      if (fData) setForms(fData);
    }

    // Fetch finished sessions (COMPLETED or TERMINATED)
    let query = supabase
      .from('sessions')
      .select('*')
      .in('status', ['COMPLETED', 'TERMINATED'])
      .order('started_at', { ascending: false });

    if (selectedFormId) {
      query = query.eq('form_id', selectedFormId);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to fetch reports');
    } else {
      setSessions((data || []) as SessionRow[]);
    }
    
    setLoading(false);
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const lowerQ = searchQuery.toLowerCase();
    return sessions.filter(s => 
      (s.student_name && s.student_name.toLowerCase().includes(lowerQ)) ||
      (s.email && s.email.toLowerCase().includes(lowerQ)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(lowerQ))
    );
  }, [sessions, searchQuery]);

  const exportToCSV = () => {
    if (filteredSessions.length === 0) {
      toast.info('No data to export');
      return;
    }

    // Define CSV Headers
    const headers = [
      'Session ID', 'Exam Form', 'Student Name', 'Email', 'Roll No', 'Section', 
      'Status', 'Trust Score', 'Total Violations', 'Started At', 'Ended At', 'Reason'
    ];

    // Map rows
    const rows = filteredSessions.map(s => [
      s.id,
      s.form_name,
      s.student_name || 'Anonymous',
      s.email || '-',
      s.roll_no || '-',
      s.section || '-',
      s.status,
      s.score.toString(),
      s.violations.toString(),
      s.started_at ? new Date(s.started_at).toLocaleString() : '',
      s.ended_at ? new Date(s.ended_at).toLocaleString() : '',
      `"${(s.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `examguard-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>Exam Reports</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 4 }}>
            Review completed and terminated exam sessions.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24, 
        padding: 16, 
        background: 'var(--panel)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--line)',
        alignItems: 'center' 
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search student, email, roll no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: 'var(--canvas)',
              fontSize: 14
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} style={{ color: 'var(--muted)' }} />
          <select
            value={selectedFormId}
            onChange={e => setSelectedFormId(e.target.value)}
            style={{
              padding: '10px 32px 10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: 'var(--canvas)',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <option value="">All Exams</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.form_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--soft)' }}>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Student</th>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Exam Form</th>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Trust Score</th>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
              ) : filteredSessions.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No completed exams found.</td></tr>
              ) : (
                filteredSessions.map(session => (
                  <tr 
                    key={session.id} 
                    style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setSelectedSessionId(session.id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{session.student_name || 'Anonymous'}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{session.email || '-'}</div>
                      {(session.roll_no || session.section) && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {session.roll_no} {session.section ? `(${session.section})` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: 'var(--ink)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} style={{ color: 'var(--muted)' }} />
                        {session.form_name}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: session.score >= 80 ? 'var(--success-light)' : session.score >= 50 ? 'var(--warning-light)' : 'var(--danger-light)', color: session.score >= 80 ? 'var(--success)' : session.score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                        <span style={{ fontWeight: 700 }}>{session.score}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{session.violations} violations</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {session.status === 'COMPLETED' ? (
                        <span style={{ padding: '4px 8px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Completed</span>
                      ) : (
                        <div>
                          <span style={{ padding: '4px 8px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>Terminated</span>
                          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, maxWidth: 150 }}>{session.reason}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--muted)' }}>
                      <div><strong>Start:</strong> {session.started_at ? format(new Date(session.started_at), 'MMM d, h:mm a') : '-'}</div>
                      <div style={{ marginTop: 4 }}><strong>End:</strong> {session.ended_at ? format(new Date(session.ended_at), 'MMM d, h:mm a') : '-'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedSessionId && (
        <ReportDetailsModal 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
        />
      )}
    </div>
  );
}
