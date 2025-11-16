import { Response } from 'express';
import { InspectionRecordModel, InspectionRecord, InspectionStatus, InspectionResult } from '../models/InspectionRecordModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export const createInspectionRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const record: InspectionRecord = req.body;

    const recordId = await InspectionRecordModel.create(record);

    res.status(201).json({
      message: 'Inspection record created successfully',
      id: recordId,
    });
  } catch (error) {
    console.error('Create inspection record error:', error);
    res.status(500).json({ error: 'Failed to create inspection record' });
  }
};

export const getInspectionRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, status, result, inspectionType, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      equipmentId: equipmentId ? parseInt(equipmentId as string, 10) : undefined,
      status: status as InspectionStatus | undefined,
      result: result as InspectionResult | undefined,
      inspectionType: inspectionType as string | undefined,
    };

    const allRecords = await InspectionRecordModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    res.json({
      data: paginatedRecords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allRecords.length,
        pages: Math.ceil(allRecords.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inspection records error:', error);
    res.status(500).json({ error: 'Failed to get inspection records' });
  }
};

export const getInspectionRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await InspectionRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Inspection record not found' });
      return;
    }

    res.json(record);
  } catch (error) {
    console.error('Get inspection record error:', error);
    res.status(500).json({ error: 'Failed to get inspection record' });
  }
};

export const updateInspectionRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if record exists
    const record = await InspectionRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Inspection record not found' });
      return;
    }

    await InspectionRecordModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Inspection record updated successfully' });
  } catch (error) {
    console.error('Update inspection record error:', error);
    res.status(500).json({ error: 'Failed to update inspection record' });
  }
};

export const deleteInspectionRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if record exists
    const record = await InspectionRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Inspection record not found' });
      return;
    }

    await InspectionRecordModel.delete(parseInt(id, 10));

    res.json({ message: 'Inspection record deleted successfully' });
  } catch (error) {
    console.error('Delete inspection record error:', error);
    res.status(500).json({ error: 'Failed to delete inspection record' });
  }
};
