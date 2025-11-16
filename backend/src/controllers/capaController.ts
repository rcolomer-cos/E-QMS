import { Response } from 'express';
import { CAPAModel, CAPA } from '../models/CAPAModel';
import { AuthRequest, CAPAStatus } from '../types';
import { validationResult } from 'express-validator';

export const createCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const capa: CAPA = req.body;

    const capaId = await CAPAModel.create(capa);

    res.status(201).json({
      message: 'CAPA created successfully',
      id: capaId,
    });
  } catch (error) {
    console.error('Create CAPA error:', error);
    res.status(500).json({ error: 'Failed to create CAPA' });
  }
};

export const getCAPAs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      status: status as CAPAStatus | undefined,
      priority: priority as string | undefined,
    };

    const allCAPAs = await CAPAModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCAPAs = allCAPAs.slice(startIndex, endIndex);

    res.json({
      data: paginatedCAPAs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allCAPAs.length,
        pages: Math.ceil(allCAPAs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get CAPAs error:', error);
    res.status(500).json({ error: 'Failed to get CAPAs' });
  }
};

export const getCAPAById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    res.json(capa);
  } catch (error) {
    console.error('Get CAPA error:', error);
    res.status(500).json({ error: 'Failed to get CAPA' });
  }
};

export const updateCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if CAPA exists
    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    await CAPAModel.update(parseInt(id, 10), updates);

    res.json({ message: 'CAPA updated successfully' });
  } catch (error) {
    console.error('Update CAPA error:', error);
    res.status(500).json({ error: 'Failed to update CAPA' });
  }
};

export const deleteCAPA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if CAPA exists
    const capa = await CAPAModel.findById(parseInt(id, 10));
    if (!capa) {
      res.status(404).json({ error: 'CAPA not found' });
      return;
    }

    await CAPAModel.delete(parseInt(id, 10));

    res.json({ message: 'CAPA deleted successfully' });
  } catch (error) {
    console.error('Delete CAPA error:', error);
    res.status(500).json({ error: 'Failed to delete CAPA' });
  }
};
