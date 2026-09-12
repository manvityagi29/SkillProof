import { Link } from 'react-router-dom';
import { Badge, toneForStatus, labelForStatus } from '../ui/Badge';
import { PassportSkill } from '../../api/types';

export function SkillBarWidget({ skill, ownerId }: { skill: PassportSkill; ownerId: number }) {
  const score = Number(skill.verification_score);
  return (
    <Link to={`/verification/${ownerId}/${skill.skill_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="stack-050" style={{ padding: 'var(--space-150) 0' }}>
        <div className="cluster-between">
          <span style={{ fontWeight: 600 }}>{skill.skill_name}</span>
          <div className="cluster-100">
            <span style={{ fontWeight: 700 }}>{score.toFixed(0)}</span>
            <Badge tone={toneForStatus(skill.verification_status)}>{labelForStatus(skill.verification_status)}</Badge>
          </div>
        </div>
        <div className="skill-bar-track">
          <div
            className={`skill-bar-fill status-${skill.verification_status}`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        <div className="cluster-between" style={{ fontSize: 'var(--font-size-100)', color: 'var(--color-text-subtlest)' }}>
          <span>Assessment: {skill.assessment_score ? `${Number(skill.assessment_score).toFixed(0)}% (60%)` : 'Not taken'}</span>
          <span>Evidence: {skill.evidence_score ? `${Number(skill.evidence_score).toFixed(0)}% (40%)` : 'Not linked'}</span>
        </div>
      </div>
    </Link>
  );
}

