import { createLogger } from '@/lib/logger';
import { authService } from '@/lib/auth';
import { env } from '@/lib/env';

// Create a logger for the auth middleware
const logger = createLogger('authMiddleware');

/**
 * Admin interface
 */
export interface Admin {
  id: string;
  email: string;
  isSuperAdmin: boolean;
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export async function authMiddleware(req: Request) {
  try {
    logger.debug('Authenticating request');
    
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      logger.warn('No Authorization header found');
      return { 
        isAuthenticated: false, 
        error: 'Authentication required' 
      };
    }
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid Authorization header format');
      return { 
        isAuthenticated: false, 
        error: 'Invalid authentication format' 
      };
    }
    
    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token
    const result = await authService.verifyToken(token);
    
    if (!result.success) {
      logger.warn('Token verification failed');
      return { 
        isAuthenticated: false, 
        error: result.error || 'Invalid token' 
      };
    }
    
    // Authentication successful
    logger.debug(`Authentication successful for admin: ${result.admin.email}`);
    
    return {
      isAuthenticated: true,
      admin: result.admin,
      adminId: result.admin.id,
    };
  } catch (error) {
    logger.error('Authentication error', error);
    return { 
      isAuthenticated: false, 
      error: 'Authentication failed' 
    };
  }
}

/**
 * Create a protected handler
 * Wraps a handler function with authentication middleware
 */
export function withAuth(
  handler: (req: Request, adminId: string, isSuperAdmin: boolean) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Run auth middleware
    const auth = await authMiddleware(req);
    
    if (!auth.isAuthenticated) {
      logger.warn(`Unauthorized request: ${auth.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: auth.error || 'Unauthorized' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Call handler with admin ID and isSuperAdmin flag
    return handler(req, auth.adminId!, auth.admin?.isSuperAdmin || false);
  };
}

/**
 * Super admin middleware
 * Ensures the authenticated user is a super admin
 */
export function withSuperAdmin(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      // Authenticate request
      const authResult = await authMiddleware(req);
      
      if (!authResult.isAuthenticated) {
        return new Response(
          JSON.stringify({
            success: false,
            error: authResult.error || 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Check if user is a super admin
      if (!authResult.admin?.isSuperAdmin) {
        logger.warn(`Super admin access denied for admin: ${authResult.admin?.email}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Super admin access required',
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Call the handler with the request and any additional arguments
      return handler(req, ...args);
    } catch (error) {
      logger.error('Super admin middleware error', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
} 