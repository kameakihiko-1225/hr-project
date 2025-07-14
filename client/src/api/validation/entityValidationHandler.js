import entityValidationService from './entityValidationService.js';

/**
 * Validate a single entity
 * GET /api/validation/entity/:type/:id
 */
export const validateEntity = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (!['company', 'department', 'position'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type. Must be company, department, or position'
      });
    }

    const entityWithValidation = await entityValidationService.getEntityWithValidation(type, id);
    
    return res.status(200).json({
      success: true,
      data: entityWithValidation
    });
  } catch (error) {
    console.error('Validate entity error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while validating the entity'
    });
  }
};

/**
 * Update entity fields
 * PUT /api/validation/entity/:type/:id
 */
export const updateEntityFields = async (req, res) => {
  try {
    const { type, id } = req.params;
    const updateData = req.body;
    
    if (!['company', 'department', 'position'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type. Must be company, department, or position'
      });
    }

    const updatedEntity = await entityValidationService.updateEntityFields(type, id, updateData);
    
    return res.status(200).json({
      success: true,
      data: updatedEntity
    });
  } catch (error) {
    console.error('Update entity fields error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while updating the entity'
    });
  }
};

/**
 * Validate campaign entities
 * POST /api/validation/campaign-entities
 */
export const validateCampaignEntities = async (req, res) => {
  try {
    const campaignData = req.body;
    
    const validationResults = await entityValidationService.validateCampaignEntities(campaignData);
    
    return res.status(200).json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Validate campaign entities error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while validating campaign entities'
    });
  }
};

/**
 * Get required fields configuration for an entity type
 * GET /api/validation/required-fields/:type
 */
export const getRequiredFieldsConfig = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['company', 'department', 'position'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type. Must be company, department, or position'
      });
    }

    const requiredFields = entityValidationService.getRequiredFieldsConfig(type);
    
    return res.status(200).json({
      success: true,
      data: requiredFields
    });
  } catch (error) {
    console.error('Get required fields config error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while getting required fields configuration'
    });
  }
};

export default {
  validateEntity,
  updateEntityFields,
  validateCampaignEntities,
  getRequiredFieldsConfig
}; 