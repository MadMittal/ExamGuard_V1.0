'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EventType, ViolationSummary } from '@/lib/supabase/types';
import type { ClientSettings } from '@/types/exam';
import { toast } from 'sonner';
import { DEDUCTIONS, MAX_VIOLATIONS, MIN_SCORE } from '@/lib/utils/constants';

interface MonitoringConfig {
  sessionToken: string | null;
  sessionId: string | null;
  settings: ClientSettings | null;
  score: number;
  violations: number;
  onUpdateScore: (score: number, violations: number) => void;
  onTerminate: (reason: string) => void;
}

interface QueuedEvent {
  event_type: EventType;
  score_at_event: number;
  duration: string;
  detail: string;
}

const FLUSH_INTERVAL_MS = 30000;
const MAX_BATCH_SIZE = 10;

/**
 * Core Monitoring Engine.
 * Detects 11 violation types, manages scoring, batches events, and flushes to Supabase.
 */
export function useMonitoring({
  sessionToken,
  sessionId,
  settings,
  score,
  violations,
  onUpdateScore,
  onTerminate,
}: MonitoringConfig) {
  const supabase = createClient();
  const queueRef = useRef<QueuedEvent[]>([]);
  const summaryRef = useRef<ViolationSummary>({});
  
  // Refs for current state to use inside event listeners without re-binding
  const scoreRef = useRef(score);
  const violationsRef = useRef(violations);
  const tokenRef = useRef(sessionToken);
  const idRef = useRef(sessionId);
  const isTerminatedRef = useRef(false);

  useEffect(() => {
    scoreRef.current = score;
    violationsRef.current = violations;
    tokenRef.current = sessionToken;
    idRef.current = sessionId;
  }, [score, violations, sessionToken, sessionId]);

  const logEvent = useCallback((type: EventType, detail: string, duration = '00:00:00') => {
    if (!tokenRef.current || !idRef.current || isTerminatedRef.current) return;

    // 1. Calculate new score
    const deduction = settings?.deductions?.[type as keyof typeof settings.deductions] ?? DEDUCTIONS[type] ?? 0;
    const newScore = Math.max(0, scoreRef.current - deduction);
    const newViolations = violationsRef.current + 1;
    
    // 2. Queue event
    queueRef.current.push({
      event_type: type,
      score_at_event: newScore,
      duration,
      detail,
    });

    // 3. Update summary
    summaryRef.current[type] = (summaryRef.current[type] ?? 0) + 1;

    // 4. Update UI
    onUpdateScore(newScore, newViolations);

    // 5. Toast notification
    if (deduction > 0) {
      toast.error(`Violation Detected: ${detail}`, {
        description: `Integrity Score: -${deduction} points`,
        duration: 5000,
      });
    }

    // 6. Check auto-termination
    const minScore = settings?.thresholds?.['Min Score for Auto-End'] ?? MIN_SCORE;
    if (newScore <= minScore) {
      isTerminatedRef.current = true;
      onTerminate('Integrity score dropped below minimum threshold.');
      return;
    }
    
    const maxViolations = settings?.thresholds?.['Max: Total Violations'] ?? MAX_VIOLATIONS;
    if (newViolations >= maxViolations) {
      isTerminatedRef.current = true;
      onTerminate('Maximum number of violations exceeded.');
      return;
    }
    
    // Auto-terminate on multiple tab switches (strict mode)
    const tabSwitches = summaryRef.current['tab_switch'] ?? 0;
    const maxTabSwitches = settings?.thresholds?.['Max: Tab Switches'] ?? 3;
    if (type === 'tab_switch' && tabSwitches >= maxTabSwitches) {
      isTerminatedRef.current = true;
      onTerminate(`Session terminated: ${tabSwitches} tab switches detected.`);
    }
  }, [onUpdateScore, onTerminate, settings]);

  // Batch flusher (runs every 30s)
  useEffect(() => {
    if (!sessionToken || !sessionId) return;

    const flush = async () => {
      const queue = queueRef.current;
      const currentSummary = { ...summaryRef.current };
      
      // Heartbeat or batch processing
      if (queue.length === 0) {
        // Just heartbeat update last_seen
        await (supabase.from('sessions') as any).update({
          last_seen: new Date().toISOString(),
          score: scoreRef.current,
          violations: violationsRef.current,
          violation_summary: currentSummary,
        }).eq('token', tokenRef.current);
        return;
      }

      // We have events to flush
      const batch = queue.splice(0, MAX_BATCH_SIZE);
      const rowsToInsert = batch.map(e => ({
        session_id: idRef.current,
        event_type: e.event_type,
        score_at_event: e.score_at_event,
        duration: e.duration,
        detail: e.detail,
      }));

      try {
        await (supabase.from('activity_events') as any).insert(rowsToInsert);
        
        // Update session state
        await (supabase.from('sessions') as any).update({
          last_seen: new Date().toISOString(),
          score: scoreRef.current,
          violations: violationsRef.current,
          violation_summary: currentSummary,
        }).eq('token', tokenRef.current);
      } catch (err) {
        // Simple in-memory retry buffer (push back to front)
        console.error('Failed to flush events', err);
        queueRef.current.unshift(...batch);
      }
    };

    const intervalId = setInterval(flush, FLUSH_INTERVAL_MS);
    
    // Also flush on page unload
    const handleUnload = () => {
      if (queueRef.current.length > 0) flush();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [sessionToken, sessionId, supabase]);

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  useEffect(() => {
    if (!sessionToken || !settings) return;

    // 1. Tab Switch / Focus Loss
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (settings.monitorTabs) logEvent('tab_switch', 'Switched to another tab or application');
      } else {
        if (settings.monitorTabs) logEvent('tab_return', 'Returned to the exam tab');
      }
    };

    const handleBlur = () => {
      // Ignore blur events caused by interacting with the exam iframe itself
      if (document.activeElement?.tagName === 'IFRAME') {
        return;
      }
      
      if (settings.monitorFocus && document.visibilityState === 'visible') {
        // Only log focus loss if we didn't already log a tab switch
        logEvent('focus_loss', 'Lost window focus (clicked outside)');
      }
    };

    // 2. Fullscreen Exit
    const handleFullscreen = () => {
      if (!document.fullscreenElement && settings.requireFullscreen) {
        logEvent('fullscreen_exit', 'Exited fullscreen mode');
        toast('Please return to fullscreen mode', {
          action: {
            label: 'Enter Fullscreen',
            onClick: () => document.documentElement.requestFullscreen().catch(() => {}),
          },
          duration: Number.POSITIVE_INFINITY, // Force them to dismiss it via action
        });
      }
    };

    // 3. Clipboard
    const handleCopy = (e: ClipboardEvent) => {
      if (settings.monitorClipboard) {
        e.preventDefault();
        logEvent('copy', 'Attempted to copy content');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (settings.monitorClipboard) {
        e.preventDefault();
        logEvent('paste', 'Attempted to paste content');
      }
    };

    // 4. Right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent('right_click', 'Attempted to right-click');
    };

    // 5. Keyboard shortcuts (Ctrl+C, Ctrl+V, Alt+Tab, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print screen / Screenshot (best effort)
      if (e.key === 'PrintScreen') {
        logEvent('keyboard_shortcut', 'Attempted to take screenshot');
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          if (settings.monitorClipboard) e.preventDefault();
          // Log handled by handleCopy usually, but fallback
        } else if (e.key === 'v' || e.key === 'V') {
          if (settings.monitorClipboard) e.preventDefault();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          logEvent('keyboard_shortcut', 'Attempted to print page');
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          logEvent('keyboard_shortcut', 'Attempted to save page');
        }
      }

      // DevTools (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        logEvent('devtools', 'Attempted to open Developer Tools');
      }
    };

    // 6. Split screen detection (Resize)
    const handleResize = () => {
      if (window.innerWidth < 800 || window.innerHeight < 600) {
        logEvent('split_screen', 'Window resized below minimum dimensions (possible split screen)');
      }
    };

    // Register listeners
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 1000); // debounce resize
    };
    window.addEventListener('resize', debouncedResize);

    // 9. Webcam Snapshots
    let snapshotIntervalId: ReturnType<typeof setInterval>;
    let videoTrack: MediaStreamTrack | null = null;
    let videoEl: HTMLVideoElement | null = null;
    let canvasEl: HTMLCanvasElement | null = null;

    if (settings.webcamSnapshots) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        videoTrack = stream.getVideoTracks()[0];
        videoEl = document.createElement('video');
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});

        canvasEl = document.createElement('canvas');
        
        // Take snapshots based on interval
        snapshotIntervalId = setInterval(() => {
          if (!videoEl || !canvasEl || !idRef.current) return;
          if (videoEl.videoWidth === 0) return; // not loaded yet
          
          canvasEl.width = videoEl.videoWidth;
          canvasEl.height = videoEl.videoHeight;
          const ctx = canvasEl.getContext('2d');
          if (!ctx) return;
          
          ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
          canvasEl.toBlob(async (blob) => {
            if (!blob) return;
            const filename = `${idRef.current}/${Date.now()}.jpg`;
            
            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage.from('webcam').upload(filename, blob, { 
              contentType: 'image/jpeg',
              upsert: true
            });
            
            if (!uploadErr) {
              // Save metadata to DB
              await (supabase.from('webcam_snapshots') as any).insert({
                session_id: idRef.current,
                file_path: filename
              });
            }
          }, 'image/jpeg', 0.5); // 0.5 quality to save bandwidth
        }, (settings.webcamIntervalSec || 30) * 1000);
      }).catch(err => {
        console.error('Failed to start webcam in monitoring', err);
        logEvent('admin_flag', 'Webcam stream failed or was denied');
      });
    }

    // 10. Screen Snapshots
    let screenIntervalId: ReturnType<typeof setInterval>;
    let screenTrack: MediaStreamTrack | null = null;
    let screenVideoEl: HTMLVideoElement | null = null;
    let screenCanvasEl: HTMLCanvasElement | null = null;

    if (settings.screenSnapshots && (window as any).__screenStream) {
      const stream = (window as any).__screenStream as MediaStream;
      screenTrack = stream.getVideoTracks()[0];
      screenVideoEl = document.createElement('video');
      screenVideoEl.srcObject = stream;
      screenVideoEl.play().catch(() => {});

      screenCanvasEl = document.createElement('canvas');
      
      screenIntervalId = setInterval(() => {
        if (!screenVideoEl || !screenCanvasEl || !idRef.current) return;
        if (screenVideoEl.videoWidth === 0) return;
        
        screenCanvasEl.width = screenVideoEl.videoWidth;
        screenCanvasEl.height = screenVideoEl.videoHeight;
        const ctx = screenCanvasEl.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(screenVideoEl, 0, 0, screenCanvasEl.width, screenCanvasEl.height);
        screenCanvasEl.toBlob(async (blob) => {
          if (!blob) return;
          const filename = `${idRef.current}/screen_${Date.now()}.jpg`;
          
          const { error: uploadErr } = await supabase.storage.from('webcam').upload(filename, blob, { 
            contentType: 'image/jpeg',
            upsert: true
          });
          
          if (!uploadErr) {
            await (supabase.from('webcam_snapshots') as any).insert({
              session_id: idRef.current,
              file_path: filename
            });
          }
        }, 'image/jpeg', 0.5);
      }, (settings.webcamIntervalSec || 30) * 1000); // Reusing webcam interval for simplicity
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
      if (snapshotIntervalId) clearInterval(snapshotIntervalId);
      if (videoTrack) videoTrack.stop();
      if (videoEl) videoEl.remove();
      if (canvasEl) canvasEl.remove();
      
      if (screenIntervalId) clearInterval(screenIntervalId);
      if (screenTrack) screenTrack.stop();
      if (screenVideoEl) screenVideoEl.remove();
      if (screenCanvasEl) screenCanvasEl.remove();
    };
  }, [sessionToken, settings, logEvent, supabase]);
}
