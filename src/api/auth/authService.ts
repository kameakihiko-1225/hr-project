import { createLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { Admin } from '../../../generated/prisma';
import * as bcrypt from 'bcryptjs';
import { generateToken, JwtPayload } from '@/lib/jwt';

// Create a logger for the auth service
const logger = createLogger('authService');

// Interface for login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface for login response
export interface LoginResponse {
  success: boolean;
  admin?: Omit<Admin, 'passwordHash'>;
  token?: string;
  error?: string;
}

// Interface for reset password response
export interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}

/**
 * Authentication service
 */
export class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;
    
    try {
      logger.debug(`Attempting login for email: ${email}`);
      
      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email },
      });
      
      if (!admin) {
        logger.warn(`Login failed: Admin not found for email: ${email}`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
      
      if (!isPasswordValid) {
        logger.warn(`Login failed: Invalid password for email: ${email}`);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      
      // Generate JWT token
      const payload: JwtPayload = {
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      };
      
      const token = generateToken(payload);
      
      logger.info(`Login successful for admin: ${admin.email} (${admin.id})`);
      
      // Return admin without password hash
      const { passwordHash, ...adminWithoutPassword } = admin;
      
      return {
        success: true,
        admin: adminWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error(`Login error for email: ${email}`, error);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }
  
  /**
   * Register a new admin (only available to superadmins)
   */
  async register(adminData: {
    email: string;
    password: string;
    isSuperAdmin?: boolean;
  }): Promise<LoginResponse> {
    const { email, password, isSuperAdmin = false } = adminData;
    
    try {
      logger.debug(`Attempting to register new admin: ${email}`);
      
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });
      
      if (existingAdmin) {
        logger.warn(`Registration failed: Email already exists: ${email}`);
        return {
          success: false,
          error: 'Email already exists',
        };
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create new admin
      const admin = await prisma.admin.create({
        data: {
          email,
          passwordHash,
          isSuperAdmin,
        },
      });
      
      logger.info(`Registration successful for admin: ${admin.email} (${admin.id})`);
      
      // Generate JWT token
      const payload: JwtPayload = {
        adminId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      };
      
      const token = generateToken(payload);
      
      // Return admin without password hash
      const { passwordHash: _, ...adminWithoutPassword } = admin;
      
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
   * Reset password for an admin
   * This sends a password reset email (currently just logs it)
   */
  async resetPassword(email: string): Promise<ResetPasswordResponse> {
    try {
      logger.debug(`Attempting password reset for email: ${email}`);
      
      // Check if admin exists
      const admin = await prisma.admin.findUnique({
        where: { email },
      });
      
      if (!admin) {
        logger.warn(`Password reset failed: Admin not found for email: ${email}`);
        return {
          success: false,
          error: 'Email not found',
        };
      }
      
      // In a real application, we would send an email with a reset link
      // For now, we'll just log it
      logger.info(`Password reset requested for admin: ${admin.email} (${admin.id})`);
      logger.info(`[MOCK] Reset email sent to: ${email}`);
      
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
  
  /**
   * Create a seed superadmin if none exists
   */
  async seedSuperAdmin(): Promise<void> {
    try {
      // Check if any admin exists
      const adminCount = await prisma.admin.count();
      
      if (adminCount === 0) {
        logger.info('No admins found, creating seed superadmin');
        
        const email = 'admin@example.com';
        const password = 'admin123'; // This should be changed immediately
        
        await this.register({
          email,
          password,
          isSuperAdmin: true,
        });
        
        logger.info(`Seed superadmin created with email: ${email}`);
      } else {
        logger.debug('Admins already exist, skipping seed superadmin creation');
      }
    } catch (error) {
      logger.error('Error seeding superadmin', error);
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();

export default authService; 