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

      <div className="cluster-100" style={{ justifySelf: 'center' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success-bold)', display: 'inline-block', boxShadow: '0 0 6px var(--color-success-bold)' }} />
        <span className="text-subtlest" style={{ fontSize: 'var(--font-size-100)', fontWeight: 600, letterSpacing: '0.02em' }}>
          VERIFIED SKILL NETWORK · LIVE
        </span>
      </div>

      <div className="cluster-150">
        {me && (
          <div className="cluster-100" style={{ background: 'var(--color-surface-hovered)', padding: '4px 12px 4px 6px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-brand-gradient)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 700 }}>
              {me.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-200)' }}>{me.name}</span>
          </div>
        )}
        <Button variant="secondary" onClick={handleLogout}>Log out</Button>
      </div>
    </header>
  );
}

