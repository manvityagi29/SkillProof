import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { CandidateMatch, ChallengePrompt } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { MatchCard } from '../../components/widgets/MatchCard';

interface TeamSimple {
  id: number;
  name: string;
  hackathon: string | null;
}

export function DiscoveryPage() {
  const params = useParams();
  const queryClient = useQueryClient();

  const { data: myTeams } = useQuery({
    queryKey: ['teams', 'mine'],
    queryFn: () => api.get<TeamSimple[]>('/teams/mine'),
  });

  const activeTeamId = params.id ? Number(params.id) : (myTeams && myTeams[0] ? myTeams[0].id : null);

  const [assigning, setAssigning] = useState<{ candidateId: number; candidateName: string; skillId: number; skillName: string } | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customTimeLimit, setCustomTimeLimit] = useState(15);
  const [customStarterCode, setCustomStarterCode] = useState('');

  const { data: matches, isLoading } = useQuery({
    queryKey: ['team', activeTeamId, 'matches'],
    queryFn: () => api.get<CandidateMatch[]>(`/teams/${activeTeamId}/matches`),
    enabled: !!activeTeamId,
  });

  const { data: catalog } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get<{ id: number; name: string }[]>('/skills'),
  });

  const { data: prompts } = useQuery({
    queryKey: ['prompts', assigning?.skillId],
    queryFn: () => api.get<ChallengePrompt[]>(`/challenges/prompts/${assigning!.skillId}`),
    enabled: !!assigning,
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      if (useCustom) {
        return api.post('/challenges', {
          teamId: activeTeamId,
          candidateId: assigning!.candidateId,
          skillId: assigning!.skillId,
          title: customTitle,
          prompt: customPrompt,
          instructions: customInstructions,
          timeLimitMinutes: customTimeLimit,
          starterCode: customStarterCode,
        });
      }
      return api.post('/challenges', {
        teamId: activeTeamId,
        candidateId: assigning!.candidateId,
        skillId: assigning!.skillId,
        promptId: Number(selectedPromptId),
      });
    },
    onSuccess: () => {
      setAssigning(null);
      setSelectedPromptId('');
      setCustomTitle('');
      setCustomPrompt('');
      setCustomInstructions('');
      setCustomStarterCode('');
      queryClient.invalidateQueries({ queryKey: ['team', activeTeamId, 'matches'] });
    },
  });

  function handleAssignClick(candidate: CandidateMatch, skillName: string) {
    const skill = catalog?.find((s) => s.name === skillName);
    if (skill) {
      setAssigning({
        candidateId: candidate.userId,
        candidateName: candidate.name,
        skillId: skill.id,
        skillName,
      });
      setCustomTitle(`${skillName} Practical Challenge`);
    }
  }

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Discover Verified Candidates</span>
        <span className="text-subtle">
          Transparent skill-coverage matching: candidates are ranked by how their verified scores fill your team's open skill gaps.
          No black-box AI — just transparent skill coverage and audited verification scores.
        </span>
      </div>

      {isLoading && <span className="text-subtle">Loading matching candidates…</span>}

      {assigning && (
        <Card>
          <div className="stack-150">
            <div className="cluster-between">
              <span className="section-title">
                Assign {assigning.skillName} Challenge to {assigning.candidateName}
              </span>
              <div className="cluster-100">
                <Button variant={!useCustom ? 'primary' : 'secondary'} onClick={() => setUseCustom(false)}>
                  Standard Bank
                </Button>
                <Button variant={useCustom ? 'primary' : 'secondary'} onClick={() => setUseCustom(true)}>
                  Custom Challenge
                </Button>
              </div>
            </div>

            {!useCustom ? (
              <div className="stack-100">
                <label style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>Select Challenge Prompt</label>
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  style={{
                    padding: 'var(--space-100)',
                    borderRadius: 'var(--radius-small)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <option value="">Choose a challenge from verified bank…</option>
                  {prompts?.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.time_limit_minutes} min)</option>
                  ))}
                </select>
                {prompts && prompts.length === 0 && (
                  <span className="text-subtlest">No pre-seeded prompts for this skill. Switch to "Custom Challenge" to create one.</span>
                )}
              </div>
            ) : (
              <div className="stack-100">
                <TextField label="Challenge Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                <TextField label="Time Limit (minutes)" type="number" min={5} max={120} value={customTimeLimit} onChange={(e) => setCustomTimeLimit(Number(e.target.value))} />
                <div className="stack-050">
                  <label style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>Description / Problem Statement</label>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe what the candidate needs to build or fix..."
                    style={{ padding: 'var(--space-100)', borderRadius: 'var(--radius-small)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div className="stack-050">
                  <label style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>Instructions</label>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Specific constraints, edge cases to consider, or requirements..."
                    style={{ padding: 'var(--space-100)', borderRadius: 'var(--radius-small)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div className="stack-050">
                  <label style={{ fontWeight: 600, fontSize: 'var(--font-size-100)' }}>Starter Code (Optional)</label>
                  <textarea
                    rows={3}
                    value={customStarterCode}
                    onChange={(e) => setCustomStarterCode(e.target.value)}
                    placeholder="// Optional initial boilerplate or function signature..."
                    style={{ padding: 'var(--space-100)', borderRadius: 'var(--radius-small)', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            )}

            <div className="cluster-150">
              <Button
                variant="primary"
                disabled={(!useCustom && !selectedPromptId) || (useCustom && (!customTitle || !customPrompt)) || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? 'Assigning…' : 'Confirm & Assign Challenge'}
              </Button>
              <Button variant="secondary" onClick={() => setAssigning(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid-2">
        {matches?.map((m) => (
          <MatchCard key={m.userId} match={m} onAssignChallenge={(skillName) => handleAssignClick(m, skillName)} />
        ))}
      </div>

      {matches && matches.length === 0 && (
        <div className="empty-state">
          No candidates found or all eligible candidates have already joined the team.
        </div>
      )}
    </div>
  );
}
