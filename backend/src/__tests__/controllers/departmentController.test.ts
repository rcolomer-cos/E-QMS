import { Response } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../controllers/departmentController';
import { DepartmentModel } from '../../models/DepartmentModel';
import { AuthRequest } from '../../types';

// Mock dependencies
jest.mock('../../models/DepartmentModel');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => []),
  })),
}));

describe('Department Controller', () => {
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
      user: undefined,
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('getAllDepartments', () => {
    it('should return all departments', async () => {
      const mockDepartments = [
        { id: 1, name: 'IT', code: 'IT', description: 'Information Technology', active: true },
        { id: 2, name: 'QA', code: 'QA', description: 'Quality Assurance', active: true },
      ];
      (DepartmentModel.findAll as jest.Mock).mockResolvedValue(mockDepartments);

      await getAllDepartments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockDepartments);
    });

    it('should return 500 on error', async () => {
      (DepartmentModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAllDepartments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to fetch departments' });
    });
  });

  describe('getDepartmentById', () => {
    it('should return department by ID', async () => {
      const mockDepartment = { id: 1, name: 'IT', code: 'IT', description: 'Information Technology', active: true };
      mockAuthRequest.params = { id: '1' };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(mockDepartment);

      await getDepartmentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockDepartment);
    });

    it('should return 404 if department not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(null);

      await getDepartmentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department not found' });
    });
  });

  describe('getDepartmentByCode', () => {
    it('should return department by code', async () => {
      const mockDepartment = { id: 1, name: 'IT', code: 'IT', description: 'Information Technology', active: true };
      mockAuthRequest.params = { code: 'IT' };
      (DepartmentModel.findByCode as jest.Mock).mockResolvedValue(mockDepartment);

      await getDepartmentByCode(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockDepartment);
    });

    it('should return 404 if department not found', async () => {
      mockAuthRequest.params = { code: 'NOTFOUND' };
      (DepartmentModel.findByCode as jest.Mock).mockResolvedValue(null);

      await getDepartmentByCode(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department not found' });
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'IT',
        code: 'IT',
        description: 'Information Technology',
        managerId: 2,
      };
      (DepartmentModel.codeExists as jest.Mock).mockResolvedValue(false);
      (DepartmentModel.nameExists as jest.Mock).mockResolvedValue(false);
      (DepartmentModel.create as jest.Mock).mockResolvedValue(1);

      await createDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Department created successfully',
        departmentId: 1,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 409 if department code already exists', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'IT',
        code: 'IT',
        description: 'Information Technology',
      };
      (DepartmentModel.codeExists as jest.Mock).mockResolvedValue(true);

      await createDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department with this code already exists' });
    });

    it('should return 409 if department name already exists', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'IT',
        code: 'IT',
        description: 'Information Technology',
      };
      (DepartmentModel.codeExists as jest.Mock).mockResolvedValue(false);
      (DepartmentModel.nameExists as jest.Mock).mockResolvedValue(true);

      await createDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department with this name already exists' });
    });
  });

  describe('updateDepartment', () => {
    it('should update a department', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        name: 'Updated IT',
        code: 'IT',
        description: 'Updated Information Technology',
      };
      const mockDepartment = { id: 1, name: 'IT', code: 'IT', active: true };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(mockDepartment);
      (DepartmentModel.codeExists as jest.Mock).mockResolvedValue(false);
      (DepartmentModel.nameExists as jest.Mock).mockResolvedValue(false);
      (DepartmentModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Department updated successfully' });
    });

    it('should return 404 if department not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { name: 'Updated IT' };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(null);

      await updateDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department not found' });
    });

    it('should return 409 if updated code conflicts', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { code: 'QA' };
      const mockDepartment = { id: 1, name: 'IT', code: 'IT', active: true };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(mockDepartment);
      (DepartmentModel.codeExists as jest.Mock).mockResolvedValue(true);

      await updateDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department with this code already exists' });
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1' };
      const mockDepartment = { id: 1, name: 'IT', code: 'IT', active: true };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(mockDepartment);
      (DepartmentModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Department deleted successfully' });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await deleteDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if department not found', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '999' };
      (DepartmentModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteDepartment(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Department not found' });
    });
  });
});
