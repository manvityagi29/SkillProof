import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { AssessmentQuestion } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface LogEntry {
  time: string;
  type: 'info' | 'violation' | 'fatal';
  message: string;
}

export function AssessmentPage() {
  const { skillId } = useParams();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; correctCount: number; totalCount: number } | null>(null);

  // Proctoring & Anti-Cheating State
  const [strikes, setStrikes] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [violationLogs, setViolationLogs] = useState<LogEntry[]>([]);

  // Guard against rapid duplicate firing between visibilitychange & blur
  const lastViolationTimeRef = useRef<number>(0);
  const strikesRef = useRef<number>(0);
  strikesRef.current = strikes;

  const { data: questions, isLoading } = useQuery({
    queryKey: ['assessment-questions', skillId],
    queryFn: () => api.get<AssessmentQuestion[]>(`/assessments/${skillId}/questions`),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<{ score: number; correctCount: number; totalCount: number }>(`/assessments/${skillId}/submit`, {
        answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId: Number(questionId), selectedIndex })),
      }),
    onSuccess: (data) => setResult(data),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      api.post(`/assessments/${skillId}/cancel`, {
        strikes: 2,
        reason,
      }),
  });

  // Soft audible alert tone on violation
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Triggered when tab switch or focus loss is detected
  const handleTabSwitch = () => {
    // If already cancelled or finished, ignore
    if (isCancelled || result) return;

    const now = Date.now();
    // Debounce to ensure a single tab switch doesn't register twice
    if (now - lastViolationTimeRef.current < 2000) return;
    lastViolationTimeRef.current = now;

    const timeStr = new Date().toLocaleTimeString();
    const currentStrikes = strikesRef.current;
    playAlertSound();

    if (currentStrikes === 0) {
      // Strike 1: Warning
      setStrikes(1);
      setShowWarningModal(true);
      setViolationLogs((prev) => [
        ...prev,
        {
          time: timeStr,
          type: 'violation',
          message: 'Tab switch / focus loss detected (Strike 1 of 2 logged)',
        },
      ]);
    } else {
      // Strike 2: Disqualification & Cancellation
      setStrikes(2);
      setIsCancelled(true);
      setShowWarningModal(false);
      setViolationLogs((prev) => [
        ...prev,
        {
          time: timeStr,
          type: 'fatal',
          message: 'Repeated tab switch detected (Strike 2 of 2) — Assessment Cancelled',
        },
      ]);
      cancelMutation.mutate('Proctoring Violation: Multiple tab switches detected during active quiz.');
    }
  };

  // Monitor tab switches and window blur while the test is active
  useEffect(() => {
    const isTestActive = !result && !isCancelled && questions && questions.length > 0;
    if (!isTestActive) return;

    // Log initialization once
    if (violationLogs.length === 0) {
      setViolationLogs([
        {
          time: new Date().toLocaleTimeString(),
          type: 'info',
          message: 'Session started with active proctoring & tab-switch monitor',
        },
      ]);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitch();
      }
    };

    const handleBlur = () => {
      handleTabSwitch();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [result, isCancelled, questions]);

  const totalQuestions = questions ? questions.length : 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Render Disqualification & Cancellation Screen
  if (isCancelled) {
    return (
      <div className="stack-300">
        <Link to="/candidate/passport">← Back to Skill Passport</Link>

        <Card>
          <div className="stack-250" style={{ justifyItems: 'center', textAlign: 'center', padding: 'var(--space-300) 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center', fontSize: '32px' }}>
              🚫
            </div>

            <div className="stack-050">
              <span className="page-title" style={{ color: '#DC2626' }}>
                Assessment Cancelled &amp; Voided
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                Disqualified for Academic Integrity Policy Violation
              </span>
            </div>

            <Badge tone="danger">Status: Voided (Multiple Tab Switches Detected)</Badge>

            <div style={{ maxWidth: '580px', width: '100%', textAlign: 'left', padding: '14px 18px', background: '#FEF2F2', borderRadius: 'var(--radius-medium)', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', lineHeight: '1.6' }}>
              <strong>Anti-Cheating Policy Enforcement:</strong>
              <p style={{ margin: '6px 0 0 0' }}>
                This assessment was terminated because browser tab switching was detected during an active test session. To preserve credential validity and merit on SkillProof, evaluations must be performed in a single, unassisted window without navigating away.
              </p>
            </div>

            {/* Proctoring Audit Terminal */}
            <div style={{ maxWidth: '580px', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-subtlest)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Proctoring Security Audit Log
              </span>
              <div className="proctoring-audit-terminal" style={{ marginTop: '8px' }}>
                {violationLogs.map((log, i) => (
                  <div key={i} className="proctoring-audit-row">
                    <span style={{ color: '#64748B' }}>{log.time}</span>
                    <span style={{ color: log.type === 'violation' ? '#F87171' : log.type === 'fatal' ? '#EF4444' : '#38BDF8' }}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cluster-150" style={{ marginTop: 'var(--space-100)' }}>
              <Link to="/candidate/passport">
                <Button variant="secondary">Return to Skill Passport</Button>
              </Link>
              <Link to="/candidate/assessments">
                <Button variant="primary">Browse Assessments</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render Completed Quiz Result
  if (result) {
    const isPassing = result.score >= 70;
    return (
      <div className="stack-300">
        <Link to="/candidate/passport">← Back to Skill Passport</Link>
        <Card>
          <div className="stack-200" style={{ justifyItems: 'center', textAlign: 'center', padding: 'var(--space-300) 0' }}>
            <span className="page-title">{isPassing ? 'Assessment Completed! 🎉' : 'Assessment Completed'}</span>
            <span className="stat-number" style={{ fontSize: '56px', color: isPassing ? 'var(--color-success-bold)' : 'var(--color-warning-bold)' }}>
              {result.score.toFixed(0)}%
            </span>
            <Badge tone={result.score >= 75 ? 'success' : result.score >= 40 ? 'warning' : 'danger'}>
              {result.correctCount} of {result.totalCount} Questions Correct
            </Badge>
            <div className="info-callout" style={{ maxWidth: '500px', textAlign: 'left' }}>
              <span className="info-callout-icon">✓</span>
              <span>
                Your score contributes <strong>60%</strong> towards your total Verification Score for this skill.
                Combine this with GitHub Evidence (40%) to maximize your ranking.
              </span>
            </div>
            <Link to="/candidate/passport">
              <Button variant="primary">View Updated Skill Passport</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-300">
      {/* Tab Switch Warning Modal (Strike 1) */}
      {showWarningModal && (
        <div className="proctoring-backdrop" role="alertdialog" aria-modal="true">
          <div className="proctoring-modal">
            <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '12px', alignItems: 'center', justifyContent: 'start' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: 800 }}>
                ⚠️
              </div>
              <div className="stack-025">
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Tab Switch Detected (Warning 1 of 2)
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Academic Integrity Violation Recorded
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: 'var(--radius-small)', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
              <strong>Warning:</strong> You navigated away from the assessment tab. SkillProof monitors tab changes and window focus to prevent looking up answers.
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: '1.5', margin: 0 }}>
              If you switch tabs, minimize this browser window, or open other applications <strong>one more time</strong>, this assessment will be <strong>immediately cancelled, disqualified, and voided</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-100)', marginTop: 'var(--space-100)' }}>
              <Button variant="primary" onClick={() => setShowWarningModal(false)}>
                I Understand — Resume Assessment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="cluster-between">
        <Link to="/candidate/passport">← Back to Skill Passport</Link>
        {questions && questions.length > 0 && (
          <span className="text-subtle" style={{ fontWeight: 600 }}>
            Answered: {answeredCount} / {totalQuestions}
          </span>
        )}
      </div>

      {/* Live Proctoring & Anti-Cheating Banner */}
      <div className={`proctoring-banner ${strikes > 0 ? 'active-warning' : ''}`}>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Anti-Cheating Proctoring: {strikes === 0 ? 'Active' : 'Strike Recorded'}
          </span>
        </div>

        <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
          {strikes === 0
            ? 'Do not switch browser tabs or minimize this window. Tab switching will trigger a strike and lead to quiz cancellation.'
            : '⚠️ 1 of 2 strikes recorded! If you leave or switch this tab again, this assessment will be immediately cancelled.'}
        </span>

        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: strikes === 0 ? '#10B981' : '#EF4444', display: 'inline-block' }} />
          <span style={{ fontWeight: 700, fontSize: '12px' }}>
            {strikes} / 2 Strikes
          </span>
        </div>
      </div>

      {/* Page Title & Progress */}
      <div className="stack-100">
        <div className="cluster-between">
          <span className="page-title">Technical Assessment</span>
          <Badge tone="brand">Objective MCQ</Badge>
        </div>
        <span className="text-subtle">
          Please answer all questions below. Your responses are directly evaluated against our answer keys to calculate your Assessment Score (60% weight).
        </span>
        {totalQuestions > 0 && (
          <div className="skill-bar-track" style={{ height: '8px', marginTop: 'var(--space-050)' }}>
            <div className="skill-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {isLoading && (
        <Card>
          <span className="text-subtle">Loading assessment questions…</span>
        </Card>
      )}

      {/* Question Cards */}
      {questions?.map((q, idx) => {
        const isAnswered = answers[q.id] !== undefined;
        return (
          <Card key={q.id}>
            <div className="stack-200">
              <div className="cluster-between">
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>
                  Question {idx + 1}
                </span>
                {isAnswered && <Badge tone="success">Answered</Badge>}
              </div>
              <p style={{ fontSize: 'var(--font-size-200)', lineHeight: '1.6', color: 'var(--color-text)' }}>
                {q.question}
              </p>
              <div className="stack-100">
                {q.options.map((opt, i) => {
                  const isSelected = answers[q.id] === i;
                  return (
                    <label
                      key={i}
                      className={`quiz-option ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={isSelected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                      />
                      <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--color-brand-bolder)' : 'inherit' }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Submit Bar */}
      {questions && questions.length > 0 && (
        <Card>
          <div className="cluster-between">
            <div className="stack-050">
              <span style={{ fontWeight: 600 }}>Ready to submit?</span>
              <span className="text-subtle">
                {allAnswered
                  ? 'All questions answered! Click submit to calculate your score.'
                  : `Please answer all remaining questions (${totalQuestions - answeredCount} left).`}
              </span>
            </div>
            <Button
              variant="primary"
              disabled={!allAnswered || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? 'Grading Answers…' : 'Submit Assessment'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
