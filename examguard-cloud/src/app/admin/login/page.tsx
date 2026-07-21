'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // The middleware will handle role verification on the next request.
      // We just need to push to dashboard.
      router.push('/admin/dashboard');
      router.refresh(); // Ensure layout refetches session if needed
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--canvas)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            ExamGuard Admin
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Sign in to manage exams and monitor sessions
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="focus-ring"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 15,
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--soft)',
                color: 'var(--ink)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="focus-ring"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 15,
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--soft)',
                color: 'var(--ink)',
              }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="focus-ring"
            style={{
              marginTop: 8,
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: loading ? 'var(--subtle)' : 'var(--brand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
