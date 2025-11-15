import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { login, logout, refresh } from '../../controllers/authController';
import { UserModel } from '../../models/UserModel';
import { config } from '../../config';
import { AuthRequest } from '../../types';

// Mock dependencies
jest.mock('../../models/UserModel');
jest.mock('jsonwebtoken');
jest.mock('../../config', () => ({
  config: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '24h',
  },
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      body: {},
    };
    mockAuthRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 for invalid credentials - user not found', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 401 for invalid password', async () => {
      mockRequest.body = { username: 'testuser', password: 'wrongpassword' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        password: 'hashedpassword',
      };
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return token and user data for valid credentials', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        department: 'IT',
        password: 'hashedpassword',
      };
      const mockToken = 'mock-jwt-token';

      (UserModel.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await login(mockRequest as Request, mockResponse as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      expect(mockJson).toHaveBeenCalledWith({
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          department: mockUser.department,
        },
      });
    });
  });

  describe('logout', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await logout(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return success message for authenticated user', async () => {
      mockAuthRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      await logout(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });

  describe('refresh', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await refresh(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if user no longer exists', async () => {
      mockAuthRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await refresh(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return new token and user data for valid refresh', async () => {
      mockAuthRequest.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        department: 'IT',
      };
      const mockToken = 'new-mock-jwt-token';

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await refresh(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      expect(mockJson).toHaveBeenCalledWith({
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          department: mockUser.department,
        },
      });
    });
  });
});
