#!/usr/bin/env node

/**
 * Entity Inheritance Updater Script
 * 
 * This script implements hierarchical data inheritance:
 * - Positions inherit location data from Departments and Companies
 * - Departments inherit location data from Companies
 * - Automatic inheritance for future entity creation/updates
 */

import { PrismaClient } from '../generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Inheritance mapping configuration
const INHERITANCE_CONFIG = {
  // Position inherits from Department and Company
  position: {
    fromDepartment: {
      // Currently no direct inheritance from department
    },
    fromCompany: {
      location: (company) => {
        if (company.city && company.country) {
          return `${company.city}, ${company.country}`;
        } else if (company.city) {
          return company.city;
        } else if (company.country) {
          return company.country;
        }
        return null;
      },
      city: 'city',
      country: 'country'
    }
  },
  
  // Department inherits from Company
  department: {
    fromCompany: {
      // Currently departments don't need location inheritance
      // but this structure allows for future expansion
    }
  }
};

/**
 * Get company data for a position through department relationship
 */
async function getCompanyForPosition(positionId) {
  const departmentPosition = await prisma.departmentPosition.findFirst({
    where: { positionId },
    include: {
      department: {
        include: {
          company: true
        }
      }
    }
  });
  
  return departmentPosition?.department?.company || null;
}

/**
 * Update a single position with inherited data
 */
async function updatePositionWithInheritance(position) {
  const company = await getCompanyForPosition(position.id);
  if (!company) {
    console.log(`⚠️  Position "${position.title}" (${position.id}) has no associated company`);
    return false;
  }

  const updates = {};
  let hasUpdates = false;

  // Inherit location if missing
  if (!position.location && (company.city || company.country)) {
    const inheritedLocation = INHERITANCE_CONFIG.position.fromCompany.location(company);
    if (inheritedLocation) {
      updates.location = inheritedLocation;
      hasUpdates = true;
    }
  }

  // Inherit city if missing
  if (!position.city && company.city) {
    updates.city = company.city;
    hasUpdates = true;
  }

  // Inherit country if missing
  if (!position.country && company.country) {
    updates.country = company.country;
    hasUpdates = true;
  }

  if (hasUpdates) {
    try {
      await prisma.position.update({
        where: { id: position.id },
        data: updates
      });
      
      console.log(`✅ Updated position "${position.title}":`, updates);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update position "${position.title}":`, error.message);
      return false;
    }
  } else {
    console.log(`📋 Position "${position.title}" already has complete location data`);
    return false;
  }
}

/**
 * Update all positions with inherited data
 */
async function updateAllPositions() {
  console.log('🚀 Starting position inheritance updates...\n');
  
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      title: true,
      location: true,
      city: true,
      country: true
    }
  });

  console.log(`📊 Found ${positions.length} positions to check\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const position of positions) {
    const wasUpdated = await updatePositionWithInheritance(position);
    if (wasUpdated) {
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount} positions`);
  console.log(`   ⏭️  Skipped: ${skippedCount} positions`);
  console.log(`   📊 Total: ${positions.length} positions`);
}

/**
 * Validate inheritance results
 */
async function validateInheritance() {
  console.log('\n🔍 Validating inheritance results...\n');

  const incompletePositions = await prisma.position.findMany({
    where: {
      OR: [
        { location: null },
        { city: null },
        { country: null }
      ]
    },
    include: {
      departments: {
        include: {
          department: {
            include: {
              company: true
            }
          }
        }
      }
    }
  });

  console.log(`📋 Positions still missing location data: ${incompletePositions.length}`);

  for (const position of incompletePositions) {
    const company = position.departments[0]?.department?.company;
    console.log(`   • "${position.title}" - Missing:`, {
      location: !position.location,
      city: !position.city,
      country: !position.country
    }, company ? `(Company: ${company.name})` : '(No company)');
  }
}

/**
 * Create inheritance service functions for API integration
 */
async function createInheritanceService() {
  const serviceCode = `/**
 * Entity Inheritance Service
 * Automatically inherit missing fields from parent entities
 */

import { PrismaClient } from '../../generated/prisma/index.js';
const prisma = new PrismaClient();

/**
 * Apply inheritance to a position
 */
export const applyPositionInheritance = async (positionData, departmentId) => {
  // Get company data through department
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { company: true }
  });

  if (!department?.company) {
    return positionData;
  }

  const company = department.company;
  const inheritedData = { ...positionData };

  // Inherit location if missing
  if (!inheritedData.location && (company.city || company.country)) {
    if (company.city && company.country) {
      inheritedData.location = \`\${company.city}, \${company.country}\`;
    } else if (company.city) {
      inheritedData.location = company.city;
    } else if (company.country) {
      inheritedData.location = company.country;
    }
  }

  // Inherit city if missing
  if (!inheritedData.city && company.city) {
    inheritedData.city = company.city;
  }

  // Inherit country if missing
  if (!inheritedData.country && company.country) {
    inheritedData.country = company.country;
  }

  return inheritedData;
};

/**
 * Apply inheritance to a department
 */
export const applyDepartmentInheritance = async (departmentData, companyId) => {
  // Get company data
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    return departmentData;
  }

  const inheritedData = { ...departmentData };

  // Future: Add department inheritance logic here if needed
  
  return inheritedData;
};

/**
 * Update existing entity with inheritance
 */
export const updateEntityWithInheritance = async (entityType, entityId) => {
  switch (entityType) {
    case 'position':
      const position = await prisma.position.findUnique({
        where: { id: entityId },
        include: {
          departments: {
            include: {
              department: {
                include: { company: true }
              }
            }
          }
        }
      });

      if (position && position.departments[0]) {
        const departmentId = position.departments[0].departmentId;
        const inheritedData = await applyPositionInheritance(position, departmentId);
        
        await prisma.position.update({
          where: { id: entityId },
          data: {
            location: inheritedData.location,
            city: inheritedData.city,
            country: inheritedData.country
          }
        });
      }
      break;

    case 'department':
      const department = await prisma.department.findUnique({
        where: { id: entityId },
        include: { company: true }
      });

      if (department) {
        const inheritedData = await applyDepartmentInheritance(department, department.companyId);
        
        await prisma.department.update({
          where: { id: entityId },
          data: inheritedData
        });
      }
      break;
  }
};
`;

  return serviceCode;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🌟 Entity Inheritance Updater\n');
    console.log('This script will update existing entities with inherited data from parent entities.\n');

    // Update all positions
    await updateAllPositions();

    // Validate results
    await validateInheritance();

    // Create inheritance service file
    const serviceCode = await createInheritanceService();
    
    const serviceDir = path.join(__dirname, '../src/api/inheritance');
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(serviceDir, 'inheritanceService.js'),
      serviceCode
    );
    
    console.log('\n📝 Created inheritance service at src/api/inheritance/inheritanceService.js');
    console.log('\n🎉 Entity inheritance update completed successfully!');

  } catch (error) {
    console.error('❌ Error during inheritance update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

export {
  updatePositionWithInheritance,
  updateAllPositions,
  validateInheritance,
  getCompanyForPosition
}; 