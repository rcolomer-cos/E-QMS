import { Response } from 'express';
import { AuthRequest } from '../../types';
import {
  createRisk,
  getRisks,
  getRiskById,
  updateRisk,
  updateRiskStatus,
  deleteRisk,
  getRiskStatistics,
} from '../../controllers/riskController';
import { RiskModel } from '../../models/RiskModel';
import { logCreate, logUpdate, logDelete } from '../../services/auditLogService';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/RiskModel');
jest.mock('../../services/auditLogService');
jest.mock('express-validator');

describe('riskController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      user: { 
        id: 1, 
        email: 'testuser@example.com', 
        firstName: 'Test',
        lastName: 'User',
        roles: ['ADMIN'],
        roleIds: [1]
      },
      body: {},
      params: {},
      query: {},
    };

    jest.clearAllMocks();
    (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  describe('createRisk', () => {
    it('should create a new risk successfully', async () => {
      const riskData = {
        riskNumber: 'RISK-2024-001',
        title: 'Test Risk',
        description: 'Test description',
        category: 'operational',
        likelihood: 3,
        impact: 4,
        riskOwner: 5,
        status: 'identified',
        identifiedDate: new Date('2024-01-15'),
      };

      mockRequest.body = riskData;
      (RiskModel.create as jest.Mock).mockResolvedValue(1);

      await createRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...riskData,
          createdBy: 1,
        })
      );
      expect(logCreate).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Risk created successfully',
        id: 1,
      });
    });

    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid input' }],
      });

      await createRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await createRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should handle errors gracefully', async () => {
      mockRequest.body = { riskNumber: 'RISK-2024-001' };
      (RiskModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create risk' });
    });
  });

  describe('getRisks', () => {
    it('should return all risks with filters', async () => {
      const mockRisks = [
        { id: 1, riskNumber: 'RISK-001', title: 'Risk 1' },
        { id: 2, riskNumber: 'RISK-002', title: 'Risk 2' },
      ];

      mockRequest.query = {
        status: 'monitoring',
        riskLevel: 'high',
        sortBy: 'riskScore',
        sortOrder: 'DESC',
      };

      (RiskModel.findAll as jest.Mock).mockResolvedValue(mockRisks);

      await getRisks(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'monitoring', riskLevel: 'high' }),
        expect.objectContaining({ sortBy: 'riskScore', sortOrder: 'DESC' })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        data: mockRisks,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      (RiskModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getRisks(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to get risks' });
    });
  });

  describe('getRiskById', () => {
    it('should return a specific risk', async () => {
      const mockRisk = { id: 1, riskNumber: 'RISK-001', title: 'Test Risk' };
      mockRequest.params = { id: '1' };

      (RiskModel.findById as jest.Mock).mockResolvedValue(mockRisk);

      await getRiskById(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.findById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockRisk);
    });

    it('should return 404 if risk not found', async () => {
      mockRequest.params = { id: '999' };
      (RiskModel.findById as jest.Mock).mockResolvedValue(null);

      await getRiskById(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Risk not found' });
    });
  });

  describe('updateRisk', () => {
    it('should update a risk successfully', async () => {
      const mockRisk = { id: 1, riskNumber: 'RISK-001', title: 'Original Title' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { title: 'Updated Title', likelihood: 2 };

      (RiskModel.findById as jest.Mock).mockResolvedValue(mockRisk);
      (RiskModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.update).toHaveBeenCalledWith(1, mockRequest.body);
      expect(logUpdate).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Risk updated successfully' });
    });

    it('should return 404 if risk not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { title: 'Updated Title' };
      (RiskModel.findById as jest.Mock).mockResolvedValue(null);

      await updateRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Risk not found' });
    });
  });

  describe('updateRiskStatus', () => {
    it('should update risk status successfully', async () => {
      const mockRisk = { id: 1, riskNumber: 'RISK-001', status: 'identified' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'monitoring' };

      (RiskModel.findById as jest.Mock).mockResolvedValue(mockRisk);
      (RiskModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateRiskStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.update).toHaveBeenCalledWith(1, { status: 'monitoring' });
      expect(logUpdate).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Risk status updated successfully',
        status: 'monitoring',
      });
    });

    it('should prevent non-admin/manager from closing risks', async () => {
      const mockRisk = { id: 1, riskNumber: 'RISK-001', status: 'monitoring' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'closed' };
      mockRequest.user = { 
        id: 1, 
        email: 'auditor@example.com',
        firstName: 'Auditor',
        lastName: 'User',
        roles: ['AUDITOR'],
        roleIds: [3]
      };

      (RiskModel.findById as jest.Mock).mockResolvedValue(mockRisk);

      await updateRiskStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Only Admin and Manager can close or accept risks',
      });
    });
  });

  describe('deleteRisk', () => {
    it('should delete a risk successfully', async () => {
      const mockRisk = { id: 1, riskNumber: 'RISK-001', title: 'Test Risk' };
      mockRequest.params = { id: '1' };

      (RiskModel.findById as jest.Mock).mockResolvedValue(mockRisk);
      (RiskModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.delete).toHaveBeenCalledWith(1);
      expect(logDelete).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Risk deleted successfully' });
    });

    it('should return 404 if risk not found', async () => {
      mockRequest.params = { id: '999' };
      (RiskModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteRisk(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Risk not found' });
    });
  });

  describe('getRiskStatistics', () => {
    it('should return risk statistics', async () => {
      const mockStats = {
        totalRisks: 25,
        byStatus: { identified: 5, monitoring: 10, closed: 10 },
        byLevel: { low: 5, medium: 10, high: 8, critical: 2 },
        byCategory: { operational: 15, financial: 10 },
      };

      (RiskModel.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getRiskStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(RiskModel.getStatistics).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockStats);
    });

    it('should handle errors gracefully', async () => {
      (RiskModel.getStatistics as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getRiskStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to get risk statistics' });
    });
  });
});
