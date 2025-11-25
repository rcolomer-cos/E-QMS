import { Response } from 'express';
import WorkRoleModel, { WorkRole, WorkRoleFilters, WorkRoleSortOptions } from '../models/WorkRoleModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new work role
 */
export const createWorkRole = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if work role name already exists
    const nameExists = await WorkRoleModel.nameExists(req.body.name);
    if (nameExists) {
      res.status(409).json({ error: 'A work role with this name already exists' });
      return;
    }

    const workRole: WorkRole = {
      ...req.body,
      createdBy: req.user.id,
    };

    const createdWorkRole = await WorkRoleModel.create(workRole);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'WorkRole',
      entityId: createdWorkRole.id!,
      entityIdentifier: createdWorkRole.name,
      newValues: createdWorkRole,
    });

    res.status(201).json({
      message: 'Work role created successfully',
      workRole: createdWorkRole,
    });
  } catch (error) {
    console.error('Create work role error:', error);
    res.status(500).json({ error: 'Failed to create work role' });
  }
};

/**
 * Get all work roles with filtering and sorting
 */
export const getWorkRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      category,
      level,
      departmentId,
      active,
      searchTerm,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
    } = req.query;

    // Validate sort options
    const validSortFields = ['name', 'code', 'category', 'level', 'displayOrder', 'createdAt'];
    if (sortBy && !validSortFields.includes(sortBy as string)) {
      res.status(400).json({
        error: `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}`,
      });
      return;
    }

    const validSortOrders = ['ASC', 'DESC'];
    if (sortOrder && !validSortOrders.includes(sortOrder as string)) {
      res.status(400).json({
        error: 'Invalid sortOrder parameter. Must be ASC or DESC',
      });
      return;
    }

    // Build filters
    const filters: WorkRoleFilters = {};
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    if (level) filters.level = level as string;
    if (departmentId) filters.departmentId = parseInt(departmentId as string, 10);
    if (active !== undefined) filters.active = active === 'true';
    if (searchTerm) filters.searchTerm = searchTerm as string;

    // Sort options
    const sortOptions: WorkRoleSortOptions = {
      sortBy: sortBy as 'name' | 'code' | 'category' | 'level' | 'displayOrder' | 'createdAt',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };

    const workRoles = await WorkRoleModel.getAll(filters, sortOptions);

    res.json({
      workRoles,
      total: workRoles.length,
    });
  } catch (error) {
    console.error('Get work roles error:', error);
    res.status(500).json({ error: 'Failed to retrieve work roles' });
  }
};

/**
 * Get work role by ID
 */
export const getWorkRoleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workRole = await WorkRoleModel.getById(parseInt(id, 10));

    if (!workRole) {
      res.status(404).json({ error: 'Work role not found' });
      return;
    }

    res.json({ workRole });
  } catch (error) {
    console.error('Get work role by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve work role' });
  }
};

/**
 * Update a work role
 */
export const updateWorkRole = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const workRoleId = parseInt(id, 10);

    // Check if work role exists
    const existingWorkRole = await WorkRoleModel.getById(workRoleId);
    if (!existingWorkRole) {
      res.status(404).json({ error: 'Work role not found' });
      return;
    }

    // Check if name is being updated and if it conflicts with another work role
    if (req.body.name && req.body.name !== existingWorkRole.name) {
      const nameExists = await WorkRoleModel.nameExists(req.body.name, workRoleId);
      if (nameExists) {
        res.status(409).json({ error: 'A work role with this name already exists' });
        return;
      }
    }

    const updateData: Partial<WorkRole> = {
      ...req.body,
      updatedBy: req.user.id,
    };

    const updatedWorkRole = await WorkRoleModel.update(workRoleId, updateData);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'WorkRole',
      entityId: workRoleId,
      entityIdentifier: updatedWorkRole.name,
      oldValues: existingWorkRole,
      newValues: updatedWorkRole,
    });

    res.json({
      message: 'Work role updated successfully',
      workRole: updatedWorkRole,
    });
  } catch (error) {
    console.error('Update work role error:', error);
    res.status(500).json({ error: 'Failed to update work role' });
  }
};

/**
 * Delete a work role (soft delete)
 */
export const deleteWorkRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const workRoleId = parseInt(id, 10);

    // Check if work role exists
    const existingWorkRole = await WorkRoleModel.getById(workRoleId);
    if (!existingWorkRole) {
      res.status(404).json({ error: 'Work role not found' });
      return;
    }

    await WorkRoleModel.delete(workRoleId, req.user.id);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'WorkRole',
      entityId: workRoleId,
      entityIdentifier: existingWorkRole.name,
      oldValues: existingWorkRole,
    });

    res.json({ message: 'Work role deleted successfully' });
  } catch (error) {
    console.error('Delete work role error:', error);
    res.status(500).json({ error: 'Failed to delete work role' });
  }
};

/**
 * Get unique categories
 */
export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await WorkRoleModel.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
};

/**
 * Get unique levels
 */
export const getLevels = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const levels = await WorkRoleModel.getLevels();
    res.json({ levels });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ error: 'Failed to retrieve levels' });
  }
};

/**
 * Get work roles by department
 */
export const getWorkRolesByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const workRoles = await WorkRoleModel.getByDepartment(parseInt(departmentId, 10));

    res.json({
      workRoles,
      total: workRoles.length,
    });
  } catch (error) {
    console.error('Get work roles by department error:', error);
    res.status(500).json({ error: 'Failed to retrieve work roles for department' });
  }
};

/**
 * Get work roles statistics
 */
export const getStatistics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await WorkRoleModel.getStatistics();
    res.json({ statistics });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
};
