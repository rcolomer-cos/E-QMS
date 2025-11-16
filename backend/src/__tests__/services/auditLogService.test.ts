import { logAudit, logCreate, logUpdate, logDelete, AuditActionCategory, AuditAction } from '../../services/auditLogService';
import { AuditLogModel } from '../../models/AuditLogModel';
import { AuthRequest } from '../../types';

// Mock AuditLogModel
jest.mock('../../models/AuditLogModel');

describe('Audit Log Service', () => {
  let mockRequest: Partial<AuthRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      },
      method: 'POST',
      originalUrl: '/api/ncrs',
      url: '/api/ncrs',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'authorization': 'Bearer test-token-1234567890',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      },
    } as any;

    // Mock AuditLogModel.create to return a successful ID
    (AuditLogModel.create as jest.Mock).mockResolvedValue(1);
  });

  describe('logAudit', () => {
    it('should log a basic audit entry', async () => {
      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.CREATE,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        entityId: 123,
        entityIdentifier: 'NCR-001',
        success: true,
      });

      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          userName: 'Test User',
          userEmail: 'test@example.com',
          action: AuditAction.CREATE,
          actionCategory: AuditActionCategory.NCR,
          entityType: 'NCR',
          entityId: 123,
          entityIdentifier: 'NCR-001',
          requestMethod: 'POST',
          requestUrl: '/api/ncrs',
          success: true,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should capture changed fields when both old and new values provided', async () => {
      const oldValues = { status: 'open', assignedTo: 1 };
      const newValues = { status: 'in_progress', assignedTo: 2 };

      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.UPDATE,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        entityId: 123,
        oldValues,
        newValues,
        success: true,
      });

      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          oldValues: expect.any(String),
          newValues: expect.any(String),
          changedFields: expect.stringContaining('status'),
        })
      );

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.changedFields).toContain('status');
      expect(createCall.changedFields).toContain('assignedTo');
    });

    it('should not log password fields', async () => {
      const oldValues = { email: 'old@test.com', password: 'oldpass123' };
      const newValues = { email: 'new@test.com', password: 'newpass456' };

      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.UPDATE,
        actionCategory: AuditActionCategory.USER_MANAGEMENT,
        entityType: 'User',
        entityId: 1,
        oldValues,
        newValues,
        success: true,
      });

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      const oldValuesJson = JSON.parse(createCall.oldValues);
      const newValuesJson = JSON.parse(createCall.newValues);

      expect(oldValuesJson).not.toHaveProperty('password');
      expect(newValuesJson).not.toHaveProperty('password');
      expect(oldValuesJson).toHaveProperty('email');
      expect(newValuesJson).toHaveProperty('email');
    });

    it('should handle logging failures gracefully', async () => {
      // Mock create to throw an error
      (AuditLogModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(
        logAudit({
          req: mockRequest as AuthRequest,
          action: AuditAction.CREATE,
          actionCategory: AuditActionCategory.NCR,
          entityType: 'NCR',
          success: true,
        })
      ).resolves.not.toThrow();
    });

    it('should extract session ID from authorization header', async () => {
      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.CREATE,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        success: true,
      });

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.sessionId).toBe('test-token-123456789');
    });
  });

  describe('logCreate', () => {
    it('should log a create action', async () => {
      const newValues = { ncrNumber: 'NCR-001', status: 'open' };

      await logCreate({
        req: mockRequest as AuthRequest,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        entityId: 123,
        entityIdentifier: 'NCR-001',
        newValues,
      });

      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          actionCategory: AuditActionCategory.NCR,
          entityType: 'NCR',
          entityId: 123,
          entityIdentifier: 'NCR-001',
          success: true,
        })
      );
    });
  });

  describe('logUpdate', () => {
    it('should log an update action', async () => {
      const oldValues = { status: 'open' };
      const newValues = { status: 'closed' };

      await logUpdate({
        req: mockRequest as AuthRequest,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        entityId: 123,
        entityIdentifier: 'NCR-001',
        oldValues,
        newValues,
      });

      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          success: true,
        })
      );
    });
  });

  describe('logDelete', () => {
    it('should log a delete action', async () => {
      const oldValues = { ncrNumber: 'NCR-001', status: 'open' };

      await logDelete({
        req: mockRequest as AuthRequest,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        entityId: 123,
        entityIdentifier: 'NCR-001',
        oldValues,
      });

      expect(AuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          success: true,
        })
      );
    });
  });

  describe('Request metadata extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      };

      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.CREATE,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        success: true,
      });

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.ipAddress).toBe('203.0.113.195');
    });

    it('should extract IP from x-real-ip header', async () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-real-ip': '192.168.1.100',
      };
      delete (mockRequest.headers as any)['x-forwarded-for'];

      await logAudit({
        req: mockRequest as AuthRequest,
        action: AuditAction.CREATE,
        actionCategory: AuditActionCategory.NCR,
        entityType: 'NCR',
        success: true,
      });

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.ipAddress).toBe('192.168.1.100');
    });

    it('should work without user context for system actions', async () => {
      const systemRequest = {
        ...mockRequest,
        user: undefined,
      };

      await logAudit({
        req: systemRequest as AuthRequest,
        action: 'system_cleanup',
        actionCategory: AuditActionCategory.SYSTEM,
        entityType: 'System',
        success: true,
      });

      const createCall = (AuditLogModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.userId).toBeUndefined();
      expect(createCall.userName).toBeUndefined();
      expect(createCall.userEmail).toBeUndefined();
    });
  });
});
