import { PrismaClient } from '../../../generated/prisma/index.js';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const linkDirectSchema = z.object({
  candidateId: z.string().uuid(),
  positionId: z.string().uuid()
});

const linkGuidedStartSchema = z.object({
  candidateId: z.string().uuid()
});

/**
 * Link a candidate to a position directly (when position ID is provided)
 */
export const linkCandidateToPosition = async (req, res) => {
  try {
    // Validate request body
    const validation = linkDirectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }

    const { candidateId, positionId } = validation.data;

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Verify position exists
    const position = await prisma.position.findUnique({
      where: { id: positionId },
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

    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Position not found'
      });
    }

    // Update candidate with the position
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: { positionId },
      include: {
        position: true
      }
    });

    // Get company and department info for the response
    const departmentInfo = position.departments?.[0]?.department;
    const companyInfo = departmentInfo?.company;

    return res.status(200).json({
      success: true,
      data: {
        candidate: updatedCandidate,
        position: {
          id: position.id,
          title: position.title
        },
        department: departmentInfo ? {
          id: departmentInfo.id,
          name: departmentInfo.name
        } : null,
        company: companyInfo ? {
          id: companyInfo.id,
          name: companyInfo.name
        } : null
      },
      message: 'Candidate successfully linked to position'
    });
  } catch (error) {
    console.error('Error linking candidate to position:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while linking candidate to position'
    });
  }
};

/**
 * Get all companies for the guided selection process (step 1)
 */
export const getCompanies = async (req, res) => {
  try {
    // Validate candidate exists first
    const { candidateId } = req.params;
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Get all active companies
    const companies = await prisma.company.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        logo: true,
        industry: true
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching companies'
    });
  }
};

/**
 * Get departments for a specific company (step 2)
 */
export const getDepartments = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Get departments for this company
    const departments = await prisma.department.findMany({
      where: { 
        companyId,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: departments,
      company: {
        id: company.id,
        name: company.name
      }
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching departments'
    });
  }
};

/**
 * Get positions for a specific department (step 3)
 */
export const getPositions = async (req, res) => {
  try {
    const { departmentId } = req.params;
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        error: 'Department ID is required'
      });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        company: true
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Get positions for this department
    const positions = await prisma.position.findMany({
      where: {
        departments: {
          some: {
            departmentId
          }
        },
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        salaryRange: true,
        employmentType: true
      },
      orderBy: { title: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: positions,
      department: {
        id: department.id,
        name: department.name
      },
      company: {
        id: department.company.id,
        name: department.company.name
      }
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching positions'
    });
  }
}; 