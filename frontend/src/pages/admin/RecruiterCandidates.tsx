import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Job, JobCandidate } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function RecruiterCandidatesPage() {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs'),
  });

  const activeJobId = selectedJobId ?? (jobs && jobs[0] ? jobs[0].id : null);

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['job-candidates', activeJobId],
    queryFn: () => api.get<JobCandidate[]>(`/jobs/${activeJobId}/candidates`),
    enabled: !!activeJobId,
  });

  const { data: shortlisted } = useQuery({
    queryKey: ['job-shortlist', activeJobId],
    queryFn: () => api.get<any[]>(`/jobs/${activeJobId}/shortlist`),
    enabled: !!activeJobId,
  });

  const shortlistIds = new Set((shortlisted || []).map((s) => s.id));

  const shortlistMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/jobs/${activeJobId}/shortlist`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-shortlist', activeJobId] });
    },
  });

  const activeJob = jobs?.find((j) => j.id === activeJobId);

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Ranked Candidate Discovery</span>
        <span className="text-subtle">
          Transparent ranking based exclusively on tested assessment scores and GitHub repository signals.
          Only candidates meeting or exceeding your job's minimum Verification Score appear here.
        </span>
      </div>

      {jobsLoading && <span className="text-subtle">Loading job postings…</span>}

      {/* Job selector tabs */}
      {jobs && jobs.length > 0 && (
        <Card>
          <div className="stack-100">
            <div className="cluster-100">
              {jobs.map((j) => (
                <Button
                  key={j.id}
                  variant={j.id === activeJobId ? 'primary' : 'secondary'}
                  onClick={() => setSelectedJobId(j.id)}
                >
                  {j.title} (Min {Number(j.min_verification).toFixed(0)}%)
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeJob && (
        <div className="cluster-between">
          <div className="stack-050">
            <span className="section-title">{activeJob.title}</span>
            <span className="text-subtlest">
              Required: {activeJob.required_skills.join(', ')} · Min Verification: {Number(activeJob.min_verification).toFixed(0)}%
            </span>
          </div>
          <Badge tone="brand">{candidates?.length || 0} Qualifying Candidates</Badge>
        </div>
      )}

      {candidatesLoading && <span className="text-subtle">Ranking candidates…</span>}

      {candidates && candidates.length === 0 && (
        <div className="empty-state">
          No candidates currently meet the minimum verification score threshold ({Number(activeJob?.min_verification).toFixed(0)}%) for all required skills.
        </div>
      )}

      <div className="grid-2">
        {candidates?.map((c, index) => {
          const isShortlisted = shortlistIds.has(c.userId);
          return (
            <Card key={c.userId}>
              <div className="stack-200">
                <div className="cluster-between">
                  <div className="stack-050">
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>
                      #{index + 1} {c.name}
                    </span>
                    <span className="text-subtlest">{c.college || 'BIT Punjab'}</span>
                  </div>
                  <Badge tone={c.averageScore >= 85 ? 'success' : 'info'}>
                    Rank #{index + 1} · {c.averageScore}% Avg
                  </Badge>
                </div>

                <div className="stack-100">
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>REQUIRED SKILLS BREAKDOWN</span>
                  {c.skillBreakdown.map((s) => (
                    <div key={s.skillName} className="cluster-between" style={{ padding: 'var(--space-050) 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>✓ {s.skillName}</span>
                      <div className="cluster-100">
                        <span style={{ fontWeight: 600 }}>{s.verificationScore.toFixed(0)}%</span>
                        <Link to={`/verification/${c.userId}/${(jobs?.find(j => j.id === activeJobId)) ? 1 : 1}`}>
                          <Button variant="secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>Chain</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cluster-between">
                  <span className="text-subtlest">Verified via Assessment (60%) + Evidence (40%)</span>
                  <Button
                    variant={isShortlisted ? 'secondary' : 'primary'}
                    disabled={isShortlisted || shortlistMutation.isPending}
                    onClick={() => shortlistMutation.mutate(c.userId)}
                  >
                    {isShortlisted ? '✓ Shortlisted' : 'Shortlist Candidate'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
