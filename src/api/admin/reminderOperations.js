/**
 * Admin Operations for Reminder System
 * Provides administrative control and monitoring for automated reminders
 */

import reminderService from '../bots/reminderService.js';
import reminderScheduler from '../bots/reminderScheduler.js';
import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Get reminder system status and statistics
 */
export const getReminderStatus = async (req, res) => {
  try {
    // Get scheduler status
    const schedulerStatus = reminderScheduler.getSchedulerStatus();
    
    // Get inactive candidates count
    const inactiveCandidates = await reminderService.getInactiveCandidates();
    
    // Get recent message queue stats
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const messageStats = await prisma.messageQueue.groupBy({
      by: ['type', 'sent'],
      where: {
        scheduledFor: {
          gte: last24Hours
        }
      },
      _count: {
        id: true
      }
    });

    // Get candidate status distribution
    const candidateStats = await prisma.candidate.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    return res.json({
      success: true,
      data: {
        scheduler: schedulerStatus,
        inactiveCandidatesCount: inactiveCandidates.length,
        last24Hours: {
          messageStats,
          candidateStats
        },
        intervals: reminderService.REMINDER_INTERVALS,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting reminder status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get reminder status'
    });
  }
};

/**
 * Manually trigger reminder processing
 */
export const triggerReminders = async (req, res) => {
  try {
    console.log('📞 Manual reminder processing triggered by admin');
    
    const result = await reminderScheduler.triggerReminderProcessing();
    
    return res.json({
      success: true,
      message: 'Reminder processing completed',
      data: result
    });

  } catch (error) {
    console.error('Error triggering reminders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger reminder processing'
    });
  }
};

/**
 * Get detailed list of inactive candidates
 */
export const getInactiveCandidates = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const inactiveCandidates = await reminderService.getInactiveCandidates();
    
    // Add reminder interval calculation for each candidate
    const candidatesWithReminders = inactiveCandidates.map(candidate => {
      const reminderInterval = reminderService.calculateReminderInterval(candidate.lastActivity);
      return {
        ...candidate,
        reminderDue: reminderInterval,
        hoursInactive: ((new Date() - candidate.lastActivity) / (1000 * 60 * 60)).toFixed(1)
      };
    });

    // Apply pagination
    const paginatedCandidates = candidatesWithReminders
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return res.json({
      success: true,
      data: {
        candidates: paginatedCandidates,
        total: candidatesWithReminders.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < candidatesWithReminders.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting inactive candidates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get inactive candidates'
    });
  }
};

/**
 * Send a custom reminder to a specific candidate
 */
export const sendCustomReminder = async (req, res) => {
  try {
    const { candidateId, message, type = 'custom_admin' } = req.body;

    if (!candidateId || !message) {
      return res.status(400).json({
        success: false,
        error: 'candidateId and message are required'
      });
    }

    // Get candidate info
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        bot: true
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Schedule the custom message
    const scheduledMessage = await prisma.messageQueue.create({
      data: {
        candidateId: candidate.id,
        message: message,
        type: type,
        scheduledFor: new Date(), // Send immediately
        sent: false
      }
    });

    // Process the message immediately
    await reminderService.processPendingReminders();

    return res.json({
      success: true,
      message: 'Custom reminder sent',
      data: {
        messageId: scheduledMessage.id,
        candidateName: candidate.fullName || candidate.telegramUsername,
        message: message
      }
    });

  } catch (error) {
    console.error('Error sending custom reminder:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send custom reminder'
    });
  }
};

/**
 * Get message queue history
 */
export const getMessageHistory = async (req, res) => {
  try {
    const { 
      candidateId, 
      type, 
      sent, 
      limit = 100, 
      offset = 0,
      fromDate,
      toDate 
    } = req.query;

    const whereClause = {};
    
    if (candidateId) whereClause.candidateId = candidateId;
    if (type) whereClause.type = type;
    if (sent !== undefined) whereClause.sent = sent === 'true';
    
    if (fromDate || toDate) {
      whereClause.scheduledFor = {};
      if (fromDate) whereClause.scheduledFor.gte = new Date(fromDate);
      if (toDate) whereClause.scheduledFor.lte = new Date(toDate);
    }

    const messages = await prisma.messageQueue.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            telegramUsername: true,
            status: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.messageQueue.count({
      where: whereClause
    });

    return res.json({
      success: true,
      data: {
        messages,
        total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Error getting message history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get message history'
    });
  }
};

/**
 * Update candidate activity (manual override)
 */
export const updateCandidateActivity = async (req, res) => {
  try {
    const { candidateId, status } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId is required'
      });
    }

    // Get candidate to get telegramId
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Update activity
    const updatedCandidate = await reminderService.updateCandidateActivity(
      candidate.telegramId, 
      status
    );

    return res.json({
      success: true,
      message: 'Candidate activity updated',
      data: {
        candidateId: updatedCandidate.id,
        status: updatedCandidate.status,
        lastActivity: updatedCandidate.lastActivity
      }
    });

  } catch (error) {
    console.error('Error updating candidate activity:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update candidate activity'
    });
  }
};

export default {
  getReminderStatus,
  triggerReminders,
  getInactiveCandidates,
  sendCustomReminder,
  getMessageHistory,
  updateCandidateActivity
}; 