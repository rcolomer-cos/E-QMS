import { Response } from 'express';
import { NCRModel, NCR } from '../models/NCRModel';
import { AuthRequest, NCRStatus } from '../types';
import { validationResult } from 'express-validator';
import { addImpactScores } from '../services/ncrService';

export const createNCR = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const ncr: NCR = req.body;

    const ncrId = await NCRModel.create(ncr);

    res.status(201).json({
      message: 'NCR created successfully',
      id: ncrId,
    });
  } catch (error) {
    console.error('Create NCR error:', error);
    res.status(500).json({ error: 'Failed to create NCR' });
  }
};

export const getNCRs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, severity, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      status: status as NCRStatus | undefined,
      severity: severity as string | undefined,
    };

    const allNCRs = await NCRModel.findAll(filters);

    // Add impact scores to NCRs
    const ncrsWithImpact = addImpactScores(allNCRs);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNCRs = ncrsWithImpact.slice(startIndex, endIndex);

    res.json({
      data: paginatedNCRs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allNCRs.length,
        pages: Math.ceil(allNCRs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get NCRs error:', error);
    res.status(500).json({ error: 'Failed to get NCRs' });
  }
};

export const getNCRById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    // Add impact score
    const { addImpactScore } = require('../services/ncrService');
    const ncrWithImpact = addImpactScore(ncr);

    res.json(ncrWithImpact);
  } catch (error) {
    console.error('Get NCR error:', error);
    res.status(500).json({ error: 'Failed to get NCR' });
  }
};

export const updateNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.update(parseInt(id, 10), updates);

    res.json({ message: 'NCR updated successfully' });
  } catch (error) {
    console.error('Update NCR error:', error);
    res.status(500).json({ error: 'Failed to update NCR' });
  }
};

export const updateNCRStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    // Additional check: Only Admin and Manager can close NCRs
    if (status === 'closed') {
      const hasClosePermission = req.user.roles.some(role => 
        role === 'admin' || role === 'manager' || role === 'superuser'
      );
      if (!hasClosePermission) {
        res.status(403).json({ error: 'Only Admin and Manager can close NCRs' });
        return;
      }
    }

    await NCRModel.update(parseInt(id, 10), { status });

    res.json({ 
      message: 'NCR status updated successfully',
      status 
    });
  } catch (error) {
    console.error('Update NCR status error:', error);
    res.status(500).json({ error: 'Failed to update NCR status' });
  }
};

export const assignNCR = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { assignedTo } = req.body;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.update(parseInt(id, 10), { assignedTo });

    res.json({ 
      message: 'NCR assigned successfully',
      assignedTo 
    });
  } catch (error) {
    console.error('Assign NCR error:', error);
    res.status(500).json({ error: 'Failed to assign NCR' });
  }
};

export const deleteNCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if NCR exists
    const ncr = await NCRModel.findById(parseInt(id, 10));
    if (!ncr) {
      res.status(404).json({ error: 'NCR not found' });
      return;
    }

    await NCRModel.delete(parseInt(id, 10));

    res.json({ message: 'NCR deleted successfully' });
  } catch (error) {
    console.error('Delete NCR error:', error);
    res.status(500).json({ error: 'Failed to delete NCR' });
  }
};

export const getNCRClassificationOptions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      getAllSeverities,
      getAllSources,
      getAllTypes,
      SEVERITY_DESCRIPTIONS,
      SOURCE_DESCRIPTIONS,
      TYPE_DESCRIPTIONS,
      IMPACT_SCORES,
    } = require('../constants/ncrClassification');

    res.json({
      severities: getAllSeverities(),
      sources: getAllSources(),
      types: getAllTypes(),
      severityDescriptions: SEVERITY_DESCRIPTIONS,
      sourceDescriptions: SOURCE_DESCRIPTIONS,
      typeDescriptions: TYPE_DESCRIPTIONS,
      impactScores: IMPACT_SCORES,
    });
  } catch (error) {
    console.error('Get NCR classification options error:', error);
    res.status(500).json({ error: 'Failed to get NCR classification options' });
  }
};
