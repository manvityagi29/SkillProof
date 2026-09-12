import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PassportSkill, Me } from '../../api/types';
import { Card } from '../../components/ui/Card';
import { Badge, toneForStatus, labelForStatus } from '../../components/ui/Badge';

export function CandidateProfilePage() {
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/auth/me'),
  });

  const { data: passport } = useQuery({
    queryKey: ['passport', 'me'],
    queryFn: () => api.get<PassportSkill[]>('/users/me/passport'),
  });

  if (meLoading || !me) return <span className="text-subtle">Loading profile…</span>;

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">Candidate Profile</span>
        <span className="text-subtle">Your verified identity, credentials, and track record on SkillProof.</span>
      </div>

      <div className="grid-2">
        <Card>
          <div className="stack-150">
            <span className="section-title">Personal & Academic Details</span>
            <div className="stack-100">
              <div className="cluster-between">
                <span className="text-subtlest">FULL NAME</span>
                <span style={{ fontWeight: 600 }}>{me.name}</span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">EMAIL</span>
                <span>{me.email}</span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">COLLEGE / INSTITUTION</span>
                <span>{me.college || 'Not specified'}</span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">BRANCH / MAJOR</span>
                <span>{me.branch || 'Not specified'}</span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">GITHUB PROFILE</span>
                <span>
                  {me.github_url ? (
                    <a href={me.github_url} target="_blank" rel="noreferrer">{me.github_url}</a>
                  ) : (
                    'Not linked'
                  )}
                </span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">PLATFORM ROLE</span>
                <Badge tone="brand">{me.role.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack-150">
            <span className="section-title">Proof Summary</span>
            <div className="stack-100">
              <div className="cluster-between">
                <span className="text-subtlest">TOTAL SKILLS CLAIMED</span>
                <span className="stat-number" style={{ fontSize: '24px' }}>{(passport || []).length}</span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">VERIFIED (75%+)</span>
                <span className="stat-number" style={{ fontSize: '24px' }}>
                  {(passport || []).filter((s) => s.verification_status === 'verified' || s.verification_status === 'highly_verified').length}
                </span>
              </div>
              <div className="cluster-between">
                <span className="text-subtlest">TOP SKILL</span>
                <span style={{ fontWeight: 600 }}>
                  {passport && passport[0] ? `${passport[0].skill_name} (${Number(passport[0].verification_score).toFixed(0)}%)` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="stack-150">
          <span className="section-title">Verified Skills Ledger</span>
          {passport && passport.length === 0 && <span className="text-subtle">No skills claimed yet.</span>}
          {passport?.map((s) => (
            <div key={s.skill_id} className="cluster-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-100)' }}>
              <div className="stack-050">
                <span style={{ fontWeight: 600 }}>{s.skill_name}</span>
                <span className="text-subtlest">
                  Assessment: {s.assessment_score ? `${Number(s.assessment_score).toFixed(0)}%` : '—'} ·
                  Evidence: {s.evidence_score ? `${Number(s.evidence_score).toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="cluster-150">
                <Badge tone={toneForStatus(s.verification_status)}>{labelForStatus(s.verification_status)}</Badge>
                <span className="stat-number" style={{ fontSize: '20px' }}>{Number(s.verification_score).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
