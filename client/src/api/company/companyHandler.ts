import { createLogger } from '@/lib/logger';
import { companyService } from './companyService';
import { authMiddleware } from '../middleware/authMiddleware';
import { z } from 'zod';

// Create a logger for the company handler
const logger = createLogger('companyHandler');

// Zod schemas for company validation
const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  logoUrl: z.string().optional(),
  color: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().optional(),
  color: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Company Handler
 * Handles API endpoints for company operations.
 *
 * Endpoints:
 * - GET    /api/companies         → getCompanies
 * - GET    /api/companies/:id     → getCompany
 * - POST   /api/companies         → createCompany
 * - PUT    /api/companies/:id     → updateCompany
 * - DELETE /api/companies/:id     → deleteCompany
 *
 * All endpoints require authentication via authMiddleware.
 * Responses are JSON with { success, data?, error? }.
 */
export const companyHandler = {
  /**
   * Upload a company logo
   * @route POST /api/companies/:id/logo
   * @param {Request} req - The HTTP request object (expects multipart/form-data)
   * @param {string} id - The company ID
   * @returns {Promise<Response>} 200 with updated company, 401 if unauthenticated, 400 on validation error, 404 if not found, 500 on error
   */
  async uploadLogo(req: Request, id: string): Promise<Response> {
    try {
      logger.debug(`Uploading logo for company: ${id}`);
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Get form data from request
      const formData = await req.formData();
      const logo = formData.get('logo') as File;
      
      if (!logo) {
        logger.warn('No logo file provided');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No logo file provided',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Validate file type
      if (!logo.type.startsWith('image/')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid file type. Only images are allowed.',
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Upload logo and update company
      const company = await companyService.uploadLogo(id, authResult.adminId, logo);
      
      if (!company) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Company not found',
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: company,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error(`Error uploading logo for company: ${id}`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to upload logo',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },

  /**
   * Get all companies for the authenticated admin.
   * @route GET /api/companies
   * @param {Request} req - The HTTP request object
   * @returns {Promise<Response>} 200 with companies array, 401 if unauthenticated, 500 on error
   */
  async getCompanies(req: Request): Promise<Response> {
    try {
      logger.debug('Getting all companies');
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const companies = await companyService.getCompanies(authResult.adminId);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: companies,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error getting companies', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get companies',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Get a company by ID for the authenticated admin.
   * @route GET /api/companies/:id
   * @param {Request} req - The HTTP request object
   * @param {string} id - The company ID
   * @returns {Promise<Response>} 200 with company, 401 if unauthenticated, 404 if not found, 500 on error
   */
  async getCompany(req: Request, id: string): Promise<Response> {
    try {
      logger.debug(`Getting company with ID: ${id}`);
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const company = await companyService.getCompany(id, authResult.adminId);
      
      if (!company) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Company not found',
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: company,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error(`Error getting company with ID: ${id}`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get company',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Create a new company for the authenticated admin.
   * @route POST /api/companies
   * @param {Request} req - The HTTP request object (expects JSON body)
   * @returns {Promise<Response>} 201 with created company, 401 if unauthenticated, 400 on validation error, 500 on error
   */
  async createCompany(req: Request): Promise<Response> {
    try {
      logger.debug('Creating new company');
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const body = await req.json();
      
      // Validate input
      const parseResult = createCompanySchema.safeParse(body);
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
      
      // Add admin ID to the request body
      const data = {
        ...parseResult.data,
        adminId: authResult.adminId
      } as {
        name: string;
        logoUrl?: string;
        color?: string;
        address?: string;
        phone?: string;
        email?: string;
        city?: string;
        country?: string;
        description?: string;
        adminId: string;
      };
      const company = await companyService.createCompany(data);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: company,
        }),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('Error creating company', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create company',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Update a company by ID for the authenticated admin.
   * @route PUT /api/companies/:id
   * @param {Request} req - The HTTP request object (expects JSON body)
   * @param {string} id - The company ID
   * @returns {Promise<Response>} 200 with updated company, 401 if unauthenticated, 400 on validation error, 404 if not found, 500 on error
   */
  async updateCompany(req: Request, id: string): Promise<Response> {
    try {
      logger.debug(`Updating company with ID: ${id}`);
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const body = await req.json();
      
      // Validate input
      const parseResult = updateCompanySchema.safeParse(body);
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
      
      const company = await companyService.updateCompany(id, authResult.adminId, parseResult.data);
      
      if (!company) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Company not found',
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: company,
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error(`Error updating company with ID: ${id}`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update company',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Delete a company by ID for the authenticated admin.
   * @route DELETE /api/companies/:id
   * @param {Request} req - The HTTP request object
   * @param {string} id - The company ID
   * @returns {Promise<Response>} 200 on success, 401 if unauthenticated, 404 if not found, 500 on error
   */
  async deleteCompany(req: Request, id: string): Promise<Response> {
    try {
      logger.debug(`Deleting company with ID: ${id}`);
      
      // Get admin ID from auth middleware
      const authResult = await authMiddleware(req);
      if (!authResult.isAuthenticated || !authResult.adminId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const success = await companyService.deleteCompany(id, authResult.adminId);
      
      if (!success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Company not found',
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Company deleted successfully',
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error(`Error deleting company with ID: ${id}`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to delete company',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

export default companyHandler; 