import { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'discovery' | 'brand';


export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function toneForStatus(status: string): Tone {
  switch (status) {
    case 'highly_verified': return 'success';
    case 'verified': return 'info';
    case 'developing': return 'warning';
    default: return 'danger';
  }
}

export function labelForStatus(status: string): string {
  return status.replace('_', ' ');
}
