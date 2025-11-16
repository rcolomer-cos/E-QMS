import { Response } from 'express';
import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  getEquipmentByQR,
  updateEquipment,
  deleteEquipment,
  getCalibrationDue,
  getEquipmentReadOnly,
} from '../../controllers/equipmentController';
import { EquipmentModel } from '../../models/EquipmentModel';
import { AuthRequest, UserRole, EquipmentStatus } from '../../types';
import { validationResult } from 'express-validator';
import QRCode from 'qrcode';

// Mock dependencies
jest.mock('../../models/EquipmentModel');
jest.mock('express-validator');
jest.mock('qrcode');

describe('Equipment Controller', () => {
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockAuthRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [UserRole.ADMIN],
        roleIds: [1],
      },
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('createEquipment', () => {
    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Validation error' }],
      });

      await createEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
    });

    it('should return 401 if user is not authenticated', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.user = undefined;

      await createEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 if required fields are missing', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: 'Equipment number is required and must not exceed 100 characters' },
          { msg: 'Location is required and must not exceed 200 characters' },
          { msg: 'Invalid status. Must be one of: operational, maintenance, out_of_service, calibration_due' }
        ],
      });
      mockAuthRequest.body = {
        name: 'Test Equipment',
        // Missing equipmentNumber, location, status
      };

      await createEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        errors: [
          { msg: 'Equipment number is required and must not exceed 100 characters' },
          { msg: 'Location is required and must not exceed 200 characters' },
          { msg: 'Invalid status. Must be one of: operational, maintenance, out_of_service, calibration_due' }
        ]
      });
    });

    it('should create equipment successfully with valid data', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockqrcode');
      (EquipmentModel.create as jest.Mock).mockResolvedValue(1);

      mockAuthRequest.body = {
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
        description: 'Test description',
      };

      await createEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.create).toHaveBeenCalled();
      expect(QRCode.toDataURL).toHaveBeenCalledWith('http://localhost:5173/equipment/view/EQ-001');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Equipment created successfully',
        equipmentId: 1,
        qrCode: 'data:image/png;base64,mockqrcode',
      });
    });

    it('should return 500 on database error', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockqrcode');
      (EquipmentModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      mockAuthRequest.body = {
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
      };

      await createEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create equipment' });
    });
  });

  describe('getEquipment', () => {
    it('should return all equipment', async () => {
      const mockEquipment = [
        {
          id: 1,
          equipmentNumber: 'EQ-001',
          name: 'Equipment 1',
          location: 'Lab A',
          status: EquipmentStatus.OPERATIONAL,
        },
        {
          id: 2,
          equipmentNumber: 'EQ-002',
          name: 'Equipment 2',
          location: 'Lab B',
          status: EquipmentStatus.MAINTENANCE,
        },
      ];
      (EquipmentModel.findAll as jest.Mock).mockResolvedValue(mockEquipment);

      await getEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findAll).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should filter equipment by status', async () => {
      mockAuthRequest.query = { status: EquipmentStatus.OPERATIONAL };
      const mockEquipment = [{
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Equipment 1',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
      }];
      (EquipmentModel.findAll as jest.Mock).mockResolvedValue(mockEquipment);

      await getEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findAll).toHaveBeenCalledWith({
        status: EquipmentStatus.OPERATIONAL,
        department: undefined,
      });
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should return 500 on database error', async () => {
      (EquipmentModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get equipment' });
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment by ID', async () => {
      mockAuthRequest.params = { id: '1' };
      const mockEquipment = {
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
      };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(mockEquipment);

      await getEquipmentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should return 404 if equipment not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(null);

      await getEquipmentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Equipment not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (EquipmentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getEquipmentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get equipment' });
    });
  });

  describe('updateEquipment', () => {
    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Validation error' }],
      });

      await updateEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
    });

    it('should return 404 if equipment not found', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { name: 'Updated Name' };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(null);

      await updateEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Equipment not found' });
    });

    it('should update equipment successfully', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { name: 'Updated Name' };
      const mockEquipment = {
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
      };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(mockEquipment);
      (EquipmentModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.update).toHaveBeenCalledWith(1, { name: 'Updated Name' });
      expect(mockJson).toHaveBeenCalledWith({ message: 'Equipment updated successfully' });
    });

    it('should return 500 on database error', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { name: 'Updated Name' };
      (EquipmentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update equipment' });
    });
  });

  describe('deleteEquipment', () => {
    it('should return 404 if equipment not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Equipment not found' });
    });

    it('should delete equipment successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      const mockEquipment = {
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
      };
      (EquipmentModel.findById as jest.Mock).mockResolvedValue(mockEquipment);
      (EquipmentModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Equipment deleted successfully' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (EquipmentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteEquipment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete equipment' });
    });
  });

  describe('getCalibrationDue', () => {
    it('should return equipment with calibration due within default 30 days', async () => {
      const mockEquipment = [
        {
          id: 1,
          equipmentNumber: 'EQ-001',
          name: 'Equipment 1',
          nextCalibrationDate: new Date('2024-01-15'),
          status: EquipmentStatus.CALIBRATION_DUE,
        },
      ];
      (EquipmentModel.findCalibrationDue as jest.Mock).mockResolvedValue(mockEquipment);

      await getCalibrationDue(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findCalibrationDue).toHaveBeenCalledWith(30);
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should return equipment with custom days parameter', async () => {
      mockAuthRequest.query = { days: '60' };
      const mockEquipment: any[] = [];
      (EquipmentModel.findCalibrationDue as jest.Mock).mockResolvedValue(mockEquipment);

      await getCalibrationDue(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findCalibrationDue).toHaveBeenCalledWith(60);
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should return 500 on database error', async () => {
      (EquipmentModel.findCalibrationDue as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getCalibrationDue(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get calibration due equipment' });
    });
  });

  describe('getEquipmentByQR', () => {
    it('should return equipment by QR code', async () => {
      mockAuthRequest.params = { qrCode: 'EQMS-EQ-001' };
      const mockEquipment = {
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        qrCode: 'EQMS-EQ-001',
        status: EquipmentStatus.OPERATIONAL,
      };
      (EquipmentModel.findByQRCode as jest.Mock).mockResolvedValue(mockEquipment);

      await getEquipmentByQR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findByQRCode).toHaveBeenCalledWith('EQMS-EQ-001');
      expect(mockJson).toHaveBeenCalledWith(mockEquipment);
    });

    it('should return 404 if equipment not found', async () => {
      mockAuthRequest.params = { qrCode: 'EQMS-INVALID' };
      (EquipmentModel.findByQRCode as jest.Mock).mockResolvedValue(null);

      await getEquipmentByQR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Equipment not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { qrCode: 'EQMS-EQ-001' };
      (EquipmentModel.findByQRCode as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getEquipmentByQR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get equipment' });
    });
  });

  describe('getEquipmentReadOnly', () => {
    it('should return read-only equipment data by equipment number', async () => {
      mockAuthRequest.params = { equipmentNumber: 'EQ-001' };
      const mockEquipment = {
        id: 1,
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        description: 'Test description',
        manufacturer: 'Test Manufacturer',
        model: 'Model X',
        serialNumber: 'SN-12345',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
        nextCalibrationDate: new Date('2024-06-01'),
        nextMaintenanceDate: new Date('2024-07-01'),
        purchaseDate: new Date('2023-01-01'),
        responsiblePerson: 1,
      };
      (EquipmentModel.findByEquipmentNumber as jest.Mock).mockResolvedValue(mockEquipment);

      await getEquipmentReadOnly(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(EquipmentModel.findByEquipmentNumber).toHaveBeenCalledWith('EQ-001');
      expect(mockJson).toHaveBeenCalledWith({
        equipmentNumber: 'EQ-001',
        name: 'Test Equipment',
        description: 'Test description',
        manufacturer: 'Test Manufacturer',
        model: 'Model X',
        serialNumber: 'SN-12345',
        location: 'Lab A',
        status: EquipmentStatus.OPERATIONAL,
        nextCalibrationDate: mockEquipment.nextCalibrationDate,
        nextMaintenanceDate: mockEquipment.nextMaintenanceDate,
      });
    });

    it('should return 404 if equipment not found', async () => {
      mockAuthRequest.params = { equipmentNumber: 'EQ-INVALID' };
      (EquipmentModel.findByEquipmentNumber as jest.Mock).mockResolvedValue(null);

      await getEquipmentReadOnly(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Equipment not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { equipmentNumber: 'EQ-001' };
      (EquipmentModel.findByEquipmentNumber as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getEquipmentReadOnly(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get equipment' });
    });
  });
});
