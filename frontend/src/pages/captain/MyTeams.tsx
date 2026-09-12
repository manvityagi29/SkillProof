import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface TeamSummary {
  id: number;
  name: string;
  hackathon: string | null;
  max_members: number;
}

export function MyTeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', 'mine'],
    queryFn: () => api.get<TeamSummary[]>('/teams/mine'),
  });

  return (
    <div className="stack-200">
      <div className="cluster-between">
        <span className="page-title">My Teams</span>
        <Link to="/captain/create-team"><Button>+ Create Team</Button></Link>
      </div>

      {isLoading && <span className="text-subtle">Loading…</span>}
      {teams && teams.length === 0 && (
        <div className="empty-state">
          <span>You haven't created a team yet.</span>
          <Link to="/captain/create-team"><Button>Create your first team</Button></Link>
        </div>
      )}

      <div className="grid-2">
        {teams?.map((t) => (
          <Link key={t.id} to={`/captain/teams/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <div className="stack-050">
                <span className="section-title">{t.name}</span>
                <span className="text-subtlest">{t.hackathon} · up to {t.max_members} members</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
