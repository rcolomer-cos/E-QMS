import { Response } from 'express';
import { AuthRequest } from '../../types';
import {
  createSupplierEvaluation,
  getSupplierEvaluations,
  getSupplierEvaluationById,
  getEvaluationsBySupplier,
  updateSupplierEvaluation,
  updateSupplierEvaluationStatus,
  deleteSupplierEvaluation,
  getSupplierEvaluationStatistics,
} from '../../controllers/supplierEvaluationController';
import { SupplierEvaluationModel } from '../../models/SupplierEvaluationModel';
import { logCreate, logUpdate, logDelete } from '../../services/auditLogService';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/SupplierEvaluationModel');
jest.mock('../../services/auditLogService');
jest.mock('express-validator');

describe('supplierEvaluationController', () => {
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
        roleIds: [1],
      },
      body: {},
      params: {},
      query: {},
    };

    jest.clearAllMocks();
    (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  describe('createSupplierEvaluation', () => {
    it('should create a new supplier evaluation successfully', async () => {
      const evaluationData = {
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-001',
        evaluationDate: new Date('2024-01-15'),
        evaluationType: 'Annual',
        qualityRating: 4,
        onTimeDeliveryRate: 92.5,
        complianceStatus: 'Compliant',
        evaluationStatus: 'draft',
      };

      mockRequest.body = evaluationData;
      (SupplierEvaluationModel.create as jest.Mock).mockResolvedValue(1);

      await createSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...evaluationData,
          evaluatedBy: 1,
          createdBy: 1,
        })
      );
      expect(logCreate).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Supplier evaluation created successfully',
        id: 1,
      });
    });

    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid input' }],
      });

      await createSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await createSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should handle errors gracefully', async () => {
      mockRequest.body = { evaluationNumber: 'EVAL-2024-001' };
      (SupplierEvaluationModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create supplier evaluation' });
    });
  });

  describe('getSupplierEvaluations', () => {
    it('should return all supplier evaluations with filters', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            supplierId: 1,
            evaluationNumber: 'EVAL-2024-001',
            qualityRating: 4,
            onTimeDeliveryRate: 92.5,
            complianceStatus: 'Compliant',
            overallScore: 88.5,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockRequest.query = { complianceStatus: 'Compliant', page: '1', limit: '10' };
      (SupplierEvaluationModel.findAll as jest.Mock).mockResolvedValue(mockResult);

      await getSupplierEvaluations(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ complianceStatus: 'Compliant' }),
        expect.any(Object),
        1,
        10
      );
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockRequest.query = { page: '0', limit: '10' };

      await getSupplierEvaluations(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
    });

    it('should return 400 for invalid sortBy parameter', async () => {
      mockRequest.query = { sortBy: 'invalidField' };

      await getSupplierEvaluations(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.stringContaining('Invalid sortBy parameter'),
      });
    });
  });

  describe('getSupplierEvaluationById', () => {
    it('should return a supplier evaluation by ID', async () => {
      const mockEvaluation = {
        id: 1,
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-001',
        qualityRating: 4,
        onTimeDeliveryRate: 92.5,
        complianceStatus: 'Compliant',
        overallScore: 88.5,
      };

      mockRequest.params = { id: '1' };
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(mockEvaluation);

      await getSupplierEvaluationById(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.findById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockEvaluation);
    });

    it('should return 404 if evaluation not found', async () => {
      mockRequest.params = { id: '999' };
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(null);

      await getSupplierEvaluationById(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Supplier evaluation not found' });
    });
  });

  describe('getEvaluationsBySupplier', () => {
    it('should return all evaluations for a supplier', async () => {
      const mockEvaluations = [
        {
          id: 1,
          supplierId: 1,
          evaluationNumber: 'EVAL-2024-001',
          qualityRating: 4,
          overallScore: 88.5,
        },
        {
          id: 2,
          supplierId: 1,
          evaluationNumber: 'EVAL-2024-002',
          qualityRating: 5,
          overallScore: 95.0,
        },
      ];

      mockRequest.params = { supplierId: '1' };
      (SupplierEvaluationModel.findBySupplier as jest.Mock).mockResolvedValue(mockEvaluations);

      await getEvaluationsBySupplier(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.findBySupplier).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockEvaluations);
    });
  });

  describe('updateSupplierEvaluation', () => {
    it('should update a supplier evaluation successfully', async () => {
      const existingEvaluation = {
        id: 1,
        evaluationNumber: 'EVAL-2024-001',
        qualityRating: 4,
        evaluationStatus: 'draft',
      };

      const updates = {
        qualityRating: 5,
        overallScore: 95.0,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updates;
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(existingEvaluation);
      (SupplierEvaluationModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.update).toHaveBeenCalledWith(1, updates);
      expect(logUpdate).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Supplier evaluation updated successfully' });
    });

    it('should return 404 if evaluation not found', async () => {
      mockRequest.params = { id: '999' };
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(null);

      await updateSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Supplier evaluation not found' });
    });
  });

  describe('updateSupplierEvaluationStatus', () => {
    it('should update evaluation status successfully', async () => {
      const existingEvaluation = {
        id: 1,
        evaluationNumber: 'EVAL-2024-001',
        evaluationStatus: 'draft',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'approved' };
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(existingEvaluation);
      (SupplierEvaluationModel.updateStatus as jest.Mock).mockResolvedValue(undefined);

      await updateSupplierEvaluationStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.updateStatus).toHaveBeenCalledWith(1, 'approved', 1);
      expect(logUpdate).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Supplier evaluation status updated successfully' });
    });
  });

  describe('deleteSupplierEvaluation', () => {
    it('should delete a supplier evaluation successfully', async () => {
      const existingEvaluation = {
        id: 1,
        evaluationNumber: 'EVAL-2024-001',
        evaluationStatus: 'draft',
      };

      mockRequest.params = { id: '1' };
      (SupplierEvaluationModel.findById as jest.Mock).mockResolvedValue(existingEvaluation);
      (SupplierEvaluationModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteSupplierEvaluation(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.delete).toHaveBeenCalledWith(1);
      expect(logDelete).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Supplier evaluation deleted successfully' });
    });
  });

  describe('getSupplierEvaluationStatistics', () => {
    it('should return statistics for a specific supplier', async () => {
      const mockStats = {
        totalEvaluations: 10,
        avgQualityRating: 4.2,
        avgOnTimeDeliveryRate: 92.5,
        avgOverallScore: 87.3,
        compliantCount: 8,
        nonCompliantCount: 2,
      };

      mockRequest.query = { supplierId: '1' };
      (SupplierEvaluationModel.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getSupplierEvaluationStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.getStatistics).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockStats);
    });

    it('should return statistics for all suppliers', async () => {
      const mockStats = {
        totalEvaluations: 25,
        avgQualityRating: 4.0,
        avgOnTimeDeliveryRate: 90.0,
        avgOverallScore: 85.0,
      };

      mockRequest.query = {};
      (SupplierEvaluationModel.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getSupplierEvaluationStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(SupplierEvaluationModel.getStatistics).toHaveBeenCalledWith(undefined);
      expect(jsonMock).toHaveBeenCalledWith(mockStats);
    });
  });
});
