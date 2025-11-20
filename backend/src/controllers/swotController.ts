import { Response } from 'express';
import { SwotModel, SwotEntry, SwotFilters } from '../models/SwotModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Create a new SWOT entry
 */
export const createSwotEntry = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const entry: SwotEntry = {
      ...req.body,
      createdBy: req.user.id,
    };

    const entryId = await SwotModel.create(entry);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.STRATEGIC_PLANNING,
      entityType: 'SwotEntry',
      entityId: entryId,
      entityIdentifier: entry.title,
      newValues: entry,
    });

    res.status(201).json({
      message: 'SWOT entry created successfully',
      id: entryId,
    });
  } catch (error) {
    console.error('Create SWOT entry error:', error);
    res.status(500).json({ error: 'Failed to create SWOT entry' });
  }
};

/**
 * Get all SWOT entries with filtering
 */
export const getSwotEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, status, priority, owner } = req.query;

    // Build filters
    const filters: SwotFilters = {};
    if (category) filters.category = category as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (owner) filters.owner = parseInt(owner as string, 10);

    const entries = await SwotModel.findAll(filters);

    res.json({
      data: entries,
      total: entries.length,
    });
  } catch (error) {
    console.error('Get SWOT entries error:', error);
    res.status(500).json({ error: 'Failed to get SWOT entries' });
  }
};

/**
 * Get a single SWOT entry by ID
 */
export const getSwotEntryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const entry = await SwotModel.findById(parseInt(id, 10));
    if (!entry) {
      res.status(404).json({ error: 'SWOT entry not found' });
      return;
    }

    res.json(entry);
  } catch (error) {
    console.error('Get SWOT entry error:', error);
    res.status(500).json({ error: 'Failed to get SWOT entry' });
  }
};

/**
 * Update a SWOT entry
 */
export const updateSwotEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if entry exists
    const entry = await SwotModel.findById(parseInt(id, 10));
    if (!entry) {
      res.status(404).json({ error: 'SWOT entry not found' });
      return;
    }

    await SwotModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.STRATEGIC_PLANNING,
      entityType: 'SwotEntry',
      entityId: parseInt(id, 10),
      entityIdentifier: entry.title,
      oldValues: entry,
      newValues: updates,
    });

    res.json({ message: 'SWOT entry updated successfully' });
  } catch (error) {
    console.error('Update SWOT entry error:', error);
    res.status(500).json({ error: 'Failed to update SWOT entry' });
  }
};

/**
 * Delete a SWOT entry
 */
export const deleteSwotEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const entry = await SwotModel.findById(parseInt(id, 10));
    if (!entry) {
      res.status(404).json({ error: 'SWOT entry not found' });
      return;
    }

    await SwotModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.STRATEGIC_PLANNING,
      entityType: 'SwotEntry',
      entityId: parseInt(id, 10),
      entityIdentifier: entry.title,
      oldValues: entry,
    });

    res.json({ message: 'SWOT entry deleted successfully' });
  } catch (error) {
    console.error('Delete SWOT entry error:', error);
    res.status(500).json({ error: 'Failed to delete SWOT entry' });
  }
};

/**
 * Get SWOT statistics
 */
export const getSwotStatistics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await SwotModel.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get SWOT statistics error:', error);
    res.status(500).json({ error: 'Failed to get SWOT statistics' });
  }
};

/**
 * Reorder SWOT entries
 */
export const reorderSwotEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      res.status(400).json({ error: 'Orders must be an array' });
      return;
    }

    // Validate each order item
    for (const order of orders) {
      if (typeof order.id !== 'number' || typeof order.displayOrder !== 'number') {
        res.status(400).json({ error: 'Each order must have id and displayOrder as numbers' });
        return;
      }
    }

    await SwotModel.reorder(orders);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.STRATEGIC_PLANNING,
      entityType: 'SwotEntry',
      entityId: 0,
      entityIdentifier: 'Bulk Reorder',
      oldValues: {},
      newValues: { orders },
    });

    res.json({ message: 'SWOT entries reordered successfully' });
  } catch (error) {
    console.error('Reorder SWOT entries error:', error);
    res.status(500).json({ error: 'Failed to reorder SWOT entries' });
  }
};
