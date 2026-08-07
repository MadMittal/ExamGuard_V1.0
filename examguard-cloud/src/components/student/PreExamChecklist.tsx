'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClientSettings } from '@/types/exam';
import { MIN_SCREEN_WIDTH, MIN_SCREEN_HEIGHT } from '@/lib/utils/constants';

interface Props {
  settings: ClientSettings;
  onReady: () => void;
  loading: boolean;
  error?: string | null;
}

interface Check {
  id: string;
  label: string;
  passed: boolean;
  action?: () => void;
}

export function PreExamChecklist({ settings, onReady, loading, error }: Props) {
  const [fullscreenDone, setFullscreenDone] = useState(false);
  const [webcamGranted, setWebcamGranted] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [screenGranted, setScreenGranted] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const requestWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setWebcamGranted(true);
    } catch (err: any) {
      setWebcamError('Camera access denied or not found.');
    }
  }, []);

  const requestScreen = useCallback(async () => {
    try {
      setScreenError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      (window as any).__screenStream = stream; // Pass to monitoring hook
      
      // If user stops sharing from browser UI before exam starts
      stream.getVideoTracks()[0].onended = () => {
        setScreenGranted(false);
        setScreenError('Screen sharing was stopped. Please activate again.');
        (window as any).__screenStream = null;
      };
      
      setScreenGranted(true);
    } catch (err: any) {
      setScreenError('Screen sharing access denied.');
    }
  }, []);

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
    window.innerWidth >= MIN_SCREEN_WIDTH &&
    window.innerHeight >= MIN_SCREEN_HEIGHT;

  const checks: Check[] = [
    {
      id: 'browser',
      label: `Browser supported (${typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Edge') ? 'Edge' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown') : 'Unknown'})`,
      passed: isBrowserOk,
    },
    {
      id: 'screen',
      label: `Screen size adequate (${typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : 'Unknown'})`,
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

  if (settings.webcamSnapshots) {
    checks.push({
      id: 'webcam',
      label: webcamError || 'Camera permissions',
      passed: webcamGranted,
      action: !webcamGranted ? requestWebcam : undefined,
    });
  }

  if (settings.screenSnapshots) {
    checks.push({
      id: 'screen',
      label: screenError || 'Screen sharing permissions',
      passed: screenGranted,
      action: !screenGranted ? requestScreen : undefined,
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

  // Auto-request webcam if needed and not already granted
  useEffect(() => {
    if (settings.webcamSnapshots && !webcamGranted && !webcamError) {
      requestWebcam();
    }
  }, [settings.webcamSnapshots, webcamGranted, webcamError, requestWebcam]);

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
            {settings.monitorTabs && <li>Do not switch tabs or windows {settings.autoEndOnViolations ? `(Max: ${settings.thresholds['Max: Tab Switches']})` : ''}</li>}
            {settings.monitorFocus && <li>Do not look away from the screen {settings.autoEndOnViolations ? `(Max focus losses: ${settings.thresholds['Max: Focus Losses']})` : ''}</li>}
            {settings.monitorClipboard && <li>Do not use copy/paste</li>}
            {settings.requireFullscreen && <li>Stay in fullscreen mode {settings.autoEndOnViolations ? `(Max exits: ${settings.thresholds['Max: Fullscreen Exits']})` : ''}</li>}
            <li>Violations reduce your integrity score</li>
            {settings.autoEndOnViolations && <li><strong>Your exam will auto-terminate if you exceed the max violations.</strong></li>}
          </ul>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

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
