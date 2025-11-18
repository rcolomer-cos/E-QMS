import { Response } from 'express';
import { approveImprovementIdea, rejectImprovementIdea } from '../../controllers/improvementIdeaController';
import { ImprovementIdeaModel } from '../../models/ImprovementIdeaModel';
import { AuthRequest } from '../../types';
import { logUpdate } from '../../services/auditLogService';

// Mock dependencies
jest.mock('../../models/ImprovementIdeaModel');
jest.mock('../../services/auditLogService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
}));

describe('Improvement Idea Approval Workflow', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      params: { id: '1' },
      body: {},
      user: {
        id: 2,
        email: 'manager@test.com',
        firstName: 'Test',
        lastName: 'Manager',
        roles: ['manager'],
        roleIds: [2],
      },
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('approveImprovementIdea', () => {
    it('should approve an idea in submitted status', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'submitted',
        submittedBy: 1,
      };

      const updatedIdea = {
        ...mockIdea,
        status: 'approved',
        reviewedBy: 2,
        reviewedDate: new Date(),
      };

      (ImprovementIdeaModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockIdea)
        .mockResolvedValueOnce(updatedIdea);
      (ImprovementIdeaModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      mockRequest.body = {
        reviewComments: 'Great idea!',
      };

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'approved',
          reviewedBy: 2,
          reviewComments: 'Great idea!',
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Improvement idea approved successfully',
        data: updatedIdea,
      });
      expect(logUpdate).toHaveBeenCalled();
    });

    it('should approve an idea in under_review status', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'under_review',
        submittedBy: 1,
      };

      const updatedIdea = {
        ...mockIdea,
        status: 'approved',
        reviewedBy: 2,
      };

      (ImprovementIdeaModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockIdea)
        .mockResolvedValueOnce(updatedIdea);
      (ImprovementIdeaModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Improvement idea approved successfully',
        data: updatedIdea,
      });
    });

    it('should reject approval for idea already approved', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'approved',
        submittedBy: 1,
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.stringContaining("Cannot approve idea with status 'approved'"),
      });
    });

    it('should reject approval for rejected idea', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'rejected',
        submittedBy: 1,
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.stringContaining("Cannot approve idea with status 'rejected'"),
      });
    });

    it('should return 404 if idea not found', async () => {
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(null);

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Improvement idea not found',
      });
    });

    it('should allow assignment of responsible user during approval', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'submitted',
        submittedBy: 1,
      };

      const updatedIdea = {
        ...mockIdea,
        status: 'approved',
        reviewedBy: 2,
        responsibleUser: 3,
      };

      (ImprovementIdeaModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockIdea)
        .mockResolvedValueOnce(updatedIdea);
      (ImprovementIdeaModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      mockRequest.body = {
        reviewComments: 'Approved',
        responsibleUser: 3,
        implementationNotes: 'Start next quarter',
      };

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'approved',
          reviewedBy: 2,
          responsibleUser: 3,
          implementationNotes: 'Start next quarter',
        })
      );
    });
  });

  describe('rejectImprovementIdea', () => {
    it('should reject an idea in submitted status with comments', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'submitted',
        submittedBy: 1,
      };

      const updatedIdea = {
        ...mockIdea,
        status: 'rejected',
        reviewedBy: 2,
        reviewComments: 'Not feasible at this time',
      };

      (ImprovementIdeaModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockIdea)
        .mockResolvedValueOnce(updatedIdea);
      (ImprovementIdeaModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      mockRequest.body = {
        reviewComments: 'Not feasible at this time',
      };

      await rejectImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'rejected',
          reviewedBy: 2,
          reviewComments: 'Not feasible at this time',
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Improvement idea rejected successfully',
        data: updatedIdea,
      });
      expect(logUpdate).toHaveBeenCalled();
    });

    it('should require review comments for rejection', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'submitted',
        submittedBy: 1,
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);

      mockRequest.body = {
        reviewComments: '',
      };

      await rejectImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Review comments are required when rejecting an idea',
      });
    });

    it('should reject rejection for already approved idea', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'approved',
        submittedBy: 1,
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);

      mockRequest.body = {
        reviewComments: 'Not feasible',
      };

      await rejectImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.stringContaining("Cannot reject idea with status 'approved'"),
      });
    });

    it('should return 404 if idea not found', async () => {
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        reviewComments: 'Not feasible',
      };

      await rejectImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.update).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Improvement idea not found',
      });
    });
  });

  describe('RBAC enforcement', () => {
    it('should require authentication', async () => {
      mockRequest.user = undefined;

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'User not authenticated',
      });
    });

    it('should track reviewer identity in audit log', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'submitted',
        submittedBy: 1,
      };

      const updatedIdea = {
        ...mockIdea,
        status: 'approved',
        reviewedBy: 2,
      };

      (ImprovementIdeaModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockIdea)
        .mockResolvedValueOnce(updatedIdea);
      (ImprovementIdeaModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      await approveImprovementIdea(mockRequest as AuthRequest, mockResponse as Response);

      expect(logUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          req: mockRequest,
          entityType: 'ImprovementIdea',
          entityId: 1,
          entityIdentifier: 'IDEA-0001',
        })
      );
    });
  });
});
