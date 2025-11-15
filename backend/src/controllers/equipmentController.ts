import { Response } from 'express';
import { EquipmentModel, Equipment } from '../models/EquipmentModel';
import { AuthRequest } from '../types';
import QRCode from 'qrcode';

export const createEquipment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
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

export const getEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { status, department } = req.query;

    const equipment = await EquipmentModel.findAll({
      status: status as any,
      department: department as string,
    });

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const getEquipmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const equipment = await EquipmentModel.findById(parseInt(id, 10));
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const getEquipmentByQR = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.params;

    const equipment = await EquipmentModel.findByQRCode(qrCode);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment by QR error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await EquipmentModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await EquipmentModel.delete(parseInt(id, 10));

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
};

export const getCalibrationDue = async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const equipment = await EquipmentModel.findCalibrationDue(days);

    res.json(equipment);
  } catch (error) {
    console.error('Get calibration due error:', error);
    res.status(500).json({ error: 'Failed to get calibration due equipment' });
  }
};
