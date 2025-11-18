import { Response } from 'express';
import { 
  ImplementationTaskModel, 
  ImplementationTask, 
  ImplementationTaskFilters, 
  ImplementationTaskSortOptions 
} from '../models/ImplementationTaskModel';
import { ImprovementIdeaModel } from '../models/ImprovementIdeaModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new implementation task
 */
export const createImplementationTask = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { improvementIdeaId } = req.body;

    // Verify that the improvement idea exists
    const idea = await ImprovementIdeaModel.findById(improvementIdeaId);
    if (!idea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const task: ImplementationTask = {
      ...req.body,
      createdBy: req.user.id,
      status: req.body.status || 'pending',
      progressPercentage: req.body.progressPercentage || 0,
    };

    const taskId = await ImplementationTaskModel.create(task);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImplementationTask',
      entityId: taskId,
      entityIdentifier: `Task #${taskId} for ${idea.ideaNumber}`,
      newValues: task,
    });

    res.status(201).json({
      message: 'Implementation task created successfully',
      id: taskId,
    });
  } catch (error) {
    console.error('Create implementation task error:', error);
    res.status(500).json({ error: 'Failed to create implementation task' });
  }
};

/**
 * Get all implementation tasks with filtering and sorting
 */
export const getImplementationTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      improvementIdeaId,
      status, 
      assignedTo,
      deadlineBefore,
      deadlineAfter,
      sortBy = 'deadline',
      sortOrder = 'ASC',
      page = '1', 
      limit = '100' 
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' 
      });
      return;
    }

    // Build filters
    const filters: ImplementationTaskFilters = {};
    if (improvementIdeaId) filters.improvementIdeaId = parseInt(improvementIdeaId as string, 10);
    if (status) filters.status = status as string;
    if (assignedTo) filters.assignedTo = parseInt(assignedTo as string, 10);
    if (deadlineBefore) filters.deadlineBefore = new Date(deadlineBefore as string);
    if (deadlineAfter) filters.deadlineAfter = new Date(deadlineAfter as string);

    const sortOptions: ImplementationTaskSortOptions = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };

    const result = await ImplementationTaskModel.findAll(filters, sortOptions, pageNum, limitNum);

    res.json(result);
  } catch (error) {
    console.error('Get implementation tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve implementation tasks' });
  }
};

/**
 * Get implementation task by ID
 */
export const getImplementationTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const id = parseInt(req.params.id, 10);
    const task = await ImplementationTaskModel.findById(id);

    if (!task) {
      res.status(404).json({ error: 'Implementation task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Get implementation task by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve implementation task' });
  }
};

/**
 * Get tasks for a specific improvement idea
 */
export const getTasksByImprovementIdeaId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const improvementIdeaId = parseInt(req.params.improvementIdeaId, 10);

    // Verify that the improvement idea exists
    const idea = await ImprovementIdeaModel.findById(improvementIdeaId);
    if (!idea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const tasks = await ImplementationTaskModel.findByImprovementIdeaId(improvementIdeaId);

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks by improvement idea ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
};

/**
 * Update implementation task
 */
export const updateImplementationTask = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const id = parseInt(req.params.id, 10);
    const oldTask = await ImplementationTaskModel.findById(id);

    if (!oldTask) {
      res.status(404).json({ error: 'Implementation task not found' });
      return;
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
    };

    const success = await ImplementationTaskModel.update(id, updateData);

    if (!success) {
      res.status(500).json({ error: 'Failed to update implementation task' });
      return;
    }

    const updatedTask = await ImplementationTaskModel.findById(id);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImplementationTask',
      entityId: id,
      entityIdentifier: `Task #${id}`,
      oldValues: oldTask,
      newValues: updatedTask,
    });

    res.json({ message: 'Implementation task updated successfully', data: updatedTask });
  } catch (error) {
    console.error('Update implementation task error:', error);
    res.status(500).json({ error: 'Failed to update implementation task' });
  }
};

/**
 * Mark task as completed
 */
export const completeImplementationTask = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const id = parseInt(req.params.id, 10);
    const { completionEvidence } = req.body;

    const oldTask = await ImplementationTaskModel.findById(id);

    if (!oldTask) {
      res.status(404).json({ error: 'Implementation task not found' });
      return;
    }

    // Validate that task is not already completed
    if (oldTask.status === 'completed') {
      res.status(400).json({ error: 'Task is already completed' });
      return;
    }

    const updateData: Partial<ImplementationTask> = {
      status: 'completed',
      progressPercentage: 100,
      completedDate: new Date(),
      completionEvidence,
      updatedBy: req.user.id,
    };

    const success = await ImplementationTaskModel.update(id, updateData);

    if (!success) {
      res.status(500).json({ error: 'Failed to complete implementation task' });
      return;
    }

    const updatedTask = await ImplementationTaskModel.findById(id);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImplementationTask',
      entityId: id,
      entityIdentifier: `Task #${id}`,
      oldValues: { status: oldTask.status },
      newValues: { status: 'completed', completedDate: updateData.completedDate },
    });

    res.json({ message: 'Implementation task completed successfully', data: updatedTask });
  } catch (error) {
    console.error('Complete implementation task error:', error);
    res.status(500).json({ error: 'Failed to complete implementation task' });
  }
};

/**
 * Delete implementation task
 */
export const deleteImplementationTask = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const id = parseInt(req.params.id, 10);
    const task = await ImplementationTaskModel.findById(id);

    if (!task) {
      res.status(404).json({ error: 'Implementation task not found' });
      return;
    }

    const success = await ImplementationTaskModel.delete(id);

    if (!success) {
      res.status(500).json({ error: 'Failed to delete implementation task' });
      return;
    }

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImplementationTask',
      entityId: id,
      entityIdentifier: `Task #${id}`,
      oldValues: task,
    });

    res.json({ message: 'Implementation task deleted successfully' });
  } catch (error) {
    console.error('Delete implementation task error:', error);
    res.status(500).json({ error: 'Failed to delete implementation task' });
  }
};

/**
 * Get task statistics for an improvement idea
 */
export const getTaskStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const improvementIdeaId = parseInt(req.params.improvementIdeaId, 10);

    // Verify that the improvement idea exists
    const idea = await ImprovementIdeaModel.findById(improvementIdeaId);
    if (!idea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const statistics = await ImplementationTaskModel.getTaskStatistics(improvementIdeaId);
    res.json(statistics);
  } catch (error) {
    console.error('Get task statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve task statistics' });
  }
};
