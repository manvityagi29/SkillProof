import { ReactNode } from 'react';

export function Card({ children, sunken = false }: { children: ReactNode; sunken?: boolean }) {
  return <div className={sunken ? 'card-sunken' : 'card'}>{children}</div>;
}
