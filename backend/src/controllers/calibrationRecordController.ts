import { Response } from 'express';
import { CalibrationRecordModel, CalibrationRecord, CalibrationStatus, CalibrationResult } from '../models/CalibrationRecordModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createCalibrationRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const record: CalibrationRecord = req.body;

    const recordId = await CalibrationRecordModel.create(record);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.CALIBRATION,
      entityType: 'CalibrationRecord',
      entityId: recordId,
      entityIdentifier: `Equipment ${record.equipmentId}`,
      newValues: record,
    });

    res.status(201).json({
      message: 'Calibration record created successfully',
      id: recordId,
    });
  } catch (error) {
    console.error('Create calibration record error:', error);
    res.status(500).json({ error: 'Failed to create calibration record' });
  }
};

export const getCalibrationRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, status, result, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      equipmentId: equipmentId ? parseInt(equipmentId as string, 10) : undefined,
      status: status as CalibrationStatus | undefined,
      result: result as CalibrationResult | undefined,
    };

    const allRecords = await CalibrationRecordModel.findAll(filters);

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
    console.error('Get calibration records error:', error);
    res.status(500).json({ error: 'Failed to get calibration records' });
  }
};

export const getCalibrationRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await CalibrationRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Calibration record not found' });
      return;
    }

    res.json(record);
  } catch (error) {
    console.error('Get calibration record error:', error);
    res.status(500).json({ error: 'Failed to get calibration record' });
  }
};

export const updateCalibrationRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const record = await CalibrationRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Calibration record not found' });
      return;
    }

    await CalibrationRecordModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.CALIBRATION,
      entityType: 'CalibrationRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId}`,
      oldValues: record,
      newValues: updates,
    });

    res.json({ message: 'Calibration record updated successfully' });
  } catch (error) {
    console.error('Update calibration record error:', error);
    res.status(500).json({ error: 'Failed to update calibration record' });
  }
};

export const deleteCalibrationRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if record exists
    const record = await CalibrationRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Calibration record not found' });
      return;
    }

    await CalibrationRecordModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.CALIBRATION,
      entityType: 'CalibrationRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId}`,
      oldValues: record,
    });

    res.json({ message: 'Calibration record deleted successfully' });
  } catch (error) {
    console.error('Delete calibration record error:', error);
    res.status(500).json({ error: 'Failed to delete calibration record' });
  }
};
