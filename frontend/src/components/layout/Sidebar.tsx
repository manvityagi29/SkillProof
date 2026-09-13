import { NavLink } from 'react-router-dom';
import { UserRole } from '../../api/types';

interface NavItem {
  to: string;
  label: string;
  badge?: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: Record<UserRole, NavSection[]> = {
  candidate: [
    {
      title: 'Workspace',
      items: [
        { to: '/candidate', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { to: '/candidate/passport', label: 'Skill Passport', badge: 'PROVEN', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { to: '/candidate/assessments', label: 'Assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      ],
    },
    {
      title: 'Opportunities',
      items: [
        { to: '/candidate/teams', label: 'Browse Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { to: '/candidate/challenges', label: 'My Challenges', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { to: '/candidate/profile', label: 'Profile & Proof', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ],
    },
  ],
  captain: [
    {
      title: 'Squad Management',
      items: [
        { to: '/captain/team', label: 'My Teams', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { to: '/captain/create-team', label: 'Create Team', icon: 'M12 4v16m8-8H4' },
        { to: '/captain/candidates', label: 'Discover Candidates', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        { to: '/captain/challenges', label: 'Review Challenges', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      ],
    },
  ],
  recruiter: [
    {
      title: 'Recruiting Portal',
      items: [
        { to: '/recruiter', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { to: '/recruiter/jobs', label: 'Job Postings', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { to: '/recruiter/jobs/create', label: 'Post a Job', icon: 'M12 4v16m8-8H4' },
        { to: '/recruiter/candidates', label: 'Candidate Ranking', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      ],
    },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const sections = SECTIONS[role] || [];

  return (
    <nav className="sidebar app-sidebar">
      {sections.map((sec) => (
        <div key={sec.title} className="sidebar-group">
          <span className="sidebar-group-title">{sec.title}</span>
          {sec.items.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/candidate' || link.to === '/recruiter'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <div className="cluster-100">
                <svg
                  className="sidebar-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--color-brand-subtle)',
                    color: 'var(--color-brand-bold)',
                    letterSpacing: '0.04em',
                    justifySelf: 'end',
                  }}
                >
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
