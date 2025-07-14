import { useLocation, Redirect } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { createLogger } from '@/lib/logger';

const logger = createLogger('protectedRoute');

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Protected route component
 * Redirects to login page if user is not authenticated
 * Optionally checks for super admin status
 */
export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const [location] = useLocation();

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logger.warn(`Unauthenticated access attempt to: ${location}`);
    
    return <Redirect to="/admin/login" />;
  }

  // If super admin is required but user is not a super admin
  if (requireSuperAdmin && admin && !admin.isSuperAdmin) {
    logger.warn(`Non-super admin access attempt to protected route: ${location}`);
    
    return <Redirect to="/admin/dashboard" />;
  }

  // User is authenticated and meets requirements
  return <>{children}</>;
}

export default ProtectedRoute; 