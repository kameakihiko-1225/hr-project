// API endpoints for manual CRM operations and testing
import { PrismaClient } from '../../../generated/prisma/index.js';
import bitrixService from '../bots/bitrixService.js';

const prisma = new PrismaClient();

// Test Bitrix24 connection
export const testBitrixConnection = async (req, res) => {
  try {
    const result = await bitrixService.testBitrixConnection();
    
    return res.json({
      success: result.success,
      message: result.message,
      error: result.error,
      timestamp: result.timestamp,
      config: bitrixService.validateBitrixConfig()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date()
    });
  }
};

// Create deal for specific candidate
export const createDealForCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        position: true,
        bot: {
          include: {
            company: true
          }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Create deal in Bitrix24
    const deal = await bitrixService.createCandidateDeal(candidateId);

    return res.json({
      success: true,
      message: 'Deal created successfully',
      deal: deal,
      candidate: {
        id: candidate.id,
        name: candidate.fullName,
        email: candidate.email,
        status: candidate.status
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update deal stage manually
export const updateDealStage = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { stage, timestamp } = req.body;
    
    if (!candidateId || !stage) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID and stage are required'
      });
    }

    const stageTimestamp = timestamp ? new Date(timestamp) : new Date();
    
    const updatedDeal = await bitrixService.updateDealStage(candidateId, stage, stageTimestamp);

    return res.json({
      success: true,
      message: `Deal stage updated to ${stage}`,
      deal: updatedDeal
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add note to deal
export const addDealNote = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { note, noteType } = req.body;
    
    if (!candidateId || !note) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID and note are required'
      });
    }

    const result = await bitrixService.addDealNote(candidateId, note, noteType || 'manual');

    return res.json({
      success: true,
      message: 'Note added successfully',
      activityId: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get CRM statistics
export const getCrmStatistics = async (req, res) => {
  try {
    const { companyId } = req.query;
    
    const stats = await bitrixService.getCrmStatistics(companyId || null);

    return res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get deal information
export const getDealInfo = async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }

    const dealInfo = await bitrixService.getDealInfo(candidateId);

    if (!dealInfo) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found for this candidate'
      });
    }

    return res.json({
      success: true,
      deal: dealInfo
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Sync candidate lifecycle manually
export const syncCandidateLifecycle = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { event, metadata } = req.body;
    
    if (!candidateId || !event) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID and event are required'
      });
    }

    await bitrixService.syncCandidateLifecycle(candidateId, event, metadata || {});

    return res.json({
      success: true,
      message: `Lifecycle event '${event}' synced successfully`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk sync candidates to Bitrix24
export const bulkSyncCandidates = async (req, res) => {
  try {
    const { companyId, status } = req.query;
    
    // Build filter conditions
    const whereClause = {};
    if (companyId) {
      whereClause.bot = {
        companyId: companyId
      };
    }
    if (status) {
      whereClause.status = status;
    }

    // Get candidates without CRM deals
    const candidates = await prisma.candidate.findMany({
      where: {
        ...whereClause,
        crmDeals: {
          none: {}
        }
      },
      include: {
        position: true,
        bot: {
          include: {
            company: true
          }
        }
      },
      take: 50 // Limit to 50 candidates per request
    });

    const results = {
      total: candidates.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each candidate
    for (const candidate of candidates) {
      try {
        await bitrixService.createCandidateDeal(candidate.id);
        results.success++;
        
        // Small delay to avoid overwhelming Bitrix24 API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          candidateId: candidate.id,
          name: candidate.fullName,
          error: error.message
        });
      }
    }

    return res.json({
      success: true,
      message: `Bulk sync completed: ${results.success} successful, ${results.failed} failed`,
      results: results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get CRM dashboard data
export const getCrmDashboard = async (req, res) => {
  try {
    const { companyId } = req.query;
    
    // Get statistics
    const stats = await bitrixService.getCrmStatistics(companyId || null);
    
    // Get recent deals
    const whereClause = companyId ? {
      candidate: {
        bot: {
          companyId: companyId
        }
      }
    } : {};

    const recentDeals = await prisma.crmDeal.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
            lastActivity: true,
            position: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      },
      take: 20
    });

    // Get stage distribution
    const stageDistribution = await prisma.crmDeal.groupBy({
      by: ['stage'],
      where: whereClause,
      _count: {
        stage: true
      }
    });

    return res.json({
      success: true,
      dashboard: {
        statistics: stats,
        recentDeals: recentDeals,
        stageDistribution: stageDistribution.reduce((acc, item) => {
          acc[item.stage] = item._count.stage;
          return acc;
        }, {}),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  testBitrixConnection,
  createDealForCandidate,
  updateDealStage,
  addDealNote,
  getCrmStatistics,
  getDealInfo,
  syncCandidateLifecycle,
  bulkSyncCandidates,
  getCrmDashboard
}; 