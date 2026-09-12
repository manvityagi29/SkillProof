import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PassportSkill, Skill } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SelectField } from '../../components/ui/SelectField';
import { TextField } from '../../components/ui/TextField';
import { SkillBarWidget } from '../../components/widgets/SkillBarWidget';

export function PassportPage() {
  const { me } = useAuth();
  const queryClient = useQueryClient();

  const { data: passport, isLoading } = useQuery({
    queryKey: ['passport', 'me'],
    queryFn: () => api.get<PassportSkill[]>('/users/me/passport'),
  });
  const { data: catalog } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get<Skill[]>('/skills'),
  });

  const [claimSkillId, setClaimSkillId] = useState('');
  const claimMutation = useMutation({
    mutationFn: (skillId: number) => api.post('/users/me/skills', { skillId, claimedLevel: 3 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passport', 'me'] }),
  });

  const [evidenceSkillId, setEvidenceSkillId] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceRepo, setEvidenceRepo] = useState('');
  const evidenceMutation = useMutation({
    mutationFn: () => api.post('/evidence', { skillId: Number(evidenceSkillId), title: evidenceTitle, repoUrl: evidenceRepo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passport', 'me'] });
      setEvidenceTitle('');
      setEvidenceRepo('');
    },
  });

  const overallScore = passport && passport.length > 0
    ? Math.round(passport.reduce((sum, s) => sum + Number(s.verification_score), 0) / passport.length)
    : 0;

  const claimedSkillIds = new Set((passport || []).map((s) => s.skill_id));
  const unclaimedSkills = (catalog || []).filter((s) => !claimedSkillIds.has(s.id));

  return (
    <div className="stack-300">
      <div className="stack-050">
        <span className="page-title">{me?.name}</span>
        <span className="text-subtle">{me?.college} · {me?.branch}</span>
      </div>

      <div className="grid-3">
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">VERIFICATION SCORE</span>
            <span className="stat-number">{overallScore}</span>
          </div>
        </Card>
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">VERIFIED SKILLS</span>
            <span className="stat-number">{(passport || []).filter((s) => s.verification_status === 'verified' || s.verification_status === 'highly_verified').length}</span>
          </div>
        </Card>
        <Card>
          <div className="stack-050">
            <span className="text-subtlest">SKILLS CLAIMED</span>
            <span className="stat-number">{(passport || []).length}</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="stack-200">
          <div className="cluster-between">
            <span className="section-title">Your Verified Skills</span>
            <Badge tone="discovery">
              Formula: Assessment × 60% + Evidence × 40%
            </Badge>
          </div>

          <div className="info-callout">
            <span className="info-callout-icon">ℹ</span>
            <span>
              SkillProof does not take candidate claims on faith. Scores are computed from objective MCQ tests (60%)
              and verified GitHub repository language distributions (40%). Click any skill or "View Audit" to inspect the verification chain.
            </span>
          </div>

          {isLoading && <span className="text-subtle">Loading your passport…</span>}
          {passport && passport.length === 0 && (
            <div className="empty-state">
              <span>No skills claimed yet. Add one below, then add evidence and take the assessment to get verified.</span>
            </div>
          )}
          {passport && (
            <div className="stack-150">
              {passport.map((s) => (
                <div key={s.skill_id} className="card-sunken" style={{ display: 'grid', gap: 'var(--space-150)' }}>
                  <SkillBarWidget skill={s} ownerId={me!.id} />
                  <div className="cluster-150">
                    <Link to={`/candidate/assessments/${s.skill_id}`}>
                      <Button variant="primary">Take {s.skill_name} Assessment</Button>
                    </Link>
                    <Link to={`/verification/${me!.id}/${s.skill_id}`}>
                      <Button variant="secondary">View Audit Chain</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="stack-150">
            <span className="section-title">Claim a New Skill</span>
            <SelectField label="Skill" value={claimSkillId} onChange={(e) => setClaimSkillId(e.target.value)}>
              <option value="">Select a skill…</option>
              {unclaimedSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectField>
            <Button
              disabled={!claimSkillId || claimMutation.isPending}
              onClick={() => claimMutation.mutate(Number(claimSkillId))}
            >
              Claim Skill
            </Button>
            <span className="text-subtlest">Claiming a skill just adds it to your passport — it stays "unverified" until you add evidence and pass an assessment.</span>
          </div>
        </Card>

        <Card>
          <div className="stack-150">
            <span className="section-title">Add Evidence</span>
            <SelectField label="Skill" value={evidenceSkillId} onChange={(e) => setEvidenceSkillId(e.target.value)}>
              <option value="">Select a claimed skill…</option>
              {(passport || []).map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
            </SelectField>
            <TextField label="Project title" value={evidenceTitle} onChange={(e) => setEvidenceTitle(e.target.value)} placeholder="Collaborative Drawing App" />
            <TextField label="GitHub repo URL" value={evidenceRepo} onChange={(e) => setEvidenceRepo(e.target.value)} placeholder="https://github.com/you/project" />
            <Button
              disabled={!evidenceSkillId || !evidenceTitle || !evidenceRepo || evidenceMutation.isPending}
              onClick={() => evidenceMutation.mutate()}
            >
              {evidenceMutation.isPending ? 'Checking repo…' : 'Add Evidence'}
            </Button>
            <span className="text-subtlest">We read the repo's language breakdown from GitHub as a signal — not a full audit of your code.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
