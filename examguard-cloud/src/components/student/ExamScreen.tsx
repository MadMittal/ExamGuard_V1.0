'use client';

import { useEffect, useState, useRef } from 'react';
import { formatDuration, getRemainingSeconds } from '@/lib/utils/dates';
import { getScoreSeverity } from '@/lib/utils/constants';

import { useMonitoring } from '@/lib/hooks/useMonitoring';
import type { ClientSettings } from '@/types/exam';

interface Props {
  googleFormUrl: string;
  score: number;
  violations: number;
  endTime: string | null;
  showScore: boolean;
  onSubmit: () => void;
  loading: boolean;
  sessionToken: string | null;
  sessionId: string | null;
  settings: ClientSettings | null;
  onUpdateScore: (score: number, violations: number) => void;
  onTerminate: (reason: string) => void;
}

export function ExamScreen({ 
  googleFormUrl, 
  score, 
  violations, 
  endTime, 
  showScore, 
  onSubmit, 
  loading,
  sessionToken,
  sessionId,
  settings,
  onUpdateScore,
  onTerminate,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(endTime));
  const [start] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Initialize monitoring engine
  useMonitoring({
    sessionToken,
    sessionId,
    settings,
    score,
    violations,
    onUpdateScore,
    onTerminate,
  });

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
      if (endTime) {
        setRemaining(getRemainingSeconds(endTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const severity = getScoreSeverity(score);
  const severityColor = severity === 'ok' ? 'var(--success)' : severity === 'warning' ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>🛡️ ExamGuard</span>
          {showScore && (
            <span
              key={score}
              className="animate-score-pulse"
              style={{ color: severityColor }}
            >
              Score: {score}
            </span>
          )}
          {violations > 0 && (
            <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400 }}>
              {violations} violation{violations !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {endTime && remaining > 0 ? (
            <span style={{ color: remaining < 300 ? 'var(--danger)' : 'var(--muted)' }}>
              ⏱️ {formatDuration(remaining)} remaining
            </span>
          ) : (
            <span style={{ color: 'var(--muted)' }}>
              ⏱️ {formatDuration(elapsed)}
            </span>
          )}
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'var(--danger)',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} title="Monitoring active" />
        </div>
      </div>

      {/* Google Form iframe */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src={googleFormUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Exam Form"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--panel)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}>
        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="focus-ring"
            style={{
              padding: '8px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--danger)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            Submit &amp; End Exam
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>Are you sure? This cannot be undone.</span>
            <button
              onClick={() => { setConfirmOpen(false); onSubmit(); }}
              disabled={loading}
              className="focus-ring"
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--danger)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Submitting…' : 'Yes, End Exam'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                color: 'var(--muted)',
                background: 'var(--soft)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
