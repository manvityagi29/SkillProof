import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Skill } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';

export function CreateJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [minVerification, setMinVerification] = useState(75);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get<Skill[]>('/skills'),
  });

  const createJobMutation = useMutation({
    mutationFn: () => api.post('/jobs', { title, minVerification, requiredSkills: selectedSkills }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/recruiter/jobs');
    },
  });

  function toggleSkill(id: number, checked: boolean) {
    setSelectedSkills((prev) => (checked ? [...prev, id] : prev.filter((s) => s !== id)));
  }

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Post a Verified Job Opportunity</span>
        <span className="text-subtle">
          Define the role, required skills, and the minimum Verification Score candidates must prove.
          Only candidates whose tested assessments and GitHub evidence meet this threshold will qualify.
        </span>
      </div>

      <Card>
        <div className="stack-200">
          <TextField
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineer Intern - Backend"
            required
          />

          <TextField
            label="Minimum Verification Score (0-100)"
            type="number"
            min={0}
            max={100}
            value={minVerification}
            onChange={(e) => setMinVerification(Number(e.target.value))}
          />

          <div className="stack-100">
            <span style={{ fontWeight: 600 }}>Required Skills (Select at least one)</span>
            {isLoading && <span className="text-subtle">Loading skills catalog…</span>}
            <div className="grid-3">
              {catalog?.map((s) => (
                <label key={s.id} className="cluster-150" style={{ cursor: 'pointer', padding: 'var(--space-050)' }}>
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(s.id)}
                    onChange={(e) => toggleSkill(s.id, e.target.checked)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cluster-150">
            <Button
              variant="primary"
              disabled={!title || selectedSkills.length === 0 || createJobMutation.isPending}
              onClick={() => createJobMutation.mutate()}
            >
              {createJobMutation.isPending ? 'Publishing Job…' : 'Publish Job Posting'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/recruiter/jobs')}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
