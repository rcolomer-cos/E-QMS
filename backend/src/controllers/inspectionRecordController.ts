import { Response } from 'express';
import { InspectionRecordModel, InspectionRecord, InspectionStatus, InspectionResult } from '../models/InspectionRecordModel';
import { NCRModel, NCR } from '../models/NCRModel';
import { AuthRequest, NCRStatus } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

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

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionRecord',
      entityId: recordId,
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.inspectionType}`,
      newValues: record,
    });

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

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.inspectionType}`,
      oldValues: record,
      newValues: updates,
    });

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

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.inspectionType}`,
      oldValues: record,
    });

    res.json({ message: 'Inspection record deleted successfully' });
  } catch (error) {
    console.error('Delete inspection record error:', error);
    res.status(500).json({ error: 'Failed to delete inspection record' });
  }
};

export const createNCRFromInspection = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const inspectionRecordId = parseInt(id, 10);

    // Check if inspection record exists
    const inspectionRecord = await InspectionRecordModel.findById(inspectionRecordId);
    if (!inspectionRecord) {
      res.status(404).json({ error: 'Inspection record not found' });
      return;
    }

    // Generate NCR number
    const timestamp = Date.now();
    const ncrNumber = `NCR-INS-${inspectionRecordId}-${timestamp}`;

    // Prepare NCR data from inspection record
    const ncrData: NCR = {
      ncrNumber,
      title: req.body.title || `Failed Inspection - Equipment ${inspectionRecord.equipmentId} - ${inspectionRecord.inspectionType}`,
      description: req.body.description || 
        `Non-conformance detected during inspection.\n\nInspection Type: ${inspectionRecord.inspectionType}\nInspection Date: ${new Date(inspectionRecord.inspectionDate).toLocaleDateString()}\n\nFindings: ${inspectionRecord.findings || 'N/A'}\nDefects Found: ${inspectionRecord.defectsFound || 'N/A'}`,
      source: req.body.source || 'inspection',
      category: req.body.category || 'product',
      status: NCRStatus.OPEN,
      severity: req.body.severity || inspectionRecord.severity || 'major',
      detectedDate: new Date(inspectionRecord.inspectionDate),
      reportedBy: req.user.id,
      assignedTo: req.body.assignedTo,
      inspectionRecordId,
    };

    // Create NCR
    const ncrId = await NCRModel.create(ncrData);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.NCR,
      entityType: 'NCR',
      entityId: ncrId,
      entityIdentifier: ncrNumber,
      newValues: ncrData,
      actionDescription: `NCR created from inspection record ${inspectionRecordId}`,
    });

    res.status(201).json({
      message: 'NCR created successfully from inspection record',
      id: ncrId,
      ncrNumber,
    });
  } catch (error) {
    console.error('Create NCR from inspection error:', error);
    res.status(500).json({ error: 'Failed to create NCR from inspection record' });
  }
};
