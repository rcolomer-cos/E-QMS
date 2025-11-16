import { Response } from 'express';
import { ServiceMaintenanceRecordModel, ServiceMaintenanceRecord, ServiceStatus, ServiceType } from '../models/ServiceMaintenanceRecordModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createServiceMaintenanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const record: ServiceMaintenanceRecord = req.body;

    const recordId = await ServiceMaintenanceRecordModel.create(record);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.SERVICE_MAINTENANCE,
      entityType: 'ServiceMaintenanceRecord',
      entityId: recordId,
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.serviceType}`,
      newValues: record,
    });

    res.status(201).json({
      message: 'Service/Maintenance record created successfully',
      id: recordId,
    });
  } catch (error) {
    console.error('Create service/maintenance record error:', error);
    res.status(500).json({ error: 'Failed to create service/maintenance record' });
  }
};

export const getServiceMaintenanceRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentId, status, serviceType, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      equipmentId: equipmentId ? parseInt(equipmentId as string, 10) : undefined,
      status: status as ServiceStatus | undefined,
      serviceType: serviceType as ServiceType | undefined,
    };

    const allRecords = await ServiceMaintenanceRecordModel.findAll(filters);

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
    console.error('Get service/maintenance records error:', error);
    res.status(500).json({ error: 'Failed to get service/maintenance records' });
  }
};

export const getServiceMaintenanceRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await ServiceMaintenanceRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Service/Maintenance record not found' });
      return;
    }

    res.json(record);
  } catch (error) {
    console.error('Get service/maintenance record error:', error);
    res.status(500).json({ error: 'Failed to get service/maintenance record' });
  }
};

export const updateServiceMaintenanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const record = await ServiceMaintenanceRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Service/Maintenance record not found' });
      return;
    }

    await ServiceMaintenanceRecordModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SERVICE_MAINTENANCE,
      entityType: 'ServiceMaintenanceRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.serviceType}`,
      oldValues: record,
      newValues: updates,
    });

    res.json({ message: 'Service/Maintenance record updated successfully' });
  } catch (error) {
    console.error('Update service/maintenance record error:', error);
    res.status(500).json({ error: 'Failed to update service/maintenance record' });
  }
};

export const deleteServiceMaintenanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if record exists
    const record = await ServiceMaintenanceRecordModel.findById(parseInt(id, 10));
    if (!record) {
      res.status(404).json({ error: 'Service/Maintenance record not found' });
      return;
    }

    await ServiceMaintenanceRecordModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.SERVICE_MAINTENANCE,
      entityType: 'ServiceMaintenanceRecord',
      entityId: parseInt(id, 10),
      entityIdentifier: `Equipment ${record.equipmentId} - ${record.serviceType}`,
      oldValues: record,
    });

    res.json({ message: 'Service/Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Delete service/maintenance record error:', error);
    res.status(500).json({ error: 'Failed to delete service/maintenance record' });
  }
};
