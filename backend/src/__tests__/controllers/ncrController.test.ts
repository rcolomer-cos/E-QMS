import { Response } from 'express';
import {
  createNCR,
  getNCRs,
  getNCRById,
  updateNCR,
  updateNCRStatus,
  assignNCR,
  deleteNCR,
  getNCRMetrics,
} from '../../controllers/ncrController';
import { NCRModel } from '../../models/NCRModel';
import { AuthRequest } from '../../types';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/NCRModel');
jest.mock('express-validator');

describe('NCR Controller', () => {
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
        roles: ['admin'],
        roleIds: [1],
      },
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  describe('createNCR', () => {
    it('should create NCR successfully with authenticated user', async () => {
      const mockNCRData = {
        ncrNumber: 'NCR-001',
        title: 'Test NCR',
        description: 'Test description',
        source: 'Internal Audit',
        category: 'Process',
        status: 'open',
        severity: 'major',
        detectedDate: new Date(),
        reportedBy: 1,
      };
      mockAuthRequest.body = mockNCRData;
      (NCRModel.create as jest.Mock).mockResolvedValue(1);

      await createNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.create).toHaveBeenCalledWith(mockNCRData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'NCR created successfully',
        id: 1,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 for validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid field' }],
      });

      await createNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid field' }] });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.body = { ncrNumber: 'NCR-001' };
      (NCRModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create NCR' });
    });
  });

  describe('getNCRs', () => {
    it('should return paginated NCRs', async () => {
      const mockNCRs = [
        { id: 1, ncrNumber: 'NCR-001', title: 'Test 1', severity: 'minor' },
        { id: 2, ncrNumber: 'NCR-002', title: 'Test 2', severity: 'major' },
      ];
      mockAuthRequest.query = { page: '1', limit: '10' };
      (NCRModel.findAll as jest.Mock).mockResolvedValue(mockNCRs);

      await getNCRs(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.findAll).toHaveBeenCalledWith({ status: undefined, severity: undefined });
      expect(mockJson).toHaveBeenCalledWith({
        data: [
          { ...mockNCRs[0], impactScore: 1 },
          { ...mockNCRs[1], impactScore: 5 },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockAuthRequest.query = { page: '0', limit: '10' };

      await getNCRs(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
    });

    it('should filter NCRs by status and severity', async () => {
      const mockNCRs = [{ id: 1, ncrNumber: 'NCR-001', status: 'open', severity: 'major' }];
      mockAuthRequest.query = { status: 'open', severity: 'major', page: '1', limit: '10' };
      (NCRModel.findAll as jest.Mock).mockResolvedValue(mockNCRs);

      await getNCRs(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.findAll).toHaveBeenCalledWith({ status: 'open', severity: 'major' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.query = { page: '1', limit: '10' };
      (NCRModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getNCRs(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get NCRs' });
    });
  });

  describe('getNCRById', () => {
    it('should return NCR by ID', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001', title: 'Test NCR', severity: 'critical' };
      mockAuthRequest.params = { id: '1' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);

      await getNCRById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ ...mockNCR, impactScore: 10 });
    });

    it('should return 404 if NCR not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(null);

      await getNCRById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (NCRModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getNCRById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get NCR' });
    });
  });

  describe('updateNCR', () => {
    it('should update NCR successfully', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { title: 'Updated Title' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.update).toHaveBeenCalledWith(1, { title: 'Updated Title' });
      expect(mockJson).toHaveBeenCalledWith({ message: 'NCR updated successfully' });
    });

    it('should return 404 if NCR not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { title: 'Updated Title' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(null);

      await updateNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR not found' });
    });

    it('should return 400 for validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid field' }],
      });

      await updateNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 500 on database error', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { title: 'Updated Title' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update NCR' });
    });
  });

  describe('updateNCRStatus', () => {
    it('should update NCR status successfully for admin', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001', status: 'open' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'in_progress' };
      mockAuthRequest.user = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.update).toHaveBeenCalledWith(1, { status: 'in_progress' });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'NCR status updated successfully',
        status: 'in_progress',
      });
    });

    it('should allow admin to close NCR', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001', status: 'resolved' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'closed' };
      mockAuthRequest.user = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.update).toHaveBeenCalledWith(1, { status: 'closed' });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'NCR status updated successfully',
        status: 'closed',
      });
    });

    it('should allow manager to close NCR', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001', status: 'resolved' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'closed' };
      mockAuthRequest.user = {
        id: 2,
        email: 'manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        roles: ['manager'],
        roleIds: [2],
      };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.update).toHaveBeenCalledWith(1, { status: 'closed' });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'NCR status updated successfully',
        status: 'closed',
      });
    });

    it('should prevent auditor from closing NCR', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001', status: 'resolved' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'closed' };
      mockAuthRequest.user = {
        id: 3,
        email: 'auditor@example.com',
        firstName: 'Auditor',
        lastName: 'User',
        roles: ['auditor'],
        roleIds: [3],
      };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Only Admin and Manager can close NCRs' });
      expect(NCRModel.update).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if NCR not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { status: 'in_progress' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(null);

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR not found' });
    });

    it('should return 500 on database error', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'in_progress' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateNCRStatus(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update NCR status' });
    });
  });

  describe('assignNCR', () => {
    it('should assign NCR successfully', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { assignedTo: 5 };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockResolvedValue(undefined);

      await assignNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.update).toHaveBeenCalledWith(1, { assignedTo: 5 });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'NCR assigned successfully',
        assignedTo: 5,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await assignNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if NCR not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { assignedTo: 5 };
      (NCRModel.findById as jest.Mock).mockResolvedValue(null);

      await assignNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR not found' });
    });

    it('should return 400 for validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid assignedTo' }],
      });

      await assignNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 500 on database error', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { assignedTo: 5 };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await assignNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to assign NCR' });
    });
  });

  describe('deleteNCR', () => {
    it('should delete NCR successfully', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ message: 'NCR deleted successfully' });
    });

    it('should return 404 if NCR not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR not found' });
    });

    it('should return 500 on database error', async () => {
      const mockNCR = { id: 1, ncrNumber: 'NCR-001' };
      mockAuthRequest.params = { id: '1' };
      (NCRModel.findById as jest.Mock).mockResolvedValue(mockNCR);
      (NCRModel.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete NCR' });
    });
  });

  describe('getNCRMetrics', () => {
    it('should return NCR metrics successfully', async () => {
      const mockMetrics = {
        totalOpen: 5,
        totalInProgress: 3,
        totalResolved: 2,
        totalClosed: 10,
        totalRejected: 1,
        bySeverity: [
          { severity: 'critical', count: 2 },
          { severity: 'major', count: 5 },
          { severity: 'minor', count: 3 },
        ],
        byCategory: [
          { category: 'Product Quality', count: 4 },
          { category: 'Process', count: 3 },
        ],
        bySource: [
          { source: 'Internal Audit', count: 6 },
          { source: 'Customer Complaint', count: 4 },
        ],
        monthlyTrend: [
          { month: '2024-01', count: 5 },
          { month: '2024-02', count: 7 },
        ],
        averageClosureTime: 15,
      };
      (NCRModel.getMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      await getNCRMetrics(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(NCRModel.getMetrics).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockMetrics);
    });

    it('should return 500 on database error', async () => {
      (NCRModel.getMetrics as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getNCRMetrics(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get NCR metrics' });
    });
  });
});
