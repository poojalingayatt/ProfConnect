import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: UserRole;
}

const ProtectedRoute = ({ children, allowedUserType }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserType && user.role !== allowedUserType) {
    return <Navigate to={user.role === 'FACULTY' ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
