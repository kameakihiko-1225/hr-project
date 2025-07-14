import { createLogger } from '../lib/logger';
import { env } from '../lib/env';
import { authMiddleware } from './middleware/authMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { companyHandler } from './company/companyHandler';
import { authHandler } from './auth/authHandler';
import { dbHandler } from './db/dbHandler';
import { dashboardHandler } from './dashboard/dashboardHandler';
import { filesHandler } from './files/filesHandler';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Create a logger for the API
const logger = createLogger('api');

// Schema for industry tag creation
const createIndustryTagSchema = z.object({
  name: z.string().min(1, 'Name is required')
});

/**
 * API Router
 * @param {Request} req - The request object
 * @returns {Response} The response object
 */
export async function apiRouter(req: Request): Promise<Response> {
  try {
    // Log the request
    loggingMiddleware(req);
    
    // Get the URL pathname
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Remove /api prefix from path
    const apiPath = path.replace(/^\/api/, '');
    
    // Handle authentication endpoints (no auth required)
    if (apiPath.startsWith('/auth')) {
      if (apiPath === '/auth/login' && req.method === 'POST') {
        return authHandler.login(req);
      } else if (apiPath === '/auth/register' && req.method === 'POST') {
        return authHandler.register(req);
      } else if (apiPath === '/auth/reset-password' && req.method === 'POST') {
        return authHandler.resetPassword(req);
      } else if (apiPath === '/auth/verify' && req.method === 'GET') {
        return authHandler.verify(req);
      }
    }
    
    // Database health check endpoint (no auth required)
    if (apiPath === '/db/health' && req.method === 'GET') {
      return dbHandler.checkHealth(req);
    }
    
    // File download endpoint (no auth required)
    if (apiPath.match(/^\/files\/[^\/]+$/) && req.method === 'GET') {
      const id = apiPath.split('/').pop();
      return filesHandler.getFile(req, id!);
    }
    
    // All other endpoints require authentication
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
    
    // Handle file endpoints
    if (apiPath.startsWith('/files')) {
      if (apiPath === '/files' && req.method === 'POST') {
        return filesHandler.uploadFile(req);
      }
    }
    
    // Handle company endpoints
    if (apiPath.startsWith('/companies')) {
      if (apiPath === '/companies' && req.method === 'GET') {
        return companyHandler.getCompanies(req);
      } else if (apiPath === '/companies' && req.method === 'POST') {
        return companyHandler.createCompany(req);
      } else if (apiPath.match(/^\/companies\/[^\/]+$/) && req.method === 'GET') {
        const id = apiPath.split('/').pop();
        return companyHandler.getCompany(req, id!);
      } else if (apiPath.match(/^\/companies\/[^\/]+$/) && req.method === 'PUT') {
        const id = apiPath.split('/').pop();
        return companyHandler.updateCompany(req, id!);
      } else if (apiPath.match(/^\/companies\/[^\/]+$/) && req.method === 'DELETE') {
        const id = apiPath.split('/').pop();
        return companyHandler.deleteCompany(req, id!);
      } else if (apiPath.match(/^\/companies\/[^\/]+\/logo$/) && req.method === 'POST') {
        const id = apiPath.split('/')[2]; // Get company ID from path
        return companyHandler.uploadLogo(req, id);
      }
    }
    
    // Handle industry tags endpoints
    if (apiPath.startsWith('/industry-tags')) {
      if (apiPath === '/industry-tags' && req.method === 'GET') {
        // Get all industry tags
        try {
          logger.debug('Getting all industry tags');
          
          const industryTags = await prisma.industryTag.findMany({
            orderBy: { name: 'asc' }
          });
          
          return new Response(
            JSON.stringify({
              success: true,
              data: industryTags,
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          logger.error('Error getting industry tags', error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to get industry tags',
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } else if (apiPath === '/industry-tags' && req.method === 'POST') {
        // Create a new industry tag
        try {
          logger.debug('Creating new industry tag');
          
          // Parse and validate request body
          const body = await req.json();
          const parseResult = createIndustryTagSchema.safeParse(body);
          
          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Validation error',
                details: parseResult.error.flatten(),
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          // Check if tag already exists
          const existingTag = await prisma.industryTag.findFirst({
            where: { name: { equals: parseResult.data.name, mode: 'insensitive' } }
          });
          
          if (existingTag) {
            return new Response(
              JSON.stringify({
                success: true,
                data: existingTag,
                message: 'Industry tag already exists',
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          // Create new tag
          const newTag = await prisma.industryTag.create({
            data: { name: parseResult.data.name }
          });
          
          return new Response(
            JSON.stringify({
              success: true,
              data: newTag,
            }),
            { 
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          logger.error('Error creating industry tag', error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to create industry tag',
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }
    
    // Handle dashboard endpoints
    if (apiPath.startsWith('/dashboard')) {
      if (apiPath === '/dashboard/stats' && req.method === 'GET') {
        return dashboardHandler.getStats(req);
      }
    }
    
    // Handle database endpoints (super admin only)
    if (apiPath.startsWith('/db')) {
      if (!authResult.admin?.isSuperAdmin) {
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
      
      if (apiPath === '/db/stats' && req.method === 'GET') {
        return dbHandler.getStats(req);
      } else if (apiPath === '/db/version' && req.method === 'GET') {
        return dbHandler.getVersion(req);
      }
    }
    
    // If no route matched, return 404
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Endpoint not found',
      }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Handle any errors
    return errorMiddleware(error);
  }
} 