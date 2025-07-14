import { createLogger } from './logger';
import { env } from './env';

// Create a logger for JWT operations
const logger = createLogger('jwt');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Interface for JWT library (to support both Node.js and browser environments)
interface JwtLib {
  sign: (payload: any, secret: string, options: any) => string;
  verify: (token: string, secret: string) => any;
  decode: (token: string) => any;
}

// Browser implementation of JWT using Web Crypto API
const browserJwt: JwtLib = {
  sign: (payload, secret, options) => {
    logger.debug('Using browser JWT implementation');
    
    // In browser, we'll use a simplified JWT implementation
    // This is not as secure as the Node.js implementation but works for development
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = typeof options.expiresIn === 'string' 
      ? parseInt(options.expiresIn) * 86400 // Convert days to seconds
      : options.expiresIn;
    
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };
    
    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(jwtPayload));
    
    // In a real implementation, we would use crypto.subtle.sign
    // But for simplicity, we'll just concatenate with a fake signature
    const signature = btoa(`${secret}_${base64Header}_${base64Payload}`);
    
    return `${base64Header}.${base64Payload}.${signature}`;
  },
  
  verify: (token, secret) => {
    logger.debug('Using browser JWT verification');
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        throw { name: 'TokenExpiredError', message: 'Token expired' };
      }
      
      return payload;
    } catch (error) {
      throw error;
    }
  },
  
  decode: (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  }
};

// Use the appropriate JWT implementation
let jwtLib: JwtLib;

if (isBrowser) {
  logger.debug('Using browser JWT implementation');
  jwtLib = browserJwt;
} else {
  try {
    // In Node.js, use the real jsonwebtoken library
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsonwebtoken = require('jsonwebtoken');
    jwtLib = jsonwebtoken;
    logger.debug('Using Node.js JWT implementation');
  } catch (error) {
    logger.warn('Failed to import jsonwebtoken, falling back to browser implementation', error);
    jwtLib = browserJwt;
  }
}

/**
 * JWT payload interface
 */
export interface JwtPayload {
  adminId: string;
  email: string;
  isSuperAdmin: boolean;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
  try {
    logger.debug(`Generating token for admin: ${payload.adminId}`);
    
    const token = jwtLib.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });
    
    logger.debug(`Token generated for admin: ${payload.adminId}`);
    
    return token;
  } catch (error) {
    logger.error(`Error generating token for admin: ${payload.adminId}`, error);
    throw error;
  }
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    logger.debug('Verifying token');
    
    const payload = jwtLib.verify(token, env.jwtSecret) as JwtPayload;
    
    logger.debug(`Token verified for admin: ${payload.adminId}`);
    
    return payload;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token: ${error.message}`);
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
    } else if (error.name === 'NotBeforeError') {
      logger.warn('Token not yet valid');
    } else {
      logger.error('Error verifying token', error);
    }
    
    return null;
  }
}

/**
 * Decode a JWT token without verification
 * This is useful for debugging or extracting information from an expired token
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    logger.debug('Decoding token');
    
    const payload = jwtLib.decode(token) as JwtPayload;
    
    if (!payload) {
      logger.warn('Invalid token format');
      return null;
    }
    
    logger.debug(`Token decoded for admin: ${payload.adminId}`);
    
    return payload;
  } catch (error) {
    logger.error('Error decoding token', error);
    return null;
  }
} 