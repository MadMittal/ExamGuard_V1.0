// =============================================================================
// ExamGuard Cloud — Shared TypeScript Interfaces
// Application-level types used across components (not DB schema types)
// =============================================================================

import type { SessionStatus, EventType, ViolationSummary, ConfigRow, FormRow } from '@/lib/supabase/types';

// --------------------------------------------------------------------------
// Exam Info (Student Portal)
// --------------------------------------------------------------------------

/** Exam information shown to students on the landing page */
export interface ExamInfo {
  id: string;
  formName: string;
  googleFormId: string;
  emailField: string;
  startTime: string | null;
  endTime: string | null;
  timeLimitMinutes: number | null;
  isOpen: boolean;
  statusLabel: 'Active' | 'Scheduled' | 'Expired' | 'Inactive';
}

// --------------------------------------------------------------------------
// Client-Side Settings (derived from config table)
// --------------------------------------------------------------------------

/** Monitoring settings sent to the student's browser */
export interface ClientSettings {
  showScore: boolean;
  monitorTabs: boolean;
  monitorFocus: boolean;
  requireFullscreen: boolean;
  monitorSplitScreen: boolean;
  monitorClipboard: boolean;
  monitorRightClick: boolean;
  monitorKeyboard: boolean;
  webcamSnapshots: boolean;
  screenSnapshots: boolean;
  webcamIntervalSec: number;
  idleTimeoutSec: number;
  rosterMode: 'OPEN' | 'CLOSED';
  autoEndOnViolations: boolean;
  oneEmailOneSubmission: boolean;
  // Score deductions
  deductions: Record<string, number>;
  // Threshold limits
  thresholds: Record<string, number>;
}

/**
 * Parse config rows from Supabase into ClientSettings.
 */
export function parseClientSettings(config: Record<string, string>): ClientSettings {
  const bool = (key: string, fallback: boolean = true): boolean => {
    const v = config[key];
    if (!v) return fallback;
    return ['true', 'yes', '1', 'on'].includes(v.trim().toLowerCase());
  };

  const num = (key: string, fallback: number): number => {
    const v = Number(config[key]);
    return isNaN(v) ? fallback : v;
  };

  return {
    showScore: bool('Show Score to Student'),
    monitorTabs: bool('Monitor Tabs'),
    monitorFocus: bool('Monitor Focus'),
    requireFullscreen: bool('Require Fullscreen'),
    monitorSplitScreen: bool('Monitor Split Screen'),
    monitorClipboard: bool('Monitor Clipboard'),
    monitorRightClick: bool('Monitor Right Click'),
    monitorKeyboard: bool('Monitor Keyboard'),
    webcamSnapshots: bool('Webcam Snapshots', false),
    screenSnapshots: bool('Screen Snapshots', false),
    webcamIntervalSec: num('Webcam Interval (sec)', 30),
    idleTimeoutSec: num('Idle Timeout (sec)', 300),
    rosterMode: config['Roster Mode']?.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
    autoEndOnViolations: bool('Auto End on Violations', false),
    oneEmailOneSubmission: bool('One Email One Submission'),
    deductions: {
      tab_switch: num('Deduct: Tab Switch', 5),
      focus_loss: num('Deduct: Focus Loss', 5),
      fullscreen_exit: num('Deduct: Fullscreen', 5),
      split_screen: num('Deduct: Fullscreen', 5),
      copy: num('Deduct: Copy', 3),
      paste: num('Deduct: Paste', 3),
      right_click: num('Deduct: Right Click', 1),
      keyboard_shortcut: num('Deduct: Keyboard', 5),
      devtools: num('Deduct: Keyboard', 5),
      idle: num('Deduct: Idle', 5),
    },
    thresholds: {
      'Max: Tab Switches': num('Max: Tab Switches', 3),
      'Max: Focus Losses': num('Max: Focus Losses', 3),
      'Max: Fullscreen Exits': num('Max: Fullscreen Exits', 3),
      'Max: Total Violations': num('Max: Total Violations', 10),
      'Min Score for Auto-End': num('Min Score for Auto-End', 60),
    },
  };
}

// --------------------------------------------------------------------------
// Monitoring Engine Types
// --------------------------------------------------------------------------

/** A single violation event detected by the monitoring engine */
export interface MonitoringEvent {
  type: EventType;
  timestamp: string;
  duration?: string;
  detail?: string;
}

/** State of the monitoring engine */
export interface MonitoringState {
  isActive: boolean;
  score: number;
  violations: number;
  violationSummary: ViolationSummary;
  events: MonitoringEvent[];
  lastFlushAt: number;
  isOffline: boolean;
}

// --------------------------------------------------------------------------
// Student Portal Screen States
// --------------------------------------------------------------------------

export type StudentScreen =
  | 'landing'
  | 'login'
  | 'checking'
  | 'blocked'
  | 'exam-info'
  | 'pre-checklist'
  | 'exam-active'
  | 'completing'
  | 'completed';

export type BlockedReason =
  | 'not_enrolled'
  | 'not_allowed'
  | 'terminated'
  | 'completed'
  | 'one_submission';

// --------------------------------------------------------------------------
// Dashboard Types (Admin)
// --------------------------------------------------------------------------

/** A session row formatted for the admin dashboard */
export interface DashboardSession {
  token: string;
  email: string;
  name: string;
  rollNo: string;
  section: string;
  form: string;
  started: string;
  status: SessionStatus;
  score: number;
  violations: number;
  lastSeen: string;
  ended: string;
  reason: string;
  severity: 'ok' | 'warning' | 'critical' | 'ended';
}

/** An activity event formatted for the admin activity feed */
export interface ActivityFeedItem {
  time: string;
  name: string;
  email: string;
  section: string;
  event: string;
  duration: string;
  detail: string;
  form: string;
  score: number;
  token: string;
}
