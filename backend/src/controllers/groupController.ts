import { Response } from 'express';
import { GroupModel, Group } from '../models/GroupModel';
import { UserGroupModel } from '../models/UserGroupModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new group
 */
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { name, description } = req.body;

    // Check if group name already exists
    const exists = await GroupModel.existsByName(name);
    if (exists) {
      res.status(400).json({ error: 'Group name already exists' });
      return;
    }

    const group: Group = {
      name,
      description,
      createdBy: req.user.id,
    };

    const groupId = await GroupModel.create(group);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'Group',
      entityId: groupId,
      entityIdentifier: name,
      newValues: group,
    });

    res.status(201).json({
      message: 'Group created successfully',
      groupId,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

/**
 * Get all groups
 */
export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { includeInactive, withCounts } = req.query;

    const groups = await GroupModel.findAll({
      includeInactive: includeInactive === 'true',
      withCounts: withCounts === 'true',
    });

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
};

/**
 * Get a group by ID
 */
export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id, 10);

    const group = await GroupModel.findById(groupId);

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
};

/**
 * Update a group
 */
export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const groupId = parseInt(req.params.id, 10);
    const { name, description, active } = req.body;

    const existingGroup = await GroupModel.findById(groupId);
    if (!existingGroup) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check if new name conflicts with another group
    if (name && name !== existingGroup.name) {
      const exists = await GroupModel.existsByName(name, groupId);
      if (exists) {
        res.status(400).json({ error: 'Group name already exists' });
        return;
      }
    }

    const updates: Partial<Group> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = active;

    await GroupModel.update(groupId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'Group',
      entityId: groupId,
      entityIdentifier: name || existingGroup.name,
      oldValues: existingGroup,
      newValues: updates,
    });

    res.json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

/**
 * Delete a group (soft delete)
 */
export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const groupId = parseInt(req.params.id, 10);

    const group = await GroupModel.findById(groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    await GroupModel.delete(groupId);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'Group',
      entityId: groupId,
      entityIdentifier: group.name,
      oldValues: group,
    });

    res.json({ message: 'Group deactivated successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

/**
 * Get all users in a group
 */
export const getGroupUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id, 10);

    const users = await GroupModel.getUsersByGroupId(groupId);

    res.json(users);
  } catch (error) {
    console.error('Get group users error:', error);
    res.status(500).json({ error: 'Failed to get group users' });
  }
};

/**
 * Add users to a group
 */
export const addUsersToGroup = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const groupId = parseInt(req.params.id, 10);
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'userIds must be a non-empty array' });
      return;
    }

    const group = await GroupModel.findById(groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    await UserGroupModel.addUsersToGroup(userIds, groupId, req.user.id);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'Group',
      entityId: groupId,
      entityIdentifier: group.name,
      oldValues: {},
      newValues: { action: 'add_users', userIds },
    });

    res.json({ message: 'Users added to group successfully' });
  } catch (error) {
    console.error('Add users to group error:', error);
    res.status(500).json({ error: 'Failed to add users to group' });
  }
};

/**
 * Remove users from a group
 */
export const removeUsersFromGroup = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const groupId = parseInt(req.params.id, 10);
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'userIds must be a non-empty array' });
      return;
    }

    const group = await GroupModel.findById(groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    await UserGroupModel.removeUsersFromGroup(userIds, groupId);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'Group',
      entityId: groupId,
      entityIdentifier: group.name,
      oldValues: {},
      newValues: { action: 'remove_users', userIds },
    });

    res.json({ message: 'Users removed from group successfully' });
  } catch (error) {
    console.error('Remove users from group error:', error);
    res.status(500).json({ error: 'Failed to remove users from group' });
  }
};

/**
 * Get all documents assigned to a group
 */
export const getGroupDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groupId = parseInt(req.params.id, 10);

    const documents = await GroupModel.getDocumentsByGroupId(groupId);

    res.json(documents);
  } catch (error) {
    console.error('Get group documents error:', error);
    res.status(500).json({ error: 'Failed to get group documents' });
  }
};

/**
 * Get groups for a specific user
 */
export const getUserGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const groups = await UserGroupModel.findByUserId(userId);

    res.json(groups);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Failed to get user groups' });
  }
};
