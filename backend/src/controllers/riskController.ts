import { Response } from 'express';
import { RiskModel, Risk, RiskFilters, RiskSortOptions } from '../models/RiskModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new risk entry
 */
export const createRisk = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const risk: Risk = {
      ...req.body,
      createdBy: req.user.id,
    };

    const riskId = await RiskModel.create(risk);
    
    // Fetch the created risk to get the generated risk number
    const createdRisk = await RiskModel.findById(riskId);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.RISK,
      entityType: 'Risk',
      entityId: riskId,
      entityIdentifier: createdRisk?.riskNumber || 'Unknown',
      newValues: createdRisk,
    });

    res.status(201).json({
      message: 'Risk created successfully',
      id: riskId,
      riskNumber: createdRisk?.riskNumber,
    });
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ error: 'Failed to create risk' });
  }
};

/**
 * Get all risks with filtering and sorting
 */
export const getRisks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      category, 
      riskLevel, 
      department, 
      riskOwner,
      minRiskScore,
      maxRiskScore,
      sortBy = 'riskScore',
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
    const validSortFields = ['riskScore', 'residualRiskScore', 'identifiedDate', 'nextReviewDate', 'title'];
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
    const filters: RiskFilters = {};
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    if (riskLevel) filters.riskLevel = riskLevel as string;
    if (department) filters.department = department as string;
    if (riskOwner) filters.riskOwner = parseInt(riskOwner as string, 10);
    if (minRiskScore) filters.minRiskScore = parseInt(minRiskScore as string, 10);
    if (maxRiskScore) filters.maxRiskScore = parseInt(maxRiskScore as string, 10);

    // Build sort options
    const sortOptions: RiskSortOptions = {
      sortBy: sortBy as RiskSortOptions['sortBy'],
      sortOrder: sortOrder as RiskSortOptions['sortOrder'],
    };

    const allRisks = await RiskModel.findAll(filters, sortOptions);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRisks = allRisks.slice(startIndex, endIndex);

    res.json({
      data: paginatedRisks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allRisks.length,
        pages: Math.ceil(allRisks.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ error: 'Failed to get risks' });
  }
};

/**
 * Get a single risk by ID
 */
export const getRiskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const risk = await RiskModel.findById(parseInt(id, 10));
    if (!risk) {
      res.status(404).json({ error: 'Risk not found' });
      return;
    }

    res.json(risk);
  } catch (error) {
    console.error('Get risk error:', error);
    res.status(500).json({ error: 'Failed to get risk' });
  }
};

/**
 * Update a risk entry
 */
export const updateRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if risk exists
    const risk = await RiskModel.findById(parseInt(id, 10));
    if (!risk) {
      res.status(404).json({ error: 'Risk not found' });
      return;
    }

    await RiskModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.RISK,
      entityType: 'Risk',
      entityId: parseInt(id, 10),
      entityIdentifier: risk.riskNumber,
      oldValues: risk,
      newValues: updates,
    });

    res.json({ message: 'Risk updated successfully' });
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ error: 'Failed to update risk' });
  }
};

/**
 * Update risk status
 */
export const updateRiskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { status } = req.body;

    // Check if risk exists
    const risk = await RiskModel.findById(parseInt(id, 10));
    if (!risk) {
      res.status(404).json({ error: 'Risk not found' });
      return;
    }

    // Additional check: Only Admin and Manager can close or accept risks
    if (status === 'closed' || status === 'accepted') {
      const hasPermission = req.user.roles.some(role => 
        role === 'admin' || role === 'manager' || role === 'superuser'
      );
      if (!hasPermission) {
        res.status(403).json({ error: 'Only Admin and Manager can close or accept risks' });
        return;
      }
    }

    // If closing the risk, set the closed date
    const updates: Partial<Risk> = { status };
    if (status === 'closed') {
      updates.closedDate = new Date();
    }

    await RiskModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.RISK,
      entityType: 'Risk',
      entityId: parseInt(id, 10),
      entityIdentifier: risk.riskNumber,
      oldValues: { status: risk.status },
      newValues: { status },
      actionDescription: `Risk status changed from ${risk.status} to ${status}`,
    });

    res.json({ 
      message: 'Risk status updated successfully',
      status 
    });
  } catch (error) {
    console.error('Update risk status error:', error);
    res.status(500).json({ error: 'Failed to update risk status' });
  }
};

/**
 * Delete a risk entry
 */
export const deleteRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if risk exists
    const risk = await RiskModel.findById(parseInt(id, 10));
    if (!risk) {
      res.status(404).json({ error: 'Risk not found' });
      return;
    }

    await RiskModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.RISK,
      entityType: 'Risk',
      entityId: parseInt(id, 10),
      entityIdentifier: risk.riskNumber,
      oldValues: risk,
    });

    res.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ error: 'Failed to delete risk' });
  }
};

/**
 * Get risk statistics
 */
export const getRiskStatistics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await RiskModel.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get risk statistics error:', error);
    res.status(500).json({ error: 'Failed to get risk statistics' });
  }
};
