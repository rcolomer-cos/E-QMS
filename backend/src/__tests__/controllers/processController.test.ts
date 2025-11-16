import { Response } from 'express';
import {
  getAllProcesses,
  getProcessById,
  getProcessByCode,
  createProcess,
  updateProcess,
  deleteProcess,
  getProcessOwners,
  assignProcessOwner,
  removeProcessOwner,
} from '../../controllers/processController';
import { ProcessModel } from '../../models/ProcessModel';
import { ProcessOwnerModel } from '../../models/ProcessOwnerModel';
import { AuthRequest } from '../../types';

// Mock dependencies
jest.mock('../../models/ProcessModel');
jest.mock('../../models/ProcessOwnerModel');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => []),
  })),
}));

describe('Process Controller', () => {
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

  describe('getAllProcesses', () => {
    it('should return all processes', async () => {
      const mockProcesses = [
        { id: 1, name: 'Quality Review', code: 'PROC-001', description: 'Quality review process', active: true },
        { id: 2, name: 'Document Control', code: 'PROC-002', description: 'Document control process', active: true },
      ];
      (ProcessModel.findAll as jest.Mock).mockResolvedValue(mockProcesses);

      await getAllProcesses(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockProcesses);
    });

    it('should return 500 on error', async () => {
      (ProcessModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getAllProcesses(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to fetch processes' });
    });
  });

  describe('getProcessById', () => {
    it('should return process by ID', async () => {
      const mockProcess = { id: 1, name: 'Quality Review', code: 'PROC-001', description: 'Quality review process', active: true };
      mockAuthRequest.params = { id: '1' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(mockProcess);

      await getProcessById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockProcess);
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await getProcessById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });
  });

  describe('getProcessByCode', () => {
    it('should return process by code', async () => {
      const mockProcess = { id: 1, name: 'Quality Review', code: 'PROC-001', description: 'Quality review process', active: true };
      mockAuthRequest.params = { code: 'PROC-001' };
      (ProcessModel.findByCode as jest.Mock).mockResolvedValue(mockProcess);

      await getProcessByCode(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockProcess);
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.params = { code: 'NOTFOUND' };
      (ProcessModel.findByCode as jest.Mock).mockResolvedValue(null);

      await getProcessByCode(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });
  });

  describe('createProcess', () => {
    it('should create a new process', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'Quality Review',
        code: 'PROC-001',
        description: 'Quality review process',
        departmentId: 2,
        processCategory: 'Core',
        objective: 'Ensure quality standards',
        scope: 'All products',
      };
      (ProcessModel.codeExists as jest.Mock).mockResolvedValue(false);
      (ProcessModel.nameExists as jest.Mock).mockResolvedValue(false);
      (ProcessModel.create as jest.Mock).mockResolvedValue(1);

      await createProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Process created successfully',
        processId: 1,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 409 if process code already exists', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'Quality Review',
        code: 'PROC-001',
        description: 'Quality review process',
      };
      (ProcessModel.codeExists as jest.Mock).mockResolvedValue(true);

      await createProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process with this code already exists' });
    });

    it('should return 409 if process name already exists', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.body = {
        name: 'Quality Review',
        code: 'PROC-001',
        description: 'Quality review process',
      };
      (ProcessModel.codeExists as jest.Mock).mockResolvedValue(false);
      (ProcessModel.nameExists as jest.Mock).mockResolvedValue(true);

      await createProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process with this name already exists' });
    });
  });

  describe('updateProcess', () => {
    it('should update a process', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        name: 'Updated Quality Review',
        code: 'PROC-001',
        description: 'Updated quality review process',
      };
      const mockProcess = { id: 1, name: 'Quality Review', code: 'PROC-001', active: true };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(mockProcess);
      (ProcessModel.codeExists as jest.Mock).mockResolvedValue(false);
      (ProcessModel.nameExists as jest.Mock).mockResolvedValue(false);
      (ProcessModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Process updated successfully' });
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { name: 'Updated Quality Review' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await updateProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });

    it('should return 409 if updated code conflicts', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { code: 'PROC-002' };
      const mockProcess = { id: 1, name: 'Quality Review', code: 'PROC-001', active: true };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(mockProcess);
      (ProcessModel.codeExists as jest.Mock).mockResolvedValue(true);

      await updateProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process with this code already exists' });
    });
  });

  describe('deleteProcess', () => {
    it('should delete a process', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1' };
      const mockProcess = { id: 1, name: 'Quality Review', code: 'PROC-001', active: true };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(mockProcess);
      (ProcessModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Process deleted successfully' });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await deleteProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '999' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteProcess(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });
  });

  describe('getProcessOwners', () => {
    it('should return all owners for a process', async () => {
      const mockOwners = [
        { id: 1, processId: 1, ownerId: 2, ownerName: 'John Doe', isPrimaryOwner: true, active: true },
        { id: 2, processId: 1, ownerId: 3, ownerName: 'Jane Smith', isPrimaryOwner: false, active: true },
      ];
      mockAuthRequest.params = { id: '1' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue({ id: 1, name: 'Quality Review', code: 'PROC-001' });
      (ProcessOwnerModel.findByProcessId as jest.Mock).mockResolvedValue(mockOwners);

      await getProcessOwners(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(mockOwners);
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await getProcessOwners(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });
  });

  describe('assignProcessOwner', () => {
    it('should assign an owner to a process', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        ownerId: 2,
        isPrimaryOwner: true,
        notes: 'Primary process owner',
      };
      (ProcessModel.findById as jest.Mock).mockResolvedValue({ id: 1, name: 'Quality Review', code: 'PROC-001' });
      (ProcessOwnerModel.ownershipExists as jest.Mock).mockResolvedValue(false);
      (ProcessOwnerModel.create as jest.Mock).mockResolvedValue(1);

      await assignProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Process owner assigned successfully',
        ownershipId: 1,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await assignProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '999' };
      mockAuthRequest.body = { ownerId: 2 };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await assignProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });

    it('should return 409 if ownership already exists', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { ownerId: 2 };
      (ProcessModel.findById as jest.Mock).mockResolvedValue({ id: 1, name: 'Quality Review', code: 'PROC-001' });
      (ProcessOwnerModel.ownershipExists as jest.Mock).mockResolvedValue(true);

      await assignProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User is already assigned as an owner to this process' });
    });
  });

  describe('removeProcessOwner', () => {
    it('should remove an owner from a process', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1', ownerId: '2' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue({ id: 1, name: 'Quality Review', code: 'PROC-001' });
      (ProcessOwnerModel.ownershipExists as jest.Mock).mockResolvedValue(true);
      (ProcessOwnerModel.delete as jest.Mock).mockResolvedValue(undefined);

      await removeProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Process owner removed successfully' });
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await removeProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if process not found', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '999', ownerId: '2' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue(null);

      await removeProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process not found' });
    });

    it('should return 404 if ownership not found', async () => {
      mockAuthRequest.user = { 
        id: 1, 
        email: 'admin@test.com', 
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1]
      };
      mockAuthRequest.params = { id: '1', ownerId: '999' };
      (ProcessModel.findById as jest.Mock).mockResolvedValue({ id: 1, name: 'Quality Review', code: 'PROC-001' });
      (ProcessOwnerModel.ownershipExists as jest.Mock).mockResolvedValue(false);

      await removeProcessOwner(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Process owner assignment not found' });
    });
  });
});
