/**
 * Entity Inheritance Service
 * Automatically inherit missing fields from parent entities
 */

import { PrismaClient } from '../../../generated/prisma/index.js';
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
      inheritedData.location = `${company.city}, ${company.country}`;
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
