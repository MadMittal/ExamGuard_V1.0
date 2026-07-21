'use client';

import type { SessionStatus } from '@/lib/supabase/types';

interface Props {
  score: number;
  violations: number;
  status: SessionStatus | 'TERMINATED';
  reason?: string;
}

export function CompletionScreen({ score, violations, status, reason }: Props) {
  const isTerminated = status === 'TERMINATED';

  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {isTerminated ? '⛔' : '✅'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {isTerminated ? 'Session Terminated' : 'Exam Submitted Successfully'}
        </h2>
        {isTerminated && reason && (
          <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 16 }}>{reason}</p>
        )}

        <div style={{
          background: 'var(--soft)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          margin: '20px 0',
          textAlign: 'left',
          fontSize: 14,
          lineHeight: 2,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Integrity Score:</span>
            <span style={{ fontWeight: 600 }}>{score} / 100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Status:</span>
            <span style={{
              fontWeight: 600,
              color: isTerminated ? 'var(--danger)' : 'var(--success)',
            }}>
              {status}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Violations:</span>
            <span style={{ fontWeight: 600 }}>{violations}</span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {isTerminated
            ? 'Your session has been recorded. Contact your instructor for further information.'
            : 'Your responses have been recorded in Google Forms. You may close this window.'}
        </p>
      </div>
    </div>
  );
}
