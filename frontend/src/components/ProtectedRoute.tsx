import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'student' | 'faculty';
}

const ProtectedRoute = ({ children, allowedUserType }: ProtectedRouteProps) => {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserType && userType !== allowedUserType) {
    // Redirect to correct dashboard
    return <Navigate to={userType === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
