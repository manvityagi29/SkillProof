import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { AdminStats } from '../../api/types';
import { StatWidget } from '../../components/widgets/StatWidget';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function RecruiterDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  });

  return (
    <div className="stack-300">
      <span className="page-title">Recruiter Dashboard</span>
      {isLoading && <span className="text-subtle">Loading platform stats…</span>}

      {stats && (
        <div className="grid-4">
          <StatWidget label="Candidates" value={stats.candidateCount} />
          <StatWidget label="Verified Skills" value={stats.verifiedSkillCount} />
          <StatWidget label="Active Teams" value={stats.teamCount} />
          <StatWidget label="Avg. Verification" value={stats.avgVerification} hint="platform-wide" />
        </div>
      )}

      <Card sunken>
        <div className="stack-100">
          <span style={{ fontWeight: 600 }}>The SkillProof Trust Guarantee</span>
          <span className="text-subtle">
            Every candidate listed on SkillProof is backed by an objective, reproducible Verification Chain:
            60% timed objective assessment questions + 40% GitHub programming language distribution signals.
            Zero self-reported unproven claims.
          </span>
        </div>
      </Card>

      <div className="grid-3">
        <Card>
          <div className="stack-150">
            <span className="section-title">Discover Verified Talent</span>
            <span className="text-subtlest">
              Filter candidates against your job criteria, inspect verified scores, and view candidate verification audits.
            </span>
            <Link to="/recruiter/candidates">
              <Button variant="primary" block>Discover Candidates</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="stack-150">
            <span className="section-title">Manage Positions</span>
            <span className="text-subtlest">
              View active openings, required technical skills, and minimum verification score thresholds.
            </span>
            <Link to="/recruiter/jobs">
              <Button variant="secondary" block>View Job Postings</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="stack-150">
            <span className="section-title">Post New Opening</span>
            <span className="text-subtlest">
              Set required skills and minimum verification thresholds to automatically shortlist qualifying talent.
            </span>
            <Link to="/recruiter/jobs/create">
              <Button variant="secondary" block>Post a Job</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
