export interface IndustryTag {
  id: string;
  name: string;
}

export interface Company {
  id: string;
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
  createdAt?: string;
  
  // Industry tags
  industries?: IndustryTag[];
  
  // Additional fields for UI that may not be in the database
  industry?: string; // Legacy field for backward compatibility
  location?: string;
} 