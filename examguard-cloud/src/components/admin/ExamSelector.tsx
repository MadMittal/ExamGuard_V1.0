import { ChevronDown } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type FormRow = Database['public']['Tables']['forms']['Row'];

interface Props {
  forms: FormRow[];
  selectedFormId: string | null;
  onSelect: (formId: string | null) => void;
  loading?: boolean;
}

export function ExamSelector({ forms, selectedFormId, onSelect, loading }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
        Active Exam Filter:
      </label>
      <div style={{ position: 'relative', width: 300 }}>
        <select
          value={selectedFormId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          disabled={loading}
          className="focus-ring"
          style={{
            width: '100%',
            appearance: 'none',
            padding: '10px 16px',
            paddingRight: 40,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--ink)',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">All Active Exams</option>
          {forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.form_name} {!form.active ? '(Inactive)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          style={{ 
            position: 'absolute', 
            right: 12, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none'
          }} 
        />
      </div>
    </div>
  );
}
