import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;

async function initializeSampleData() {
  try {
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);

    console.log("Creating sample data...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("password", 10);
    await sql`
      INSERT INTO users (username, password) 
      VALUES ('admin@example.com', ${hashedPassword})
      ON CONFLICT (username) DO NOTHING;
    `;
    console.log("✓ Admin user created");

    // Create sample companies
    const companies = [
      {
        name: "Millat Umidi University",
        description: "Leading educational institution in Uzbekistan",
        city: "Tashkent",
        country: "Uzbekistan",
        address: "Tashkent, Uzbekistan",
        phone: "+998 71 123 4567",
        email: "info@millatumidi.uz"
      },
      {
        name: "Initech Software",
        description: "Technology solutions provider",
        city: "Austin",
        country: "USA",
        address: "Austin, Texas, USA",
        phone: "+1 512 555 0123",
        email: "info@initech.com"
      },
      {
        name: "Global Consulting Group",
        description: "International business consulting firm",
        city: "London",
        country: "UK",
        address: "London, United Kingdom",
        phone: "+44 20 7123 4567",
        email: "contact@globalconsulting.com"
      },
      {
        name: "TechStart Innovation",
        description: "Startup accelerator and venture capital",
        city: "Singapore",
        country: "Singapore",
        address: "Singapore",
        phone: "+65 6123 4567",
        email: "hello@techstart.sg"
      }
    ];

    const companyIds = [];
    for (const company of companies) {
      const result = await sql`
        INSERT INTO companies (name, description, city, country, address, phone, email)
        VALUES (${company.name}, ${company.description}, ${company.city}, ${company.country}, ${company.address}, ${company.phone}, ${company.email})
        RETURNING id;
      `;
      companyIds.push(result[0]?.id);
    }
    console.log("✓ Sample companies created");

    // Create sample departments
    const departments = [
      { name: "Academic Affairs", description: "Educational programs and curriculum", companyId: companyIds[0] },
      { name: "Information Technology", description: "IT infrastructure and digital services", companyId: companyIds[0] },
      { name: "Engineering", description: "Software development and engineering", companyId: companyIds[1] },
      { name: "Product Management", description: "Product strategy and development", companyId: companyIds[1] },
      { name: "Business Consulting", description: "Strategic business advisory", companyId: companyIds[2] },
      { name: "Digital Transformation", description: "Technology transformation services", companyId: companyIds[2] },
      { name: "Investment", description: "Venture capital and funding", companyId: companyIds[3] },
      { name: "Startup Acceleration", description: "Startup mentoring and support", companyId: companyIds[3] }
    ];

    const departmentIds = [];
    for (const dept of departments) {
      if (dept.companyId) {
        const result = await sql`
          INSERT INTO departments (name, description, company_id)
          VALUES (${dept.name}, ${dept.description}, ${dept.companyId})
          RETURNING id;
        `;
        departmentIds.push(result[0]?.id);
      }
    }
    console.log("✓ Sample departments created");

    // Create sample positions
    const positions = [
      {
        title: "Software Engineer",
        description: "Develop and maintain software applications",
        location: "Austin, USA",
        city: "Austin",
        country: "USA",
        salaryRange: "$80,000 - $120,000",
        employmentType: "Full-time",
        departmentId: departmentIds[2] // Engineering at Initech
      },
      {
        title: "Product Manager",
        description: "Lead product development initiatives",
        location: "Austin, USA", 
        city: "Austin",
        country: "USA",
        salaryRange: "$90,000 - $140,000",
        employmentType: "Full-time",
        departmentId: departmentIds[3] // Product Management at Initech
      },
      {
        title: "Business Analyst",
        description: "Analyze business processes and requirements",
        location: "London, UK",
        city: "London", 
        country: "UK",
        salaryRange: "£50,000 - £70,000",
        employmentType: "Full-time",
        departmentId: departmentIds[4] // Business Consulting
      },
      {
        title: "IT Support Specialist",
        description: "Provide technical support and maintenance",
        location: "Tashkent, Uzbekistan",
        city: "Tashkent",
        country: "Uzbekistan", 
        salaryRange: "$25,000 - $35,000",
        employmentType: "Full-time",
        departmentId: departmentIds[1] // IT at Millat Umidi
      },
      {
        title: "Investment Analyst",
        description: "Analyze investment opportunities and market trends",
        location: "Singapore",
        city: "Singapore",
        country: "Singapore",
        salaryRange: "S$70,000 - S$95,000", 
        employmentType: "Full-time",
        departmentId: departmentIds[6] // Investment at TechStart
      }
    ];

    for (const position of positions) {
      if (position.departmentId) {
        await sql`
          INSERT INTO positions (title, description, location, city, country, salary_range, employment_type, departmentid)
          VALUES (${position.title}, ${position.description}, ${position.location}, ${position.city}, ${position.country}, ${position.salaryRange}, ${position.employmentType}, ${position.departmentId});
        `;
      }
    }
    console.log("✓ Sample positions created");

    console.log("Sample data initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing sample data:", error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSampleData();
}

export { initializeSampleData };