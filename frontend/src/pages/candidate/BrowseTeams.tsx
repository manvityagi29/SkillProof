import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { OpenTeam } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function BrowseTeamsPage() {
  const queryClient = useQueryClient();
  const [requestedTeamIds, setRequestedTeamIds] = useState<Set<number>>(new Set());

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', 'open'],
    queryFn: () => api.get<OpenTeam[]>('/teams/open'),
  });

  const joinMutation = useMutation({
    mutationFn: (teamId: number) => api.post(`/teams/${teamId}/join-request`),
    onSuccess: (_, teamId) => {
      setRequestedTeamIds((prev) => new Set(prev).add(teamId));
      queryClient.invalidateQueries({ queryKey: ['teams', 'open'] });
    },
  });

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Open Hackathon Teams</span>
        <span className="text-subtle">
          Find teams currently recruiting. Team captains review applicant skill verification passports and run human rubric challenges before accepting members.
        </span>
      </div>

      {isLoading && <span className="text-subtle">Loading teams…</span>}
      {teams && teams.length === 0 && <div className="empty-state">No open teams currently seeking members.</div>}

      <div className="grid-2">
        {teams?.map((t) => {
          const isRequested = requestedTeamIds.has(t.id);
          const memberCount = Number(t.member_count);
          const isFull = memberCount >= t.max_members;

          return (
            <Card key={t.id}>
              <div className="stack-200">
                <div className="cluster-between">
                  <div className="stack-050">
                    <span className="section-title">{t.name}</span>
                    <span className="text-subtle">{t.hackathon || 'Open Hackathon'} · Captain: <strong>{t.captain_name}</strong></span>
                  </div>
                  <Badge tone={isFull ? 'danger' : 'success'}>
                    {memberCount}/{t.max_members} Slots
                  </Badge>
                </div>

                <div className="stack-050">
                  <span className="text-subtlest">REQUIRED SKILLS</span>
                  <div className="cluster-100">
                    {t.required_skills.map((s) => <Badge key={s} tone="discovery">{s}</Badge>)}
                  </div>
                </div>

                <div className="cluster-between">
                  <span className="text-subtlest">Requires verified skill proof</span>
                  <Button
                    variant={isRequested ? 'secondary' : 'primary'}
                    onClick={() => joinMutation.mutate(t.id)}
                    disabled={joinMutation.isPending || isRequested || isFull}
                  >
                    {isRequested ? '✓ Request Submitted' : 'Request to Join'}
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
