import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import dotenv from "dotenv";
import { 
  users, companies, departments, positions, candidates, galleryItems,
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Department, type InsertDepartment,
  type Position, type InsertPosition,
  type Candidate, type InsertCandidate,
  type GalleryItem, type InsertGalleryItem
} from "@shared/schema";

// Load environment variables
dotenv.config();

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_TVDxarv9Nn3Q@ep-raspy-mode-a85brbk6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company methods
  getAllCompanies(): Promise<Company[]>;
  getCompanyById(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Department methods
  getAllDepartments(companyId?: number): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Position methods
  getAllPositions(departmentId?: number): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;

  // Candidate methods
  getAllCandidates(positionId?: string): Promise<Candidate[]>;
  getCandidateById(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: string): Promise<boolean>;

  // Gallery item methods
  getAllGalleryItems(category?: string): Promise<GalleryItem[]>;
  getGalleryItemById(id: number): Promise<GalleryItem | undefined>;
  createGalleryItem(galleryItem: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: number, galleryItem: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Company methods
  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
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

  // Department methods
  async getAllDepartments(companyId?: number): Promise<Department[]> {
    if (companyId) {
      return await db.select().from(departments).where(eq(departments.companyId, companyId));
    }
    return await db.select().from(departments);
  }

  async getDepartmentById(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
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
  async getAllPositions(departmentId?: number): Promise<Position[]> {
    try {
      if (departmentId) {
        return await db.select().from(positions).where(eq(positions.departmentId, departmentId));
      }
      return await db.select().from(positions);
    } catch (error) {
      console.error('Database error in getAllPositions:', error);
      // Return empty array if there's a database error
      return [];
    }
  }

  async getPositionById(id: number): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id));
    return result[0];
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
      ...candidate,
      id: candidate.id || `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
  async getAllGalleryItems(category?: string): Promise<GalleryItem[]> {
    try {
      if (category) {
        return await db.select().from(galleryItems)
          .where(and(eq(galleryItems.isActive, true), eq(galleryItems.category, category)))
          .orderBy(galleryItems.sortOrder, galleryItems.createdAt);
      } else {
        return await db.select().from(galleryItems)
          .where(eq(galleryItems.isActive, true))
          .orderBy(galleryItems.sortOrder, galleryItems.createdAt);
      }
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      return [];
    }
  }

  async getGalleryItemById(id: number): Promise<GalleryItem | undefined> {
    try {
      const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
      return item || undefined;
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
}

export const storage = new DatabaseStorage();
