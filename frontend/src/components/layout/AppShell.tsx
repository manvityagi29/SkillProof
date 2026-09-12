import { Outlet, Navigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../auth/AuthContext';

export function AppShell() {
  const { me, isLoading } = useAuth();

  if (isLoading) {
    return <div className="center-screen"><span className="text-subtle">Loading ProofStack…</span></div>;
  }
  if (!me) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <TopNav />
      <Sidebar role={me.role} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
