import { Response } from 'express';
import { AuthRequest } from '../types';
import { UserWorkRoleModel, UserWorkRole, UserWorkRoleFilters } from '../models/UserWorkRoleModel';

/**
 * Assign a work role to a user
 */
export const assignWorkRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      userId,
      workRoleId,
      skillLevelId,
      assignedDate,
      effectiveDate,
      expiryDate,
      status,
      verified,
      verifiedBy,
      verifiedAt,
      verificationNotes,
      notes,
      trainingRequired,
      trainingCompleted,
      trainingCompletedDate,
      certificationRequired,
      certificationId,
      lastAssessmentDate,
      lastAssessmentScore,
      lastAssessedBy,
      nextAssessmentDate,
    } = req.body;

    const assignedBy = req.user!.id;

    const data: UserWorkRole = {
      userId,
      workRoleId,
      skillLevelId: skillLevelId || null,
      assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      status: status || 'active',
      verified: verified || false,
      verifiedBy: verifiedBy || undefined,
      verifiedAt: verifiedAt ? new Date(verifiedAt) : undefined,
      verificationNotes: verificationNotes || undefined,
      notes: notes || undefined,
      trainingRequired: trainingRequired || false,
      trainingCompleted: trainingCompleted || false,
      trainingCompletedDate: trainingCompletedDate ? new Date(trainingCompletedDate) : undefined,
      certificationRequired: certificationRequired || false,
      certificationId: certificationId || undefined,
      lastAssessmentDate: lastAssessmentDate ? new Date(lastAssessmentDate) : undefined,
      lastAssessmentScore: lastAssessmentScore || undefined,
      lastAssessedBy: lastAssessedBy || undefined,
      nextAssessmentDate: nextAssessmentDate ? new Date(nextAssessmentDate) : undefined,
      assignedBy,
      active: true,
    };

    const id = await UserWorkRoleModel.assignWorkRole(data);

    res.status(201).json({
      message: 'Work role assigned to user successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error assigning work role:', error);
    
    if (error.message && error.message.includes('UQ_UserWorkRoles_User_WorkRole')) {
      res.status(400).json({ 
        message: 'This user already has this work role assigned',
        error: 'Duplicate assignment'
      });
    } else {
      res.status(500).json({ 
        message: 'Error assigning work role to user',
        error: error.message 
      });
    }
  }
};

/**
 * Get all work roles assigned to a specific user
 */
export const getUserWorkRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    // Check if user can view this data
    const currentUserId = req.user!.id;
    const userRoles = req.user!.roles || [];
    const canViewAll = userRoles.some(role => 
      ['superuser', 'admin', 'manager'].includes(role.toLowerCase())
    );

    if (!canViewAll && currentUserId !== userId) {
      res.status(403).json({ message: 'You can only view your own work role assignments' });
      return;
    }

    const filters: UserWorkRoleFilters = {};
    
    if (req.query.workRoleId) {
      filters.workRoleId = parseInt(req.query.workRoleId as string);
    }
    if (req.query.skillLevelId) {
      filters.skillLevelId = parseInt(req.query.skillLevelId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.verified !== undefined) {
      filters.verified = req.query.verified === 'true';
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    if (req.query.expiringWithinDays) {
      filters.expiringWithinDays = parseInt(req.query.expiringWithinDays as string);
    }

    const workRoles = await UserWorkRoleModel.getUserWorkRoles(userId, filters);

    res.json(workRoles);
  } catch (error: any) {
    console.error('Error getting user work roles:', error);
    res.status(500).json({ 
      message: 'Error retrieving user work roles',
      error: error.message 
    });
  }
};

/**
 * Get all users assigned to a specific work role
 */
export const getWorkRoleUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workRoleId = parseInt(req.params.workRoleId);
    
    if (isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid work role ID' });
      return;
    }

    const filters: UserWorkRoleFilters = {};
    
    if (req.query.skillLevelId) {
      filters.skillLevelId = parseInt(req.query.skillLevelId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.verified !== undefined) {
      filters.verified = req.query.verified === 'true';
    }
    if (req.query.departmentId) {
      filters.departmentId = parseInt(req.query.departmentId as string);
    }

    const users = await UserWorkRoleModel.getWorkRoleUsers(workRoleId, filters);

    res.json(users);
  } catch (error: any) {
    console.error('Error getting work role users:', error);
    res.status(500).json({ 
      message: 'Error retrieving users for work role',
      error: error.message 
    });
  }
};

/**
 * Get all user work role assignments with filters
 */
export const getAllAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: UserWorkRoleFilters = {};
    
    if (req.query.userId) {
      filters.userId = parseInt(req.query.userId as string);
    }
    if (req.query.workRoleId) {
      filters.workRoleId = parseInt(req.query.workRoleId as string);
    }
    if (req.query.skillLevelId) {
      filters.skillLevelId = parseInt(req.query.skillLevelId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.verified !== undefined) {
      filters.verified = req.query.verified === 'true';
    }
    if (req.query.departmentId) {
      filters.departmentId = parseInt(req.query.departmentId as string);
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    if (req.query.expiringWithinDays) {
      filters.expiringWithinDays = parseInt(req.query.expiringWithinDays as string);
    }
    if (req.query.assessmentDueWithinDays) {
      filters.assessmentDueWithinDays = parseInt(req.query.assessmentDueWithinDays as string);
    }
    if (req.query.trainingRequired !== undefined) {
      filters.trainingRequired = req.query.trainingRequired === 'true';
    }
    if (req.query.certificationRequired !== undefined) {
      filters.certificationRequired = req.query.certificationRequired === 'true';
    }

    const assignments = await UserWorkRoleModel.getAll(filters);

    res.json(assignments);
  } catch (error: any) {
    console.error('Error getting user work role assignments:', error);
    res.status(500).json({ 
      message: 'Error retrieving user work role assignments',
      error: error.message 
    });
  }
};

/**
 * Get a single user work role assignment by ID
 */
export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid assignment ID' });
      return;
    }

    const assignment = await UserWorkRoleModel.getById(id);

    if (!assignment) {
      res.status(404).json({ message: 'User work role assignment not found' });
      return;
    }

    // Check if user can view this data
    const currentUserId = req.user!.id;
    const userRoles = req.user!.roles || [];
    const canViewAll = userRoles.some(role => 
      ['superuser', 'admin', 'manager'].includes(role.toLowerCase())
    );

    if (!canViewAll && currentUserId !== assignment.userId) {
      res.status(403).json({ message: 'You can only view your own work role assignments' });
      return;
    }

    res.json(assignment);
  } catch (error: any) {
    console.error('Error getting user work role assignment:', error);
    res.status(500).json({ 
      message: 'Error retrieving user work role assignment',
      error: error.message 
    });
  }
};

/**
 * Update a user work role assignment
 */
export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid assignment ID' });
      return;
    }

    const updates: Partial<UserWorkRole> = {};
    
    if (req.body.skillLevelId !== undefined) {
      updates.skillLevelId = req.body.skillLevelId;
    }
    if (req.body.effectiveDate !== undefined) {
      updates.effectiveDate = new Date(req.body.effectiveDate);
    }
    if (req.body.expiryDate !== undefined) {
      updates.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : undefined;
    }
    if (req.body.status !== undefined) {
      updates.status = req.body.status;
    }
    if (req.body.verified !== undefined) {
      updates.verified = req.body.verified;
      if (req.body.verified && !req.body.verifiedAt) {
        updates.verifiedAt = new Date();
        updates.verifiedBy = req.user!.id;
      }
    }
    if (req.body.verifiedBy !== undefined) {
      updates.verifiedBy = req.body.verifiedBy;
    }
    if (req.body.verifiedAt !== undefined) {
      updates.verifiedAt = new Date(req.body.verifiedAt);
    }
    if (req.body.verificationNotes !== undefined) {
      updates.verificationNotes = req.body.verificationNotes;
    }
    if (req.body.notes !== undefined) {
      updates.notes = req.body.notes;
    }
    if (req.body.trainingRequired !== undefined) {
      updates.trainingRequired = req.body.trainingRequired;
    }
    if (req.body.trainingCompleted !== undefined) {
      updates.trainingCompleted = req.body.trainingCompleted;
      if (req.body.trainingCompleted && !req.body.trainingCompletedDate) {
        updates.trainingCompletedDate = new Date();
      }
    }
    if (req.body.trainingCompletedDate !== undefined) {
      updates.trainingCompletedDate = req.body.trainingCompletedDate ? new Date(req.body.trainingCompletedDate) : undefined;
    }
    if (req.body.certificationRequired !== undefined) {
      updates.certificationRequired = req.body.certificationRequired;
    }
    if (req.body.certificationId !== undefined) {
      updates.certificationId = req.body.certificationId;
    }
    if (req.body.lastAssessmentDate !== undefined) {
      updates.lastAssessmentDate = new Date(req.body.lastAssessmentDate);
    }
    if (req.body.lastAssessmentScore !== undefined) {
      updates.lastAssessmentScore = req.body.lastAssessmentScore;
    }
    if (req.body.lastAssessedBy !== undefined) {
      updates.lastAssessedBy = req.body.lastAssessedBy;
    }
    if (req.body.nextAssessmentDate !== undefined) {
      updates.nextAssessmentDate = req.body.nextAssessmentDate ? new Date(req.body.nextAssessmentDate) : undefined;
    }
    if (req.body.active !== undefined) {
      updates.active = req.body.active;
    }

    updates.updatedBy = req.user!.id;

    await UserWorkRoleModel.update(id, updates);

    res.json({ message: 'User work role assignment updated successfully' });
  } catch (error: any) {
    console.error('Error updating user work role assignment:', error);
    res.status(500).json({ 
      message: 'Error updating user work role assignment',
      error: error.message 
    });
  }
};

/**
 * Soft delete (deactivate) a user work role assignment
 */
export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid assignment ID' });
      return;
    }

    await UserWorkRoleModel.delete(id);

    res.json({ message: 'User work role assignment deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting user work role assignment:', error);
    res.status(500).json({ 
      message: 'Error deleting user work role assignment',
      error: error.message 
    });
  }
};

/**
 * Hard delete a user work role assignment
 */
export const hardDeleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid assignment ID' });
      return;
    }

    await UserWorkRoleModel.hardDelete(id);

    res.json({ message: 'User work role assignment permanently deleted' });
  } catch (error: any) {
    console.error('Error permanently deleting user work role assignment:', error);
    res.status(500).json({ 
      message: 'Error permanently deleting user work role assignment',
      error: error.message 
    });
  }
};

/**
 * Get statistics for user work role assignments
 */
export const getStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: UserWorkRoleFilters = {};
    
    if (req.query.userId) {
      filters.userId = parseInt(req.query.userId as string);
    }
    if (req.query.workRoleId) {
      filters.workRoleId = parseInt(req.query.workRoleId as string);
    }
    if (req.query.departmentId) {
      filters.departmentId = parseInt(req.query.departmentId as string);
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }

    const statistics = await UserWorkRoleModel.getStatistics(filters);

    res.json(statistics);
  } catch (error: any) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ 
      message: 'Error retrieving statistics',
      error: error.message 
    });
  }
};
