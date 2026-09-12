import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CandidateMatch } from '../../api/types';

export function MatchCard({
  match,
  onAssignChallenge,
}: {
  match: CandidateMatch;
  onAssignChallenge: (skillName: string) => void;
}) {
  const matched = match.skillBreakdown.filter((s) => s.verificationScore >= 60);
  const missing = match.skillBreakdown.filter((s) => s.verificationScore < 60);
  const avgVerification = match.skillBreakdown.length > 0
    ? Math.round(match.skillBreakdown.reduce((sum, s) => sum + s.verificationScore, 0) / match.skillBreakdown.length)
    : 0;

  const highestPriorityGap = match.skillBreakdown.find((s) => s.isTeamGap && s.verificationScore > 0) || match.skillBreakdown[0];

  return (
    <div className="card stack-150">
      <div className="cluster-between">
        <div className="stack-050">
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)' }}>{match.name}</span>
          {match.college && <span className="text-subtlest">{match.college}</span>}
        </div>
        <Badge tone={match.matchPercent >= 80 ? 'success' : match.matchPercent >= 50 ? 'info' : 'neutral'}>
          {match.matchPercent}% Match
        </Badge>
      </div>

      <div className="cluster-between" style={{ background: 'var(--color-surface-sunken)', padding: 'var(--space-100)', borderRadius: 'var(--radius-small)' }}>
        <span className="text-subtlest">AVG VERIFICATION SCORE</span>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-300)', color: 'var(--color-brand-bold)' }}>
          {avgVerification}%
        </span>
      </div>

      {/* Matched Required Skills */}
      <div className="stack-050">
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-100)', color: 'var(--color-success-bold)' }}>
          MATCHED SKILLS ({matched.length})
        </span>
        {matched.length === 0 && <span className="text-subtlest">None meeting 60% verification threshold</span>}
        {matched.map((s) => (
          <div key={s.skillName} className="cluster-between" style={{ fontSize: 'var(--font-size-150)' }}>
            <span>✓ {s.skillName} {s.isTeamGap ? <Badge tone="discovery">Team Gap</Badge> : null}</span>
            <span style={{ fontWeight: 600 }}>{s.verificationScore.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Missing Required Skills */}
      {missing.length > 0 && (
        <div className="stack-050">
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-100)', color: 'var(--color-danger-bold)' }}>
            MISSING OR UNVERIFIED ({missing.length})
          </span>
          {missing.map((s) => (
            <div key={s.skillName} className="cluster-between" style={{ fontSize: 'var(--font-size-150)', color: 'var(--color-text-subtle)' }}>
              <span>✗ {s.skillName}</span>
              <span className="text-subtlest">{s.verificationScore > 0 ? `${s.verificationScore.toFixed(0)}% (Below threshold)` : 'Unverified'}</span>
            </div>
          ))}
        </div>
      )}

      {highestPriorityGap && (
        <div className="cluster-between" style={{ paddingTop: 'var(--space-100)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="secondary" onClick={() => onAssignChallenge(highestPriorityGap.skillName)}>
            Assign {highestPriorityGap.skillName} Challenge
          </Button>
          <Link to={`/passport`} className="text-subtlest" style={{ fontSize: 'var(--font-size-100)' }}>
            View Full Profile
          </Link>
        </div>
      )}
    </div>
  );
}
