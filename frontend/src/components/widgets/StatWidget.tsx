import { Card } from '../ui/Card';

export function StatWidget({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <div className="stack-100" style={{ position: 'relative' }}>
        <span className="text-subtlest" style={{ letterSpacing: '0.05em', fontWeight: 700 }}>{label.toUpperCase()}</span>
        <span className="stat-number">{value}</span>
        {hint && <span className="text-subtle" style={{ fontSize: 'var(--font-size-100)' }}>{hint}</span>}
      </div>
    </Card>
  );
}

