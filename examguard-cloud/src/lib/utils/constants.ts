// =============================================================================
// ExamGuard Cloud — Application Constants
// =============================================================================

export const APP_NAME = 'ExamGuard';
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0';

// --------------------------------------------------------------------------
// Monitoring Configuration
// --------------------------------------------------------------------------

/** Default heartbeat/batch interval in milliseconds */
export const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/** Maximum events per batch before forced flush */
export const MAX_BATCH_SIZE = 10;

/** Minimum screen width for exam eligibility */
export const MIN_SCREEN_WIDTH = 1024;

/** Minimum screen height for exam eligibility */
export const MIN_SCREEN_HEIGHT = 768;

/** Split-screen detection threshold (percentage of screen width) */
export const SPLIT_SCREEN_THRESHOLD = 0.9;

/** DevTools detection width differential threshold (pixels) */
export const DEVTOOLS_WIDTH_THRESHOLD = 160;

/** Default idle timeout in seconds (overridden by config) */
export const DEFAULT_IDLE_TIMEOUT_SEC = 300;

export const MAX_VIOLATIONS = 10;
export const MIN_SCORE = 0;

export const DEDUCTIONS: Record<string, number> = {
  tab_switch: 10,
  focus_loss: 5,
  fullscreen_exit: 10,
  split_screen: 10,
  copy: 5,
  paste: 10,
  right_click: 0,
  keyboard_shortcut: 5,
  devtools: 20,
  idle: 5,
};

// --------------------------------------------------------------------------
// Event Metadata (mirrors EG_EVENT_META from Code.gs)
// --------------------------------------------------------------------------

export const EVENT_META = {
  tab_switch: {
    label: 'Tab Switch',
    deductKey: 'Deduct: Tab Switch',
    maxKey: 'Max: Tab Switches',
    icon: 'monitor-x',
    severity: 'warning' as const,
  },
  tab_return: {
    label: 'Tab Return',
    deductKey: null,
    maxKey: null,
    icon: 'monitor-check',
    severity: 'info' as const,
  },
  focus_loss: {
    label: 'Focus Loss',
    deductKey: 'Deduct: Focus Loss',
    maxKey: 'Max: Focus Losses',
    icon: 'eye-off',
    severity: 'warning' as const,
  },
  fullscreen_exit: {
    label: 'Fullscreen Exit',
    deductKey: 'Deduct: Fullscreen',
    maxKey: 'Max: Fullscreen Exits',
    icon: 'minimize-2',
    severity: 'warning' as const,
  },
  split_screen: {
    label: 'Split Screen',
    deductKey: 'Deduct: Fullscreen',
    maxKey: 'Max: Fullscreen Exits',
    icon: 'columns',
    severity: 'warning' as const,
  },
  copy: {
    label: 'Copy',
    deductKey: 'Deduct: Copy',
    maxKey: null,
    icon: 'clipboard-copy',
    severity: 'warning' as const,
  },
  paste: {
    label: 'Paste',
    deductKey: 'Deduct: Paste',
    maxKey: null,
    icon: 'clipboard-paste',
    severity: 'warning' as const,
  },
  right_click: {
    label: 'Right Click',
    deductKey: 'Deduct: Right Click',
    maxKey: null,
    icon: 'mouse-pointer-click',
    severity: 'info' as const,
  },
  keyboard_shortcut: {
    label: 'Keyboard Shortcut',
    deductKey: 'Deduct: Keyboard',
    maxKey: null,
    icon: 'keyboard',
    severity: 'warning' as const,
  },
  devtools: {
    label: 'Developer Tools',
    deductKey: 'Deduct: Keyboard',
    maxKey: null,
    icon: 'terminal',
    severity: 'critical' as const,
  },
  idle: {
    label: 'Idle',
    deductKey: 'Deduct: Idle',
    maxKey: null,
    icon: 'clock',
    severity: 'warning' as const,
  },
  admin_flag: {
    label: 'Admin Flag',
    deductKey: null,
    maxKey: null,
    icon: 'flag',
    severity: 'info' as const,
  },
} as const;

export type EventTypeKey = keyof typeof EVENT_META;

// --------------------------------------------------------------------------
// Event Type Aliases (normalize inconsistent type strings)
// --------------------------------------------------------------------------

export const EVENT_TYPE_ALIASES: Record<string, EventTypeKey> = {
  tabswitch: 'tab_switch',
  tab: 'tab_switch',
  blur: 'focus_loss',
  focus: 'focus_loss',
  fullscreen: 'fullscreen_exit',
  fullscreenexit: 'fullscreen_exit',
  splitscreen: 'split_screen',
  split: 'split_screen',
  resize: 'split_screen',
  rightclick: 'right_click',
  contextmenu: 'right_click',
  keyboard: 'keyboard_shortcut',
  shortcut: 'keyboard_shortcut',
};

/**
 * Normalize event type string to canonical EventTypeKey.
 */
export function normalizeEventType(raw: string): EventTypeKey | null {
  const type = raw.trim().toLowerCase();
  if (type in EVENT_META) return type as EventTypeKey;
  if (type in EVENT_TYPE_ALIASES) return EVENT_TYPE_ALIASES[type];
  return null;
}

// --------------------------------------------------------------------------
// Restricted Keyboard Shortcuts
// --------------------------------------------------------------------------

export const RESTRICTED_SHORTCUTS = [
  { key: 'c', ctrl: true },           // Ctrl+C (copy)
  { key: 'v', ctrl: true },           // Ctrl+V (paste)
  { key: 'a', ctrl: true },           // Ctrl+A (select all)
  { key: 'x', ctrl: true },           // Ctrl+X (cut)
  { key: 'p', ctrl: true },           // Ctrl+P (print)
  { key: 's', ctrl: true },           // Ctrl+S (save)
  { key: 'u', ctrl: true },           // Ctrl+U (view source)
  { key: 'F12', ctrl: false },        // F12 (DevTools)
  { key: 'I', ctrl: true, shift: true }, // Ctrl+Shift+I (DevTools)
  { key: 'J', ctrl: true, shift: true }, // Ctrl+Shift+J (Console)
  { key: 'C', ctrl: true, shift: true }, // Ctrl+Shift+C (Inspector)
];

// --------------------------------------------------------------------------
// Session Severity Thresholds
// --------------------------------------------------------------------------

export const SCORE_THRESHOLDS = {
  ok: 80,       // score >= 80 → green
  warning: 60,  // score >= 60 → yellow
  critical: 0,  // score < 60 → red
} as const;

export function getScoreSeverity(score: number): 'ok' | 'warning' | 'critical' {
  if (score >= SCORE_THRESHOLDS.ok) return 'ok';
  if (score >= SCORE_THRESHOLDS.warning) return 'warning';
  return 'critical';
}

// --------------------------------------------------------------------------
// UI Constants
// --------------------------------------------------------------------------

export const TOAST_DURATION_MS = {
  info: 3000,
  warning: 4000,
  critical: 6000,
} as const;

/** Max toasts visible at once */
export const MAX_VISIBLE_TOASTS = 3;

/** Admin dashboard polling fallback interval (if Realtime disconnects) */
export const ADMIN_POLL_INTERVAL_MS = 10_000;
