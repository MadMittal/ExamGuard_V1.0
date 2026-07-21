'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ExamInfo, ClientSettings } from '@/types/exam';
import { parseClientSettings } from '@/types/exam';
import type { FormRow, ConfigRow } from '@/lib/supabase/types';

interface ExamData {
  forms: ExamInfo[];
  settings: ClientSettings | null;
  institutionName: string;
  loading: boolean;
  error: string | null;
}

function getFormStatus(form: FormRow): ExamInfo['statusLabel'] {
  if (!form.active) return 'Inactive';
  const now = new Date();
  if (form.start_time && new Date(form.start_time) > now) return 'Scheduled';
  if (form.end_time && new Date(form.end_time) < now) return 'Expired';
  return 'Active';
}

function formToExamInfo(form: FormRow): ExamInfo {
  const status = getFormStatus(form);
  return {
    id: form.id,
    formName: form.form_name,
    googleFormId: form.google_form_id,
    emailField: form.email_field,
    startTime: form.start_time,
    endTime: form.end_time,
    timeLimitMinutes: form.time_limit_minutes ?? null,
    isOpen: status === 'Active',
    statusLabel: status,
  };
}

/**
 * Fetches active forms and monitoring settings from Supabase.
 * Student-facing — uses anon key with public-read RLS policies.
 */
export function useExamInfo(): ExamData {
  const [state, setState] = useState<ExamData>({
    forms: [],
    settings: null,
    institutionName: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        // Fetch active forms and config in parallel
        const [formsRes, configRes] = await Promise.all([
          supabase.from('forms').select('*').eq('active', true),
          supabase.from('config').select('*'),
        ]);

        if (formsRes.error) throw formsRes.error;
        if (configRes.error) throw configRes.error;

        const configMap: Record<string, string> = {};
        const configRows = configRes.data as unknown as ConfigRow[];
        for (const row of configRows ?? []) {
          configMap[row.key] = row.value;
        }

        setState({
          forms: (formsRes.data ?? []).map(formToExamInfo),
          settings: parseClientSettings(configMap),
          institutionName: configMap['Institution Name'] ?? '',
          loading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load exam info',
        }));
      }
    }

    load();
  }, []);

  return state;
}
