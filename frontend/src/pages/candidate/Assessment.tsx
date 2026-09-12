import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { AssessmentQuestion } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function AssessmentPage() {
  const { skillId } = useParams();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; correctCount: number; totalCount: number } | null>(null);

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

  const totalQuestions = questions ? questions.length : 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

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
      <div className="cluster-between">
        <Link to="/candidate/passport">← Back to Skill Passport</Link>
        {questions && questions.length > 0 && (
          <span className="text-subtle" style={{ fontWeight: 600 }}>
            Answered: {answeredCount} / {totalQuestions}
          </span>
        )}
      </div>

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
