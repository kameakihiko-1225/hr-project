import { Company } from "./company";
import { Position } from "./position";

export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt?: string;
  
  // Relations
  company?: Company;
  positions?: Position[];
} 