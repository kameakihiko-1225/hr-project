import { createLogger } from './logger';

// Create a logger for authentication
const logger = createLogger('auth');

/**
 * Authentication service
 * Uses the existing backend authentication system
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      logger.debug(`Attempting sign in for email: ${email}`);
      
      // Use the existing backend authentication endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        logger.warn(`Sign in failed for email: ${email} - ${data.error}`);
        return {
          success: false,
          error: data.error || 'Authentication failed',
        };
      }
      
      logger.info(`Sign in successful for user: ${email}`);
      
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      logger.error(`Sign in error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  }
  
  /**
   * Register a new user (simplified version)
   */
  async register(email: string, password: string) {
    try {
      logger.debug(`Attempting to register new user with email: ${email}`);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        logger.warn(`Registration failed for email: ${email} - ${data.error}`);
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }
      
      logger.info(`Registration successful for user: ${email}`);
      
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      logger.error(`Registration error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during registration',
      };
    }
  }
  
  /**
   * Verify token 
   */
  async verifyToken(token: string) {
    try {
      logger.debug('Verifying token');
      
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        logger.warn('Token verification failed');
        return {
          success: false,
          error: 'Invalid token',
        };
      }
      
      logger.info('Token verification successful');
      
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      logger.error('Token verification error', error);
      return {
        success: false,
        error: 'An error occurred during token verification',
      };
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();

export default authService; 