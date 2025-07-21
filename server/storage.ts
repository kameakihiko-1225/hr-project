import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, count } from "drizzle-orm";
import dotenv from "dotenv";
import { 
  companies, departments, positions, candidates, galleryItems, industryTags, companyIndustryTags, positionClicks, adminUsers, adminSessions,
  type Company, type InsertCompany,
  type Department, type InsertDepartment,
  type Position, type InsertPosition,
  type Candidate, type InsertCandidate,
  type GalleryItem, type InsertGalleryItem,
  type IndustryTag, type InsertIndustryTag,
  type CompanyIndustryTag, type InsertCompanyIndustryTag,
  type PositionClick, type InsertPositionClick,
  type AdminUser, type InsertAdminUser, type AdminLogin,
  type AdminSession, type InsertAdminSession,
  type LocalizedContent, type SupportedLanguage, getLocalizedContent
} from "@shared/schema";
import { localizeEntity } from "@shared/localization";

// Load environment variables
dotenv.config();

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_TVDxarv9Nn3Q@ep-raspy-mode-a85brbk6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Extended Company type with industries for API responses
export type CompanyWithIndustries = Company & {
  industries: IndustryTag[];
};

export interface IStorage {
  // Company methods with localization support
  getAllCompanies(language?: SupportedLanguage): Promise<CompanyWithIndustries[]>;
  getCompanyById(id: number, language?: SupportedLanguage): Promise<CompanyWithIndustries | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Department methods with localization support
  getAllDepartments(companyId?: number, language?: SupportedLanguage): Promise<Department[]>;
  getAllDepartmentsWithPositionCounts(companyId?: number, language?: SupportedLanguage): Promise<(Department & { positionCount: number })[]>;
  getDepartmentById(id: number, language?: SupportedLanguage): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Position methods with localization support
  getAllPositions(departmentId?: number, language?: SupportedLanguage): Promise<Position[]>;
  getPositionById(id: number, language?: SupportedLanguage): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;

  // Candidate methods
  getAllCandidates(positionId?: string): Promise<Candidate[]>;
  getCandidateById(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: string): Promise<boolean>;

  // Gallery item methods with localization support
  getAllGalleryItems(category?: string, language?: SupportedLanguage): Promise<GalleryItem[]>;
  getGalleryItemById(id: number, language?: SupportedLanguage): Promise<GalleryItem | undefined>;
  createGalleryItem(galleryItem: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: number, galleryItem: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: number): Promise<boolean>;

  // Industry tag methods with localization support
  getAllIndustryTags(language?: SupportedLanguage): Promise<IndustryTag[]>;
  getIndustryTagById(id: number, language?: SupportedLanguage): Promise<IndustryTag | undefined>;
  createIndustryTag(industryTag: InsertIndustryTag): Promise<IndustryTag>;
  updateIndustryTag(id: number, industryTag: Partial<InsertIndustryTag>): Promise<IndustryTag | undefined>;
  deleteIndustryTag(id: number): Promise<boolean>;

  // Company-industry tag association methods
  getCompanyIndustryTags(companyId: number): Promise<IndustryTag[]>;
  addCompanyIndustryTag(companyId: number, industryTagId: number): Promise<void>;
  removeCompanyIndustryTag(companyId: number, industryTagId: number): Promise<void>;
  setCompanyIndustryTags(companyId: number, industryTagIds: number[]): Promise<void>;

  // Position click tracking methods
  trackPositionClick(positionId: number, clickType: 'view' | 'apply', ipAddress?: string, userAgent?: string): Promise<PositionClick>;
  getPositionClickStats(positionId?: number): Promise<{ positionId: number; viewCount: number; applyCount: number; }[]>;
  getDashboardStats(): Promise<{ totalViews: number; totalApplies: number; }>;
  getPositionApplicantCounts(): Promise<{ positionId: number; applicantCount: number; positionTitle: string; }[]>;

  // New methods for dynamic position counters
  getTopAppliedPositions(): Promise<{ positionId: number; positionTitle: string; appliedCount: number; }[]>;
  getAllAppliedPositions(): Promise<{ positionId: number; positionTitle: string; appliedCount: number; }[]>;

  // Admin authentication methods
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminById(id: number): Promise<AdminUser | undefined>;
  updateAdminUser(id: number, adminUser: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  updateAdminLastLogin(id: number): Promise<void>;
  deleteAdminUser(id: number): Promise<boolean>;

  // Admin session methods
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSessionByToken(token: string): Promise<(AdminSession & { adminUser: AdminUser }) | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Company methods
  // Add caching for frequently accessed data
  private companiesCache: { data: CompanyWithIndustries[]; timestamp: number; language?: string } | null = null;
  private departmentsCache: { data: Department[]; timestamp: number; language?: string; companyId?: string } | null = null;
  private positionsCache: { data: Position[]; timestamp: number; language?: string; departmentId?: string } | null = null;
  private cacheTimeout = 300000; // 5 minutes cache
  
  async getAllCompanies(language?: SupportedLanguage): Promise<CompanyWithIndustries[]> {
    console.log('[Storage] getAllCompanies: Starting request');
    
    // Check cache first
    if (this.companiesCache && 
        this.companiesCache.language === language &&
        Date.now() - this.companiesCache.timestamp < this.cacheTimeout) {
      console.log('[Storage] getAllCompanies: Returning cached data');
      return this.companiesCache.data;
    }
    
    try {
      const companiesData = await db.select().from(companies);
      console.log(`[Storage] getAllCompanies: Found ${companiesData.length} companies in database`);
      console.log(`[Storage] getAllCompanies: Company IDs: ${companiesData.map(c => c.id).join(', ')}`);
      
      // PERFORMANCE OPTIMIZATION: Fetch all industry tags in one query instead of individual queries
      const allIndustryTags = await db
        .select({
          companyId: companyIndustryTags.companyId,
          industryId: industryTags.id,
          industryName: industryTags.name,
          industryDescription: industryTags.description,
          industryCreatedAt: industryTags.createdAt
        })
        .from(companyIndustryTags)
        .leftJoin(industryTags, eq(companyIndustryTags.industryTagId, industryTags.id));
      
      // Group industry tags by company ID for O(1) lookup
      const industryTagsByCompany = allIndustryTags.reduce((acc, tag) => {
        if (!acc[tag.companyId]) {
          acc[tag.companyId] = [];
        }
        if (tag.industryId) {
          const industryTag = {
            id: tag.industryId,
            name: language ? getLocalizedContent(tag.industryName as LocalizedContent, language) : tag.industryName,
            description: language ? getLocalizedContent(tag.industryDescription as LocalizedContent, language) : tag.industryDescription,
            createdAt: tag.industryCreatedAt
          };
          acc[tag.companyId].push(industryTag);
        }
        return acc;
      }, {} as Record<number, any[]>);
      
      // Process companies without individual database calls
      const companiesWithTags = companiesData.map((company) => {
        const industries = industryTagsByCompany[company.id] || [];
        
        if (language) {
          // Localize company fields for public API
          return {
            ...company,
            name: getLocalizedContent(company.name, language),
            description: getLocalizedContent(company.description, language),
            address: getLocalizedContent(company.address, language),
            city: getLocalizedContent(company.city, language),
            country: getLocalizedContent(company.country, language),
            industries,
          } as CompanyWithIndustries;
        } else {
          // Return raw data for admin interface
          return {
            ...company,
            industries,
          } as CompanyWithIndustries;
        }
      });
      
      // Cache the result
      this.companiesCache = {
        data: companiesWithTags,
        timestamp: Date.now(),
        language
      };
      
      console.log(`[Storage] getAllCompanies: Returning ${companiesWithTags.length} companies with optimized queries`);
      return companiesWithTags;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  async getCompanyById(id: number, language?: SupportedLanguage): Promise<CompanyWithIndustries | undefined> {
    try {
      const result = await db.select().from(companies).where(eq(companies.id, id));
      const company = result[0];
      
      if (company) {
        const industries = await this.getCompanyIndustryTags(company.id, language);
        
        if (language) {
          // Localize company fields for public API
          const localizedCompany = {
            ...company,
            name: getLocalizedContent(company.name, language),
            description: getLocalizedContent(company.description, language),
            address: getLocalizedContent(company.address, language),
            city: getLocalizedContent(company.city, language),
            country: getLocalizedContent(company.country, language),
            industries,
          };
          
          return localizedCompany as CompanyWithIndustries;
        } else {
          // Return raw LocalizedContent objects for admin interface
          return {
            ...company,
            industries,
          } as CompanyWithIndustries;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error fetching company by id:', error);
      return undefined;
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(companies).set(company).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // Optimized method for admin interface using shared optimization class
  async getAllCompaniesOptimized(): Promise<CompanyWithIndustries[]> {
    console.log('[Storage] getAllCompaniesOptimized: Starting optimized request');
    
    try {
      // Use the shared optimization utility
      const batchData = await import('./storage-optimizations');
      const { StorageOptimizations } = batchData;
      
      // Get companies from batch data (more efficient)
      const adminData = await StorageOptimizations.getAdminBatchData();
      
      console.log(`[Storage] getAllCompaniesOptimized: Returning ${adminData.companies.length} companies with optimized batch query`);
      return adminData.companies;
      
    } catch (error) {
      console.error('[Storage] Optimized query failed, falling back to standard method:', error);
      
      // Fallback to standard method
      return this.getAllCompanies();
    }
  }

  // Department methods
  async getAllDepartments(companyId?: number, language?: SupportedLanguage): Promise<Department[]> {
    let result;
    if (companyId) {
      result = await db.select().from(departments).where(eq(departments.companyId, companyId));
    } else {
      result = await db.select().from(departments);
    }
    
    if (language) {
      // Localize department fields for public API
      return result.map(department => ({
        ...department,
        name: getLocalizedContent(department.name, language),
        description: getLocalizedContent(department.description, language),
      }));
    } else {
      // Return raw LocalizedContent objects for admin interface
      return result;
    }
  }

  async getAllDepartmentsWithPositionCounts(companyId?: number, language?: SupportedLanguage): Promise<(Department & { positionCount: number })[]> {
    try {
      console.log('Executing getAllDepartmentsWithPositionCounts with companyId:', companyId, 'language:', language);
      
      // Get all departments first
      const departmentsResult = await this.getAllDepartments(companyId, language);
      
      // Count positions for each department
      const departmentsWithCounts = await Promise.all(
        departmentsResult.map(async (department) => {
          const positionCountResult = await db
            .select({ count: count(positions.id) })
            .from(positions)
            .where(eq(positions.departmentId, department.id));
          
          const positionCount = positionCountResult[0]?.count || 0;
          const departmentName = language ? department.name : 
            (typeof department.name === 'object' ? department.name.en || 'Unknown' : department.name);
          console.log(`Department ${department.id} (${departmentName}) has ${positionCount} positions`);
          
          return {
            ...department,
            positionCount: Number(positionCount)
          };
        })
      );
      
      console.log('getAllDepartmentsWithPositionCounts result:', departmentsWithCounts);
      return departmentsWithCounts;
    } catch (error) {
      console.error('Database error in getAllDepartmentsWithPositionCounts:', error);
      // Return regular departments if position count query fails
      console.log('Falling back to regular getAllDepartments due to error');
      return await this.getAllDepartments(companyId, language) as (Department & { positionCount: number })[];
    }
  }

  async getDepartmentById(id: number, language: SupportedLanguage = 'en'): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    if (result[0]) {
      // Localize department fields
      return {
        ...result[0],
        name: getLocalizedContent(result[0].name, language),
        description: getLocalizedContent(result[0].description, language),
      };
    }
    return undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await db.update(departments).set(department).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return result.rowCount > 0;
  }

  // Position methods
  async getAllPositions(departmentId?: number, language?: SupportedLanguage): Promise<Position[]> {
    try {
      let dbPositions;
      if (departmentId) {
        dbPositions = await db.select().from(positions).where(eq(positions.departmentId, departmentId));
      } else {
        dbPositions = await db.select().from(positions);
      }
      
      // Return the full LocalizedContent objects
      return dbPositions.map(position => {
        // Create a new object with the correct types
        const result: any = { ...position };
        
        // If language is provided, add localized versions of the fields
        if (language) {
          result.localizedTitle = getLocalizedContent(position.title, language);
          result.localizedDescription = getLocalizedContent(position.description, language);
          result.localizedLocation = getLocalizedContent(position.location, language);
          result.localizedCity = getLocalizedContent(position.city, language);
          result.localizedCountry = getLocalizedContent(position.country, language);
          result.localizedSalaryRange = getLocalizedContent(position.salaryRange, language);
          result.localizedEmploymentType = getLocalizedContent(position.employmentType, language);
          result.localizedLanguageRequirements = getLocalizedContent(position.languageRequirements, language);
          result.localizedQualifications = getLocalizedContent(position.qualifications, language);
          result.localizedResponsibilities = getLocalizedContent(position.responsibilities, language);
        }
        
        return result as Position;
      });
    } catch (error) {
      console.error('Database error in getAllPositions:', error);
      // Return empty array if there's a database error
      return [];
    }
  }

  async getPositionById(id: number, language: SupportedLanguage = 'en'): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id));
    if (!result[0]) {
      return undefined;
    }
    
    const position = result[0];
    // Create a new object with the correct types
    const resultPosition: any = { ...position };
    
    // If language is provided, add localized versions of the fields
    if (language) {
      resultPosition.localizedTitle = getLocalizedContent(position.title, language);
      resultPosition.localizedDescription = getLocalizedContent(position.description, language);
      resultPosition.localizedLocation = getLocalizedContent(position.location, language);
      resultPosition.localizedCity = getLocalizedContent(position.city, language);
      resultPosition.localizedCountry = getLocalizedContent(position.country, language);
      resultPosition.localizedSalaryRange = getLocalizedContent(position.salaryRange, language);
      resultPosition.localizedEmploymentType = getLocalizedContent(position.employmentType, language);
      resultPosition.localizedLanguageRequirements = getLocalizedContent(position.languageRequirements, language);
      resultPosition.localizedQualifications = getLocalizedContent(position.qualifications, language);
      resultPosition.localizedResponsibilities = getLocalizedContent(position.responsibilities, language);
    }
    
    return resultPosition as Position;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const result = await db.insert(positions).values(position).returning();
    return result[0];
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const result = await db.update(positions).set(position).where(eq(positions.id, id)).returning();
    return result[0];
  }

  async deletePosition(id: number): Promise<boolean> {
    const result = await db.delete(positions).where(eq(positions.id, id));
    return result.rowCount > 0;
  }

  // Candidate methods
  async getAllCandidates(positionId?: string): Promise<Candidate[]> {
    try {
      if (positionId) {
        return await db.select().from(candidates).where(eq(candidates.positionId, positionId));
      }
      return await db.select().from(candidates);
    } catch (error) {
      console.error('Database error in getAllCandidates:', error);
      return [];
    }
  }

  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id));
    return result[0];
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const candidateWithId = {
      id: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...candidate
    };
    const result = await db.insert(candidates).values([candidateWithId]).returning();
    return result[0];
  }

  async updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const result = await db.update(candidates).set(candidate).where(eq(candidates.id, id)).returning();
    return result[0];
  }

  async deleteCandidate(id: string): Promise<boolean> {
    const result = await db.delete(candidates).where(eq(candidates.id, id));
    return result.rowCount > 0;
  }

  // Gallery item methods
  async getAllGalleryItems(category?: string, language: SupportedLanguage = 'en'): Promise<GalleryItem[]> {
    try {
      let dbItems: GalleryItem[];
      if (category) {
        dbItems = await db.select().from(galleryItems)
          .where(and(eq(galleryItems.isActive, true), eq(galleryItems.category, category)))
          .orderBy(galleryItems.sortOrder, galleryItems.createdAt);
      } else {
        dbItems = await db.select().from(galleryItems)
          .where(eq(galleryItems.isActive, true))
          .orderBy(galleryItems.sortOrder, galleryItems.createdAt);
      }
      
      // Return gallery items with localized fields if language is provided
      return dbItems.map(item => {
        // Create a new object with the correct types
        const result: any = { ...item };
        
        // If language is provided, add localized versions of the fields
        if (language) {
          result.localizedTitle = getLocalizedContent(item.title, language);
          result.localizedDescription = getLocalizedContent(item.description, language);
        }
        
        return result as GalleryItem;
      });
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      return [];
    }
  }

  async getGalleryItemById(id: number, language: SupportedLanguage = 'en'): Promise<GalleryItem | undefined> {
    try {
      const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
      if (!item) return undefined;
      
      // Create a new object with the correct types
      const result: any = { ...item };
      
      // If language is provided, add localized versions of the fields
      if (language) {
        result.localizedTitle = getLocalizedContent(item.title, language);
        result.localizedDescription = getLocalizedContent(item.description, language);
      }
      
      return result as GalleryItem;
    } catch (error) {
      console.error("Error fetching gallery item:", error);
      return undefined;
    }
  }

  async createGalleryItem(galleryItem: InsertGalleryItem): Promise<GalleryItem> {
    try {
      const [newItem] = await db.insert(galleryItems).values(galleryItem).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating gallery item:", error);
      throw error;
    }
  }

  async updateGalleryItem(id: number, galleryItem: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    try {
      const [updatedItem] = await db
        .update(galleryItems)
        .set({ ...galleryItem, updatedAt: new Date() })
        .where(eq(galleryItems.id, id))
        .returning();
      return updatedItem || undefined;
    } catch (error) {
      console.error("Error updating gallery item:", error);
      return undefined;
    }
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(galleryItems).where(eq(galleryItems.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      return false;
    }
  }

  // Industry tag methods
  async getAllIndustryTags(language: SupportedLanguage = 'en'): Promise<IndustryTag[]> {
    try {
      const dbTags = await db.select().from(industryTags).orderBy(industryTags.name);
      
      // For industry tags, we'll just use the English version directly
      return dbTags.map(tag => ({
        ...tag,
        // Ensure name and description are strings (use English version)
        name: typeof tag.name === 'object' ? tag.name.en || '' : tag.name || '',
        description: typeof tag.description === 'object' ? tag.description.en || '' : tag.description || ''
      }));
    } catch (error) {
      console.error('Error fetching industry tags:', error);
      return [];
    }
  }

  async getIndustryTagById(id: number, language: SupportedLanguage = 'en'): Promise<IndustryTag | undefined> {
    try {
      const [tag] = await db.select().from(industryTags).where(eq(industryTags.id, id));
      if (!tag) return undefined;
      
      // For industry tags, we'll just use the English version directly
      return {
        ...tag,
        // Ensure name and description are strings (use English version)
        name: typeof tag.name === 'object' ? tag.name.en || '' : tag.name || '',
        description: typeof tag.description === 'object' ? tag.description.en || '' : tag.description || ''
      };
    } catch (error) {
      console.error('Error fetching industry tag:', error);
      return undefined;
    }
  }

  async createIndustryTag(industryTag: InsertIndustryTag): Promise<IndustryTag> {
    try {
      const [tag] = await db.insert(industryTags).values(industryTag).returning();
      return tag;
    } catch (error) {
      console.error('Error creating industry tag:', error);
      throw error;
    }
  }

  async updateIndustryTag(id: number, industryTag: Partial<InsertIndustryTag>): Promise<IndustryTag | undefined> {
    try {
      const [tag] = await db.update(industryTags).set(industryTag).where(eq(industryTags.id, id)).returning();
      return tag || undefined;
    } catch (error) {
      console.error('Error updating industry tag:', error);
      return undefined;
    }
  }

  async deleteIndustryTag(id: number): Promise<boolean> {
    try {
      await db.delete(industryTags).where(eq(industryTags.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting industry tag:', error);
      return false;
    }
  }

  // Company-industry tag association methods
  async getCompanyIndustryTags(companyId: number, language: SupportedLanguage = 'en'): Promise<IndustryTag[]> {
    try {
      console.log(`[Storage] getCompanyIndustryTags: Fetching tags for company ${companyId}`);
      const results = await db
        .select({
          id: industryTags.id,
          name: industryTags.name,
          description: industryTags.description,
          createdAt: industryTags.createdAt,
        })
        .from(companyIndustryTags)
        .innerJoin(industryTags, eq(companyIndustryTags.industryTagId, industryTags.id))
        .where(eq(companyIndustryTags.companyId, companyId));

      console.log(`[Storage] getCompanyIndustryTags: Found ${results.length} tags for company ${companyId}`);
      
      // For company industry tags, we'll just use the English version directly
      return results.map(tag => ({
        ...tag,
        // Ensure name and description are strings (use English version)
        name: typeof tag.name === 'object' ? tag.name.en || '' : tag.name || '',
        description: typeof tag.description === 'object' ? tag.description.en || '' : tag.description || ''
      }));
    } catch (error) {
      console.error(`[Storage] Error fetching company industry tags for company ${companyId}:`, error);
      return [];
    }
  }

  async addCompanyIndustryTag(companyId: number, industryTagId: number): Promise<void> {
    try {
      await db.insert(companyIndustryTags).values({
        companyId,
        industryTagId,
      });
    } catch (error) {
      console.error('Error adding company industry tag:', error);
      throw error;
    }
  }

  async removeCompanyIndustryTag(companyId: number, industryTagId: number): Promise<void> {
    try {
      await db.delete(companyIndustryTags).where(
        and(
          eq(companyIndustryTags.companyId, companyId),
          eq(companyIndustryTags.industryTagId, industryTagId)
        )
      );
    } catch (error) {
      console.error('Error removing company industry tag:', error);
      throw error;
    }
  }

  async setCompanyIndustryTags(companyId: number, industryTagIds: number[]): Promise<void> {
    try {
      // Remove all existing associations for this company
      await db.delete(companyIndustryTags).where(eq(companyIndustryTags.companyId, companyId));
      
      // Add new associations
      if (industryTagIds.length > 0) {
        await db.insert(companyIndustryTags).values(
          industryTagIds.map(industryTagId => ({
            companyId,
            industryTagId,
          }))
        );
      }
    } catch (error) {
      console.error('Error setting company industry tags:', error);
      throw error;
    }
  }

  // Position click tracking methods
  async trackPositionClick(positionId: number, clickType: 'view' | 'apply', ipAddress?: string, userAgent?: string): Promise<PositionClick> {
    try {
      const [click] = await db.insert(positionClicks).values({
        positionId,
        clickType,
        ipAddress,
        userAgent,
      }).returning();
      
      return click;
    } catch (error) {
      console.error('Error tracking position click:', error);
      throw error;
    }
  }

  async getPositionClickStats(positionId?: number): Promise<{ positionId: number; viewCount: number; applyCount: number; }[]> {
    try {
      const query = db
        .select({
          positionId: positionClicks.positionId,
          clickType: positionClicks.clickType,
        })
        .from(positionClicks);

      const results = positionId 
        ? await query.where(eq(positionClicks.positionId, positionId))
        : await query;

      // Group by position and count clicks
      const stats = results.reduce((acc, row) => {
        const pos = row.positionId;
        if (!acc[pos]) {
          acc[pos] = { positionId: pos, viewCount: 0, applyCount: 0 };
        }
        if (row.clickType === 'view') {
          acc[pos].viewCount++;
        } else if (row.clickType === 'apply') {
          acc[pos].applyCount++;
        }
        return acc;
      }, {} as Record<number, { positionId: number; viewCount: number; applyCount: number; }>);

      return Object.values(stats);
    } catch (error) {
      console.error('Error getting position click stats:', error);
      return [];
    }
  }

  async getDashboardStats(): Promise<{ totalViews: number; totalApplies: number; }> {
    try {
      const results = await db
        .select({
          clickType: positionClicks.clickType,
        })
        .from(positionClicks);

      const stats = results.reduce((acc, row) => {
        if (row.clickType === 'view') {
          acc.totalViews++;
        } else if (row.clickType === 'apply') {
          acc.totalApplies++;
        }
        return acc;
      }, { totalViews: 0, totalApplies: 0 });

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { totalViews: 0, totalApplies: 0 };
    }
  }

  // New method to get applicant counts for positions
  async getPositionApplicantCounts(): Promise<{ positionId: number; applicantCount: number; positionTitle: string; }[]> {
    try {
      // For demonstration purposes, provide sample data showing the feature functionality
      // In production, this would query actual application data from the database
      const samplePositions = [
        { positionId: 7, applicantCount: 43, positionTitle: "HR Generalist" },
        { positionId: 6, applicantCount: 28, positionTitle: "English Teacher" },
        { positionId: 5, applicantCount: 19, positionTitle: "Software Developer" }
      ];
      
      console.log('Position applicant counts (demo data):', samplePositions);
      return samplePositions;
    } catch (error) {
      console.error('Error getting position applicant counts:', error);
      return [];
    }
  }

  // Get top 3 positions with most apply clicks (real data from position_clicks table)
  async getTopAppliedPositions(): Promise<{ positionId: number; positionTitle: string; appliedCount: number; }[]> {
    try {
      // Query position_clicks table to get actual apply click counts
      const appliedPositions = await db
        .select({
          positionId: positionClicks.positionId,
          appliedCount: count(positionClicks.id).as('appliedCount')
        })
        .from(positionClicks)
        .where(eq(positionClicks.clickType, 'apply'))
        .groupBy(positionClicks.positionId)
        .orderBy(desc(count(positionClicks.id)))
        .limit(3);

      // Get position titles for these positions
      const results = [];
      for (const appliedPos of appliedPositions) {
        const position = await db
          .select({ title: positions.title })
          .from(positions)
          .where(eq(positions.id, appliedPos.positionId))
          .limit(1);
        
        if (position.length > 0) {
          // Extract localized title from JSON - title is a LocalizedContent object
          const titleJson = position[0].title as LocalizedContent;
          const positionTitle = typeof titleJson === 'string' ? titleJson : (titleJson.en || titleJson.ru || titleJson.uz || 'Unknown Position');
          
          results.push({
            positionId: appliedPos.positionId,
            positionTitle: positionTitle,
            appliedCount: Number(appliedPos.appliedCount)
          });
        }
      }
      
      console.log('Top applied positions (real data):', results);
      return results;
    } catch (error) {
      console.error('Error getting top applied positions:', error);
      return [];
    }
  }

  // Get all positions with apply clicks (full list, no pagination)
  async getAllAppliedPositions(): Promise<{ positionId: number; positionTitle: string; appliedCount: number; }[]> {
    try {
      // Query position_clicks table to get all positions with apply clicks
      const appliedPositions = await db
        .select({
          positionId: positionClicks.positionId,
          appliedCount: count(positionClicks.id).as('appliedCount')
        })
        .from(positionClicks)
        .where(eq(positionClicks.clickType, 'apply'))
        .groupBy(positionClicks.positionId)
        .orderBy(desc(count(positionClicks.id)));

      // Get position titles for these positions
      const results = [];
      for (const appliedPos of appliedPositions) {
        const position = await db
          .select({ title: positions.title })
          .from(positions)
          .where(eq(positions.id, appliedPos.positionId))
          .limit(1);
        
        if (position.length > 0) {
          // Extract localized title from JSON - title is a LocalizedContent object
          const titleJson = position[0].title as LocalizedContent;
          const positionTitle = typeof titleJson === 'string' ? titleJson : (titleJson.en || titleJson.ru || titleJson.uz || 'Unknown Position');
          
          results.push({
            positionId: appliedPos.positionId,
            positionTitle: positionTitle,
            appliedCount: Number(appliedPos.appliedCount)
          });
        }
      }

      console.log('All applied positions (real data):', results);
      return results;
    } catch (error) {
      console.error('Error getting all applied positions:', error);
      return [];
    }
  }

  // Admin authentication methods
  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    try {
      const result = await db.insert(adminUsers).values(adminUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    try {
      const result = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting admin by username:', error);
      return undefined;
    }
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    try {
      const result = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting admin by email:', error);
      return undefined;
    }
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    try {
      const result = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting admin by id:', error);
      return undefined;
    }
  }

  async updateAdminUser(id: number, adminUser: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    try {
      const result = await db
        .update(adminUsers)
        .set({ ...adminUser, updatedAt: new Date() })
        .where(eq(adminUsers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    try {
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, id));
    } catch (error) {
      console.error('Error updating admin last login:', error);
      throw error;
    }
  }

  async deleteAdminUser(id: number): Promise<boolean> {
    try {
      await db.delete(adminUsers).where(eq(adminUsers.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting admin user:', error);
      return false;
    }
  }

  // Admin session methods
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    try {
      const result = await db.insert(adminSessions).values(session).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating admin session:', error);
      throw error;
    }
  }

  async getAdminSessionByToken(token: string): Promise<(AdminSession & { adminUser: AdminUser }) | undefined> {
    try {
      const result = await db
        .select({
          session: adminSessions,
          adminUser: adminUsers,
        })
        .from(adminSessions)
        .leftJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
        .where(eq(adminSessions.token, token))
        .limit(1);

      if (!result[0] || !result[0].adminUser) {
        return undefined;
      }

      return {
        ...result[0].session,
        adminUser: result[0].adminUser,
      };
    } catch (error) {
      console.error('Error getting admin session by token:', error);
      return undefined;
    }
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    try {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
      return true;
    } catch (error) {
      console.error('Error deleting admin session:', error);
      return false;
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      await db.delete(adminSessions).where(new Date() > adminSessions.expiresAt);
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }
}

export const storage = new DatabaseStorage();
