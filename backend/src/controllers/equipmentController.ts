import { Response } from 'express';
import { EquipmentModel, Equipment } from '../models/EquipmentModel';
import { AuthRequest, EquipmentStatus } from '../types';
import QRCode from 'qrcode';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createEquipment = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const equipment: Equipment = req.body;

    // Handle image upload if present
    if (req.file) {
      console.log('File uploaded:', req.file.filename);
      equipment.imagePath = `uploads/equipment/${req.file.filename}`;
      console.log('Image path set to:', equipment.imagePath);
    }

    const equipmentId = await EquipmentModel.create(equipment);

    // Generate QR code on-the-fly (not stored in database)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/equipment/view/${equipment.equipmentNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.EQUIPMENT,
      entityType: 'Equipment',
      entityId: equipmentId,
      entityIdentifier: equipment.equipmentNumber,
      newValues: equipment,
    });

    res.status(201).json({
      message: 'Equipment created successfully',
      equipmentId,
      qrCode,
    });
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
};

export const getEquipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, department } = req.query;

    const equipment = await EquipmentModel.findAll({
      status: status as EquipmentStatus | undefined,
      department: department as string | undefined,
    });

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const getEquipmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Handle image upload if present
    if (req.file) {
      console.log('File uploaded for update:', req.file.filename);
      updates.imagePath = `uploads/equipment/${req.file.filename}`;
      console.log('Image path set to:', updates.imagePath);
    } else {
      console.log('No file uploaded, updates:', Object.keys(updates));
    }

    // Check if equipment exists
    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    await EquipmentModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.EQUIPMENT,
      entityType: 'Equipment',
      entityId: parseInt(id, 10),
      entityIdentifier: equipment.equipmentNumber,
      oldValues: equipment,
      newValues: updates,
    });

    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if equipment exists
    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    await EquipmentModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.EQUIPMENT,
      entityType: 'Equipment',
      entityId: parseInt(id, 10),
      entityIdentifier: equipment.equipmentNumber,
      oldValues: equipment,
    });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
};

export const getCalibrationDue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const equipment = await EquipmentModel.findCalibrationDue(days);

    res.json(equipment);
  } catch (error) {
    console.error('Get calibration due error:', error);
    res.status(500).json({ error: 'Failed to get calibration due equipment' });
  }
};

export const getEquipmentReadOnly = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { equipmentNumber } = req.params;

    const equipment = await EquipmentModel.findByEquipmentNumber(equipmentNumber);
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    // Return only essential, non-sensitive information for read-only public access
    const readOnlyData = {
      equipmentNumber: equipment.equipmentNumber,
      name: equipment.name,
      description: equipment.description,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      location: equipment.location,
      status: equipment.status,
      nextCalibrationDate: equipment.nextCalibrationDate,
      nextMaintenanceDate: equipment.nextMaintenanceDate,
    };

    res.json(readOnlyData);
  } catch (error) {
    console.error('Get equipment read-only error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const regenerateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if equipment exists
    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    // Generate QR code on-the-fly (not stored in database)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/equipment/view/${equipment.equipmentNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.json({
      message: 'QR code generated successfully',
      qrCode,
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export const getEquipmentMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const upcomingDays = req.query.upcomingDays ? parseInt(req.query.upcomingDays as string, 10) : 30;
    const { department } = req.query;

    const filters: { department?: string } = {};
    if (department) {
      filters.department = department as string;
    }

    const metrics = await EquipmentModel.getEquipmentOverviewMetrics(upcomingDays, filters);

    res.json(metrics);
  } catch (error) {
    console.error('Get equipment metrics error:', error);
    res.status(500).json({ error: 'Failed to get equipment metrics' });
  }
};
