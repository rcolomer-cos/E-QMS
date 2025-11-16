import { Response } from 'express';
import { NCRModel, NCR } from '../models/NCRModel';
import { AuthRequest, NCRStatus } from '../types';
import { validationResult } from 'express-validator';

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

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNCRs = allNCRs.slice(startIndex, endIndex);

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

    res.json(ncr);
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
