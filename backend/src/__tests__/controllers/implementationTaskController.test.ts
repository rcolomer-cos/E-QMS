import { Response } from 'express';
import {
  createImplementationTask,
  getImplementationTasks,
  getImplementationTaskById,
  getTasksByImprovementIdeaId,
  updateImplementationTask,
  completeImplementationTask,
  deleteImplementationTask,
  getTaskStatistics,
} from '../../controllers/implementationTaskController';
import { ImplementationTaskModel } from '../../models/ImplementationTaskModel';
import { ImprovementIdeaModel } from '../../models/ImprovementIdeaModel';
import { AuthRequest } from '../../types';
import { logCreate, logUpdate, logDelete } from '../../services/auditLogService';

// Mock dependencies
jest.mock('../../models/ImplementationTaskModel');
jest.mock('../../models/ImprovementIdeaModel');
jest.mock('../../services/auditLogService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
}));

describe('Implementation Task Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: {
        id: 1,
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        roleIds: [3],
      },
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('createImplementationTask', () => {
    it('should create a task for an existing improvement idea', async () => {
      const mockIdea = {
        id: 1,
        ideaNumber: 'IDEA-0001',
        title: 'Test Idea',
        status: 'approved',
      };

      mockRequest.body = {
        improvementIdeaId: 1,
        taskName: 'Implement Feature X',
        taskDescription: 'Complete implementation of feature X',
        assignedTo: 2,
        deadline: '2024-12-31',
        status: 'pending',
        progressPercentage: 0,
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);
      (ImplementationTaskModel.create as jest.Mock).mockResolvedValue(100);
      (logCreate as jest.Mock).mockResolvedValue(undefined);

      await createImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.findById).toHaveBeenCalledWith(1);
      expect(ImplementationTaskModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          improvementIdeaId: 1,
          taskName: 'Implement Feature X',
          createdBy: 1,
          status: 'pending',
          progressPercentage: 0,
        })
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Implementation task created successfully',
        id: 100,
      });
    });

    it('should return 404 if improvement idea not found', async () => {
      mockRequest.body = {
        improvementIdeaId: 999,
        taskName: 'Test Task',
      };

      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(null);

      await createImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Improvement idea not found' });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await createImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('getImplementationTasks', () => {
    it('should return paginated tasks with filters', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            taskName: 'Task 1',
            status: 'pending',
            progressPercentage: 0,
          },
          {
            id: 2,
            taskName: 'Task 2',
            status: 'in_progress',
            progressPercentage: 50,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        improvementIdeaId: '1',
        status: 'pending',
        page: '1',
        limit: '10',
      };

      (ImplementationTaskModel.findAll as jest.Mock).mockResolvedValue(mockResult);

      await getImplementationTasks(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImplementationTaskModel.findAll).toHaveBeenCalledWith(
        { improvementIdeaId: 1, status: 'pending' },
        { sortBy: 'deadline', sortOrder: 'ASC' },
        1,
        10
      );
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockRequest.query = {
        page: '0',
        limit: '10',
      };

      await getImplementationTasks(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid pagination parameters'),
        })
      );
    });
  });

  describe('getImplementationTaskById', () => {
    it('should return a task by ID', async () => {
      const mockTask = {
        id: 1,
        taskName: 'Test Task',
        status: 'pending',
        progressPercentage: 0,
      };

      mockRequest.params = { id: '1' };
      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(mockTask);

      await getImplementationTaskById(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImplementationTaskModel.findById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockTask);
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(null);

      await getImplementationTaskById(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Implementation task not found' });
    });
  });

  describe('getTasksByImprovementIdeaId', () => {
    it('should return tasks for a specific improvement idea', async () => {
      const mockTasks = [
        { id: 1, taskName: 'Task 1', status: 'pending' },
        { id: 2, taskName: 'Task 2', status: 'completed' },
      ];

      const mockIdea = { id: 1, ideaNumber: 'IDEA-0001' };

      mockRequest.params = { improvementIdeaId: '1' };
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);
      (ImplementationTaskModel.findByImprovementIdeaId as jest.Mock).mockResolvedValue(mockTasks);

      await getTasksByImprovementIdeaId(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.findById).toHaveBeenCalledWith(1);
      expect(ImplementationTaskModel.findByImprovementIdeaId).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockTasks);
    });

    it('should return 404 if improvement idea not found', async () => {
      mockRequest.params = { improvementIdeaId: '999' };
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(null);

      await getTasksByImprovementIdeaId(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Improvement idea not found' });
    });
  });

  describe('updateImplementationTask', () => {
    it('should update a task', async () => {
      const oldTask = {
        id: 1,
        taskName: 'Old Name',
        status: 'pending',
        progressPercentage: 0,
      };

      const updatedTask = {
        id: 1,
        taskName: 'New Name',
        status: 'in_progress',
        progressPercentage: 50,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        taskName: 'New Name',
        status: 'in_progress',
        progressPercentage: 50,
      };

      (ImplementationTaskModel.findById as jest.Mock)
        .mockResolvedValueOnce(oldTask)
        .mockResolvedValueOnce(updatedTask);
      (ImplementationTaskModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      await updateImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImplementationTaskModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          taskName: 'New Name',
          status: 'in_progress',
          progressPercentage: 50,
          updatedBy: 1,
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Implementation task updated successfully',
        data: updatedTask,
      });
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { taskName: 'New Name' };

      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(null);

      await updateImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Implementation task not found' });
    });
  });

  describe('completeImplementationTask', () => {
    it('should complete a task with evidence', async () => {
      const oldTask = {
        id: 1,
        taskName: 'Test Task',
        status: 'in_progress',
        progressPercentage: 80,
      };

      const completedTask = {
        ...oldTask,
        status: 'completed',
        progressPercentage: 100,
        completedDate: new Date(),
        completionEvidence: 'Task completed successfully',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        completionEvidence: 'Task completed successfully',
      };

      (ImplementationTaskModel.findById as jest.Mock)
        .mockResolvedValueOnce(oldTask)
        .mockResolvedValueOnce(completedTask);
      (ImplementationTaskModel.update as jest.Mock).mockResolvedValue(true);
      (logUpdate as jest.Mock).mockResolvedValue(undefined);

      await completeImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImplementationTaskModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'completed',
          progressPercentage: 100,
          completedDate: expect.any(Date),
          completionEvidence: 'Task completed successfully',
          updatedBy: 1,
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Implementation task completed successfully',
        data: completedTask,
      });
    });

    it('should return 400 if task is already completed', async () => {
      const completedTask = {
        id: 1,
        taskName: 'Test Task',
        status: 'completed',
        progressPercentage: 100,
      };

      mockRequest.params = { id: '1' };
      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(completedTask);

      await completeImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Task is already completed' });
    });
  });

  describe('deleteImplementationTask', () => {
    it('should delete a task', async () => {
      const mockTask = {
        id: 1,
        taskName: 'Test Task',
        status: 'pending',
      };

      mockRequest.params = { id: '1' };
      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(mockTask);
      (ImplementationTaskModel.delete as jest.Mock).mockResolvedValue(true);
      (logDelete as jest.Mock).mockResolvedValue(undefined);

      await deleteImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImplementationTaskModel.delete).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Implementation task deleted successfully',
      });
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      (ImplementationTaskModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteImplementationTask(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Implementation task not found' });
    });
  });

  describe('getTaskStatistics', () => {
    it('should return task statistics for an improvement idea', async () => {
      const mockStats = {
        totalTasks: 10,
        pending: 2,
        inProgress: 3,
        completed: 4,
        blocked: 1,
        cancelled: 0,
        avgProgress: 65.5,
        overdueTasks: 1,
      };

      const mockIdea = { id: 1, ideaNumber: 'IDEA-0001' };

      mockRequest.params = { improvementIdeaId: '1' };
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(mockIdea);
      (ImplementationTaskModel.getTaskStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getTaskStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(ImprovementIdeaModel.findById).toHaveBeenCalledWith(1);
      expect(ImplementationTaskModel.getTaskStatistics).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockStats);
    });

    it('should return 404 if improvement idea not found', async () => {
      mockRequest.params = { improvementIdeaId: '999' };
      (ImprovementIdeaModel.findById as jest.Mock).mockResolvedValue(null);

      await getTaskStatistics(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Improvement idea not found' });
    });
  });
});
