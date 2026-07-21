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
  timeLimitMinutes: number | null;
  startedAt: string | null;
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
  timeLimitMinutes,
  startedAt,
  showScore, 
  onSubmit, 
  loading,
  sessionToken,
  sessionId,
  settings,
  onUpdateScore,
  onTerminate,
}: Props) {
  // Calculate the strict end time considering both overall form end time and the session time limit
  const computedEndTime = (() => {
    let finalEnd = endTime;
    if (timeLimitMinutes && startedAt) {
      const limitMs = timeLimitMinutes * 60 * 1000;
      const sessionEnd = new Date(new Date(startedAt).getTime() + limitMs).toISOString();
      if (!finalEnd || new Date(sessionEnd) < new Date(finalEnd)) {
        finalEnd = sessionEnd;
      }
    }
    return finalEnd;
  })();

  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(computedEndTime));
  const [start] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [warningShown, setWarningShown] = useState(false);
  
  // Track iframe loads to detect form submission
  const [iframeLoadCount, setIframeLoadCount] = useState(0);
  const firstLoadTimeRef = useRef(0);

  const handleIframeLoad = () => {
    const now = Date.now();
    setIframeLoadCount(prev => {
      if (prev === 0) {
        firstLoadTimeRef.current = now;
      }
      return prev + 1;
    });
  };

  useEffect(() => {
    // If this is the second (or subsequent) load AND it happened at least 5 seconds
    // after the first load, it means the student submitted the Google Form and was 
    // redirected to the "Thank you" page! We should auto-terminate the session.
    if (iframeLoadCount >= 2 && Date.now() - firstLoadTimeRef.current > 5000) {
      onSubmit();
    }
  }, [iframeLoadCount, onSubmit]);

  // Fullscreen listener
  useEffect(() => {
    if (!settings?.requireFullscreen) return;

    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handler);
    // initial check
    setIsFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [settings?.requireFullscreen]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error(e);
    }
  };

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

  // Timer tick and auto-termination logic
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
      
      if (computedEndTime) {
        const secs = getRemainingSeconds(computedEndTime);
        setRemaining(secs);
        
        // Auto-terminate exactly at 0
        if (secs <= 0) {
          clearInterval(interval);
          onTerminate('Time limit exceeded');
        } 
        // Warning toast at 60 seconds remaining
        else if (secs === 60 && !warningShown) {
          setWarningShown(true);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [computedEndTime, start, warningShown, onTerminate]);

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
          {computedEndTime && remaining > 0 ? (
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

      {/* 1-Minute Warning Banner (Inline so it doesn't cover iframe content) */}
      {warningShown && remaining > 0 && remaining <= 60 && (
        <div style={{
          background: 'var(--danger)',
          color: '#fff',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1s infinite',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>⚠️ 1 Minute Remaining ⚠️</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, fontWeight: 500 }}>
            Submit your form IMMEDIATELY. When the timer hits zero, the form will close and unsaved progress will be lost!
          </p>
        </div>
      )}

      {/* Google Form iframe */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src={googleFormUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          filter: (!isFullscreen && settings?.requireFullscreen) ? 'blur(10px)' : 'none',
          pointerEvents: (!isFullscreen && settings?.requireFullscreen) ? 'none' : 'auto',
        }}
        title="Exam Form"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        onLoad={handleIframeLoad}
      />

        {(!isFullscreen && settings?.requireFullscreen) && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--danger)', marginBottom: 16 }}>
              Fullscreen Required
            </h2>
            <p style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
              You must remain in fullscreen mode to continue taking the exam. Split screen is not allowed.
            </p>
            <button
              onClick={enterFullscreen}
              style={{
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--brand)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Return to Fullscreen
            </button>
          </div>
        )}
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
