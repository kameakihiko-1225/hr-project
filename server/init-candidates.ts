import { storage } from "./storage";
import type { InsertCandidate } from "@shared/schema";

// Sample candidates data
const sampleCandidates: InsertCandidate[] = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+998901234567",
    positionId: 1,
    status: "applied",
    resume: "Experienced software developer with 5+ years in full-stack development",
    coverLetter: "I am excited to apply for this position..."
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+998901234568",
    positionId: 1,
    status: "interviewed",
    resume: "Senior developer with expertise in React and Node.js",
    coverLetter: "Looking forward to contributing to your team..."
  },
  {
    name: "Ali Rahman",
    email: "ali.rahman@example.com",
    phone: "+998901234569",
    positionId: 2,
    status: "applied",
    resume: "Marketing professional with 3+ years experience",
    coverLetter: "Passionate about digital marketing and growth..."
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+998901234570",
    positionId: 2,
    status: "hired",
    resume: "Product manager with strong analytical skills",
    coverLetter: "Excited to lead product development initiatives..."
  },
  {
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "+998901234571",
    positionId: 3,
    status: "applied",
    resume: "UI/UX designer with 4+ years experience",
    coverLetter: "Passionate about creating user-centered designs..."
  }
];

export async function initializeCandidates() {
  try {
    console.log("Initializing sample candidates...");
    
    // Check if candidates already exist
    const existingCandidates = await storage.getAllCandidates();
    if (existingCandidates.length > 0) {
      console.log("Candidates already exist, skipping initialization.");
      return;
    }
    
    // Add sample candidates
    for (const candidateData of sampleCandidates) {
      try {
        await storage.createCandidate(candidateData);
        console.log(`Created candidate: ${candidateData.name}`);
      } catch (error) {
        console.error(`Failed to create candidate ${candidateData.name}:`, error);
      }
    }
    
    console.log("Sample candidates initialized successfully!");
  } catch (error) {
    console.error("Error initializing candidates:", error);
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  initializeCandidates();
}