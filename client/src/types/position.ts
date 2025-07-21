import { Department } from "./department";
import { LocalizedContent } from "@shared/schema";

export interface Position {
  id: string;
  title: string | LocalizedContent;
  description?: string | LocalizedContent;
  location?: string | LocalizedContent;
  city?: string | LocalizedContent;
  country?: string | LocalizedContent;
  salaryRange?: string | LocalizedContent;
  employmentType?: string | LocalizedContent;
  expectedStartDate?: string;
  languageRequirements?: string | LocalizedContent;
  qualifications?: string | LocalizedContent;
  responsibilities?: string | LocalizedContent;
  createdAt?: string;
  departmentId?: string;
  applyLink?: string | LocalizedContent;
  
  // Relations
  department?: Department;
  departments?: { department: Department }[];

  // Optional direct relation when fetched with company
  company?: import("./company").Company;
} 