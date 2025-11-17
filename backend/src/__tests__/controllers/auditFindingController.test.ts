import { Response } from 'express';
import {
  createAuditFinding,
  getAuditFindings,
  getAuditFindingById,
  getAuditFindingsByAuditId,
  updateAuditFinding,
  deleteAuditFinding,
  linkFindingToNCR,
  getAuditFindingStats,
} from '../../controllers/auditFindingController';
import { AuditFindingModel } from '../../models/AuditFindingModel';
import { AuthRequest } from '../../types';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/AuditFindingModel');
jest.mock('express-validator');

describe('AuditFinding Controller', () => {
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
        roles: ['auditor'],
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

  describe('createAuditFinding', () => {
    it('should create audit finding successfully with authenticated user', async () => {
      const mockFindingData = {
        findingNumber: 'FND-001',
        auditId: 1,
        title: 'Test Finding',
        description: 'Test description',
        category: 'Process',
        severity: 'major',
        status: 'open',
        identifiedDate: new Date(),
        requiresNCR: false,
      };
      mockAuthRequest.body = mockFindingData;
      (AuditFindingModel.create as jest.Mock).mockResolvedValue(1);

      await createAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.create).toHaveBeenCalledWith({
        ...mockFindingData,
        createdBy: 1,
        identifiedBy: 1,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Audit finding created successfully',
        findingId: 1,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 for validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid field' }],
      });

      await createAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid field' }] });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.body = { findingNumber: 'FND-001' };
      (AuditFindingModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create audit finding' });
    });
  });

  describe('getAuditFindings', () => {
    it('should get all audit findings with filters', async () => {
      const mockFindings = [
        { id: 1, findingNumber: 'FND-001', title: 'Finding 1' },
        { id: 2, findingNumber: 'FND-002', title: 'Finding 2' },
      ];
      mockAuthRequest.query = { status: 'open', severity: 'major' };
      (AuditFindingModel.findAll as jest.Mock).mockResolvedValue(mockFindings);

      await getAuditFindings(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.findAll).toHaveBeenCalledWith({
        status: 'open',
        severity: 'major',
        auditId: undefined,
        assignedTo: undefined,
        category: undefined,
      });
      expect(mockJson).toHaveBeenCalledWith(mockFindings);
    });

    it('should return 500 on database error', async () => {
      (AuditFindingModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAuditFindings(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get audit findings' });
    });
  });

  describe('getAuditFindingById', () => {
    it('should get audit finding by id successfully', async () => {
      const mockFinding = { id: 1, findingNumber: 'FND-001', title: 'Finding 1' };
      mockAuthRequest.params = { id: '1' };
      (AuditFindingModel.findById as jest.Mock).mockResolvedValue(mockFinding);

      await getAuditFindingById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(mockFinding);
    });

    it('should return 404 if finding not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (AuditFindingModel.findById as jest.Mock).mockResolvedValue(null);

      await getAuditFindingById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Audit finding not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditFindingModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAuditFindingById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get audit finding' });
    });
  });

  describe('getAuditFindingsByAuditId', () => {
    it('should get findings by audit id successfully', async () => {
      const mockFindings = [
        { id: 1, findingNumber: 'FND-001', auditId: 5 },
        { id: 2, findingNumber: 'FND-002', auditId: 5 },
      ];
      mockAuthRequest.params = { auditId: '5' };
      (AuditFindingModel.findByAuditId as jest.Mock).mockResolvedValue(mockFindings);

      await getAuditFindingsByAuditId(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.findByAuditId).toHaveBeenCalledWith(5);
      expect(mockJson).toHaveBeenCalledWith(mockFindings);
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { auditId: '5' };
      (AuditFindingModel.findByAuditId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAuditFindingsByAuditId(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get audit findings' });
    });
  });

  describe('updateAuditFinding', () => {
    it('should update audit finding successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'resolved', recommendations: 'Updated recommendations' };
      (AuditFindingModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.update).toHaveBeenCalledWith(1, {
        status: 'resolved',
        recommendations: 'Updated recommendations',
      });
      expect(mockJson).toHaveBeenCalledWith({ message: 'Audit finding updated successfully' });
    });

    it('should return 400 for validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid field' }],
      });

      await updateAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid field' }] });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'resolved' };
      (AuditFindingModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update audit finding' });
    });
  });

  describe('deleteAuditFinding', () => {
    it('should delete audit finding successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditFindingModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Audit finding deleted successfully' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditFindingModel.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteAuditFinding(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete audit finding' });
    });
  });

  describe('linkFindingToNCR', () => {
    it('should link finding to NCR successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { ncrId: 5 };
      (AuditFindingModel.linkToNCR as jest.Mock).mockResolvedValue(undefined);

      await linkFindingToNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.linkToNCR).toHaveBeenCalledWith(1, 5);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Audit finding linked to NCR successfully' });
    });

    it('should return 400 if ncrId is not provided', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};

      await linkFindingToNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'NCR ID is required' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { ncrId: 5 };
      (AuditFindingModel.linkToNCR as jest.Mock).mockRejectedValue(new Error('Database error'));

      await linkFindingToNCR(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to link finding to NCR' });
    });
  });

  describe('getAuditFindingStats', () => {
    it('should get audit finding statistics successfully', async () => {
      const mockStats = {
        total: 10,
        bySeverity: { critical: 2, major: 3, minor: 4, observation: 1 },
        byStatus: { open: 5, resolved: 3, closed: 2 },
      };
      mockAuthRequest.params = { auditId: '1' };
      (AuditFindingModel.getFindingStatsByAudit as jest.Mock).mockResolvedValue(mockStats);

      await getAuditFindingStats(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditFindingModel.getFindingStatsByAudit).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(mockStats);
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { auditId: '1' };
      (AuditFindingModel.getFindingStatsByAudit as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await getAuditFindingStats(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get audit finding statistics' });
    });
  });
});
