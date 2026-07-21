'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientSettings } from '@/types/exam';
import { MIN_SCREEN_WIDTH, MIN_SCREEN_HEIGHT } from '@/lib/utils/constants';

interface Props {
  settings: ClientSettings;
  onReady: () => void;
  loading: boolean;
}

interface Check {
  id: string;
  label: string;
  passed: boolean;
  action?: () => void;
}

export function PreExamChecklist({ settings, onReady, loading }: Props) {
  const [fullscreenDone, setFullscreenDone] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenDone(true);
    } catch {
      // Some browsers block programmatic fullscreen
    }
  }, []);

  const isBrowserOk =
    typeof window !== 'undefined' &&
    ('visibilityState' in document) &&
    ('requestFullscreen' in document.documentElement);
  
  const isScreenOk =
    typeof window !== 'undefined' &&
    window.screen.width >= MIN_SCREEN_WIDTH &&
    window.screen.height >= MIN_SCREEN_HEIGHT;

  const checks: Check[] = [
    {
      id: 'browser',
      label: `Browser supported (${typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Edge') ? 'Edge' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown') : 'Unknown'})`,
      passed: isBrowserOk,
    },
    {
      id: 'screen',
      label: `Screen size adequate (${typeof window !== 'undefined' ? `${window.screen.width}×${window.screen.height}` : 'Unknown'})`,
      passed: isScreenOk,
    },
  ];

  if (settings.monitorTabs)     checks.push({ id: 'tabs',       label: 'Tab switch detection enabled',     passed: true });
  if (settings.monitorClipboard) checks.push({ id: 'clipboard',  label: 'Clipboard monitoring enabled',    passed: true });
  if (settings.monitorFocus)    checks.push({ id: 'focus',       label: 'Focus monitoring enabled',         passed: true });

  if (settings.requireFullscreen) {
    checks.push({
      id: 'fullscreen',
      label: 'Fullscreen mode',
      passed: fullscreenDone || (typeof document !== 'undefined' && !!document.fullscreenElement),
      action: enterFullscreen,
    });
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => {
      if (document.fullscreenElement) setFullscreenDone(true);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const allPassed = checks.every(c => c.passed);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Pre-Exam Readiness Check</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {checks.map(check => (
            <div
              key={check.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color: check.passed ? 'var(--success)' : 'var(--muted)',
              }}
            >
              <span style={{ fontSize: 16 }}>{check.passed ? '✅' : '⬜'}</span>
              <span style={{ flex: 1 }}>{check.label}</span>
              {!check.passed && check.action && (
                <button
                  onClick={check.action}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    background: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--warning-light)',
          border: '1px solid rgba(161,98,7,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--warning)',
          lineHeight: 1.6,
        }}>
          <strong>⚠️ During this exam:</strong>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li>Do not switch tabs or windows</li>
            <li>Do not use copy/paste</li>
            {settings.requireFullscreen && <li>Stay in fullscreen mode</li>}
            <li>Violations reduce your integrity score</li>
          </ul>
        </div>

        <button
          onClick={onReady}
          disabled={!allPassed || loading}
          className="focus-ring"
          style={{
            width: '100%',
            padding: '10px 0',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            background: allPassed && !loading ? 'var(--brand)' : 'var(--subtle)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: allPassed && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Starting…' : 'Start Exam →'}
        </button>
      </div>
    </div>
  );
}
