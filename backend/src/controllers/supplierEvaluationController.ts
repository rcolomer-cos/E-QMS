import { Response } from 'express';
import {
  SupplierEvaluationModel,
  SupplierEvaluation,
  SupplierEvaluationFilters,
  SupplierEvaluationSortOptions,
} from '../models/SupplierEvaluationModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new supplier evaluation
 */
export const createSupplierEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const evaluation: SupplierEvaluation = {
      ...req.body,
      evaluatedBy: req.user.id,
      createdBy: req.user.id,
    };

    const evaluationId = await SupplierEvaluationModel.create(evaluation);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.SUPPLIER,
      entityType: 'SupplierEvaluation',
      entityId: evaluationId,
      entityIdentifier: evaluation.evaluationNumber,
      newValues: evaluation,
    });

    res.status(201).json({
      message: 'Supplier evaluation created successfully',
      id: evaluationId,
    });
  } catch (error) {
    console.error('Create supplier evaluation error:', error);
    res.status(500).json({ error: 'Failed to create supplier evaluation' });
  }
};

/**
 * Get all supplier evaluations with filtering and sorting
 */
export const getSupplierEvaluations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      supplierId,
      evaluationType,
      complianceStatus,
      evaluationStatus,
      overallRating,
      decision,
      minOverallScore,
      maxOverallScore,
      minQualityRating,
      evaluatedBy,
      startDate,
      endDate,
      sortBy = 'evaluationDate',
      sortOrder = 'DESC',
      page = '1',
      limit = '10',
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

    // Validate sort options
    const validSortFields = ['evaluationDate', 'overallScore', 'qualityRating', 'onTimeDeliveryRate', 'evaluationNumber'];
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
    const filters: SupplierEvaluationFilters = {};
    if (supplierId) filters.supplierId = parseInt(supplierId as string, 10);
    if (evaluationType) filters.evaluationType = evaluationType as string;
    if (complianceStatus) filters.complianceStatus = complianceStatus as string;
    if (evaluationStatus) filters.evaluationStatus = evaluationStatus as string;
    if (overallRating) filters.overallRating = overallRating as string;
    if (decision) filters.decision = decision as string;
    if (minOverallScore) filters.minOverallScore = parseFloat(minOverallScore as string);
    if (maxOverallScore) filters.maxOverallScore = parseFloat(maxOverallScore as string);
    if (minQualityRating) filters.minQualityRating = parseInt(minQualityRating as string, 10);
    if (evaluatedBy) filters.evaluatedBy = parseInt(evaluatedBy as string, 10);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    // Sort options
    const sortOptions: SupplierEvaluationSortOptions = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };

    const result = await SupplierEvaluationModel.findAll(filters, sortOptions, pageNum, limitNum);

    res.json(result);
  } catch (error) {
    console.error('Get supplier evaluations error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier evaluations' });
  }
};

/**
 * Get supplier evaluation by ID
 */
export const getSupplierEvaluationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const evaluation = await SupplierEvaluationModel.findById(parseInt(id, 10));

    if (!evaluation) {
      res.status(404).json({ error: 'Supplier evaluation not found' });
      return;
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get supplier evaluation by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier evaluation' });
  }
};

/**
 * Get supplier evaluations by supplier ID
 */
export const getEvaluationsBySupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const evaluations = await SupplierEvaluationModel.findBySupplier(parseInt(supplierId, 10));

    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations by supplier error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier evaluations' });
  }
};

/**
 * Update supplier evaluation
 */
export const updateSupplierEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const evaluationId = parseInt(id, 10);

    const existingEvaluation = await SupplierEvaluationModel.findById(evaluationId);
    if (!existingEvaluation) {
      res.status(404).json({ error: 'Supplier evaluation not found' });
      return;
    }

    const updates = req.body;
    await SupplierEvaluationModel.update(evaluationId, updates);

    // Log audit entry
    if (req.user) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'SupplierEvaluation',
        entityId: evaluationId,
        entityIdentifier: existingEvaluation.evaluationNumber,
        oldValues: existingEvaluation,
        newValues: { ...existingEvaluation, ...updates },
      });
    }

    res.json({ message: 'Supplier evaluation updated successfully' });
  } catch (error) {
    console.error('Update supplier evaluation error:', error);
    res.status(500).json({ error: 'Failed to update supplier evaluation' });
  }
};

/**
 * Update supplier evaluation status
 */
export const updateSupplierEvaluationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;
    const evaluationId = parseInt(id, 10);

    const existingEvaluation = await SupplierEvaluationModel.findById(evaluationId);
    if (!existingEvaluation) {
      res.status(404).json({ error: 'Supplier evaluation not found' });
      return;
    }

    await SupplierEvaluationModel.updateStatus(evaluationId, status, req.user?.id);

    // Log audit entry
    if (req.user) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'SupplierEvaluation',
        entityId: evaluationId,
        entityIdentifier: existingEvaluation.evaluationNumber,
        oldValues: { evaluationStatus: existingEvaluation.evaluationStatus },
        newValues: { evaluationStatus: status },
      });
    }

    res.json({ message: 'Supplier evaluation status updated successfully' });
  } catch (error) {
    console.error('Update supplier evaluation status error:', error);
    res.status(500).json({ error: 'Failed to update supplier evaluation status' });
  }
};

/**
 * Delete supplier evaluation
 */
export const deleteSupplierEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const evaluationId = parseInt(id, 10);

    const existingEvaluation = await SupplierEvaluationModel.findById(evaluationId);
    if (!existingEvaluation) {
      res.status(404).json({ error: 'Supplier evaluation not found' });
      return;
    }

    await SupplierEvaluationModel.delete(evaluationId);

    // Log audit entry
    if (req.user) {
      await logDelete({
        req,
        actionCategory: AuditActionCategory.SUPPLIER,
        entityType: 'SupplierEvaluation',
        entityId: evaluationId,
        entityIdentifier: existingEvaluation.evaluationNumber,
        oldValues: existingEvaluation,
      });
    }

    res.json({ message: 'Supplier evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete supplier evaluation error:', error);
    res.status(500).json({ error: 'Failed to delete supplier evaluation' });
  }
};

/**
 * Get supplier evaluation statistics
 */
export const getSupplierEvaluationStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.query;

    const statistics = await SupplierEvaluationModel.getStatistics(
      supplierId ? parseInt(supplierId as string, 10) : undefined
    );

    res.json(statistics);
  } catch (error) {
    console.error('Get supplier evaluation statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier evaluation statistics' });
  }
};
