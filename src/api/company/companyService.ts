import { createLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { Company } from '../../../generated/prisma';

// Create a logger for the company service
const logger = createLogger('companyService');

/**
 * CompanyService
 * Provides methods for company CRUD operations with logging.
 * All methods require adminId for access control.
 */
/**
 * Company data interface for create/update operations
 */
type CompanyData = {
  name: string;
  logoUrl?: string;
  color?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  description?: string;
  adminId?: string;
};

/**
 * File interface for Node.js environment
 */
interface File {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * CompanyService class for company operations
 */
export class CompanyService {
  /**
   * Get all companies for a given admin.
   * @param {string} adminId - The admin's user ID
   * @returns {Promise<Company[]>} Array of companies
   */
  async getCompanies(adminId: string): Promise<Company[]> {
    try {
      logger.debug(`Getting companies for admin: ${adminId}`);
      
      const companies = await prisma.company.findMany({
        where: { adminId },
        orderBy: { createdAt: 'desc' },
      });
      
      logger.debug(`Found ${companies.length} companies for admin: ${adminId}`);
      
      return companies;
    } catch (error) {
      logger.error(`Error getting companies for admin: ${adminId}`, error);
      throw error;
    }
  }
  
  /**
   * Get a company by ID for a given admin.
   * @param {string} id - The company ID
   * @param {string} adminId - The admin's user ID
   * @returns {Promise<Company|null>} The company or null if not found
   */
  async getCompany(id: string, adminId: string): Promise<Company | null> {
    try {
      logger.debug(`Getting company: ${id} for admin: ${adminId}`);
      
      const company = await prisma.company.findFirst({
        where: {
          id,
          adminId,
        },
      });
      
      if (!company) {
        logger.warn(`Company not found: ${id} for admin: ${adminId}`);
        return null;
      }
      
      logger.debug(`Found company: ${company.name} (${company.id})`);
      
      return company;
    } catch (error) {
      logger.error(`Error getting company: ${id} for admin: ${adminId}`, error);
      throw error;
    }
  }
  
  async uploadLogo(id: string, adminId: string, logo: File): Promise<Company | null> {
    try {
      logger.debug(`Uploading logo for company: ${id} by admin: ${adminId}`);
      
      // First verify company exists and belongs to admin
      const company = await prisma.company.findFirst({
        where: {
          id,
          adminId,
        },
      });
      
      if (!company) {
        logger.warn(`Company not found: ${id} for admin: ${adminId}`);
        return null;
      }
      
      // Convert file to ArrayBuffer and then to Buffer for Prisma
      const arrayBuffer = await logo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Store file in FileStorage
      const file = await prisma.fileStorage.create({
        data: {
          fileName: logo.name,
          fileType: logo.type,
          fileData: buffer,
          uploadedBy: adminId,
        },
      });
      
      // Update company with new logo URL
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          logoUrl: `/api/files/${file.id}`,
        },
      });
      
      logger.info(`Updated logo for company: ${company.name} (${company.id})`);
      
      return updatedCompany;
    } catch (error) {
      logger.error(`Error uploading logo for company: ${id}`, error);
      throw error;
    }
  }

  async createCompany(data: CompanyData & { adminId: string }): Promise<Company> {
    try {
      logger.debug(`Creating company: ${data.name} for admin: ${data.adminId}`);
      
      const company = await prisma.company.create({
        data,
      });
      
      logger.info(`Created company: ${company.name} (${company.id}) for admin: ${data.adminId}`);
      
      return company;
    } catch (error) {
      logger.error(`Error creating company: ${data.name} for admin: ${data.adminId}`, error);
      throw error;
    }
  }
  
  /**
   * Update a company by ID for a given admin.
   * @param {string} id - The company ID
   * @param {string} adminId - The admin's user ID
   * @param {object} data - Fields to update (name, logoUrl, color, address, phone, email, city, country, description)
   * @returns {Promise<Company|null>} The updated company or null if not found/unauthorized
   */
  async updateCompany(
    id: string,
    adminId: string,
    data: Partial<CompanyData>
  ): Promise<Company | null> {
    try {
      logger.debug(`Updating company: ${id} for admin: ${adminId}`);
      
      // Check if company exists and belongs to admin
      const existingCompany = await this.getCompany(id, adminId);
      
      if (!existingCompany) {
        logger.warn(`Company not found or unauthorized: ${id} for admin: ${adminId}`);
        return null;
      }
      
      const company = await prisma.company.update({
        where: { id },
        data,
      });
      
      logger.info(`Updated company: ${company.name} (${company.id}) for admin: ${adminId}`);
      
      return company;
    } catch (error) {
      logger.error(`Error updating company: ${id} for admin: ${adminId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a company by ID for a given admin.
   * @param {string} id - The company ID
   * @param {string} adminId - The admin's user ID
   * @returns {Promise<boolean>} True if deleted, false if not found/unauthorized
   */
  async deleteCompany(id: string, adminId: string): Promise<boolean> {
    try {
      logger.debug(`Deleting company: ${id} for admin: ${adminId}`);
      
      // Check if company exists and belongs to admin
      const existingCompany = await this.getCompany(id, adminId);
      
      if (!existingCompany) {
        logger.warn(`Company not found or unauthorized: ${id} for admin: ${adminId}`);
        return false;
      }
      
      await prisma.company.delete({
        where: { id },
      });
      
      logger.info(`Deleted company: ${existingCompany.name} (${id}) for admin: ${adminId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting company: ${id} for admin: ${adminId}`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const companyService = new CompanyService();

export default companyService; 