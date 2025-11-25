import { Response } from 'express';
import { validationResult } from 'express-validator';
import SkillLevelModel from '../models/SkillLevelModel';
import { AuthRequest } from '../types';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Get all skill levels
 */
export const getSkillLevels = async (_req: AuthRequest, res: Response) => {
  try {
    const skillLevels = await SkillLevelModel.getAll();
    res.json({ skillLevels });
  } catch (error: any) {
    console.error('Error fetching skill levels:', error);
    res.status(500).json({ message: 'Error fetching skill levels', error: error.message });
  }
};

/**
 * Get skill level summary (quick reference)
 */
export const getSkillLevelSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await SkillLevelModel.getSummary();
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching skill level summary:', error);
    res.status(500).json({ message: 'Error fetching skill level summary', error: error.message });
  }
};

/**
 * Get a single skill level by ID
 */
export const getSkillLevelById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const skillLevel = await SkillLevelModel.getById(parseInt(id));
    
    if (!skillLevel) {
      return res.status(404).json({ message: 'Skill level not found' });
    }
    
    return res.json(skillLevel);
  } catch (error: any) {
    console.error('Error fetching skill level:', error);
    return res.status(500).json({ message: 'Error fetching skill level', error: error.message });
  }
};

/**
 * Get skill level by level number (1-5)
 */
export const getSkillLevelByLevel = async (req: AuthRequest, res: Response) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level);
    
    if (levelNum < 1 || levelNum > 5) {
      return res.status(400).json({ message: 'Level must be between 1 and 5' });
    }
    
    const skillLevel = await SkillLevelModel.getByLevel(levelNum);
    
    if (!skillLevel) {
      return res.status(404).json({ message: `Skill level ${levelNum} not found` });
    }
    
    return res.json(skillLevel);
  } catch (error: any) {
    console.error('Error fetching skill level by level:', error);
    return res.status(500).json({ message: 'Error fetching skill level', error: error.message });
  }
};

/**
 * Create a new skill level
 */
export const createSkillLevel = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const skillLevelData = {
      ...req.body,
      createdBy: userId,
    };

    // Check if level already exists
    if (skillLevelData.level) {
      const existing = await SkillLevelModel.getByLevel(skillLevelData.level);
      if (existing) {
        return res.status(409).json({ 
          message: `Skill level ${skillLevelData.level} already exists. Each level (1-5) can only be defined once.` 
        });
      }
    }

    const skillLevel = await SkillLevelModel.create(skillLevelData);

    // Audit log
    await logCreate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'skill_level',
      entityId: skillLevel.id!,
      actionDescription: `Created skill level: ${skillLevel.name} (Level ${skillLevel.level})`,
      newValues: skillLevel,
    });

    return res.status(201).json(skillLevel);
  } catch (error: any) {
    console.error('Error creating skill level:', error);
    return res.status(500).json({ message: 'Error creating skill level', error: error.message });
  }
};

/**
 * Update an existing skill level
 */
export const updateSkillLevel = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existing = await SkillLevelModel.getById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ message: 'Skill level not found' });
    }

    // If changing level number, check if new level already exists
    if (req.body.level !== undefined && req.body.level !== existing.level) {
      const levelExists = await SkillLevelModel.getByLevel(req.body.level);
      if (levelExists) {
        return res.status(409).json({ 
          message: `Level ${req.body.level} is already assigned to another skill level definition` 
        });
      }
    }

    const skillLevelData = {
      ...req.body,
      updatedBy: userId,
    };

    const skillLevel = await SkillLevelModel.update(parseInt(id), skillLevelData);

    // Audit log
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'skill_level',
      entityId: skillLevel.id!,
      oldValues: existing,
      newValues: skillLevel,
      actionDescription: `Updated skill level: ${skillLevel.name} (Level ${skillLevel.level})`,
    });

    return res.json(skillLevel);
  } catch (error: any) {
    console.error('Error updating skill level:', error);
    if (error.message === 'Skill level not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Error updating skill level', error: error.message });
  }
};

/**
 * Delete a skill level (soft delete)
 */
export const deleteSkillLevel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existing = await SkillLevelModel.getById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ message: 'Skill level not found' });
    }

    await SkillLevelModel.delete(parseInt(id), userId);

    // Audit log
    await logDelete({
      req,
      actionCategory: AuditActionCategory.USER_MANAGEMENT,
      entityType: 'skill_level',
      entityId: parseInt(id),
      oldValues: existing,
      actionDescription: `Deleted skill level: ${existing.name} (Level ${existing.level})`,
    });

    return res.json({ message: 'Skill level deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting skill level:', error);
    if (error.message === 'Skill level not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Error deleting skill level', error: error.message });
  }
};
