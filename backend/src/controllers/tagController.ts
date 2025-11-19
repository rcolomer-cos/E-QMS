import { Response } from 'express';
import { TagModel } from '../models/TagModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new tag (Admin only)
 */
export const createTag = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { name, description, backgroundColor, fontColor } = req.body;

    // Check if tag with same name already exists
    const existingTag = await TagModel.findByName(name);
    if (existingTag) {
      res.status(400).json({ error: 'Tag with this name already exists' });
      return;
    }

    // Validate hex color codes
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (backgroundColor && !hexColorRegex.test(backgroundColor)) {
      res.status(400).json({ error: 'Invalid background color format. Use hex format (#RRGGBB)' });
      return;
    }
    if (fontColor && !hexColorRegex.test(fontColor)) {
      res.status(400).json({ error: 'Invalid font color format. Use hex format (#RRGGBB)' });
      return;
    }

    const tagId = await TagModel.create({
      name: name.trim(),
      description: description?.trim(),
      backgroundColor: backgroundColor || '#3B82F6',
      fontColor: fontColor || '#FFFFFF',
      createdBy: req.user.id,
    });

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Tag',
      entityId: tagId,
      entityIdentifier: name,
      newValues: { name, description, backgroundColor, fontColor },
    });

    res.status(201).json({
      message: 'Tag created successfully',
      tagId,
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

/**
 * Get all tags
 */
export const getTags = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tags = await TagModel.findAll();
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
};

/**
 * Get tag by ID
 */
export const getTagById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      res.status(400).json({ error: 'Invalid tag ID' });
      return;
    }

    const tag = await TagModel.findById(tagId);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.json(tag);
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Failed to get tag' });
  }
};

/**
 * Update tag (Admin only)
 */
export const updateTag = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      res.status(400).json({ error: 'Invalid tag ID' });
      return;
    }

    // Check if tag exists
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    const { name, description, backgroundColor, fontColor } = req.body;

    // If updating name, check if new name already exists
    if (name && name.trim() !== tag.name) {
      const existingTag = await TagModel.findByName(name);
      if (existingTag) {
        res.status(400).json({ error: 'Tag with this name already exists' });
        return;
      }
    }

    // Validate hex color codes if provided
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (backgroundColor && !hexColorRegex.test(backgroundColor)) {
      res.status(400).json({ error: 'Invalid background color format. Use hex format (#RRGGBB)' });
      return;
    }
    if (fontColor && !hexColorRegex.test(fontColor)) {
      res.status(400).json({ error: 'Invalid font color format. Use hex format (#RRGGBB)' });
      return;
    }

    const updates: Partial<typeof tag> = {
      updatedBy: req.user.id,
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (backgroundColor !== undefined) updates.backgroundColor = backgroundColor;
    if (fontColor !== undefined) updates.fontColor = fontColor;

    await TagModel.update(tagId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Tag',
      entityId: tagId,
      entityIdentifier: tag.name,
      oldValues: tag,
      newValues: updates,
    });

    res.json({ message: 'Tag updated successfully' });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

/**
 * Delete tag (Admin only)
 */
export const deleteTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      res.status(400).json({ error: 'Invalid tag ID' });
      return;
    }

    // Check if tag exists
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    await TagModel.delete(tagId);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Tag',
      entityId: tagId,
      entityIdentifier: tag.name,
      oldValues: tag,
    });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

/**
 * Get tag usage statistics
 */
export const getTagUsage = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usage = await TagModel.getTagUsageCount();
    res.json(usage);
  } catch (error) {
    console.error('Get tag usage error:', error);
    res.status(500).json({ error: 'Failed to get tag usage' });
  }
};
