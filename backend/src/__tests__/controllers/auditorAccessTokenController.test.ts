import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as auditorAccessTokenController from '../../controllers/auditorAccessTokenController';
import { AuditorAccessTokenService, TokenScopeType } from '../../services/auditorAccessTokenService';
import * as auditLogService from '../../services/auditLogService';

// Mock dependencies
jest.mock('../../services/auditorAccessTokenService');
jest.mock('../../services/auditLogService');

describe('AuditorAccessTokenController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();

    mockRequest = {
      user: {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      },
      body: {},
      params: {},
      query: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a new auditor access token successfully', async () => {
      const tokenData = {
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        auditorOrganization: 'External Audit Firm',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
        scopeType: TokenScopeType.FULL_READ_ONLY,
        purpose: 'ISO 9001 certification audit',
      };

      mockRequest.body = tokenData;

      const mockTokenResult = {
        id: 1,
        token: 'abc123def456',
      };

      (AuditorAccessTokenService.createToken as jest.Mock).mockResolvedValue(mockTokenResult);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await auditorAccessTokenController.generateToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(AuditorAccessTokenService.createToken).toHaveBeenCalledWith(
        expect.objectContaining({
          auditorName: tokenData.auditorName,
          auditorEmail: tokenData.auditorEmail,
          scopeType: tokenData.scopeType,
          purpose: tokenData.purpose,
          createdBy: 1,
        })
      );

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Auditor access token generated successfully',
          tokenId: 1,
          token: 'abc123def456',
          accessUrl: expect.stringContaining('token=abc123def456'),
        })
      );
    });

    it('should reject token generation with past expiration date', async () => {
      mockRequest.body = {
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Past date
        scopeType: TokenScopeType.FULL_READ_ONLY,
        purpose: 'Audit',
      };

      await auditorAccessTokenController.generateToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Expiration date must be in the future',
        })
      );
    });

    it('should reject invalid scope type', async () => {
      mockRequest.body = {
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        scopeType: 'invalid_scope',
        purpose: 'Audit',
      };

      await auditorAccessTokenController.generateToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid scope type',
        })
      );
    });

    it('should require scopeEntityId for specific scope types', async () => {
      mockRequest.body = {
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        scopeType: TokenScopeType.SPECIFIC_AUDIT,
        purpose: 'Audit specific audit',
      };

      await auditorAccessTokenController.generateToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('requires scopeEntityId'),
        })
      );
    });
  });

  describe('getTokens', () => {
    it('should retrieve all tokens', async () => {
      const mockTokens = [
        {
          id: 1,
          tokenPreview: 'abc12345...ef67',
          auditorName: 'John Auditor',
          auditorEmail: 'john@auditor.com',
          active: true,
        },
      ];

      (AuditorAccessTokenService.getTokens as jest.Mock).mockResolvedValue(mockTokens);

      await auditorAccessTokenController.getTokens(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseJson).toHaveBeenCalledWith({
        tokens: mockTokens,
        count: 1,
      });
    });

    it('should filter tokens by activeOnly', async () => {
      mockRequest.query = { activeOnly: 'true' };

      (AuditorAccessTokenService.getTokens as jest.Mock).mockResolvedValue([]);

      await auditorAccessTokenController.getTokens(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(AuditorAccessTokenService.getTokens).toHaveBeenCalledWith({
        activeOnly: true,
        auditorEmail: undefined,
        scopeType: undefined,
      });
    });
  });

  describe('getTokenById', () => {
    it('should retrieve a specific token by ID', async () => {
      mockRequest.params = { id: '1' };

      const mockToken = {
        id: 1,
        tokenPreview: 'abc12345...ef67',
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        active: true,
      };

      (AuditorAccessTokenService.getTokenById as jest.Mock).mockResolvedValue(mockToken);

      await auditorAccessTokenController.getTokenById(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseJson).toHaveBeenCalledWith(mockToken);
    });

    it('should return 404 if token not found', async () => {
      mockRequest.params = { id: '999' };

      (AuditorAccessTokenService.getTokenById as jest.Mock).mockResolvedValue(null);

      await auditorAccessTokenController.getTokenById(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Auditor access token not found',
      });
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { reason: 'Audit completed' };

      const mockToken = {
        id: 1,
        tokenPreview: 'abc12345...ef67',
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        active: true,
      };

      (AuditorAccessTokenService.getTokenById as jest.Mock).mockResolvedValue(mockToken);
      (AuditorAccessTokenService.revokeToken as jest.Mock).mockResolvedValue(undefined);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await auditorAccessTokenController.revokeToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(AuditorAccessTokenService.revokeToken).toHaveBeenCalledWith(
        1,
        1,
        'Audit completed'
      );

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Auditor access token revoked successfully',
        tokenId: 1,
      });
    });

    it('should reject revoking an already revoked token', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { reason: 'Audit completed' };

      const mockToken = {
        id: 1,
        tokenPreview: 'abc12345...ef67',
        auditorName: 'John Auditor',
        auditorEmail: 'john@auditor.com',
        active: false,
      };

      (AuditorAccessTokenService.getTokenById as jest.Mock).mockResolvedValue(mockToken);

      await auditorAccessTokenController.revokeToken(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Token is already revoked',
      });
    });
  });

  describe('getOptions', () => {
    it('should return available options', async () => {
      await auditorAccessTokenController.getOptions(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeTypes: expect.any(Array),
          resourceTypes: expect.any(Array),
          defaultExpirationHours: expect.any(Array),
        })
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      (AuditorAccessTokenService.cleanupExpiredTokens as jest.Mock).mockResolvedValue(5);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await auditorAccessTokenController.cleanupExpiredTokens(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Expired tokens cleaned up successfully',
        count: 5,
      });
    });
  });
});
