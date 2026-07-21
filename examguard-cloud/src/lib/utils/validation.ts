import { z } from 'zod';
import type { EventType } from '../supabase/types';

// =============================================================================
// ExamGuard Cloud — Input Validation Schemas (Zod)
// =============================================================================

// --------------------------------------------------------------------------
// Email Validation
// --------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

// --------------------------------------------------------------------------
// Session Start
// --------------------------------------------------------------------------

export const startSessionSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(200).default(''),
  form_id: z.string().uuid('Invalid form ID'),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

// --------------------------------------------------------------------------
// Event Batch (from monitoring engine → server)
// --------------------------------------------------------------------------

const eventTypeEnum = z.enum([
  'tab_switch', 'tab_return', 'focus_loss', 'fullscreen_exit',
  'split_screen', 'copy', 'paste', 'right_click',
  'keyboard_shortcut', 'devtools', 'idle', 'admin_flag',
]) satisfies z.ZodType<EventType>;

export const singleEventSchema = z.object({
  type: eventTypeEnum,
  timestamp: z.string().datetime().optional(),
  duration: z.string().max(50).default(''),
  detail: z.string().max(500).default(''),
});

export const eventBatchSchema = z.object({
  session_token: z.string().min(1, 'Session token is required'),
  events: z.array(singleEventSchema).max(50, 'Too many events in batch'),
  current_score: z.number().int().min(0).max(100),
  total_violations: z.number().int().min(0),
});

export type SingleEventInput = z.infer<typeof singleEventSchema>;
export type EventBatchInput = z.infer<typeof eventBatchSchema>;

// --------------------------------------------------------------------------
// Form Management (Admin)
// --------------------------------------------------------------------------

export const saveFormSchema = z.object({
  form_name: z.string().trim().min(1, 'Form name is required').max(200),
  google_form_id: z.string().trim().min(10, 'Invalid Google Form ID'),
  email_field: z.string().trim().default('Email Address'),
  start_time: z.string().nullable().default(null),
  end_time: z.string().nullable().default(null),
  active: z.boolean().default(true),
  webcam_override: z.string().trim().default(''),
});

export type SaveFormInput = z.infer<typeof saveFormSchema>;

// --------------------------------------------------------------------------
// Student Import (Admin)
// --------------------------------------------------------------------------

export const importStudentSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(200).default(''),
  roll_no: z.string().trim().max(50).default(''),
  section: z.string().trim().max(50).default(''),
  allowed: z.boolean().default(true),
});

export type ImportStudentInput = z.infer<typeof importStudentSchema>;

// --------------------------------------------------------------------------
// Settings (Admin)
// --------------------------------------------------------------------------

export const saveSettingsSchema = z.record(
  z.string(),
  z.string().max(1000)
);

export type SaveSettingsInput = z.infer<typeof saveSettingsSchema>;

// --------------------------------------------------------------------------
// Webcam Snapshot
// --------------------------------------------------------------------------

export const snapshotSchema = z.object({
  session_token: z.string().min(1),
  image_data: z.string().min(1, 'Image data is required'),
});

export type SnapshotInput = z.infer<typeof snapshotSchema>;
