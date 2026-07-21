'use client';

import { useState } from 'react';
import type { ExamInfo } from '@/types/exam';

interface Props {
  onSubmit: (email: string) => void;
  form: ExamInfo;
  institutionName: string;
  loading: boolean;
  error: string | null;
}

export function LoginScreen({ onSubmit, form, institutionName, loading, error }: Props) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 440, margin: '0 auto', padding: '48px 24px' }}>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
          {form.formName}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Enter your institutional email to continue
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="student@university.edu"
            required
            autoFocus
            disabled={loading}
            className="focus-ring"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 15,
              border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
              borderRadius: 'var(--radius-md)',
              background: 'var(--soft)',
              color: 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="focus-ring"
            style={{
              width: '100%',
              marginTop: 16,
              padding: '10px 0',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: loading ? 'var(--subtle)' : 'var(--brand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Verifying…' : 'Continue →'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 16, textAlign: 'center' }}>
          🔒 Your email is used to verify your identity and track your exam session.
        </p>
      </div>
    </div>
  );
}
