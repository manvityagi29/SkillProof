import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PassportSkill, OpenTeam, Job } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge, toneForStatus, labelForStatus } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function CandidateDashboardPage() {
  const { me } = useAuth();

  const { data: passport, isLoading: passportLoading } = useQuery({
    queryKey: ['passport', 'me'],
    queryFn: () => api.get<PassportSkill[]>('/users/me/passport'),
  });

  const { data: assessments } = useQuery({
    queryKey: ['assessments', 'results'],
    queryFn: () => api.get<any[]>('/assessments/results'),
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', 'mine'],
    queryFn: () => api.get<any[]>('/evidence'),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', 'open'],
    queryFn: () => api.get<OpenTeam[]>('/teams/open'),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs'),
  });

  const overallScore = passport && passport.length > 0
    ? Math.round(passport.reduce((sum, s) => sum + Number(s.verification_score), 0) / passport.length)
    : 0;

  const verifiedSkillsCount = (passport || []).filter(
    (s) => s.verification_status === 'verified' || s.verification_status === 'highly_verified'
  ).length;

  const assessmentCount = assessments ? assessments.length : 0;
  const evidenceCount = evidence ? evidence.length : 0;
  const opportunitiesCount = (teams ? teams.length : 0) + (jobs ? jobs.length : 0);

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Candidate Dashboard</span>
        <span className="text-subtle">
          Welcome back, {me?.name}! Here is your real-time skill verification and opportunity overview.
        </span>
      </div>

      {/* Hero Stats */}
      <div className="grid-4">
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">OVERALL VERIFICATION</span>
            <span className="stat-number">{overallScore}</span>
            <span className="text-subtle">Tested & Proven</span>
          </div>
        </Card>
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">VERIFIED SKILLS</span>
            <span className="stat-number">{verifiedSkillsCount}</span>
            <span className="text-subtle">of {(passport || []).length} claimed</span>
          </div>
        </Card>
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">ASSESSMENTS COMPLETED</span>
            <span className="stat-number">{assessmentCount}</span>
            <span className="text-subtle">Graded MCQs</span>
          </div>
        </Card>
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">OPPORTUNITIES</span>
            <span className="stat-number">{opportunitiesCount}</span>
            <span className="text-subtle">{teams?.length || 0} teams · {jobs?.length || 0} jobs</span>
          </div>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <div className="grid-3">
        <Card>
          <div className="stack-100">
            <span style={{ fontWeight: 600 }}>Skill Passport</span>
            <span className="text-subtlest">Add new skills, link GitHub repositories, and track verification scores.</span>
            <Link to="/candidate/passport">
              <Button block variant="primary">Manage Passport</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="stack-100">
            <span style={{ fontWeight: 600 }}>Take Assessment</span>
            <span className="text-subtlest">Prove your abilities with 5-question timed technical assessments.</span>
            <Link to="/candidate/assessments">
              <Button block variant="secondary">Browse Assessments</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="stack-100">
            <span style={{ fontWeight: 600 }}>Explore Teams</span>
            <span className="text-subtlest">Find hackathon squads actively searching for your verified skills.</span>
            <Link to="/candidate/teams">
              <Button block variant="secondary">Browse Open Teams</Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Skills Breakdown */}
      <Card>
        <div className="stack-150">
          <div className="cluster-between">
            <span className="section-title">Verified Skills Status</span>
            <Link to="/candidate/passport"><Button variant="secondary">View Full Passport</Button></Link>
          </div>

          {passportLoading && <span className="text-subtle">Loading skills…</span>}
          {passport && passport.length === 0 && (
            <div className="empty-state">
              <span>No skills claimed yet. Go to your Passport to claim your first skill!</span>
            </div>
          )}

          {passport && passport.slice(0, 4).map((s) => (
            <div key={s.skill_id} className="cluster-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-100)' }}>
              <div className="stack-050">
                <span style={{ fontWeight: 600 }}>{s.skill_name}</span>
                <span className="text-subtlest">
                  Assessment: {s.assessment_score ? `${Number(s.assessment_score).toFixed(0)}%` : 'None'} ·
                  Evidence: {s.evidence_score ? `${Number(s.evidence_score).toFixed(0)}%` : 'None'}
                </span>
              </div>
              <div className="cluster-150">
                <Badge tone={toneForStatus(s.verification_status)}>{labelForStatus(s.verification_status)}</Badge>
                <span className="stat-number" style={{ fontSize: '20px' }}>{Number(s.verification_score).toFixed(0)}</span>
                <Link to={`/verification/${me?.id}/${s.skill_id}`}>
                  <Button variant="secondary">Verify Chain</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
