import { createLogger } from '@/lib/logger';
import { authService } from '@/lib/auth';
import { authMiddleware } from '../middleware/authMiddleware';

// Create a logger for the auth handler
const logger = createLogger('authHandler');

/**
 * Auth Handler
 * Provides API endpoints for authentication
 */
export const authHandler = {
  /**
   * Login endpoint
   * POST /api/auth/login
   */
  async login(req: Request): Promise<Response> {
    try {
      logger.debug('Processing login request');
      
      // Get request body
      const body = await req.json();
      const { email, password } = body;
      
      if (!email || !password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email and password are required',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Authenticate user
      const result = await authService.signInWithEmail(email, password);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || 'Authentication failed',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return success response with token
      return new Response(
        JSON.stringify({
          success: true,
          admin: result.admin,
          token: result.token,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Login error', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An error occurred during login',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Register endpoint
   * POST /api/auth/register
   */
  async register(req: Request): Promise<Response> {
    try {
      logger.debug('Processing registration request');
      
      // Get request body
      const body = await req.json();
      const { email, password, inviteCode } = body;
      
      if (!email || !password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email and password are required',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // In a real application, we would verify the invite code
      // For now, we'll just check if it's the super admin code
      const isSuperAdmin = inviteCode === 'SUPER_ADMIN_SECRET_CODE';
      
      // Register user
      const result = await authService.register(email, password, isSuperAdmin);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || 'Registration failed',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return success response with token
      return new Response(
        JSON.stringify({
          success: true,
          admin: result.admin,
          token: result.token,
        }),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Registration error', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An error occurred during registration',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Reset password endpoint
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request): Promise<Response> {
    try {
      logger.debug('Processing password reset request');
      
      // Get request body
      const body = await req.json();
      const { email } = body;
      
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email is required',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Reset password
      const result = await authService.resetPassword(email);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || 'Password reset failed',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message || 'Password reset instructions sent',
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Password reset error', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An error occurred during password reset',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Verify token endpoint
   * GET /api/auth/verify
   */
  async verify(req: Request): Promise<Response> {
    try {
      logger.debug('Processing token verification request');
      
      // Use auth middleware to verify token
      const authResult = await authMiddleware(req);
      
      if (!authResult.isAuthenticated) {
        return new Response(
          JSON.stringify({
            success: false,
            error: authResult.error || 'Invalid token',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return success response with admin data
      return new Response(
        JSON.stringify({
          success: true,
          admin: authResult.admin,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Token verification error', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An error occurred during token verification',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

export default authHandler; 