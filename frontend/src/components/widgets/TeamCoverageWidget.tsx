import { Card } from '../ui/Card';
import { TeamCoverage } from '../../api/types';

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'Design',
  ml: 'AI / ML',
  devops: 'DevOps',
  data: 'Data',
};

export function TeamCoverageWidget({ coverage }: { coverage: TeamCoverage }) {
  const gaps = coverage.byCategory.filter((c) => Number(c.coverage_score) < 60);

  return (
    <Card>
      <div className="stack-200">
        <div className="cluster-between">
          <span className="section-title">Team Skill Coverage</span>
          <span className="text-subtle">Health: <strong>{coverage.overallHealth}%</strong></span>
        </div>

        <div className="stack-150">
          {coverage.byCategory.map((c) => {
            const score = Number(c.coverage_score);
            return (
              <div key={c.category} className="stack-050">
                <div className="cluster-between">
                  <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[c.category] || c.category}</span>
                  <span className="text-subtle">{score.toFixed(0)}%</span>
                </div>
                <div className="skill-bar-track">
                  <div
                    className={`skill-bar-fill ${score >= 75 ? 'status-verified' : score >= 40 ? 'status-developing' : 'status-unverified'}`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {gaps.length > 0 && (
          <Card sunken>
            <span className="text-subtle">
              ⚠ Team has no strongly verified member in: {gaps.map((g) => CATEGORY_LABELS[g.category] || g.category).join(', ')}
            </span>
          </Card>
        )}
      </div>
    </Card>
  );
}
