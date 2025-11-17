import { Response } from 'express';
import {
  createCompetency,
  getCompetencies,
  getCompetencyById,
  updateCompetency,
  assignCompetencyToUser,
  getUserCompetencies,
  getUsersByCompetency,
  updateUserCompetency,
  getExpiringCompetencies,
} from '../../controllers/competencyController';
import { CompetencyModel } from '../../models/CompetencyModel';
import { AuthRequest, CompetencyStatus } from '../../types';

// Mock dependencies
jest.mock('../../models/CompetencyModel');
jest.mock('../../services/auditLogService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => []),
  })),
}));

describe('Competency Controller', () => {
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
  });

  describe('createCompetency', () => {
    it('should create a competency successfully', async () => {
      const competencyData = {
        competencyCode: 'COMP-001',
        name: 'ISO 9001 Lead Auditor',
        category: 'Quality',
        status: CompetencyStatus.ACTIVE,
        isRegulatory: true,
        isMandatory: false,
        hasExpiry: true,
        renewalRequired: true,
        requiresAssessment: true,
      };

      mockAuthRequest.body = competencyData;
      (CompetencyModel.create as jest.Mock).mockResolvedValue(1);

      await createCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Competency created successfully',
        id: 1,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 500 on error', async () => {
      mockAuthRequest.body = { competencyCode: 'COMP-001', name: 'Test' };
      (CompetencyModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create Competency' });
    });
  });

  describe('getCompetencies', () => {
    it('should return all competencies with pagination', async () => {
      const mockCompetencies = [
        { id: 1, competencyCode: 'COMP-001', name: 'Competency 1', category: 'Quality' },
        { id: 2, competencyCode: 'COMP-002', name: 'Competency 2', category: 'Safety' },
      ];
      (CompetencyModel.findAll as jest.Mock).mockResolvedValue(mockCompetencies);

      await getCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        data: mockCompetencies,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should filter competencies by status', async () => {
      const mockCompetencies = [
        { id: 1, competencyCode: 'COMP-001', name: 'Active Competency', status: CompetencyStatus.ACTIVE },
      ];
      mockAuthRequest.query = { status: 'active' };
      (CompetencyModel.findAll as jest.Mock).mockResolvedValue(mockCompetencies);

      await getCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(CompetencyModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: CompetencyStatus.ACTIVE })
      );
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockAuthRequest.query = { page: '0', limit: '200' };

      await getCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
    });
  });

  describe('getCompetencyById', () => {
    it('should return competency by ID', async () => {
      const mockCompetency = {
        id: 1,
        competencyCode: 'COMP-001',
        name: 'ISO 9001 Lead Auditor',
        category: 'Quality',
      };
      mockAuthRequest.params = { id: '1' };
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(mockCompetency);

      await getCompetencyById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockCompetency);
    });

    it('should return 404 if competency not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(null);

      await getCompetencyById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Competency not found' });
    });
  });

  describe('updateCompetency', () => {
    it('should update a competency successfully', async () => {
      const mockCompetency = {
        id: 1,
        competencyCode: 'COMP-001',
        name: 'Old Name',
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { name: 'New Name' };
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(mockCompetency);
      (CompetencyModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Competency updated successfully' });
    });

    it('should return 404 if competency not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { name: 'New Name' };
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(null);

      await updateCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Competency not found' });
    });
  });

  describe('assignCompetencyToUser', () => {
    it('should assign competency to user successfully', async () => {
      const userCompetencyData = {
        userId: 1,
        competencyId: 1,
        acquiredDate: new Date('2024-01-01'),
        effectiveDate: new Date('2024-01-01'),
        status: 'active',
        verified: false,
      };

      mockAuthRequest.body = userCompetencyData;
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(null);
      (CompetencyModel.assignToUser as jest.Mock).mockResolvedValue(1);

      await assignCompetencyToUser(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Competency assigned to user successfully',
        id: 1,
      });
    });

    it('should auto-calculate expiry date when competency has default validity', async () => {
      const userCompetencyData = {
        userId: 1,
        competencyId: 1,
        acquiredDate: new Date('2024-01-01'),
        effectiveDate: new Date('2024-01-01'),
        status: 'active',
        verified: false,
      };

      const mockCompetency = {
        id: 1,
        hasExpiry: true,
        defaultValidityMonths: 36,
        renewalRequired: true,
      };

      mockAuthRequest.body = userCompetencyData;
      (CompetencyModel.findById as jest.Mock).mockResolvedValue(mockCompetency);
      (CompetencyModel.assignToUser as jest.Mock).mockResolvedValue(1);

      await assignCompetencyToUser(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(CompetencyModel.assignToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          expiryDate: expect.any(Date),
          nextRenewalDate: expect.any(Date),
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await assignCompetencyToUser(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('getUserCompetencies', () => {
    it('should return user competencies with pagination', async () => {
      const mockUserCompetencies = [
        {
          id: 1,
          userId: 1,
          competencyId: 1,
          competencyName: 'ISO 9001 Lead Auditor',
          status: 'active',
        },
      ];
      mockAuthRequest.params = { userId: '1' };
      (CompetencyModel.getUserCompetencies as jest.Mock).mockResolvedValue(mockUserCompetencies);

      await getUserCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        data: mockUserCompetencies,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should return 403 if user tries to view other users competencies without permission', async () => {
      mockAuthRequest.params = { userId: '2' };
      mockAuthRequest.user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        roleIds: [3],
      };

      await getUserCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Forbidden: Cannot view other users competencies' });
    });
  });

  describe('getUsersByCompetency', () => {
    it('should return users with specific competency', async () => {
      const mockUsers = [
        { id: 1, userId: 1, userName: 'John Doe', status: 'active' },
        { id: 2, userId: 2, userName: 'Jane Smith', status: 'active' },
      ];
      mockAuthRequest.params = { competencyId: '1' };
      (CompetencyModel.getUsersByCompetency as jest.Mock).mockResolvedValue(mockUsers);

      await getUsersByCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1,
        },
      });
    });
  });

  describe('updateUserCompetency', () => {
    it('should update user competency successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'expired', verified: true };
      (CompetencyModel.updateUserCompetency as jest.Mock).mockResolvedValue(undefined);

      await updateUserCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'User competency updated successfully' });
    });

    it('should track status change metadata', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { status: 'revoked' };
      (CompetencyModel.updateUserCompetency as jest.Mock).mockResolvedValue(undefined);

      await updateUserCompetency(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(CompetencyModel.updateUserCompetency).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          statusChangedBy: 1,
          statusChangedAt: expect.any(Date),
        })
      );
    });
  });

  describe('getExpiringCompetencies', () => {
    it('should return expiring competencies for user', async () => {
      const mockExpiringCompetencies = [
        {
          id: 1,
          userId: 1,
          competencyName: 'ISO 9001 Lead Auditor',
          expiryDate: new Date('2024-02-15'),
        },
      ];
      mockAuthRequest.params = { userId: '1' };
      mockAuthRequest.query = { daysThreshold: '30' };
      (CompetencyModel.getExpiringCompetencies as jest.Mock).mockResolvedValue(mockExpiringCompetencies);

      await getExpiringCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        data: mockExpiringCompetencies,
        total: 1,
      });
    });

    it('should return 403 if user tries to view other users expiring competencies without permission', async () => {
      mockAuthRequest.params = { userId: '2' };
      mockAuthRequest.user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        roleIds: [3],
      };

      await getExpiringCompetencies(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Forbidden: Cannot view other users competencies' });
    });
  });
});
