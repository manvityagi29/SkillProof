import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';

interface ChallengeItem {
  id: number;
  status: string;
  score: number | null;
  recommendation: string | null;
  code_submission: string | null;
  correctness: number | null;
  code_quality: number | null;
  problem_solving: number | null;
  comments: string | null;
  verdict: string | null;
  title: string;
  prompt: string;
  time_limit_minutes: number;
  instructions: string | null;
  starter_code: string | null;
  candidate_name: string;
  skill_name: string;
  team_name: string;
}

export function ChallengeReviewPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [reviewState, setReviewState] = useState<Record<number, {
    correctness: number;
    codeQuality: number;
    problemSolving: number;
    comments: string;
  }>>({});

  const endpoint = id ? `/challenges/team/${id}` : '/challenges';

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['captain-challenges', id],
    queryFn: () => api.get<ChallengeItem[]>(endpoint),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ challengeId, verdict }: { challengeId: number; verdict: 'ACCEPT' | 'REJECT' }) => {
      const state = reviewState[challengeId] || { correctness: 80, codeQuality: 80, problemSolving: 80, comments: '' };
      const overallScore = Math.round((Number(state.correctness) + Number(state.codeQuality) + Number(state.problemSolving)) / 3);
      return api.post(`/challenges/${challengeId}/review`, {
        correctness: Number(state.correctness),
        codeQuality: Number(state.codeQuality),
        problemSolving: Number(state.problemSolving),
        overallScore,
        comments: state.comments,
        verdict,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captain-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });

  function updateField(challengeId: number, field: string, value: any) {
    setReviewState((prev) => ({
      ...prev,
      [challengeId]: {
        ...(prev[challengeId] || { correctness: 80, codeQuality: 80, problemSolving: 80, comments: '' }),
        [field]: value,
      },
    }));
  }

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Practical Challenge Review</span>
        <span className="text-subtle">
          Review candidates' submitted solutions against a structured human rubric.
          No automated grading — captains evaluate code quality and problem solving directly.
        </span>
      </div>

      {isLoading && <span className="text-subtle">Loading submissions…</span>}
      {challenges && challenges.length === 0 && (
        <div className="empty-state">
          No practical challenges found. Go to Candidate Discovery to assign a practical challenge.
        </div>
      )}

      {challenges?.map((c) => {
        const state = reviewState[c.id] || {
          correctness: c.correctness ?? 85,
          codeQuality: c.code_quality ?? 80,
          problemSolving: c.problem_solving ?? 85,
          comments: c.comments ?? '',
        };
        const calculatedScore = Math.round((Number(state.correctness) + Number(state.codeQuality) + Number(state.problemSolving)) / 3);

        return (
          <Card key={c.id}>
            <div className="stack-200">
              <div className="cluster-between">
                <div className="stack-050">
                  <span className="section-title">{c.candidate_name} — {c.skill_name}</span>
                  <span className="text-subtlest">{c.title} · Team: {c.team_name}</span>
                </div>
                <Badge tone={c.status === 'accepted' ? 'success' : c.status === 'rejected' ? 'danger' : c.status === 'submitted' ? 'discovery' : 'neutral'}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>

              <Card sunken>
                <div className="stack-050">
                  <span style={{ fontWeight: 600 }}>Challenge Prompt:</span>
                  <span>{c.prompt}</span>
                  {c.instructions && <span className="text-subtle">Instructions: {c.instructions}</span>}
                </div>
              </Card>

              {c.code_submission ? (
                <div className="code-editor">
                  <div className="code-editor-toolbar">
                    <span className="code-editor-toolbar-title">Candidate Submission ({c.skill_name})</span>
                    <span />
                    <span />
                  </div>
                  <pre style={{ margin: 0, padding: 'var(--space-200)', color: '#D8E1F5', overflowX: 'auto', fontFamily: 'monospace', fontSize: 'var(--font-size-200)', maxHeight: '320px' }}>
                    {c.code_submission}
                  </pre>
                </div>
              ) : (
                <span className="text-subtle">Candidate has not submitted code yet.</span>
              )}

              {/* Human Rubric Review Form */}
              {c.status === 'submitted' && (
                <Card>
                  <div className="stack-150">
                    <span className="section-title">Human Rubric Evaluation</span>

                    <div className="grid-3">
                      <TextField
                        label="Correctness (0-100)"
                        type="number"
                        min={0}
                        max={100}
                        value={state.correctness}
                        onChange={(e) => updateField(c.id, 'correctness', Number(e.target.value))}
                      />
                      <TextField
                        label="Code Quality (0-100)"
                        type="number"
                        min={0}
                        max={100}
                        value={state.codeQuality}
                        onChange={(e) => updateField(c.id, 'codeQuality', Number(e.target.value))}
                      />
                      <TextField
                        label="Problem Solving (0-100)"
                        type="number"
                        min={0}
                        max={100}
                        value={state.problemSolving}
                        onChange={(e) => updateField(c.id, 'problemSolving', Number(e.target.value))}
                      />
                    </div>

                    <div className="cluster-150">
                      <span className="text-subtle">Calculated Overall Score:</span>
                      <span className="stat-number" style={{ fontSize: '24px' }}>{calculatedScore}/100</span>
                    </div>

                    <div className="stack-050">
                      <label style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>Review Comments</label>
                      <textarea
                        rows={3}
                        value={state.comments}
                        onChange={(e) => updateField(c.id, 'comments', e.target.value)}
                        placeholder="Provide feedback on the candidate's implementation, edge case handling, or architecture..."
                        style={{
                          width: '100%',
                          padding: 'var(--space-100)',
                          borderRadius: 'var(--radius-small)',
                          border: '1px solid var(--color-border)',
                          fontFamily: 'inherit',
                          fontSize: 'var(--font-size-200)',
                        }}
                      />
                    </div>

                    <div className="cluster-150">
                      <Button
                        variant="primary"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ challengeId: c.id, verdict: 'ACCEPT' })}
                      >
                        ✓ Accept Candidate to Team
                      </Button>
                      <Button
                        variant="danger"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ challengeId: c.id, verdict: 'REJECT' })}
                      >
                        ✗ Reject Submission
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {(c.status === 'accepted' || c.status === 'rejected') && (
                <div className="stack-100" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-100)' }}>
                  <div className="cluster-150">
                    <span>Reviewed Score: <strong>{c.score}/100</strong></span>
                    <Badge tone={c.status === 'accepted' ? 'success' : 'danger'}>
                      Verdict: {c.status.toUpperCase()}
                    </Badge>
                  </div>
                  {c.comments && <span className="text-subtle">Captain Feedback: "{c.comments}"</span>}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
