import { createLogger } from './logger';
import prisma from './prisma';
import { generateToken, verifyToken } from './jwt';
import bcrypt from 'bcryptjs';

// Create a logger for authentication
const logger = createLogger('auth');

/**
 * Authentication service
 * Provides methods for user authentication
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      logger.debug(`Attempting sign in for email: ${email}`);
      
      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email }
      });
      
      if (!admin) {
        logger.warn(`Sign in failed: No admin found with email ${email}`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      
      // Check password
      const passwordValid = await bcrypt.compare(password, admin.passwordHash);
      
      if (!passwordValid) {
        logger.warn(`Sign in failed: Invalid password for ${email}`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      
      // Generate JWT token
      const token = generateToken({
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      });
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      logger.info(`Sign in successful for admin: ${admin.email} (${admin.id})`);
      
      return {
        success: true,
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
   * Register a new admin
   */
  async register(email: string, password: string, isSuperAdmin: boolean = false) {
    try {
      logger.debug(`Attempting to register new admin with email: ${email}`);
      
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email }
      });
      
      if (existingAdmin) {
        logger.warn(`Registration failed: Admin already exists with email ${email}`);
        return {
          success: false,
          error: 'Email already in use',
        };
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email,
          passwordHash,
          isSuperAdmin,
        }
      });
      
      // Generate JWT token
      const token = generateToken({
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      });
      
      // Return admin without password hash
      const { passwordHash: _, ...adminWithoutPassword } = admin;
      
      logger.info(`Registration successful for admin: ${admin.email} (${admin.id})`);
      
      return {
        success: true,
        admin: adminWithoutPassword,
        token,
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
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      logger.debug(`Attempting to reset password for email: ${email}`);
      
      // Check if admin exists
      const admin = await prisma.admin.findUnique({
        where: { email }
      });
      
      if (!admin) {
        logger.warn(`Password reset failed: No admin found with email ${email}`);
        return {
          success: false,
          error: 'Email not found',
        };
      }
      
      // In a real application, we would send an email with a reset link
      // For now, we'll just log it
      logger.info(`Password reset requested for admin: ${admin.email} (${admin.id})`);
      
      return {
        success: true,
        message: 'Password reset instructions sent to your email',
      };
    } catch (error) {
      logger.error(`Password reset error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during password reset',
      };
    }
  }
  
  /**
   * Verify token and get admin
   */
  async verifyToken(token: string) {
    try {
      logger.debug('Verifying token');
      
      // Verify token
      const payload = verifyToken(token);
      
      if (!payload || !payload.adminId) {
        logger.warn('Token verification failed: Invalid payload');
        return {
          success: false,
          error: 'Invalid token',
        };
      }
      
      // Find admin by ID
      const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId }
      });
      
      if (!admin) {
        logger.warn(`Token verification failed: No admin found with ID ${payload.adminId}`);
        return {
          success: false,
          error: 'Invalid token',
        };
      }
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      logger.debug(`Token verified for admin: ${admin.email} (${admin.id})`);
      
      return {
        success: true,
        admin: adminWithoutPassword,
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