'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ExamInfo, ClientSettings, StudentScreen, BlockedReason } from '@/types/exam';
import type { SessionConflictResult, StudentRow, SessionRow } from '@/lib/supabase/types';
import { emailSchema } from '@/lib/utils/validation';

interface SessionState {
  screen: StudentScreen;
  email: string;
  studentName: string;
  rollNo: string;
  section: string;
  sessionToken: string | null;
  sessionId: string | null;
  startedAt: string | null;
  score: number;
  violations: number;
  blockedReason: BlockedReason | null;
  blockedMessage: string;
  error: string | null;
  loading: boolean;
  selectedForm: ExamInfo | null;
}

const initialState: SessionState = {
  screen: 'landing',
  email: '',
  studentName: '',
  rollNo: '',
  section: '',
  sessionToken: null,
  sessionId: null,
  startedAt: null,
  score: 100,
  violations: 0,
  blockedReason: null,
  blockedMessage: '',
  error: null,
  loading: false,
  selectedForm: null,
};

/**
 * Core session state machine for the student exam flow.
 * Manages: landing → login → checking → blocked/exam-info → pre-checklist → exam-active → completed
 */
export function useSession(settings: ClientSettings | null, forms: ExamInfo[]) {
  const [state, setState] = useState<SessionState>(initialState);
  const supabase = createClient();

  const update = useCallback((patch: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  /** Landing → Login */
  const enterLogin = useCallback((form: ExamInfo) => {
    update({ screen: 'login', selectedForm: form, error: null });
  }, [update]);

  /** Trigger Google OAuth Login */
  const submitEmail = useCallback(async () => {
    const form = state.selectedForm;
    if (!form) return;

    update({ loading: true, error: null });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/exam?formId=${form.id}`,
      },
    });

    if (error) {
      update({ loading: false, error: error.message });
    }
  }, [state.selectedForm, supabase, update]);

  /** Process student after OAuth redirect */
  const processStudentLogin = useCallback(async (email: string, form: ExamInfo) => {
    update({ screen: 'checking', email, loading: true, error: null });

    try {
      // Domain validation
      const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN;
      if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
        update({ screen: 'blocked', blockedReason: 'not_allowed', blockedMessage: `Only students from ${allowedDomain} can access this exam.`, loading: false });
        // Sign out so they can switch accounts
        await supabase.auth.signOut();
        return;
      }

      // Check roster in CLOSED mode
      if (settings?.rosterMode === 'CLOSED') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .single();
          
        const student = studentData as unknown as StudentRow;

        if (!student) {
          update({ screen: 'blocked', blockedReason: 'not_enrolled', blockedMessage: 'Your email is not enrolled for this exam. Contact your instructor.', loading: false });
          return;
        }
        if (!student.allowed) {
          update({ screen: 'blocked', blockedReason: 'not_allowed', blockedMessage: 'Your account has been restricted. Contact your instructor.', loading: false });
          return;
        }
        update({ studentName: student.name, rollNo: student.roll_no, section: student.section });
      }

      // Check session conflicts via RPC
      const { data: conflict, error: conflictErr } = await (supabase.rpc as any)('check_session_conflict', {
        student_email: email,
        target_form_id: form.id,
      });
      if (conflictErr) throw conflictErr;

      const result = conflict as unknown as SessionConflictResult;

      if (!result.allowed) {
        update({
          screen: 'blocked',
          blockedReason: result.reason as BlockedReason,
          blockedMessage: result.message,
          loading: false,
        });
        return;
      }

      if (result.reason === 'resume' && result.token) {
        // Resume existing active session — go to checklist first to enforce fullscreen!
        update({
          screen: 'pre-checklist',
          sessionToken: result.token,
          sessionId: result.session_id ?? null,
          startedAt: result.started_at ?? null,
          score: result.score ?? 100,
          loading: false,
        });
        return;
      }

      // New session — proceed to pre-checklist
      update({ screen: 'pre-checklist', loading: false });
    } catch (err) {
      update({
        screen: 'login',
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to verify session',
      });
    }
  }, [settings, supabase, update]);

  // Handle OAuth Redirect on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const formId = searchParams.get('formId');

    if (formId && forms.length > 0) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && user.email) {
          const email = user.email;
          const form = forms.find(f => f.id === formId);
          if (form) {
            update({ selectedForm: form });
            processStudentLogin(email, form);
          }
        }
      });
    }
  }, [forms, processStudentLogin, supabase, update]);

  /** ExamInfo → PreChecklist */
  const goToChecklist = useCallback(() => {
    update({ screen: 'pre-checklist', error: null });
  }, [update]);

  /** PreChecklist → ExamActive (creates session) */
  const startSession = useCallback(async () => {
    const form = state.selectedForm;
    if (!form) return;

    update({ loading: true, error: null });

    // If we are resuming a session, we already have a token
    if (state.sessionToken) {
      update({ screen: 'exam-active', loading: false });
      return;
    }

    try {
      const { data: session, error: insertErr } = await (supabase.from('sessions') as any)
        .insert({
          email: state.email.toLowerCase().trim(),
          student_name: state.studentName,
          roll_no: state.rollNo,
          section: state.section,
          form_id: form.id,
          form_name: form.formName,
          status: 'ACTIVE',
          score: 100,
          violations: 0,
          reason: '',
          violation_summary: {},
        })
        .select('id, token, started_at')
        .single();

      if (insertErr) throw insertErr;
      const s = session as unknown as SessionRow;

      update({
        screen: 'exam-active',
        sessionToken: s.token,
        sessionId: s.id,
        startedAt: s.started_at,
        score: 100,
        violations: 0,
        loading: false,
      });
    } catch (err: any) {
      update({
        loading: false,
        error: err?.message || (err instanceof Error ? err.message : 'Failed to start session'),
      });
    }
  }, [state.selectedForm, state.email, state.studentName, state.rollNo, state.section, supabase, update]);

  /** ExamActive → Completing → Completed */
  const endSession = useCallback(async (reason = 'Student submitted') => {
    if (!state.sessionToken) return;
    update({ screen: 'completing', loading: true });

    try {
      await (supabase.from('sessions') as any)
        .update({
          status: 'COMPLETED',
          ended_at: new Date().toISOString(),
          reason,
        })
        .eq('token', state.sessionToken);

      update({ screen: 'completed', loading: false });
    } catch {
      // Even if the update fails, show completion — the heartbeat will handle sync
      update({ screen: 'completed', loading: false });
    }
  }, [state.sessionToken, supabase, update]);

  /** Called by monitoring engine when auto-termination triggers */
  const terminateSession = useCallback(async (reason: string) => {
    if (!state.sessionToken) return;

    try {
      await (supabase.from('sessions') as any)
        .update({
          status: 'TERMINATED',
          ended_at: new Date().toISOString(),
          reason,
        })
        .eq('token', state.sessionToken);
    } catch {
      // Best-effort — session may already be terminated
    }

    update({
      screen: 'completed',
      blockedReason: 'terminated',
      blockedMessage: reason,
    });
  }, [state.sessionToken, supabase, update]);

  /** Update score/violations from monitoring engine */
  const updateScore = useCallback((score: number, violations: number) => {
    update({ score, violations });
  }, [update]);

  /** Google Form embed URL with email pre-fill */
  const googleFormUrl = state.selectedForm
    ? `https://docs.google.com/forms/d/e/${state.selectedForm.googleFormId}/viewform?embedded=true&emailAddress=${encodeURIComponent(state.email)}&entry.${state.selectedForm.emailField}=${encodeURIComponent(state.email)}`
    : '';

  return {
    ...state,
    googleFormUrl,
    enterLogin,
    submitEmail,
    goToChecklist,
    startSession,
    endSession,
    terminateSession,
    updateScore,
  };
}
