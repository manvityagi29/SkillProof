import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface AssessmentSkill {
  id: number;
  name: string;
  category: string;
  question_count: string;
}

interface AssessmentHistory {
  id: number;
  skill_id: number;
  skill_name: string;
  score: string;
  correct_count: number;
  total_count: number;
  created_at: string;
}

export function AssessmentsListPage() {
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => api.get<AssessmentSkill[]>('/assessments'),
  });

  const { data: results } = useQuery({
    queryKey: ['assessments', 'results'],
    queryFn: () => api.get<AssessmentHistory[]>('/assessments/results'),
  });

  const historyMap = new Map<number, AssessmentHistory>();
  (results || []).forEach((r) => {
    if (!historyMap.has(r.skill_id)) {
      historyMap.set(r.skill_id, r);
    }
  });

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Technical Assessments</span>
        <span className="text-subtle">
          Take objective, 5-question multiple choice quizzes to test and prove your foundational knowledge.
          Assessments count for 60% of your Verification Score.
        </span>
      </div>

      <div className="proctoring-banner">
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Anti-Cheating Policy Active
          </span>
        </div>
        <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
          All assessments are strictly proctored against browser tab switching. Navigating away or switching tabs during an active quiz will trigger a strike; repeated violations will instantly cancel and void your assessment.
        </span>
        <Badge tone="warning">Tab Switch Detection</Badge>
      </div>

      {isLoading && <span className="text-subtle">Loading assessments…</span>}

      <div className="grid-2">
        {assessments?.map((a) => {
          const pastResult = historyMap.get(a.id);
          return (
            <Card key={a.id}>
              <div className="stack-150">
                <div className="cluster-between">
                  <div className="stack-050">
                    <span className="section-title">{a.name}</span>
                    <span className="text-subtlest">{a.category.toUpperCase()} · {a.question_count} Questions</span>
                  </div>
                  {pastResult ? (
                    <Badge tone={Number(pastResult.score) >= 75 ? 'success' : Number(pastResult.score) >= 40 ? 'warning' : 'danger'}>
                      Score: {Number(pastResult.score).toFixed(0)}%
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Not Taken</Badge>
                  )}
                </div>

                {pastResult && (
                  <span className="text-subtlest">
                    Last attempt: {pastResult.correct_count}/{pastResult.total_count} correct on {new Date(pastResult.created_at).toLocaleDateString()}
                  </span>
                )}

                <div className="cluster-between">
                  <span className="text-subtle">Auto-graded on submit</span>
                  <Link to={`/candidate/assessments/${a.id}`}>
                    <Button variant={pastResult ? 'secondary' : 'primary'}>
                      {pastResult ? 'Retake Assessment' : 'Start Assessment'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
