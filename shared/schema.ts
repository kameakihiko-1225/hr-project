import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  color: text("color"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  country: text("country"),
  adminId: text("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  companyId: integer("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  salaryRange: text("salary_range"),
  employmentType: text("employment_type"),
  expectedStartDate: text("expected_start_date"),
  languageRequirements: text("language_requirements"),
  qualifications: text("qualifications"),
  responsibilities: text("responsibilities"),
  departmentId: integer("departmentid").notNull(),
  applyLink: text("applyLink"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  positionId: text("position_id"),
  status: text("status").default("applied"),
  cvUrl: text("cv_url"),
  telegramId: text("telegram_id"),
  telegramUsername: text("telegram_username"),
  salaryExpectation: text("salary_expectation"),
  workType: text("work_type"),
  country: text("country"),
  region: text("region"),
  englishLevel: text("english_level"),
  preferredLanguage: text("preferred_language"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'teamwork' | 'culture' | 'workspace' | 'events'
  imageUrl: text("image_url").notNull(),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fileAttachments = pgTable("file_attachments", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'company', 'gallery_item', etc.
  entityId: text("entity_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filepath: text("filepath").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const industryTags = pgTable("industry_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertIndustryTagSchema = createInsertSchema(industryTags).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

export type InsertFileAttachment = z.infer<typeof insertFileAttachmentSchema>;
export type FileAttachment = typeof fileAttachments.$inferSelect;

export type InsertIndustryTag = z.infer<typeof insertIndustryTagSchema>;
export type IndustryTag = typeof industryTags.$inferSelect;
