import { NavLink } from 'react-router-dom';
import { UserRole } from '../../api/types';

const LINKS: Record<UserRole, Array<{ to: string; label: string }>> = {
  candidate: [
    { to: '/candidate', label: 'Dashboard' },
    { to: '/candidate/passport', label: 'Skill Passport' },
    { to: '/candidate/assessments', label: 'Assessments' },
    { to: '/candidate/teams', label: 'Browse Teams' },
    { to: '/candidate/challenges', label: 'My Challenges' },
    { to: '/candidate/profile', label: 'Profile' },
  ],
  captain: [
    { to: '/captain/team', label: 'My Teams' },
    { to: '/captain/create-team', label: 'Create Team' },
    { to: '/captain/candidates', label: 'Discover Candidates' },
    { to: '/captain/challenges', label: 'Review Challenges' },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Dashboard' },
    { to: '/recruiter/jobs', label: 'Job Postings' },
    { to: '/recruiter/jobs/create', label: 'Post a Job' },
    { to: '/recruiter/candidates', label: 'Candidate Ranking' },
  ],
};


export function Sidebar({ role }: { role: UserRole }) {
  return (
    <nav className="sidebar app-sidebar">
      {LINKS[role].map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
