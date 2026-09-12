import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Skill } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';

export function CreateTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [hackathon, setHackathon] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [selectedSkills, setSelectedSkills] = useState<Record<number, number>>({}); // skillId -> importance

  const { data: catalog } = useQuery({ queryKey: ['skills'], queryFn: () => api.get<Skill[]>('/skills') });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<{ id: number }>('/teams', {
        name,
        hackathon,
        maxMembers,
        requiredSkills: Object.entries(selectedSkills).map(([skillId, importance]) => ({ skillId: Number(skillId), importance })),
      }),
    onSuccess: (data) => navigate(`/captain/teams/${data.id}`),
  });

  function toggleSkill(skillId: number, checked: boolean) {
    setSelectedSkills((prev) => {
      const next = { ...prev };
      if (checked) next[skillId] = 3;
      else delete next[skillId];
      return next;
    });
  }

  const canSubmit = name.trim().length > 0 && Object.keys(selectedSkills).length > 0;

  return (
    <div className="stack-200">
      <span className="page-title">Create a Hackathon Team</span>
      <Card>
        <div className="stack-200">
          <TextField label="Team name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Code Titans" />
          <TextField label="Hackathon" value={hackathon} onChange={(e) => setHackathon(e.target.value)} placeholder="Bit N Build - International Hackathon" />
          <TextField label="Max members" type="number" min={2} max={8} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} />

          <div className="stack-100">
            <span style={{ fontWeight: 600 }}>Required skills</span>
            <span className="text-subtlest">Check the skills this team needs. We'll use this to rank and discover candidates.</span>
            <div className="stack-100">
              {catalog?.map((s) => (
                <label key={s.id} className="cluster-150" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={s.id in selectedSkills}
                    onChange={(e) => toggleSkill(s.id, e.target.checked)}
                  />
                  <span>{s.name}</span>
                  {s.id in selectedSkills && (
                    <select
                      value={selectedSkills[s.id]}
                      onChange={(e) => setSelectedSkills((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                    >
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Priority {n}</option>)}
                    </select>
                  )}
                </label>
              ))}
            </div>
          </div>

          <Button disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Creating…' : 'Create Team'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
