import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MyChallenge } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Badge, toneForStatus } from '../../components/ui/Badge';
import { CodeEditorStub } from '../../components/widgets/CodeEditorStub';

export function MyChallengesPage() {
  const queryClient = useQueryClient();
  const [codeByChallenge, setCodeByChallenge] = useState<Record<number, string>>({});

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges', 'mine'],
    queryFn: () => api.get<MyChallenge[]>('/challenges/mine'),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) => api.post(`/challenges/${id}/submit`, { code }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', 'mine'] }),
  });

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Practical Challenges</span>
        <span className="text-subtle">
          Real-world, pre-join skill checks assigned directly by team captains to verify practical problem solving.
        </span>
      </div>

      {isLoading && <span className="text-subtle">Loading your challenges…</span>}
      {challenges && challenges.length === 0 && (
        <div className="empty-state">
          No practical challenges currently assigned. Browse open teams and request to join to receive challenge assignments.
        </div>
      )}

      {challenges?.map((c) => {
        const currentCode = codeByChallenge[c.id] ?? (c.code_submission || c.starter_code || '');

        return (
          <Card key={c.id}>
            <div className="stack-200">
              <div className="cluster-between">
                <div className="stack-050">
                  <span className="section-title">{c.title}</span>
                  <span className="text-subtle">
                    Skill: <strong>{c.skill_name}</strong> · Team: <strong>{c.team_name}</strong> · Time Limit: {c.time_limit_minutes} min
                  </span>
                </div>
                <Badge tone={c.status === 'accepted' ? 'success' : c.status === 'rejected' ? 'danger' : c.status === 'scored' ? 'info' : 'warning'}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>

              {/* Challenge prompt and instructions */}
              <div className="card-sunken stack-100">
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Challenge Prompt</span>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{c.prompt}</p>
                {c.instructions && (
                  <div className="info-callout" style={{ marginTop: 'var(--space-100)' }}>
                    <span className="info-callout-icon">📋</span>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>Instructions & Constraints:</strong>
                      <span>{c.instructions}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status: ASSIGNED */}
              {c.status === 'assigned' && (
                <div className="stack-150">
                  <span style={{ fontWeight: 600 }}>Your Solution</span>
                  <CodeEditorStub
                    value={currentCode}
                    onChange={(val) => setCodeByChallenge((prev) => ({ ...prev, [c.id]: val }))}
                    timeLimitMinutes={c.time_limit_minutes}
                    onSubmit={() => submitMutation.mutate({ id: c.id, code: currentCode })}
                  />
                  {submitMutation.isPending && <span className="text-subtle">Submitting your code…</span>}
                </div>
              )}

              {/* Status: SUBMITTED (Pending review) */}
              {c.status === 'submitted' && (
                <div className="stack-150">
                  <div className="info-callout">
                    <span className="info-callout-icon">⏳</span>
                    <span>Solution submitted successfully! Awaiting captain review against the evaluation rubric.</span>
                  </div>
                  {c.code_submission && (
                    <div className="stack-050">
                      <span className="text-subtlest">SUBMITTED CODE</span>
                      <pre style={{ background: '#0B1220', color: '#D8E1F5', padding: 'var(--space-200)', borderRadius: 'var(--radius-medium)', overflowX: 'auto', fontSize: 'var(--font-size-100)' }}>
                        {c.code_submission}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Status: SCORED / ACCEPTED / REJECTED */}
              {(c.status === 'scored' || c.status === 'accepted' || c.status === 'rejected') && (
                <div className="stack-200">
                  <div className="card-sunken stack-150">
                    <div className="cluster-between">
                      <span className="section-title">Captain Review Rubric</span>
                      <div className="cluster-100">
                        <span className="stat-number" style={{ fontSize: '28px' }}>{c.score}/100</span>
                        <Badge tone={c.score && c.score >= 75 ? 'success' : 'warning'}>
                          {c.recommendation || (c.score && c.score >= 75 ? 'Strong Pass' : 'Needs Work')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid-3">
                      <div className="stack-050">
                        <span className="text-subtlest">CORRECTNESS (40%)</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>
                          {c.correctness !== null ? `${c.correctness}/100` : '—'}
                        </span>
                      </div>
                      <div className="stack-050">
                        <span className="text-subtlest">CODE QUALITY (30%)</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>
                          {c.code_quality !== null ? `${c.code_quality}/100` : '—'}
                        </span>
                      </div>
                      <div className="stack-050">
                        <span className="text-subtlest">PROBLEM SOLVING (30%)</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>
                          {c.problem_solving !== null ? `${c.problem_solving}/100` : '—'}
                        </span>
                      </div>
                    </div>

                    {c.comments && (
                      <div className="stack-050" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-100)' }}>
                        <span className="text-subtlest">CAPTAIN COMMENTS</span>
                        <p style={{ fontStyle: 'italic', color: 'var(--color-text)' }}>"{c.comments}"</p>
                      </div>
                    )}
                  </div>

                  {c.status === 'accepted' && (
                    <div className="cluster-100" style={{ color: 'var(--color-success-bold)', fontWeight: 700 }}>
                      <span>✓ Congratulations! You have been accepted into {c.team_name}.</span>
                    </div>
                  )}
                  {c.status === 'rejected' && (
                    <div className="cluster-100" style={{ color: 'var(--color-danger-bold)', fontWeight: 600 }}>
                      <span>You were not selected for this position. Keep practicing and boosting your Verification Scores!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
