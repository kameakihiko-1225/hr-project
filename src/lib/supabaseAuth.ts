import { createLogger } from './logger';
import { supabase } from './supabase';
import { generateToken, JwtPayload } from './jwt';
import { env } from './env';

// Create a logger for Supabase authentication
const logger = createLogger('supabaseAuth');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if we're in development mode
const isDevelopment = env.isDevelopment;

// Check if Supabase is configured
const isSupabaseConfigured = !!env.supabaseUrl && !!env.supabaseAnonKey;

/**
 * Interface for authentication response
 */
export interface AuthResponse {
  success: boolean;
  user?: any;
  admin?: any;
  token?: string;
  error?: string;
}

/**
 * Supabase authentication service
 */
export class SupabaseAuthService {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      logger.debug(`Attempting sign in for email: ${email}`);
      
      // If Supabase is not configured, return an error
      if (!isSupabaseConfigured) {
        logger.warn('Sign in failed: Supabase not configured');
        return {
          success: false,
          error: 'Authentication service not configured',
        };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.warn(`Sign in failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
      
      if (!data.user) {
        logger.warn('Sign in succeeded but no user returned');
        return {
          success: false,
          error: 'Authentication failed',
        };
      }
      
      if (isBrowser) {
        // In browser environment, we can't access the database directly
        // Instead, we should make an API call to validate the user
        // For now, we'll just return a mock admin
        logger.info(`Sign in successful for user: ${data.user.email} (browser environment)`);
        
        // Generate a token with mock data
        const mockPayload: JwtPayload = {
          adminId: 'browser-mock-id',
          email: data.user.email!,
          isSuperAdmin: false,
        };
        
        const token = generateToken(mockPayload);
        
        return {
          success: true,
          user: data.user,
          admin: {
            id: 'browser-mock-id',
            email: data.user.email,
            isSuperAdmin: false,
            createdAt: new Date().toISOString(),
          },
          token,
        };
      }
      
      // Server environment - access database directly
      // Import prisma here to prevent browser import issues
      const { default: prisma } = await import('./prisma');
      
      // Find the corresponding admin in our database
      const admin = await prisma.admin.findUnique({
        where: { email: data.user.email! },
      });
      
      if (!admin) {
        logger.warn(`No admin found for authenticated user: ${data.user.email}`);
        return {
          success: false,
          error: 'User not authorized as admin',
        };
      }
      
      // Generate our own JWT token for API authorization
      const payload: JwtPayload = {
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      };
      
      const token = generateToken(payload);
      
      logger.info(`Sign in successful for admin: ${admin.email} (${admin.id})`);
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      return {
        success: true,
        user: data.user,
        admin: adminWithoutPassword,
        token,
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
   * Sign up with email and password
   * This should only be used by super admins to create new admin accounts
   */
  async signUpWithEmail(email: string, password: string, isSuperAdmin: boolean = false): Promise<AuthResponse> {
    try {
      logger.debug(`Attempting sign up for email: ${email}`);
      
      if (isBrowser) {
        logger.warn('Sign up attempted in browser environment');
        return {
          success: false,
          error: 'Admin creation is not available in the browser',
        };
      }
      
      // Import prisma here to prevent browser import issues
      const { default: prisma } = await import('./prisma');
      
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });
      
      if (existingAdmin) {
        logger.warn(`Admin already exists for email: ${email}`);
        return {
          success: false,
          error: 'Email already in use',
        };
      }
      
      // Create user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        logger.warn(`Sign up failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
      
      if (!data.user) {
        logger.warn('Sign up succeeded but no user returned');
        return {
          success: false,
          error: 'Registration failed',
        };
      }
      
      // Create admin in our database
      const admin = await prisma.admin.create({
        data: {
          email,
          passwordHash: 'supabase-managed', // We don't store the password, Supabase handles it
          isSuperAdmin,
        },
      });
      
      // Generate our own JWT token for API authorization
      const payload: JwtPayload = {
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      };
      
      const token = generateToken(payload);
      
      logger.info(`Sign up successful for admin: ${admin.email} (${admin.id})`);
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      return {
        success: true,
        user: data.user,
        admin: adminWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error(`Sign up error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during registration',
      };
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.debug('Attempting sign out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.warn(`Sign out failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
      
      logger.info('Sign out successful');
      
      return {
        success: true,
      };
    } catch (error) {
      logger.error('Sign out error', error);
      return {
        success: false,
        error: 'An error occurred during sign out',
      };
    }
  }
  
  /**
   * Get the current session
   */
  async getSession() {
    try {
      logger.debug('Getting current session');
      
      // If Supabase is not configured, return no session
      if (!isSupabaseConfigured) {
        logger.debug('No active session (Supabase not configured)');
        return {
          success: false,
          error: 'No active session',
        };
      }
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn(`Get session failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
      
      if (!data.session) {
        logger.debug('No active session');
        return {
          success: false,
          error: 'No active session',
        };
      }
      
      logger.debug(`Session found for user: ${data.session.user.email}`);
      
      if (isBrowser) {
        // In browser environment, we can't access the database directly
        // Instead, we should make an API call to validate the user
        // For now, we'll just return a mock admin based on local storage
        const storedAdmin = localStorage.getItem('adminData');
        
        if (storedAdmin) {
          try {
            const admin = JSON.parse(storedAdmin);
            const token = localStorage.getItem('authToken') || '';
            
            logger.debug(`Using stored admin data for: ${admin.email}`);
            
            return {
              success: true,
              session: data.session,
              admin,
              token,
            };
          } catch (error) {
            logger.warn('Failed to parse stored admin data', error);
          }
        }
        
        // If no stored admin or parsing failed, return a mock admin
        logger.debug(`Creating mock admin for: ${data.session.user.email}`);
        
        // Generate a token with mock data
        const mockPayload: JwtPayload = {
          adminId: 'browser-mock-id',
          email: data.session.user.email!,
          isSuperAdmin: false,
        };
        
        const token = generateToken(mockPayload);
        
        const mockAdmin = {
          id: 'browser-mock-id',
          email: data.session.user.email!,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
        };
        
        return {
          success: true,
          session: data.session,
          admin: mockAdmin,
          token,
        };
      }
      
      // Server environment - access database directly
      // Import prisma here to prevent browser import issues
      const { default: prisma } = await import('./prisma');
      
      // Find the corresponding admin in our database
      const admin = await prisma.admin.findUnique({
        where: { email: data.session.user.email! },
      });
      
      if (!admin) {
        logger.warn(`No admin found for authenticated user: ${data.session.user.email}`);
        return {
          success: false,
          error: 'User not authorized as admin',
        };
      }
      
      // Generate our own JWT token for API authorization
      const payload: JwtPayload = {
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      };
      
      const token = generateToken(payload);
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      return {
        success: true,
        session: data.session,
        admin: adminWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error('Get session error', error);
      return {
        success: false,
        error: 'An error occurred while getting session',
      };
    }
  }
  
  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.debug(`Attempting password reset for email: ${email}`);
      
      // If Supabase is not configured, return an error
      if (!isSupabaseConfigured) {
        logger.warn('Password reset failed: Supabase not configured');
        return {
          success: false,
          error: 'Authentication service not configured',
        };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        logger.warn(`Password reset failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
      
      logger.info(`Password reset email sent to: ${email}`);
      
      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Password reset error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during password reset',
      };
    }
  }
}

// Export a singleton instance
export const supabaseAuth = new SupabaseAuthService();

export default supabaseAuth; 