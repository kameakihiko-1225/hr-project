import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { users, companies, departments, positions } from "@shared/schema";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_TVDxarv9Nn3Q@ep-raspy-mode-a85brbk6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

async function initializeDatabase() {
  try {
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);

    console.log("Creating database tables...");

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;
    console.log("✓ Users table created");

    // Create companies table
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        logo_url TEXT,
        color TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        city TEXT,
        country TEXT,
        admin_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✓ Companies table created");

    // Create departments table
    await sql`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        company_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✓ Departments table created");

    // Create positions table
    await sql`
      CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        city TEXT,
        country TEXT,
        salary_range TEXT,
        employment_type TEXT,
        expected_start_date TEXT,
        language_requirements TEXT,
        qualifications TEXT,
        responsibilities TEXT,
        department_id INTEGER NOT NULL,
        apply_link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("✓ Positions table created");

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };