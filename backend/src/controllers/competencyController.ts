import { Response } from 'express';
import { CompetencyModel, Competency, UserCompetency } from '../models/CompetencyModel';
import { AuthRequest, CompetencyStatus } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, AuditActionCategory } from '../services/auditLogService';

export const createCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const competency: Competency = {
      ...req.body,
      createdBy: req.user.id,
    };

    const competencyId = await CompetencyModel.create(competency);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'Competency',
      entityId: competencyId,
      entityIdentifier: competency.competencyCode,
      newValues: competency,
    });

    res.status(201).json({
      message: 'Competency created successfully',
      id: competencyId,
    });
  } catch (error) {
    console.error('Create Competency error:', error);
    res.status(500).json({ error: 'Failed to create Competency' });
  }
};

export const getCompetencies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, isMandatory, isRegulatory, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' 
      });
      return;
    }

    const filters = {
      status: status as CompetencyStatus | undefined,
      category: category as string | undefined,
      isMandatory: isMandatory === 'true' ? true : isMandatory === 'false' ? false : undefined,
      isRegulatory: isRegulatory === 'true' ? true : isRegulatory === 'false' ? false : undefined,
    };

    const allCompetencies = await CompetencyModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCompetencies = allCompetencies.slice(startIndex, endIndex);

    res.json({
      data: paginatedCompetencies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allCompetencies.length,
        pages: Math.ceil(allCompetencies.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Competencies error:', error);
    res.status(500).json({ error: 'Failed to get Competencies' });
  }
};

export const getCompetencyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const competency = await CompetencyModel.findById(parseInt(id, 10));
    if (!competency) {
      res.status(404).json({ error: 'Competency not found' });
      return;
    }

    res.json(competency);
  } catch (error) {
    console.error('Get Competency error:', error);
    res.status(500).json({ error: 'Failed to get Competency' });
  }
};

export const updateCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if Competency exists
    const competency = await CompetencyModel.findById(parseInt(id, 10));
    if (!competency) {
      res.status(404).json({ error: 'Competency not found' });
      return;
    }

    await CompetencyModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'Competency',
      entityId: parseInt(id, 10),
      entityIdentifier: competency.competencyCode,
      oldValues: competency,
      newValues: updates,
    });

    res.json({ message: 'Competency updated successfully' });
  } catch (error) {
    console.error('Update Competency error:', error);
    res.status(500).json({ error: 'Failed to update Competency' });
  }
};

export const assignCompetencyToUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userCompetency: UserCompetency = {
      ...req.body,
      createdBy: req.user.id,
    };

    // Auto-calculate expiry date if not provided and competency has default validity
    if (!userCompetency.expiryDate && userCompetency.competencyId) {
      const competency = await CompetencyModel.findById(userCompetency.competencyId);
      if (competency && competency.hasExpiry && competency.defaultValidityMonths) {
        const effectiveDate = userCompetency.effectiveDate || new Date();
        const expiryDate = new Date(effectiveDate);
        expiryDate.setMonth(expiryDate.getMonth() + competency.defaultValidityMonths);
        userCompetency.expiryDate = expiryDate;
        
        // Also set next renewal date if renewal is required
        if (competency.renewalRequired) {
          userCompetency.nextRenewalDate = expiryDate;
        }
      }
    }

    const userCompetencyId = await CompetencyModel.assignToUser(userCompetency);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'UserCompetency',
      entityId: userCompetencyId,
      entityIdentifier: `User ${userCompetency.userId} - Competency ${userCompetency.competencyId}`,
      newValues: userCompetency,
    });

    res.status(201).json({
      message: 'Competency assigned to user successfully',
      id: userCompetencyId,
    });
  } catch (error) {
    console.error('Assign Competency error:', error);
    res.status(500).json({ error: 'Failed to assign Competency to user' });
  }
};

export const getUserCompetencies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status, isExpired, page = '1', limit = '50' } = req.query;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Users can only view their own competencies unless they're admin/manager
    const requestedUserId = parseInt(userId, 10);
    if (
      requestedUserId !== req.user.id &&
      !req.user.roles.includes('admin') &&
      !req.user.roles.includes('manager')
    ) {
      res.status(403).json({ error: 'Forbidden: Cannot view other users competencies' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' 
      });
      return;
    }

    const filters = {
      status: status as string | undefined,
      isExpired: isExpired === 'true' ? true : isExpired === 'false' ? false : undefined,
    };

    const allCompetencies = await CompetencyModel.getUserCompetencies(requestedUserId, filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCompetencies = allCompetencies.slice(startIndex, endIndex);

    res.json({
      data: paginatedCompetencies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allCompetencies.length,
        pages: Math.ceil(allCompetencies.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get User Competencies error:', error);
    res.status(500).json({ error: 'Failed to get user competencies' });
  }
};

export const getUsersByCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { competencyId } = req.params;
    const { status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' 
      });
      return;
    }

    const filters = {
      status: status as string | undefined,
    };

    const allUsers = await CompetencyModel.getUsersByCompetency(parseInt(competencyId, 10), filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    res.json({
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Users by Competency error:', error);
    res.status(500).json({ error: 'Failed to get users by competency' });
  }
};

export const updateUserCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // For status changes, track who changed it and when
    if (updates.status) {
      updates.statusChangedBy = req.user?.id;
      updates.statusChangedAt = new Date();
    }

    await CompetencyModel.updateUserCompetency(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'UserCompetency',
      entityId: parseInt(id, 10),
      entityIdentifier: `UserCompetency ${id}`,
      oldValues: {}, // Could fetch the old record if needed
      newValues: updates,
    });

    res.json({ message: 'User competency updated successfully' });
  } catch (error) {
    console.error('Update User Competency error:', error);
    res.status(500).json({ error: 'Failed to update user competency' });
  }
};

export const getExpiringCompetencies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { daysThreshold = '30' } = req.query;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Users can only view their own expiring competencies unless they're admin/manager
    const requestedUserId = parseInt(userId, 10);
    if (
      requestedUserId !== req.user.id &&
      !req.user.roles.includes('admin') &&
      !req.user.roles.includes('manager')
    ) {
      res.status(403).json({ error: 'Forbidden: Cannot view other users competencies' });
      return;
    }

    const expiringCompetencies = await CompetencyModel.getExpiringCompetencies(
      requestedUserId,
      parseInt(daysThreshold as string, 10)
    );

    res.json({
      data: expiringCompetencies,
      total: expiringCompetencies.length,
    });
  } catch (error) {
    console.error('Get Expiring Competencies error:', error);
    res.status(500).json({ error: 'Failed to get expiring competencies' });
  }
};

export const getTrainingMatrix = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roleId, departmentId, competencyCategory } = req.query;

    const filters = {
      roleId: roleId ? parseInt(roleId as string, 10) : undefined,
      departmentId: departmentId ? parseInt(departmentId as string, 10) : undefined,
      competencyCategory: competencyCategory as string | undefined,
    };

    const matrixData = await CompetencyModel.getTrainingMatrix(filters);

    res.json({
      data: matrixData,
      total: matrixData.length,
    });
  } catch (error) {
    console.error('Get Training Matrix error:', error);
    res.status(500).json({ error: 'Failed to get training matrix' });
  }
};
