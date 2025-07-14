import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Define required fields for each entity type
const REQUIRED_FIELDS = {
  company: [
    { field: 'name', label: 'Company Name', type: 'text' },
    { field: 'email', label: 'Email Address', type: 'email' },
    { field: 'phone', label: 'Phone Number', type: 'tel' },
    { field: 'city', label: 'City', type: 'text' },
    { field: 'country', label: 'Country', type: 'text' },
    { field: 'description', label: 'Description', type: 'textarea' }
  ],
  department: [
    { field: 'name', label: 'Department Name', type: 'text' },
    { field: 'description', label: 'Description', type: 'textarea' }
  ],
  position: [
    { field: 'title', label: 'Position Title', type: 'text' },
    { field: 'description', label: 'Job Description', type: 'textarea' },
    { field: 'salaryRange', label: 'Salary Range', type: 'text' },
    { field: 'employmentType', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] },
    { field: 'location', label: 'Location', type: 'text' },
    { field: 'qualifications', label: 'Required Qualifications', type: 'textarea' },
    { field: 'responsibilities', label: 'Key Responsibilities', type: 'textarea' }
  ]
};

/**
 * Apply inheritance to entity data
 * @param {string} entityType - Type of entity ('company', 'department', 'position')
 * @param {Object} entity - Entity data
 * @returns {Object} - Entity with inherited fields
 */
export const applyInheritance = (entityType, entity) => {
  if (entityType !== 'position') {
    return entity;
  }
  
  // Apply inheritance for positions
  const inheritedEntity = { ...entity };
  
  // Get company data through department relationship
  const department = entity.departments?.[0]?.department;
  const company = department?.company;
  
  if (company) {
    // Inherit location if missing
    if (!inheritedEntity.location && (company.city || company.country)) {
      if (company.city && company.country) {
        inheritedEntity.location = `${company.city}, ${company.country}`;
      } else if (company.city) {
        inheritedEntity.location = company.city;
      } else if (company.country) {
        inheritedEntity.location = company.country;
      }
    }
    
    // Inherit city if missing
    if (!inheritedEntity.city && company.city) {
      inheritedEntity.city = company.city;
    }
    
    // Inherit country if missing
    if (!inheritedEntity.country && company.country) {
      inheritedEntity.country = company.country;
    }
  }
  
  return inheritedEntity;
};

/**
 * Check if entity is complete based on required fields (considering inheritance)
 * @param {string} entityType - Type of entity ('company', 'department', 'position')
 * @param {Object} entity - Entity data
 * @returns {Object} - Validation result with completeness status and missing fields
 */
export const validateEntityCompleteness = (entityType, entity) => {
  const requiredFields = REQUIRED_FIELDS[entityType] || [];
  
  // Apply inheritance before validation
  const entityWithInheritance = applyInheritance(entityType, entity);
  
  const missingFields = [];
  const presentFields = [];
  
  requiredFields.forEach(field => {
    const value = entityWithInheritance[field.field];
    
    if (value === null || value === undefined || value === '') {
      missingFields.push(field);
    } else {
      presentFields.push(field);
    }
  });
  
  const isComplete = missingFields.length === 0;
  const completionPercentage = Math.round((presentFields.length / requiredFields.length) * 100);
  
  return {
    isComplete,
    completionPercentage,
    totalFields: requiredFields.length,
    presentFields: presentFields.length,
    missingFields: missingFields.length,
    missingFieldsList: missingFields,
    presentFieldsList: presentFields,
    // Include inherited data for reference
    entityWithInheritance: entityWithInheritance
  };
};

/**
 * Get entity by ID with validation (considering inheritance)
 * @param {string} entityType - Type of entity ('company', 'department', 'position')
 * @param {string} entityId - ID of the entity
 * @returns {Object} - Entity data with validation results
 */
export const getEntityWithValidation = async (entityType, entityId) => {
  let entity;
  
  try {
    switch (entityType) {
      case 'company':
        entity = await prisma.company.findUnique({
          where: { id: entityId },
          include: {
            departments: {
              include: {
                positions: {
                  include: {
                    position: true
                  }
                }
              }
            }
          }
        });
        break;
      case 'department':
        entity = await prisma.department.findUnique({
          where: { id: entityId },
          include: {
            company: true,
            positions: {
              include: {
                position: true
              }
            }
          }
        });
        break;
      case 'position':
        entity = await prisma.position.findUnique({
          where: { id: entityId },
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
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    const validation = validateEntityCompleteness(entityType, entity);
    
    return {
      ...entity,
      validation
    };
  } catch (error) {
    console.error(`Error getting ${entityType} with validation:`, error);
    throw error;
  }
};

/**
 * Update entity with missing fields (with inheritance support)
 * @param {string} entityType - Type of entity ('company', 'department', 'position')
 * @param {string} entityId - ID of the entity
 * @param {Object} updateData - Data to update
 * @returns {Object} - Updated entity with validation results
 */
export const updateEntityFields = async (entityType, entityId, updateData) => {
  let updatedEntity;
  
  try {
    // Clean the update data to remove empty strings and null values
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== null && updateData[key] !== undefined && updateData[key] !== '') {
        cleanUpdateData[key] = updateData[key];
      }
    });

    switch (entityType) {
      case 'company':
        updatedEntity = await prisma.company.update({
          where: { id: entityId },
          data: cleanUpdateData
        });
        break;
      case 'department':
        updatedEntity = await prisma.department.update({
          where: { id: entityId },
          data: cleanUpdateData
        });
        break;
      case 'position':
        // For positions, we need to get the current data with relationships first
        const currentPosition = await prisma.position.findUnique({
          where: { id: entityId },
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
        
        // Apply inheritance if fields are still missing after update
        const department = currentPosition?.departments[0]?.department;
        if (department?.company) {
          const company = department.company;
          
          // Inherit location if missing and not provided in update
          if (!currentPosition.location && !cleanUpdateData.location && (company.city || company.country)) {
            if (company.city && company.country) {
              cleanUpdateData.location = `${company.city}, ${company.country}`;
            } else if (company.city) {
              cleanUpdateData.location = company.city;
            } else if (company.country) {
              cleanUpdateData.location = company.country;
            }
          }
          
          // Inherit city if missing and not provided in update
          if (!currentPosition.city && !cleanUpdateData.city && company.city) {
            cleanUpdateData.city = company.city;
          }
          
          // Inherit country if missing and not provided in update
          if (!currentPosition.country && !cleanUpdateData.country && company.country) {
            cleanUpdateData.country = company.country;
          }
        }
        
        updatedEntity = await prisma.position.update({
          where: { id: entityId },
          data: cleanUpdateData
        });
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Get the updated entity with relationships for validation
    const entityWithValidation = await getEntityWithValidation(entityType, entityId);
    
    return entityWithValidation;
  } catch (error) {
    console.error(`Error updating ${entityType}:`, error);
    throw error;
  }
};

/**
 * Validate entities for SMS campaign (considering inheritance)
 * @param {Object} entities - Object containing arrays of companies, departments, and positions
 * @returns {Object} - Validation result with incomplete entities
 */
export const validateCampaignEntities = async (entities) => {
  const { companies = [], departments = [], positions = [] } = entities;
  
  const incompleteEntities = {
    companies: [],
    departments: [],
    positions: []
  };
  
  let hasIncompleteEntities = false;
  
  // Validate companies
  for (const companyId of companies) {
    try {
      const company = await getEntityWithValidation('company', companyId);
      if (!company.validation.isComplete) {
        incompleteEntities.companies.push(company);
        hasIncompleteEntities = true;
      }
    } catch (error) {
      console.error(`Error validating company ${companyId}:`, error);
    }
  }
  
  // Validate departments
  for (const departmentId of departments) {
    try {
      const department = await getEntityWithValidation('department', departmentId);
      if (!department.validation.isComplete) {
        incompleteEntities.departments.push(department);
        hasIncompleteEntities = true;
      }
    } catch (error) {
      console.error(`Error validating department ${departmentId}:`, error);
    }
  }
  
  // Validate positions (with inheritance)
  for (const positionId of positions) {
    try {
      const position = await getEntityWithValidation('position', positionId);
      if (!position.validation.isComplete) {
        incompleteEntities.positions.push(position);
        hasIncompleteEntities = true;
      }
    } catch (error) {
      console.error(`Error validating position ${positionId}:`, error);
    }
  }
  
  return {
    hasIncompleteEntities,
    entities: incompleteEntities
  };
};

/**
 * Get required fields configuration for an entity type
 * @param {string} entityType - Type of entity ('company', 'department', 'position')
 * @returns {Array} - Array of required field configurations
 */
export const getRequiredFieldsConfig = (entityType) => {
  return REQUIRED_FIELDS[entityType] || [];
};

export default {
  validateEntityCompleteness,
  getEntityWithValidation,
  updateEntityFields,
  validateCampaignEntities,
  getRequiredFieldsConfig,
  applyInheritance
}; 