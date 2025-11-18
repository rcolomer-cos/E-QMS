import { Response } from 'express';
import { 
  ImprovementIdeaModel, 
  ImprovementIdea, 
  ImprovementIdeaFilters, 
  ImprovementIdeaSortOptions 
} from '../models/ImprovementIdeaModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new improvement idea
 */
export const createImprovementIdea = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Generate idea number
    const ideaNumber = await ImprovementIdeaModel.generateIdeaNumber();

    const idea: ImprovementIdea = {
      ...req.body,
      ideaNumber,
      submittedBy: req.user.id,
      submittedDate: new Date(),
      status: req.body.status || 'submitted',
    };

    const ideaId = await ImprovementIdeaModel.create(idea);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImprovementIdea',
      entityId: ideaId,
      entityIdentifier: ideaNumber,
      newValues: idea,
    });

    res.status(201).json({
      message: 'Improvement idea created successfully',
      id: ideaId,
      ideaNumber,
    });
  } catch (error) {
    console.error('Create improvement idea error:', error);
    res.status(500).json({ error: 'Failed to create improvement idea' });
  }
};

/**
 * Get all improvement ideas with filtering and sorting
 */
export const getImprovementIdeas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      category, 
      impactArea,
      submittedBy,
      responsibleUser,
      department,
      sortBy = 'submittedDate',
      sortOrder = 'DESC',
      page = '1', 
      limit = '10' 
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

    // Validate sort options
    const validSortFields = ['submittedDate', 'reviewedDate', 'implementedDate', 'title'];
    if (sortBy && !validSortFields.includes(sortBy as string)) {
      res.status(400).json({ 
        error: `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}` 
      });
      return;
    }

    const validSortOrders = ['ASC', 'DESC'];
    if (sortOrder && !validSortOrders.includes(sortOrder as string)) {
      res.status(400).json({ 
        error: 'Invalid sortOrder parameter. Must be ASC or DESC' 
      });
      return;
    }

    // Build filters
    const filters: ImprovementIdeaFilters = {};
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    if (impactArea) filters.impactArea = impactArea as string;
    if (submittedBy) filters.submittedBy = parseInt(submittedBy as string, 10);
    if (responsibleUser) filters.responsibleUser = parseInt(responsibleUser as string, 10);
    if (department) filters.department = department as string;

    const sortOptions: ImprovementIdeaSortOptions = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };

    const result = await ImprovementIdeaModel.findAll(filters, sortOptions, pageNum, limitNum);

    res.json(result);
  } catch (error) {
    console.error('Get improvement ideas error:', error);
    res.status(500).json({ error: 'Failed to retrieve improvement ideas' });
  }
};

/**
 * Get improvement idea by ID
 */
export const getImprovementIdeaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const id = parseInt(req.params.id, 10);
    const idea = await ImprovementIdeaModel.findById(id);

    if (!idea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    res.json(idea);
  } catch (error) {
    console.error('Get improvement idea by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve improvement idea' });
  }
};

/**
 * Update improvement idea
 */
export const updateImprovementIdea = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const oldIdea = await ImprovementIdeaModel.findById(id);

    if (!oldIdea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const success = await ImprovementIdeaModel.update(id, req.body);

    if (!success) {
      res.status(500).json({ error: 'Failed to update improvement idea' });
      return;
    }

    const updatedIdea = await ImprovementIdeaModel.findById(id);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImprovementIdea',
      entityId: id,
      entityIdentifier: oldIdea.ideaNumber,
      oldValues: oldIdea,
      newValues: updatedIdea,
    });

    res.json({ message: 'Improvement idea updated successfully', data: updatedIdea });
  } catch (error) {
    console.error('Update improvement idea error:', error);
    res.status(500).json({ error: 'Failed to update improvement idea' });
  }
};

/**
 * Update improvement idea status
 */
export const updateImprovementIdeaStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { status, reviewComments } = req.body;

    const oldIdea = await ImprovementIdeaModel.findById(id);

    if (!oldIdea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const updateData: Partial<ImprovementIdea> = { status };

    // Update dates based on status changes
    if (status === 'under_review' || status === 'approved' || status === 'rejected') {
      updateData.reviewedDate = new Date();
      updateData.reviewedBy = req.user.id;
      if (reviewComments) {
        updateData.reviewComments = reviewComments;
      }
    }

    if (status === 'implemented') {
      updateData.implementedDate = new Date();
    }

    const success = await ImprovementIdeaModel.update(id, updateData);

    if (!success) {
      res.status(500).json({ error: 'Failed to update improvement idea status' });
      return;
    }

    const updatedIdea = await ImprovementIdeaModel.findById(id);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImprovementIdea',
      entityId: id,
      entityIdentifier: oldIdea.ideaNumber,
      oldValues: { status: oldIdea.status },
      newValues: { status },
    });

    res.json({ message: 'Improvement idea status updated successfully', data: updatedIdea });
  } catch (error) {
    console.error('Update improvement idea status error:', error);
    res.status(500).json({ error: 'Failed to update improvement idea status' });
  }
};

/**
 * Delete improvement idea
 */
export const deleteImprovementIdea = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const idea = await ImprovementIdeaModel.findById(id);

    if (!idea) {
      res.status(404).json({ error: 'Improvement idea not found' });
      return;
    }

    const success = await ImprovementIdeaModel.delete(id);

    if (!success) {
      res.status(500).json({ error: 'Failed to delete improvement idea' });
      return;
    }

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.IMPROVEMENT_IDEA,
      entityType: 'ImprovementIdea',
      entityId: id,
      entityIdentifier: idea.ideaNumber,
      oldValues: idea,
    });

    res.json({ message: 'Improvement idea deleted successfully' });
  } catch (error) {
    console.error('Delete improvement idea error:', error);
    res.status(500).json({ error: 'Failed to delete improvement idea' });
  }
};

/**
 * Get improvement idea statistics
 */
export const getImprovementIdeaStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await ImprovementIdeaModel.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get improvement idea statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
};
