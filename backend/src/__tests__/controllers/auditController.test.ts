import { Response } from 'express';
import {
  submitAuditForReview,
  approveAudit,
  rejectAudit,
} from '../../controllers/auditController';
import { AuditModel } from '../../models/AuditModel';
import { AuthRequest, AuditStatus } from '../../types';

// Mock dependencies
jest.mock('../../models/AuditModel');

describe('Audit Approval Workflow Controller', () => {
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
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['manager'],
        roleIds: [1],
      },
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('submitAuditForReview', () => {
    it('should submit a completed audit for review', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        auditNumber: 'AUD-001',
        status: AuditStatus.COMPLETED,
      });
      (AuditModel.submitForReview as jest.Mock).mockResolvedValue(undefined);

      await submitAuditForReview(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditModel.findById).toHaveBeenCalledWith(1);
      expect(AuditModel.submitForReview).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Audit submitted for review successfully',
      });
    });

    it('should return 404 if audit not found', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditModel.findById as jest.Mock).mockResolvedValue(null);

      await submitAuditForReview(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Audit not found' });
    });

    it('should return 400 if audit is not completed', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.PLANNED,
      });

      await submitAuditForReview(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only completed audits can be submitted for review',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.user = undefined;

      await submitAuditForReview(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('approveAudit', () => {
    it('should approve an audit pending review', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reviewComments: 'Looks good' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.PENDING_REVIEW,
      });
      (AuditModel.approveAudit as jest.Mock).mockResolvedValue(undefined);

      await approveAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditModel.approveAudit).toHaveBeenCalledWith(1, 1, 'Looks good');
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Audit approved successfully',
      });
    });

    it('should approve audit without comments', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.PENDING_REVIEW,
      });
      (AuditModel.approveAudit as jest.Mock).mockResolvedValue(undefined);

      await approveAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditModel.approveAudit).toHaveBeenCalledWith(1, 1, undefined);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Audit approved successfully',
      });
    });

    it('should return 400 if audit is not pending review', async () => {
      mockAuthRequest.params = { id: '1' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.COMPLETED,
      });

      await approveAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only audits pending review can be approved',
      });
    });
  });

  describe('rejectAudit', () => {
    it('should reject an audit with comments', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reviewComments: 'Needs more details' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.PENDING_REVIEW,
      });
      (AuditModel.rejectAudit as jest.Mock).mockResolvedValue(undefined);

      await rejectAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(AuditModel.rejectAudit).toHaveBeenCalledWith(1, 1, 'Needs more details');
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Audit rejected successfully',
      });
    });

    it('should return 400 if review comments are missing', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reviewComments: '' };

      await rejectAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Review comments are required when rejecting an audit',
      });
    });

    it('should return 400 if audit is not pending review', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reviewComments: 'Test' };
      (AuditModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        status: AuditStatus.COMPLETED,
      });

      await rejectAudit(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Only audits pending review can be rejected',
      });
    });
  });
});
