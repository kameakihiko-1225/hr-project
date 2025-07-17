import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ru', 'uz'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Localized content interface
export interface LocalizedContent {
  en?: string;
  ru?: string;
  uz?: string;
}

// Helper function to get localized content with fallback
export function getLocalizedContent(content: LocalizedContent | string | null, language: SupportedLanguage = 'en'): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  // Try requested language first
  if (content[language]) return content[language];
  
  // Fallback order: en -> ru -> uz -> first available
  for (const fallbackLang of ['en', 'ru', 'uz'] as const) {
    if (content[fallbackLang]) return content[fallbackLang];
  }
  
  return '';
}



export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: json("name").$type<LocalizedContent>().notNull(), // Localized company name
  description: json("description").$type<LocalizedContent>(), // Localized description
  logoUrl: text("logo_url"),
  color: text("color"),
  address: json("address").$type<LocalizedContent>(), // Localized address
  phone: text("phone"),
  email: text("email"),
  city: json("city").$type<LocalizedContent>(), // Localized city
  country: json("country").$type<LocalizedContent>(), // Localized country
  adminId: text("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: json("name").$type<LocalizedContent>().notNull(), // Localized department name
  description: json("description").$type<LocalizedContent>(), // Localized description
  companyId: integer("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: json("title").$type<LocalizedContent>().notNull(), // Localized position title
  description: json("description").$type<LocalizedContent>(), // Localized description
  location: json("location").$type<LocalizedContent>(), // Localized location
  city: json("city").$type<LocalizedContent>(), // Localized city
  country: json("country").$type<LocalizedContent>(), // Localized country
  salaryRange: json("salary_range").$type<LocalizedContent>(), // Localized salary range
  employmentType: json("employment_type").$type<LocalizedContent>(), // Localized employment type
  expectedStartDate: text("expected_start_date"),
  languageRequirements: json("language_requirements").$type<LocalizedContent>(), // Localized language requirements
  qualifications: json("qualifications").$type<LocalizedContent>(), // Localized qualifications
  responsibilities: json("responsibilities").$type<LocalizedContent>(), // Localized responsibilities
  departmentId: integer("departmentid").notNull(),
  applyLink: json("apply_link").$type<LocalizedContent>(), // Localized apply links for different languages
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
  title: json("title").$type<LocalizedContent>().notNull(), // Localized blog title
  description: json("description").$type<LocalizedContent>().notNull(), // Localized blog description
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
  name: json("name").$type<LocalizedContent>().notNull(), // Localized industry tag name
  description: json("description").$type<LocalizedContent>(), // Localized description
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for many-to-many relationship between companies and industry tags
export const companyIndustryTags = pgTable("company_industry_tags", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  industryTagId: integer("industry_tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table to track position clicks for analytics
export const positionClicks = pgTable("position_clicks", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  clickType: text("click_type").notNull(), // 'view' or 'apply'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Validation schemas for localized content
const localizedContentSchema = z.object({
  en: z.string().optional(),
  ru: z.string().optional(),
  uz: z.string().optional(),
}).refine(
  (data) => data.en || data.ru || data.uz,
  { message: "At least one language must be provided" }
);

// Optional localized content schema that allows completely empty objects
const optionalLocalizedContentSchema = z.object({
  en: z.string().optional(),
  ru: z.string().optional(),
  uz: z.string().optional(),
}).optional().refine(
  (data) => {
    // Allow undefined or null
    if (!data) return true;
    
    // Allow empty object
    if (Object.keys(data).length === 0) return true;
    
    // Check if all values are empty strings or undefined
    const hasEmptyValues = Object.values(data).every(val => !val || val.trim() === '');
    if (hasEmptyValues) return true;
    
    // If there are actual values, at least one language must be provided
    return data.en || data.ru || data.uz;
  },
  { message: "At least one language must be provided when apply link is specified" }
);

// Insert schemas with localization support

export const insertCompanySchema = z.object({
  name: localizedContentSchema,
  description: localizedContentSchema.optional(),
  logoUrl: z.string().optional(),
  color: z.string().optional(),
  address: localizedContentSchema.optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  city: localizedContentSchema.optional(),
  country: localizedContentSchema.optional(),
  adminId: z.string().optional(),
});

export const insertDepartmentSchema = z.object({
  name: localizedContentSchema,
  description: localizedContentSchema.optional(),
  companyId: z.number(),
});

export const insertPositionSchema = z.object({
  title: localizedContentSchema,
  description: localizedContentSchema.optional(),
  location: localizedContentSchema.optional(),
  city: localizedContentSchema.optional(),
  country: localizedContentSchema.optional(),
  salaryRange: localizedContentSchema.optional(),
  employmentType: localizedContentSchema.optional(), // LocalizedContent to match database
  expectedStartDate: z.string().optional(),
  languageRequirements: localizedContentSchema.optional(),
  qualifications: localizedContentSchema.optional(),
  responsibilities: localizedContentSchema.optional(),
  departmentId: z.number(),
  applyLink: optionalLocalizedContentSchema, // Allow completely empty apply links
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryItemSchema = z.object({
  title: localizedContentSchema,
  description: localizedContentSchema,
  category: z.string(),
  imageUrl: z.string(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertIndustryTagSchema = z.object({
  name: localizedContentSchema,
  description: localizedContentSchema.optional(),
});

export const insertCompanyIndustryTagSchema = createInsertSchema(companyIndustryTags).omit({
  id: true,
  createdAt: true,
});

export const insertPositionClickSchema = createInsertSchema(positionClicks).omit({
  id: true,
  createdAt: true,
});

// Types

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

export type InsertCompanyIndustryTag = z.infer<typeof insertCompanyIndustryTagSchema>;
export type CompanyIndustryTag = typeof companyIndustryTags.$inferSelect;

export type InsertPositionClick = z.infer<typeof insertPositionClickSchema>;
export type PositionClick = typeof positionClicks.$inferSelect;
