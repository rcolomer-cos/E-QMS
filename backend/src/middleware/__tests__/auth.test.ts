import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRoles } from '../auth';
import { AuthRequest, UserRole } from '../../types';
import { config } from '../../config';

describe('RBAC Middleware', () => {
  describe('authenticateToken', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should reject request without authorization header', () => {
      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access token required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockRequest.headers = { authorization: 'InvalidToken' };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access token required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept request with valid token', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };
      const token = jwt.sign(payload, config.jwtSecret);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(1);
      expect(mockRequest.user?.username).toBe('testuser');
      expect(mockRequest.user?.role).toBe(UserRole.USER);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };
      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should reject request without authenticated user', () => {
      const middleware = authorizeRoles(UserRole.ADMIN);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not authenticated',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject user with insufficient permissions', () => {
      mockRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      };

      const middleware = authorizeRoles(UserRole.ADMIN);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied: insufficient permissions',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept user with required role', () => {
      mockRequest.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const middleware = authorizeRoles(UserRole.ADMIN);

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should accept user with one of multiple allowed roles', () => {
      mockRequest.user = {
        id: 2,
        username: 'manager',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
      };

      const middleware = authorizeRoles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AUDITOR
      );

      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle all user roles correctly', () => {
      const testCases = [
        {
          userRole: UserRole.ADMIN,
          allowedRoles: [UserRole.ADMIN],
          shouldPass: true,
        },
        {
          userRole: UserRole.MANAGER,
          allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
          shouldPass: true,
        },
        {
          userRole: UserRole.AUDITOR,
          allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR],
          shouldPass: true,
        },
        {
          userRole: UserRole.USER,
          allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
          shouldPass: false,
        },
        {
          userRole: UserRole.VIEWER,
          allowedRoles: [UserRole.ADMIN],
          shouldPass: false,
        },
      ];

      testCases.forEach(({ userRole, allowedRoles, shouldPass }) => {
        const request = {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: userRole,
          },
        } as AuthRequest;

        const response = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const next = jest.fn();

        const middleware = authorizeRoles(...allowedRoles);
        middleware(request, response, next);

        if (shouldPass) {
          expect(next).toHaveBeenCalled();
          expect(response.status).not.toHaveBeenCalled();
        } else {
          expect(next).not.toHaveBeenCalled();
          expect(response.status).toHaveBeenCalledWith(403);
        }
      });
    });
  });
});
