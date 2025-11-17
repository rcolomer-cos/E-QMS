import { Response } from 'express';
import {
  RoleTrainingRequirementsModel,
  RoleTrainingRequirement,
} from '../models/RoleTrainingRequirementsModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createRequirement = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const requirement: RoleTrainingRequirement = {
      ...req.body,
      createdBy: req.user.id,
    };

    const requirementId = await RoleTrainingRequirementsModel.create(requirement);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'RoleTrainingRequirement',
      entityId: requirementId,
      entityIdentifier: `Role ${requirement.roleId} - Competency ${requirement.competencyId}`,
      newValues: requirement,
    });

    res.status(201).json({
      message: 'Role training requirement created successfully',
      id: requirementId,
    });
  } catch (error: any) {
    console.error('Create Role Training Requirement error:', error);
    
    // Handle unique constraint violation
    if (error.number === 2627 || error.number === 2601) {
      res.status(409).json({ 
        error: 'This competency is already required for this role' 
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to create role training requirement' });
  }
};

export const getRequirements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      roleId,
      competencyId,
      status,
      isMandatory,
      isRegulatory,
      priority,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
      return;
    }

    const filters = {
      roleId: roleId ? parseInt(roleId as string, 10) : undefined,
      competencyId: competencyId ? parseInt(competencyId as string, 10) : undefined,
      status: status as string | undefined,
      isMandatory: isMandatory === 'true' ? true : isMandatory === 'false' ? false : undefined,
      isRegulatory: isRegulatory === 'true' ? true : isRegulatory === 'false' ? false : undefined,
      priority: priority as string | undefined,
    };

    const allRequirements = await RoleTrainingRequirementsModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRequirements = allRequirements.slice(startIndex, endIndex);

    res.json({
      data: paginatedRequirements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allRequirements.length,
        pages: Math.ceil(allRequirements.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Role Training Requirements error:', error);
    res.status(500).json({ error: 'Failed to get role training requirements' });
  }
};

export const getRequirementById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const requirement = await RoleTrainingRequirementsModel.findById(parseInt(id, 10));
    if (!requirement) {
      res.status(404).json({ error: 'Role training requirement not found' });
      return;
    }

    res.json(requirement);
  } catch (error) {
    console.error('Get Role Training Requirement error:', error);
    res.status(500).json({ error: 'Failed to get role training requirement' });
  }
};

export const getRequiredCompetenciesForRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { includeInactive } = req.query;

    const requirements = await RoleTrainingRequirementsModel.getRequiredCompetenciesForRole(
      parseInt(roleId, 10),
      includeInactive === 'true'
    );

    res.json({
      data: requirements,
      total: requirements.length,
    });
  } catch (error) {
    console.error('Get Required Competencies for Role error:', error);
    res.status(500).json({ error: 'Failed to get required competencies for role' });
  }
};

export const getMissingCompetenciesForUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { daysThreshold = '30' } = req.query;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Users can only view their own missing competencies unless they're admin/manager
    const requestedUserId = parseInt(userId, 10);
    if (
      requestedUserId !== req.user.id &&
      !req.user.roles.includes('admin') &&
      !req.user.roles.includes('manager') &&
      !req.user.roles.includes('superuser')
    ) {
      res.status(403).json({ error: 'Forbidden: Cannot view other users missing competencies' });
      return;
    }

    const missingCompetencies = await RoleTrainingRequirementsModel.getMissingCompetenciesForUser(
      requestedUserId,
      parseInt(daysThreshold as string, 10)
    );

    res.json({
      data: missingCompetencies,
      total: missingCompetencies.length,
    });
  } catch (error) {
    console.error('Get Missing Competencies for User error:', error);
    res.status(500).json({ error: 'Failed to get missing competencies for user' });
  }
};

export const getUsersWithMissingCompetencies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roleId, competencyId, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
      return;
    }

    const allUsers = await RoleTrainingRequirementsModel.getUsersWithMissingCompetencies(
      roleId ? parseInt(roleId as string, 10) : undefined,
      competencyId ? parseInt(competencyId as string, 10) : undefined
    );

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
    console.error('Get Users with Missing Competencies error:', error);
    res.status(500).json({ error: 'Failed to get users with missing competencies' });
  }
};

export const updateRequirement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if requirement exists
    const requirement = await RoleTrainingRequirementsModel.findById(parseInt(id, 10));
    if (!requirement) {
      res.status(404).json({ error: 'Role training requirement not found' });
      return;
    }

    await RoleTrainingRequirementsModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'RoleTrainingRequirement',
      entityId: parseInt(id, 10),
      entityIdentifier: `Role ${requirement.roleId} - Competency ${requirement.competencyId}`,
      oldValues: requirement,
      newValues: updates,
    });

    res.json({ message: 'Role training requirement updated successfully' });
  } catch (error) {
    console.error('Update Role Training Requirement error:', error);
    res.status(500).json({ error: 'Failed to update role training requirement' });
  }
};

export const deleteRequirement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if requirement exists
    const requirement = await RoleTrainingRequirementsModel.findById(parseInt(id, 10));
    if (!requirement) {
      res.status(404).json({ error: 'Role training requirement not found' });
      return;
    }

    await RoleTrainingRequirementsModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.TRAINING,
      entityType: 'RoleTrainingRequirement',
      entityId: parseInt(id, 10),
      entityIdentifier: `Role ${requirement.roleId} - Competency ${requirement.competencyId}`,
      oldValues: requirement,
    });

    res.json({ message: 'Role training requirement deleted successfully' });
  } catch (error) {
    console.error('Delete Role Training Requirement error:', error);
    res.status(500).json({ error: 'Failed to delete role training requirement' });
  }
};
