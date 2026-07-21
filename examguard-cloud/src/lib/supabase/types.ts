// =============================================================================
// ExamGuard Cloud — Database Type Definitions
// These types mirror the PostgreSQL schema defined in 001_initial_schema.sql
// In production, generate these with: npx supabase gen types typescript
// =============================================================================

// --------------------------------------------------------------------------
// Enums
// --------------------------------------------------------------------------

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
export type UserRole = 'admin' | 'ta';
export type EventType =
  | 'tab_switch'
  | 'tab_return'
  | 'focus_loss'
  | 'fullscreen_exit'
  | 'split_screen'
  | 'copy'
  | 'paste'
  | 'right_click'
  | 'keyboard_shortcut'
  | 'devtools'
  | 'idle'
  | 'admin_flag';

// --------------------------------------------------------------------------
// Table Row Types
// --------------------------------------------------------------------------

export interface UserRoleRow {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ConfigRow {
  key: string;
  value: string;
  notes: string;
  updated_at: string;
}

export interface FormRow {
  id: string;
  sort_order: number;
  form_name: string;
  google_form_id: string;
  email_field: string;
  start_time: string | null;
  end_time: string | null;
  active: boolean;
  webcam_override: string;
  created_at: string;
  updated_at: string;
}

export interface StudentRow {
  id: string;
  email: string;
  name: string;
  roll_no: string;
  section: string;
  allowed: boolean;
  created_at: string;
}

export interface SessionRow {
  id: string;
  token: string;
  email: string;
  student_name: string;
  roll_no: string;
  section: string;
  form_id: string;
  form_name: string;
  started_at: string;
  status: SessionStatus;
  score: number;
  violations: number;
  last_seen: string;
  ended_at: string | null;
  reason: string;
  violation_summary: ViolationSummary;
}

export interface ActivityEventRow {
  id: string;
  session_id: string;
  event_type: EventType;
  score_at_event: number;
  duration: string;
  detail: string;
  created_at: string;
}

export interface ReportRow {
  id: string;
  session_id: string;
  student_name: string;
  email: string;
  roll_no: string;
  section: string;
  form_name: string;
  score: number;
  tab_switches: number;
  focus_losses: number;
  fullscreen_exits: number;
  copy_events: number;
  paste_events: number;
  right_clicks: number;
  keyboard_shortcuts: number;
  idle_events: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  violation_summary: string;
  generated_at: string;
}

export interface WebcamSnapshotRow {
  id: string;
  session_id: string;
  file_path: string;
  file_size_bytes: number;
  captured_at: string;
}

// --------------------------------------------------------------------------
// JSONB Types
// --------------------------------------------------------------------------

export interface ViolationSummary {
  tab_switch?: number;
  tab_return?: number;
  focus_loss?: number;
  fullscreen_exit?: number;
  split_screen?: number;
  copy?: number;
  paste?: number;
  right_click?: number;
  keyboard_shortcut?: number;
  devtools?: number;
  idle?: number;
  [key: string]: number | undefined;
}

// --------------------------------------------------------------------------
// RPC Function Types
// --------------------------------------------------------------------------

export interface DashboardMetrics {
  active: number;
  completed: number;
  terminated: number;
  alert: number;
  total: number;
}

export interface SessionConflictResult {
  allowed: boolean;
  reason: 'new' | 'resume' | 'terminated' | 'completed' | 'one_submission';
  message: string;
  session_id?: string;
  token?: string;
  score?: number;
}

export interface CleanupResult {
  cutoff_date: string;
  deleted_sessions: number;
  deleted_events: number;
  deleted_reports: number;
  deleted_snapshots: number;
}

// --------------------------------------------------------------------------
// Supabase Database Type Map (for supabase-js type inference)
// --------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: UserRoleRow;
        Insert: Omit<UserRoleRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<UserRoleRow, 'id'>>;
      };
      config: {
        Row: ConfigRow;
        Insert: Omit<ConfigRow, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<ConfigRow, 'key'>>;
      };
      forms: {
        Row: FormRow;
        Insert: Omit<FormRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FormRow, 'id'>>;
      };
      students: {
        Row: StudentRow;
        Insert: Omit<StudentRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<StudentRow, 'id'>>;
      };
      sessions: {
        Row: SessionRow;
        Insert: Omit<SessionRow, 'id' | 'token' | 'started_at' | 'last_seen'> & {
          id?: string;
          token?: string;
          started_at?: string;
          last_seen?: string;
        };
        Update: Partial<Omit<SessionRow, 'id'>>;
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: Omit<ActivityEventRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ActivityEventRow, 'id'>>;
      };
      reports: {
        Row: ReportRow;
        Insert: Omit<ReportRow, 'id' | 'generated_at'> & {
          id?: string;
          generated_at?: string;
        };
        Update: Partial<Omit<ReportRow, 'id'>>;
      };
      webcam_snapshots: {
        Row: WebcamSnapshotRow;
        Insert: Omit<WebcamSnapshotRow, 'id' | 'captured_at'> & {
          id?: string;
          captured_at?: string;
        };
        Update: Partial<Omit<WebcamSnapshotRow, 'id'>>;
      };
    };
    Functions: {
      get_dashboard_metrics: {
        Args: { target_form_id?: string };
        Returns: DashboardMetrics;
      };
      generate_report: {
        Args: { target_form_id?: string };
        Returns: number;
      };
      cleanup_old_data: {
        Args: { days_old?: number };
        Returns: CleanupResult;
      };
      check_session_conflict: {
        Args: { student_email: string; target_form_id: string };
        Returns: SessionConflictResult;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      session_status: SessionStatus;
      user_role: UserRole;
      event_type: EventType;
    };
  };
}
