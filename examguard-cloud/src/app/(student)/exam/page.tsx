'use client';

import { useState, useEffect } from 'react';
import { useExamInfo } from '@/lib/hooks/useExamInfo';
import { useSession } from '@/lib/hooks/useSession';
import { ExamInfoScreen } from '@/components/student/ExamInfoScreen';
import { LoginScreen } from '@/components/student/LoginScreen';
import { PreExamChecklist } from '@/components/student/PreExamChecklist';
import { ExamScreen } from '@/components/student/ExamScreen';
import { CompletionScreen } from '@/components/student/CompletionScreen';
import { BlockedScreen } from '@/components/student/BlockedScreen';

function MobileBlock() {
  return (
    <div style={{ padding: 32, textAlign: 'center', maxWidth: 400, margin: '80px auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💻</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Desktop Required</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
        ExamGuard requires a desktop browser (Chrome or Edge) with a screen width of at least 1024px.
        Please switch to a laptop or desktop computer.
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: 'var(--muted)',
      fontSize: 14,
    }}>
      Loading exam information…
    </div>
  );
}

export default function ExamPage() {
  const { forms, settings, institutionName, loading: infoLoading, error: infoError } = useExamInfo();
  const session = useSession(settings, forms);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection - moved to useEffect to prevent SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  if (isMobile) {
    return <MobileBlock />;
  }

  // Loading exam info
  if (infoLoading) return <LoadingSpinner />;

  // Error loading exam info
  if (infoError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', maxWidth: 400, margin: '80px auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>
          Failed to load exam
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{infoError}</p>
      </div>
    );
  }

  // Screen router — single-page state machine
  switch (session.screen) {
    case 'landing':
    case 'exam-info':
      return (
        <ExamInfoScreen
          forms={forms}
          institutionName={institutionName}
          onSelectForm={session.enterLogin}
        />
      );

    case 'login':
    case 'checking':
      return (
        <LoginScreen
          form={session.selectedForm!}
          institutionName={institutionName}
          onSubmit={session.submitEmail}
          loading={session.loading}
          error={session.error}
        />
      );

    case 'blocked':
      return (
        <BlockedScreen
          reason={session.blockedReason!}
          message={session.blockedMessage}
        />
      );

    case 'pre-checklist':
      return settings ? (
        <PreExamChecklist
          settings={settings}
          onReady={session.startSession}
          loading={session.loading}
          error={session.error}
        />
      ) : null;

    case 'exam-active':
      return (
        <ExamScreen
          googleFormUrl={session.googleFormUrl}
          score={session.score}
          violations={session.violations}
          endTime={session.selectedForm?.endTime ?? null}
          timeLimitMinutes={session.selectedForm?.timeLimitMinutes ?? null}
          startedAt={session.startedAt}
          showScore={settings?.showScore ?? true}
          onSubmit={session.endSession}
          loading={session.loading}
          sessionToken={session.sessionToken}
          sessionId={session.sessionId}
          settings={settings}
          onUpdateScore={session.updateScore}
          onTerminate={session.terminateSession}
        />
      );

    case 'completing':
    case 'completed':
      return (
        <CompletionScreen
          score={session.score}
          violations={session.violations}
          status={session.blockedReason === 'terminated' ? 'TERMINATED' : 'COMPLETED'}
          reason={session.blockedMessage || undefined}
        />
      );

    default:
      return <LoadingSpinner />;
  }
}
