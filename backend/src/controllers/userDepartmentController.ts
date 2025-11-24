import { Response } from 'express';
import { UserDepartmentModel, CreateUserDepartmentData } from '../models/UserDepartmentModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Get all user-department assignments
 */
export const getAllUserDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await UserDepartmentModel.findAll();
    res.json(assignments);
  } catch (error) {
    console.error('Get all user-department assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch user-department assignments' });
  }
};

/**
 * Get assignments for a specific user
 */
export const getUserDepartmentsByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const assignments = await UserDepartmentModel.findByUserId(parseInt(userId, 10));
    res.json(assignments);
  } catch (error) {
    console.error('Get user departments by user ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user departments' });
  }
};

/**
 * Get assignments for a specific department
 */
export const getUserDepartmentsByDepartmentId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const assignments = await UserDepartmentModel.findByDepartmentId(parseInt(departmentId, 10));
    res.json(assignments);
  } catch (error) {
    console.error('Get user departments by department ID error:', error);
    res.status(500).json({ error: 'Failed to fetch department users' });
  }
};

/**
 * Get assignment by ID
 */
export const getUserDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await UserDepartmentModel.findById(parseInt(id, 10));

    if (!assignment) {
      res.status(404).json({ error: 'User-department assignment not found' });
      return;
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get user-department assignment by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user-department assignment' });
  }
};

/**
 * Create a new user-department assignment (manager/admin/superuser only)
 */
export const createUserDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { userId, departmentId, isPrimary } = req.body;

    // Check if assignment already exists
    const exists = await UserDepartmentModel.assignmentExists(userId, departmentId);
    if (exists) {
      res.status(409).json({ error: 'User is already assigned to this department' });
      return;
    }

    // If setting as primary, clear other primary flags
    if (isPrimary) {
      await UserDepartmentModel.clearPrimaryForUser(userId);
    }

    // Create assignment
    const assignmentData: CreateUserDepartmentData = {
      userId,
      departmentId,
      isPrimary: isPrimary || false,
      assignedBy: req.user.id,
    };

    const assignmentId = await UserDepartmentModel.create(assignmentData);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'UserDepartment',
      entityId: assignmentId,
      entityIdentifier: `User ${userId} - Department ${departmentId}`,
      newValues: assignmentData,
    });

    res.status(201).json({
      message: 'User-department assignment created successfully',
      assignmentId,
    });
  } catch (error) {
    console.error('Create user-department assignment error:', error);
    res.status(500).json({ error: 'Failed to create user-department assignment' });
  }
};

/**
 * Update user-department assignment (manager/admin/superuser only)
 */
export const updateUserDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const assignmentId = parseInt(id, 10);
    const { isPrimary } = req.body;

    const assignment = await UserDepartmentModel.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'User-department assignment not found' });
      return;
    }

    // If setting as primary, clear other primary flags for this user
    if (isPrimary && !assignment.isPrimary) {
      await UserDepartmentModel.clearPrimaryForUser(assignment.userId);
    }

    const updates = {
      isPrimary,
    };
    await UserDepartmentModel.update(assignmentId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'UserDepartment',
      entityId: assignmentId,
      entityIdentifier: `User ${assignment.userId} - Department ${assignment.departmentId}`,
      oldValues: assignment,
      newValues: updates,
    });

    res.json({ message: 'User-department assignment updated successfully' });
  } catch (error) {
    console.error('Update user-department assignment error:', error);
    res.status(500).json({ error: 'Failed to update user-department assignment' });
  }
};

/**
 * Delete user-department assignment (manager/admin/superuser only)
 */
export const deleteUserDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const assignmentId = parseInt(id, 10);

    const assignment = await UserDepartmentModel.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'User-department assignment not found' });
      return;
    }

    await UserDepartmentModel.delete(assignmentId);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'UserDepartment',
      entityId: assignmentId,
      entityIdentifier: `User ${assignment.userId} - Department ${assignment.departmentId}`,
      oldValues: assignment,
    });

    res.json({ message: 'User-department assignment deleted successfully' });
  } catch (error) {
    console.error('Delete user-department assignment error:', error);
    res.status(500).json({ error: 'Failed to delete user-department assignment' });
  }
};

/**
 * Set a user-department assignment as primary
 */
export const setPrimaryDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignmentId = parseInt(id, 10);

    const assignment = await UserDepartmentModel.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'User-department assignment not found' });
      return;
    }

    await UserDepartmentModel.setPrimary(assignmentId, assignment.userId);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'UserDepartment',
      entityId: assignmentId,
      entityIdentifier: `User ${assignment.userId} - Department ${assignment.departmentId}`,
      oldValues: { isPrimary: assignment.isPrimary },
      newValues: { isPrimary: true },
    });

    res.json({ message: 'Primary department set successfully' });
  } catch (error) {
    console.error('Set primary department error:', error);
    res.status(500).json({ error: 'Failed to set primary department' });
  }
};
