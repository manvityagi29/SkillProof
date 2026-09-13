import { useState } from 'react';
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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const copyPassportLink = () => {
    const url = `${window.location.origin}/passport/${me?.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    showToast('Public Skill Passport link copied to clipboard!');
  };

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
  const opportunitiesCount = (teams ? teams.length : 0) + (jobs ? jobs.length : 0);

  // SVG circular gauge geometry (radius: 46, circumference: ~289.03)
  const gaugeRadius = 46;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = gaugeCircumference - (overallScore / 100) * gaugeCircumference;
  const gaugeColor = overallScore >= 80 ? '#059669' : overallScore >= 60 ? '#2563EB' : '#D97706';

  // Find high-match team and job for proactive recommendation display
  const featuredTeam = teams && teams.length > 0 ? teams[0] : null;
  const featuredJob = jobs && jobs.length > 0 ? jobs[0] : null;

  return (
    <div className="stack-300">
      {/* Micro-Interaction Toast Notification */}
      {toast && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className="toast-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Editorial SaaS Header */}
      <div className="cluster-between" style={{ alignItems: 'start', gap: 'var(--space-200)' }}>
        <div className="stack-050" style={{ maxWidth: '680px' }}>
          <div style={{ display: 'inline-grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-brand-bold)', textTransform: 'uppercase' }}>
              ENGINEERING TALENT PLATFORM
            </span>
            <span style={{ color: 'var(--color-border-bold)' }}>·</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
              CANDIDATE SUITE
            </span>
          </div>
          <span className="page-title">Your skills, proven.</span>
          <span className="text-subtle">
            Welcome back, <strong style={{ color: 'var(--color-text)' }}>{me?.name || 'Developer'}</strong>. SkillProof calculates objective proof of competence through repository static analysis and timed assessments. <em>Proof &gt; Claims</em>.
          </span>
        </div>

        <div className="cluster-100" style={{ alignItems: 'center' }}>
          <button type="button" onClick={copyPassportLink} className="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Share Passport
          </button>
          <Link to="/candidate/assessments">
            <Button variant="primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Take Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Centerpiece: Verification Engine Panel */}
      <div className="verification-panel">
        {/* Left: Overall Verification Circular Gauge & Formula */}
        <div className="score-hero-box">
          <div className="cluster-between" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-subtlest)', textTransform: 'uppercase' }}>
              OVERALL VERIFICATION
            </span>
            <span className="pill" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              ● TESTED &amp; PROVEN
            </span>
          </div>

          {/* SVG Circular Progress Gauge */}
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative', width: '130px', height: '130px', margin: '8px auto' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="65"
                cy="65"
                r={gaugeRadius}
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="65"
                cy="65"
                r={gaugeRadius}
                stroke={gaugeColor}
                strokeWidth="10"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                {overallScore}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-subtlest)', letterSpacing: '0.04em' }}>
                / 100
              </span>
            </div>
          </div>

          {/* Dual Formula Breakdown Box */}
          <div style={{ display: 'grid', gap: '8px', background: 'var(--color-surface)', padding: '12px 14px', borderRadius: 'var(--radius-medium)', border: '1px solid var(--color-border)' }}>
            <div className="cluster-between" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-subtlest)' }}>
              <span>Verification Formula</span>
              <span style={{ color: 'var(--color-brand-bold)', fontWeight: 700 }}>Dual-Signal Ledger</span>
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              <div className="cluster-between" style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-subtle)' }}>1. Timed Assessments</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>60%</span>
              </div>
              <div className="cluster-between" style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-subtle)' }}>2. Code Repository Evidence</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Integrated Key Metrics Stack */}
        <div className="metrics-grid-stack">
          {/* Metric 1 */}
          <div className="metric-box-item">
            <div className="stack-050">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-subtlest)', textTransform: 'uppercase' }}>
                VERIFIED SKILLS
              </span>
              <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'baseline', justifyContent: 'start' }}>
                <span className="stat-number">{verifiedSkillsCount}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                  / {(passport || []).length} claimed
                </span>
              </div>
              <span className="text-subtle" style={{ fontSize: '13px' }}>
                Skills backed by cryptographic ledger verification
              </span>
            </div>
            <Link to="/candidate/passport" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-bold)' }}>
              Manage Passport &rarr;
            </Link>
          </div>

          {/* Metric 2 */}
          <div className="metric-box-item">
            <div className="stack-050">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-subtlest)', textTransform: 'uppercase' }}>
                ASSESSMENTS COMPLETED
              </span>
              <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'baseline', justifyContent: 'start' }}>
                <span className="stat-number">{assessmentCount}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                  evaluations
                </span>
              </div>
              <span className="text-subtle" style={{ fontSize: '13px' }}>
                5-question timed technical challenges completed
              </span>
            </div>
            <Link to="/candidate/assessments" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-bold)' }}>
              Take More Assessments &rarr;
            </Link>
          </div>

          {/* Metric 3 */}
          <div className="metric-box-item">
            <div className="stack-050">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-subtlest)', textTransform: 'uppercase' }}>
                ACTIVE OPPORTUNITIES
              </span>
              <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'baseline', justifyContent: 'start' }}>
                <span className="stat-number">{opportunitiesCount}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                  matches
                </span>
              </div>
              <span className="text-subtle" style={{ fontSize: '13px' }}>
                {teams?.length || 0} hackathon squads · {jobs?.length || 0} qualified jobs
              </span>
            </div>
            <Link to="/candidate/teams" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-bold)' }}>
              Explore Matches &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* "How Verification Works" 4-Step Flow */}
      <div className="workflow-strip">
        <div className="workflow-step">
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '11px', display: 'grid', placeItems: 'center' }}>
            1
          </span>
          <div className="stack-025">
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Claim Skill</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>Declare your primary stack in your passport.</span>
          </div>
        </div>
        <div className="workflow-step">
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '11px', display: 'grid', placeItems: 'center' }}>
            2
          </span>
          <div className="stack-025">
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Code Evidence (40%)</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>Link GitHub repos for automated AST sanity analysis.</span>
          </div>
        </div>
        <div className="workflow-step">
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '11px', display: 'grid', placeItems: 'center' }}>
            3
          </span>
          <div className="stack-025">
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Timed Assessment (60%)</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>Pass 5-question randomized technical evaluations.</span>
          </div>
        </div>
        <div className="workflow-step">
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '11px', display: 'grid', placeItems: 'center' }}>
            4
          </span>
          <div className="stack-025">
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#059669' }}>Verified Ledger</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>Receive immutable proof on your public passport.</span>
          </div>
        </div>
      </div>

      {/* Main Section: High-Density Skills Ledger & Digital Passport Preview */}
      <div className="grid-2">
        {/* Left Column: High-Density Verified Skills Table */}
        <Card>
          <div className="stack-200">
            <div className="cluster-between" style={{ alignItems: 'center' }}>
              <div className="stack-025">
                <span className="section-title">Verified Skills Ledger</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>
                  Detailed breakdown of your assessed vs. code evidence scores.
                </span>
              </div>
              <Link to="/candidate/passport">
                <button type="button" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  View Full Passport &rarr;
                </button>
              </Link>
            </div>

            {passportLoading && (
              <div style={{ padding: 'var(--space-300)', textAlign: 'center', color: 'var(--color-text-subtle)' }}>
                Loading skills ledger…
              </div>
            )}

            {passport && passport.length === 0 && (
              <div className="empty-state">
                <span>No skills claimed yet. Go to your Passport to claim your first skill!</span>
                <Link to="/candidate/passport">
                  <Button variant="primary">Claim a Skill</Button>
                </Link>
              </div>
            )}

            {passport && passport.length > 0 && (
              <div className="skill-data-table">
                <div className="skill-data-header">
                  <span>SKILL</span>
                  <span>SCORE</span>
                  <span>BREAKDOWN</span>
                  <span>STATUS</span>
                  <span>ACTION</span>
                </div>

                {passport.map((s) => {
                  const scoreNum = Number(s.verification_score) || 0;
                  const assessScore = s.assessment_score ? Number(s.assessment_score) : null;
                  const evidScore = s.evidence_score ? Number(s.evidence_score) : null;

                  return (
                    <div key={s.skill_id} className="skill-data-row">
                      {/* Skill Name & Category */}
                      <div className="stack-025">
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
                          {s.skill_name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-subtlest)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {s.category || 'General'}
                        </span>
                      </div>

                      {/* Verification Score */}
                      <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'center', justifyContent: 'start' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scoreNum >= 80 ? '#059669' : scoreNum >= 60 ? '#2563EB' : scoreNum >= 40 ? '#D97706' : '#DC2626' }} />
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
                          {scoreNum.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-subtlest)' }}>/ 100</span>
                      </div>

                      {/* Dual Breakdown */}
                      <div className="stack-050">
                        <div className="cluster-between" style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                          <span>Test (60%): <strong>{assessScore !== null ? `${assessScore.toFixed(0)}%` : '—'}</strong></span>
                          <span>Repo (40%): <strong>{evidScore !== null ? `${evidScore.toFixed(0)}%` : '—'}</strong></span>
                        </div>
                        <div className="skill-bar-track" style={{ height: '6px' }}>
                          <div
                            className={`skill-bar-fill status-${s.verification_status}`}
                            style={{ width: `${Math.min(100, Math.max(4, scoreNum))}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <Badge tone={toneForStatus(s.verification_status)}>
                          {labelForStatus(s.verification_status)}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="cluster-050" style={{ alignItems: 'center' }}>
                        <Link to={`/verification/${me?.id}/${s.skill_id}`}>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                            Verify Chain
                          </button>
                        </Link>
                        <Link to="/candidate/assessments">
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                            Retake
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Digital Passport Credential Card & Quick Links */}
        <div className="stack-200">
          <div className="passport-credential-card">
            {/* Header */}
            <div className="cluster-between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '8px', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#93C5FD' }}>
                  SKILLPROOF CREDENTIAL
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ACTIVE CREDENTIAL
              </span>
            </div>

            {/* Credential Body */}
            <div className="stack-100" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 'var(--space-200)' }}>
              <div className="stack-025">
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{me?.name}</span>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {me?.college ? `${me.college} · ` : ''}{me?.branch || 'Verified Software Engineer'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-small)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="stack-025">
                  <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    PASSPORT ID
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>
                    SP-{String(me?.id || 1).padStart(5, '0')}-DEV
                  </span>
                </div>
                <div className="stack-025">
                  <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    SECURITY LEDGER
                  </span>
                  <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
                    SHA-256 Verified
                  </span>
                </div>
              </div>

              {/* Verified skills badges inside credential */}
              <div className="stack-050">
                <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Verified Skills in Passport
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                  {(passport || [])
                    .filter((s) => s.verification_status === 'verified' || s.verification_status === 'highly_verified')
                    .slice(0, 5)
                    .map((s) => (
                      <span
                        key={s.skill_id}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93C5FD',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          textAlign: 'center',
                        }}
                      >
                        {s.skill_name} ({Number(s.verification_score).toFixed(0)}%)
                      </span>
                    ))}
                  {verifiedSkillsCount === 0 && (
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Take assessments to mint verified skills to your passport.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-100)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 'var(--space-150)' }}>
              <Link to={`/passport/${me?.id}`}>
                <button type="button" className="btn" style={{ width: '100%', background: '#2563EB', color: '#FFFFFF', border: 'none' }}>
                  Open Public Passport
                </button>
              </Link>
              <button
                type="button"
                onClick={copyPassportLink}
                className="btn"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Quick Guidance Card */}
          <Card>
            <div className="stack-100">
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Ready to boost your score?</span>
              <span className="text-subtle" style={{ fontSize: '13px' }}>
                Completing a 5-question timed technical assessment takes less than 3 minutes and directly drives 60% of your verification score.
              </span>
              <div className="cluster-100">
                <Link to="/candidate/assessments">
                  <Button variant="secondary">Browse Assessments</Button>
                </Link>
                <Link to="/candidate/passport">
                  <Button variant="secondary">Submit Evidence</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recommended Opportunities Row */}
      <div className="stack-150">
        <div className="cluster-between" style={{ alignItems: 'center' }}>
          <div className="stack-025">
            <span className="section-title">Matched Opportunities</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>
              Hackathon teams and employers specifically requesting your verified competencies.
            </span>
          </div>
          <Link to="/candidate/teams">
            <button type="button" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              Explore All Teams &rarr;
            </button>
          </Link>
        </div>

        <div className="grid-2">
          {/* Opportunity 1: Hackathon Team */}
          <Card>
            <div className="stack-150">
              <div className="cluster-between" style={{ alignItems: 'start' }}>
                <div className="stack-050">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-bold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    HACKATHON SQUAD MATCH
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-text)' }}>
                    {featuredTeam ? featuredTeam.name : 'Code Titans'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>
                    Event: <strong>{featuredTeam?.hackathon || 'Bit N Build Hackathon'}</strong> · Captain: {featuredTeam?.captain_name || 'Priya Nair'}
                  </span>
                </div>
                <span className="pill" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
                  92% Match · 64% Synergy
                </span>
              </div>

              <div className="stack-050">
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                  Looking for verified skills:
                </span>
                <div className="cluster-050">
                  {(featuredTeam?.required_skills || ['React', 'Node.js', 'PostgreSQL']).map((req) => (
                    <Badge key={req} tone="info">{req}</Badge>
                  ))}
                </div>
              </div>

              <div className="cluster-between" style={{ alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-150)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtlest)' }}>
                  Squad size: {featuredTeam?.member_count || '1'} / {featuredTeam?.max_members || '4'} members
                </span>
                <Link to="/candidate/teams">
                  <Button variant="primary">View Team &amp; Join</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Opportunity 2: Job Role */}
          <Card>
            <div className="stack-150">
              <div className="cluster-between" style={{ alignItems: 'start' }}>
                <div className="stack-050">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    QUALIFIED JOB OPENING
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-text)' }}>
                    {featuredJob ? featuredJob.title : 'SDE Intern - Backend'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>
                    Company: <strong>Acme Technologies</strong> · Bangalore (Hybrid)
                  </span>
                </div>
                <span className="pill" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 700, fontSize: '11px', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
                  91% Qualified
                </span>
              </div>

              <div className="stack-050">
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                  Minimum Verification Threshold: <strong>{featuredJob?.min_verification || '75%'}</strong>
                </span>
                <div className="cluster-050">
                  {(featuredJob?.required_skills || ['Java', 'SQL', 'Spring Boot']).map((req) => (
                    <Badge key={req} tone="brand">{req}</Badge>
                  ))}
                </div>
              </div>

              <div className="cluster-between" style={{ alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-150)' }}>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  ✓ You exceed the verification bar
                </span>
                <Link to="/candidate/jobs">
                  <Button variant="secondary">Apply with Passport</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
