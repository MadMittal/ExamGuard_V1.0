'use client';

import type { ExamInfo } from '@/types/exam';
import { formatDate } from '@/lib/utils/dates';

interface Props {
  forms: ExamInfo[];
  institutionName: string;
  onSelectForm: (form: ExamInfo) => void;
}

export function ExamInfoScreen({ forms, institutionName, onSelectForm }: Props) {
  const activeForms = forms.filter(f => f.isOpen);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>🛡️ ExamGuard</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{institutionName}</div>
      </div>

      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
          Welcome to your secure exam environment
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Select an exam to begin
        </p>

        {activeForms.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            No active exams available at this time.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeForms.map(form => (
              <button
                key={form.id}
                onClick={() => onSelectForm(form)}
                className="focus-ring"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 20px',
                  background: 'var(--soft)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                  📋 {form.formName}
                </div>
                {(form.startTime || form.endTime) && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    🕐 {form.startTime ? formatDate(form.startTime) : 'No start'} — {form.endTime ? formatDate(form.endTime) : 'No end'}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 16, textAlign: 'center' }}>
        ⚠️ Desktop browser required (Chrome/Edge) · v3.0 Cloud
      </p>
    </div>
  );
}
