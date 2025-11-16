import { Response } from 'express';
import {
  uploadAttachment,
  getAttachments,
  getAttachmentById,
  getAttachmentsByEntity,
} from '../../controllers/attachmentController';
import { AttachmentModel, EntityType } from '../../models/AttachmentModel';
import { AuthRequest } from '../../types';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/AttachmentModel');
jest.mock('express-validator');
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  unlink: jest.fn(),
}));
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}));

describe('AttachmentController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockValidationResult: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidationResult = validationResult as unknown as jest.Mock;
    mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      },
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('uploadAttachment', () => {
    it('should upload an attachment successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.pdf',
        filename: 'test-123456.pdf',
        path: '/uploads/calibration/test-123456.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        fieldname: 'file',
        encoding: '7bit',
        destination: '/uploads/calibration',
        buffer: Buffer.from(''),
        stream: {} as unknown as NodeJS.ReadableStream,
      };

      mockRequest.file = mockFile;
      mockRequest.body = {
        entityType: EntityType.CALIBRATION,
        entityId: '1',
        description: 'Test description',
        category: 'certificate',
        isPublic: 'false',
      };

      (AttachmentModel.create as jest.Mock).mockResolvedValueOnce(1);

      await uploadAttachment(mockRequest as AuthRequest, mockResponse as Response);

      expect(AttachmentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test.pdf',
          storedFileName: 'test-123456.pdf',
          entityType: EntityType.CALIBRATION,
          entityId: 1,
          uploadedBy: 1,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Attachment uploaded successfully',
          id: 1,
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await uploadAttachment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 if no file is uploaded', async () => {
      mockRequest.file = undefined;

      await uploadAttachment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should return 400 if validation fails', async () => {
      mockValidationResult.mockReturnValueOnce({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid entity type' }],
      });

      await uploadAttachment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{ msg: 'Invalid entity type' }],
      });
    });

  });

  describe('getAttachments', () => {
    it('should return paginated attachments', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'file1.pdf' },
        { id: 2, fileName: 'file2.pdf' },
      ];

      mockRequest.query = { page: '1', limit: '10' };

      (AttachmentModel.findAll as jest.Mock).mockResolvedValueOnce(mockAttachments);

      await getAttachments(mockRequest as AuthRequest, mockResponse as Response);

      expect(AttachmentModel.findAll).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockAttachments,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      mockRequest.query = { page: '0', limit: '10' };

      await getAttachments(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      });
    });
  });

  describe('getAttachmentById', () => {
    it('should return an attachment by ID', async () => {
      const mockAttachment = { id: 1, fileName: 'test.pdf' };

      mockRequest.params = { id: '1' };

      (AttachmentModel.findById as jest.Mock).mockResolvedValueOnce(mockAttachment);

      await getAttachmentById(mockRequest as AuthRequest, mockResponse as Response);

      expect(AttachmentModel.findById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAttachment);
    });

    it('should return 404 if attachment is not found', async () => {
      mockRequest.params = { id: '999' };

      (AttachmentModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await getAttachmentById(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Attachment not found' });
    });
  });

  describe('getAttachmentsByEntity', () => {
    it('should return attachments for a specific entity', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'file1.pdf' },
        { id: 2, fileName: 'file2.pdf' },
      ];

      mockRequest.params = {
        entityType: EntityType.EQUIPMENT,
        entityId: '5',
      };

      (AttachmentModel.findByEntity as jest.Mock).mockResolvedValueOnce(mockAttachments);
      (AttachmentModel.countByEntity as jest.Mock).mockResolvedValueOnce(2);

      await getAttachmentsByEntity(mockRequest as AuthRequest, mockResponse as Response);

      expect(AttachmentModel.findByEntity).toHaveBeenCalledWith(EntityType.EQUIPMENT, 5);
      expect(AttachmentModel.countByEntity).toHaveBeenCalledWith(EntityType.EQUIPMENT, 5);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockAttachments,
        count: 2,
      });
    });

    it('should return 400 for invalid entity type', async () => {
      mockRequest.params = {
        entityType: 'invalid_type',
        entityId: '5',
      };

      await getAttachmentsByEntity(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid entity type' });
    });

    it('should return 400 for invalid entity ID', async () => {
      mockRequest.params = {
        entityType: EntityType.EQUIPMENT,
        entityId: 'invalid',
      };

      await getAttachmentsByEntity(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid entity ID' });
    });
  });
});
