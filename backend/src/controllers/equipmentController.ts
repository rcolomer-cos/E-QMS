import { Response } from 'express';
import { EquipmentModel, Equipment } from '../models/EquipmentModel';
import { AuthRequest, EquipmentStatus } from '../types';
import QRCode from 'qrcode';
import { validationResult } from 'express-validator';

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

    // Generate QR code
    const qrData = `EQMS-${equipment.equipmentNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);
    equipment.qrCode = qrCode;

    const equipmentId = await EquipmentModel.create(equipment);

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

export const getEquipmentByQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrCode } = req.params;

    const equipment = await EquipmentModel.findByQRCode(qrCode);
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment by QR error:', error);
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

    // Check if equipment exists
    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    await EquipmentModel.update(parseInt(id, 10), updates);

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
