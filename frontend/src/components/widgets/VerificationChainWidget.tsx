import { Card } from '../ui/Card';
import { Badge, toneForStatus, labelForStatus } from '../ui/Badge';
import { VerificationChain } from '../../api/types';

export function VerificationChainWidget({ chain, skillName }: { chain: VerificationChain; skillName: string }) {
  const score = chain.verification ? Number(chain.verification.verification_score) : 0;
  const status = chain.verification?.verification_status || 'unverified';
  const assessmentScore = chain.assessment ? Number(chain.assessment.score) : 0;
  const avgEvidenceScore = chain.evidence.length > 0
    ? Math.round(chain.evidence.reduce((sum, e) => sum + Number(e.evidence_score), 0) / chain.evidence.length)
    : 0;

  return (
    <div className="stack-300">
      <Card>
        <div className="stack-100" style={{ justifyItems: 'center', textAlign: 'center' }}>
          <span className="text-subtlest">{skillName.toUpperCase()} — VERIFICATION CHAIN</span>
          <span className="stat-number" style={{ fontSize: '48px' }}>{score.toFixed(0)}</span>
          <Badge tone={toneForStatus(status)}>{labelForStatus(status)}</Badge>
          <span className="text-subtle">
            Calculated: Assessment ({assessmentScore.toFixed(0)} × 0.6) + Evidence ({avgEvidenceScore} × 0.4) = {score.toFixed(0)}%
          </span>
        </div>
      </Card>

      {/* The Stepped Verification Chain Flow */}
      <Card>
        <div className="stack-150">
          <span className="section-title">The Verification Chain: Why should I trust this score?</span>
          <span className="text-subtle">
            SkillProof operates on a trust-by-verification model. Every step below is cryptographically or objectively verified:
          </span>

          <div className="stack-100" style={{ borderLeft: '3px solid var(--color-brand-bold)', paddingLeft: 'var(--space-200)' }}>
            <div className="stack-050">
              <span style={{ fontWeight: 600, color: 'var(--color-success-bold)' }}>✓ Step 1: Skill Claimed</span>
              <span className="text-subtlest">Candidate self-reported competence in {skillName} (baseline entry in ledger).</span>
            </div>

            <div className="stack-050">
              <span style={{ fontWeight: 600, color: chain.evidence.length > 0 ? 'var(--color-success-bold)' : 'var(--color-text-subtle)' }}>
                {chain.evidence.length > 0 ? '✓' : '○'} Step 2: GitHub Evidence & Language Breakdown
              </span>
              <span className="text-subtlest">
                {chain.evidence.length > 0
                  ? `Linked ${chain.evidence.length} repository. Verified programming language distribution via GitHub REST API. Evidence score: ${avgEvidenceScore}%.`
                  : 'No public GitHub repository linked yet.'}
              </span>
            </div>

            <div className="stack-050">
              <span style={{ fontWeight: 600, color: chain.assessment ? 'var(--color-success-bold)' : 'var(--color-text-subtle)' }}>
                {chain.assessment ? '✓' : '○'} Step 3: Objective Timed Assessment
              </span>
              <span className="text-subtlest">
                {chain.assessment
                  ? `Completed 5-question technical assessment. Score: ${assessmentScore.toFixed(0)}% (${chain.assessment.correct_count}/${chain.assessment.total_count} correct).`
                  : 'No technical assessment taken yet.'}
              </span>
            </div>

            <div className="stack-050">
              <span style={{ fontWeight: 600, color: score > 0 ? 'var(--color-brand-bold)' : 'var(--color-text-subtle)' }}>
                ★ Step 4: Transparent Verification Score
              </span>
              <span className="text-subtlest">
                Formula: Assessment × 0.6 + Evidence × 0.4 = {score.toFixed(0)}%. Stored immutably in PostgreSQL.
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="stack-150">
            <span className="section-title">Assessment (60% weight)</span>
            {chain.assessment ? (
              <div className="stack-050">
                <span className="stat-number" style={{ fontSize: '32px' }}>{Number(chain.assessment.score).toFixed(0)}</span>
                <span className="text-subtle">{chain.assessment.correct_count}/{chain.assessment.total_count} correct</span>
                <span className="text-subtlest">{new Date(chain.assessment.created_at).toLocaleDateString()}</span>
              </div>
            ) : (
              <span className="text-subtle">No assessment taken yet.</span>
            )}
          </div>
        </Card>

        <Card>
          <div className="stack-150">
            <span className="section-title">Evidence (40% weight)</span>
            {chain.evidence.length > 0 ? (
              <div className="stack-150">
                {chain.evidence.map((e, i) => (
                  <div key={i} className="stack-050">
                    <span style={{ fontWeight: 600 }}>{e.title}</span>
                    <a href={e.repo_url} target="_blank" rel="noreferrer" className="text-subtlest">{e.repo_url}</a>
                    <div className="cluster-100">
                      {e.detected_languages.map((lang) => <Badge key={lang} tone="discovery">{lang}</Badge>)}
                    </div>
                    <span className="text-subtle">Evidence score: {Number(e.evidence_score).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-subtle">No evidence linked yet.</span>
            )}
          </div>
        </Card>
      </div>

      <Card sunken>
        <span className="text-subtle">
          This is a <strong>Platform Verification Score</strong> — a transparent combination of a tested
          assessment and linked project evidence. It is not an arbitrary algorithm or opaque AI prediction;
          every input above is auditable and backed by code.
        </span>
      </Card>
    </div>
  );
}

