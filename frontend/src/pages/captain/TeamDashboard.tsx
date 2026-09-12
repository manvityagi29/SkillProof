import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { TeamDetail, TeamCoverage } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TeamCoverageWidget } from '../../components/widgets/TeamCoverageWidget';

export function TeamDashboardPage() {
  const { id } = useParams();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => api.get<TeamDetail>(`/teams/${id}`),
  });
  const { data: coverage } = useQuery({
    queryKey: ['team', id, 'coverage'],
    queryFn: () => api.get<TeamCoverage>(`/teams/${id}/coverage`),
  });

  if (isLoading || !detail) return <span className="text-subtle">Loading team…</span>;

  const acceptedMembers = detail.members.filter((m) => m.status === 'accepted');
  const pendingMembers = detail.members.filter((m) => m.status === 'pending');

  return (
    <div className="stack-300">
      <div className="cluster-between">
        <div className="stack-050">
          <span className="page-title">{detail.team.name}</span>
          <span className="text-subtle">{detail.team.hackathon} · {acceptedMembers.length}/{detail.team.max_members} members</span>
        </div>
        <div className="cluster-150">
          <Link to={`/captain/teams/${id}/discovery`}><Button>Find Candidates</Button></Link>
          <Link to={`/captain/teams/${id}/challenges`}><Button variant="secondary">Review Challenges</Button></Link>
        </div>
      </div>

      {coverage && <TeamCoverageWidget coverage={coverage} />}

      <Card>
        <div className="stack-150">
          <span className="section-title">Required Skills</span>
          <div className="cluster-100">
            {detail.requirements.map((r) => <Badge key={r.skill_id} tone="discovery">{r.skill_name}</Badge>)}
          </div>
        </div>
      </Card>

      <Card>
        <div className="stack-150">
          <span className="section-title">Accepted Members</span>
          {acceptedMembers.length === 0 && <span className="text-subtle">No members yet — start discovering candidates.</span>}
          {acceptedMembers.map((m) => (
            <div key={m.id} className="cluster-between">
              <span>{m.name} {m.role_label && <span className="text-subtlest">· {m.role_label}</span>}</span>
              <Badge tone="success">Accepted</Badge>
            </div>
          ))}
        </div>
      </Card>

      {pendingMembers.length > 0 && (
        <Card>
          <div className="stack-150">
            <span className="section-title">Join Requests</span>
            {pendingMembers.map((m) => (
              <div key={m.id} className="cluster-between">
                <span>{m.name}</span>
                <Link to={`/captain/teams/${id}/discovery`}><Button variant="secondary">Review</Button></Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
