import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Job, JobCandidate, Skill } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Badge } from '../../components/ui/Badge';

export function JobsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [minVerification, setMinVerification] = useState(75);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  const { data: jobs, isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => api.get<Job[]>('/admin/jobs') });
  const { data: catalog } = useQuery({ queryKey: ['skills'], queryFn: () => api.get<Skill[]>('/skills') });

  const { data: candidates } = useQuery({
    queryKey: ['job-candidates', expandedJobId],
    queryFn: () => api.get<JobCandidate[]>(`/admin/jobs/${expandedJobId}/candidates`),
    enabled: expandedJobId !== null,
  });

  const createJobMutation = useMutation({
    mutationFn: () => api.post('/admin/jobs', { title, minVerification, requiredSkills: selectedSkills }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowForm(false);
      setTitle('');
      setSelectedSkills([]);
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: ({ jobId, userId }: { jobId: number; userId: number }) => api.post(`/admin/jobs/${jobId}/shortlist`, { userId }),
  });

  function toggleSkill(id: number, checked: boolean) {
    setSelectedSkills((prev) => (checked ? [...prev, id] : prev.filter((s) => s !== id)));
  }

  return (
    <div className="stack-200">
      <div className="cluster-between">
        <span className="page-title">Job Postings</span>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New Job'}</Button>
      </div>

      {showForm && (
        <Card>
          <div className="stack-150">
            <TextField label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SDE Intern - Backend" />
            <TextField
              label="Minimum verification score"
              type="number" min={0} max={100}
              value={minVerification}
              onChange={(e) => setMinVerification(Number(e.target.value))}
            />
            <div className="stack-100">
              <span style={{ fontWeight: 600 }}>Required skills</span>
              {catalog?.map((s) => (
                <label key={s.id} className="cluster-150" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedSkills.includes(s.id)} onChange={(e) => toggleSkill(s.id, e.target.checked)} />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
            <Button
              disabled={!title || selectedSkills.length === 0 || createJobMutation.isPending}
              onClick={() => createJobMutation.mutate()}
            >
              Create Job Posting
            </Button>
          </div>
        </Card>
      )}

      {isLoading && <span className="text-subtle">Loading…</span>}

      <div className="stack-200">
        {jobs?.map((job) => (
          <Card key={job.id}>
            <div className="stack-150">
              <div className="cluster-between">
                <div className="stack-050">
                  <span className="section-title">{job.title}</span>
                  <div className="cluster-100">
                    {job.required_skills.map((s) => <Badge key={s} tone="discovery">{s}</Badge>)}
                    <Badge tone="neutral">Min score {Number(job.min_verification).toFixed(0)}</Badge>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}>
                  {expandedJobId === job.id ? 'Hide Candidates' : 'View Verified Candidates'}
                </Button>
              </div>

              {expandedJobId === job.id && (
                <div className="stack-100">
                  {candidates && candidates.length === 0 && <span className="text-subtle">No candidates currently meet the minimum verification bar.</span>}
                  {candidates?.map((c) => (
                    <div key={c.userId} className="cluster-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-100)' }}>
                      <div className="stack-050">
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span className="text-subtlest">{c.college} · avg verified score {c.averageScore}</span>
                      </div>
                      <Button variant="secondary" onClick={() => shortlistMutation.mutate({ jobId: job.id, userId: c.userId })}>
                        Shortlist
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
