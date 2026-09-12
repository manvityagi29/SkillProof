import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';

export function TopNav() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="topnav app-topnav">
      <div className="cluster-150" style={{ cursor: 'pointer' }} onClick={() => navigate(me?.role === 'captain' ? '/captain/team' : me?.role === 'recruiter' ? '/recruiter' : '/candidate')}>
        <span className="topnav-brand-badge">✓</span>
        <span className="topnav-brand">SkillProof</span>
        {me && <span className="topnav-role-pill">{me.role}</span>}
      </div>

      <div />

      <div className="cluster-150">
        {me && (
          <div className="cluster-100" style={{ background: 'var(--color-surface-hovered)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-200)' }}>{me.name}</span>
          </div>
        )}
        <Button variant="secondary" onClick={handleLogout}>Log out</Button>
      </div>
    </header>
  );
}

