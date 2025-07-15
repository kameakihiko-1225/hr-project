import { db } from "./db";
import { industryTags } from "@shared/schema";

const defaultIndustryTags = [
  { name: "Technology", description: "Software, hardware, and IT services" },
  { name: "Healthcare", description: "Medical services, pharmaceuticals, and health tech" },
  { name: "Finance", description: "Banking, insurance, and financial services" },
  { name: "Education", description: "Schools, universities, and educational services" },
  { name: "Manufacturing", description: "Production and industrial operations" },
  { name: "Retail", description: "Consumer goods and retail services" },
  { name: "Hospitality", description: "Hotels, restaurants, and travel services" },
  { name: "Transportation", description: "Logistics, shipping, and transportation" },
  { name: "Energy", description: "Oil, gas, renewable energy, and utilities" },
  { name: "Media", description: "Publishing, broadcasting, and entertainment" },
  { name: "Private University", description: "Private higher education institutions" },
  { name: "Consulting", description: "Business and professional consulting services" },
  { name: "Construction", description: "Building and construction services" },
  { name: "Agriculture", description: "Farming, food production, and agriculture tech" },
  { name: "Government", description: "Public sector and government services" }
];

export async function initializeIndustryTags() {
  try {
    console.log('[INFO] [init-industry-tags] Starting industry tags initialization');
    
    // Check if industry tags already exist
    const existingTags = await db.select().from(industryTags);
    
    if (existingTags.length > 0) {
      console.log('[INFO] [init-industry-tags] Industry tags already exist, skipping initialization');
      return;
    }
    
    // Insert default industry tags
    await db.insert(industryTags).values(defaultIndustryTags);
    
    console.log(`[INFO] [init-industry-tags] Successfully initialized ${defaultIndustryTags.length} industry tags`);
  } catch (error) {
    console.error('[ERROR] [init-industry-tags] Failed to initialize industry tags:', error);
    throw error;
  }
}