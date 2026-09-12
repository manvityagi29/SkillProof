import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../api/types';

const HOME_FOR_ROLE: Record<UserRole, string> = {
  candidate: '/passport',
  captain: '/captain/teams',
  recruiter: '/admin/dashboard',
};

export function RoleGuard({ allow }: { allow: UserRole[] }) {
  const { me } = useAuth();
  if (!me) return null;
  if (!allow.includes(me.role)) {
    return <Navigate to={HOME_FOR_ROLE[me.role]} replace />;
  }
  return <Outlet />;
}
