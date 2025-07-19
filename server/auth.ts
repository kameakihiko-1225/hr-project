import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { AdminUser, AdminLogin, InsertAdminUser } from '@shared/schema';

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface AuthRequest extends Request {
  admin?: AdminUser;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(adminId: number): string {
    return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token: string): { adminId: number } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Create admin user with hashed password
  static async createAdmin(adminData: Omit<InsertAdminUser, 'passwordHash'> & { password: string }): Promise<AdminUser> {
    const { password, ...adminInfo } = adminData;
    const passwordHash = await this.hashPassword(password);
    
    const adminUser: InsertAdminUser = {
      ...adminInfo,
      passwordHash,
    };

    return storage.createAdminUser(adminUser);
  }

  // Login admin
  static async login(credentials: AdminLogin): Promise<{ admin: AdminUser; token: string } | null> {
    try {
      const admin = await storage.getAdminByUsername(credentials.username);
      if (!admin || !admin.isActive) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(credentials.password, admin.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Update last login time
      await storage.updateAdminLastLogin(admin.id);

      // Generate JWT token
      const token = this.generateToken(admin.id);

      // Create session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await storage.createAdminSession({
        adminUserId: admin.id,
        token,
        expiresAt,
      });

      return {
        admin: {
          ...admin,
          passwordHash: undefined, // Don't return password hash
        } as AdminUser,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Logout admin
  static async logout(token: string): Promise<boolean> {
    try {
      return await storage.deleteAdminSession(token);
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Get admin from token
  static async getAdminFromToken(token: string): Promise<AdminUser | null> {
    try {
      const sessionWithAdmin = await storage.getAdminSessionByToken(token);
      if (!sessionWithAdmin) {
        return null;
      }

      // Check if session is expired
      if (new Date() > sessionWithAdmin.expiresAt) {
        await storage.deleteAdminSession(token);
        return null;
      }

      return {
        ...sessionWithAdmin.adminUser,
        passwordHash: undefined, // Don't return password hash
      } as AdminUser;
    } catch (error) {
      console.error('Get admin from token error:', error);
      return null;
    }
  }
}

// Middleware to authenticate admin requests
export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Verify token and get admin
    const admin = await AuthService.getAdminFromToken(token);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Add admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

// Middleware to check if admin has specific role
export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.admin.role !== role && req.admin.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user is super admin
export const requireSuperAdmin = requireRole('super_admin');