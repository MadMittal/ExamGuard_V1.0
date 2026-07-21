'use client';

import type { BlockedReason } from '@/types/exam';

interface Props {
  reason: BlockedReason;
  message: string;
}

const ICONS: Record<BlockedReason, string> = {
  not_enrolled: '🚫',
  not_allowed: '🚫',
  terminated: '⛔',
  completed: '✅',
  one_submission: '📝',
};

const TITLES: Record<BlockedReason, string> = {
  not_enrolled: 'Not Enrolled',
  not_allowed: 'Access Restricted',
  terminated: 'Session Terminated',
  completed: 'Already Submitted',
  one_submission: 'One Submission Only',
};

export function BlockedScreen({ reason, message }: Props) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 440, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{ICONS[reason]}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{TITLES[reason]}</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </div>
  );
}
