import { Department } from "./department";

export interface Position {
  id: string;
  title: string;
  description?: string;
  location?: string;
  city?: string;
  country?: string;
  salaryRange?: string;
  employmentType?: string;
  expectedStartDate?: string;
  languageRequirements?: string;
  qualifications?: string;
  responsibilities?: string;
  createdAt?: string;
  departmentId?: string;
  applyLink?: string;
  
  // Relations
  department?: Department;
  departments?: { department: Department }[];

  // Optional direct relation when fetched with company
  company?: import("./company").Company;
} 