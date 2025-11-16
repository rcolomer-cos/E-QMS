import { Response } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
  uploadDocumentFile,
} from '../../controllers/documentController';
import { DocumentModel } from '../../models/DocumentModel';
import { AuthRequest, UserRole, DocumentStatus } from '../../types';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/DocumentModel');
jest.mock('express-validator');

describe('Document Controller', () => {
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
      query: {},
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [UserRole.USER],
        roleIds: [1],
      },
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Validation error' }],
      });

      await createDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
    });

    it('should return 401 if user is not authenticated', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.user = undefined;

      await createDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should create document successfully', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.body = {
        title: 'Test Document',
        description: 'Test Description',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
      };
      (DocumentModel.create as jest.Mock).mockResolvedValue(123);

      await createDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.create).toHaveBeenCalledWith({
        ...mockAuthRequest.body,
        createdBy: 1,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Document created successfully',
        documentId: 123,
      });
    });

    it('should return 500 on database error', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.body = {
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
      };
      (DocumentModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create document' });
    });
  });

  describe('getDocuments', () => {
    it('should return all documents', async () => {
      const mockDocuments = [
        {
          id: 1,
          title: 'Document 1',
          status: DocumentStatus.APPROVED,
          category: 'Quality',
        },
        {
          id: 2,
          title: 'Document 2',
          status: DocumentStatus.DRAFT,
          category: 'Safety',
        },
      ];
      (DocumentModel.findAll as jest.Mock).mockResolvedValue(mockDocuments);

      await getDocuments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.findAll).toHaveBeenCalledWith({
        status: undefined,
        category: undefined,
        documentType: undefined,
      });
      expect(mockJson).toHaveBeenCalledWith(mockDocuments);
    });

    it('should filter documents by status', async () => {
      mockAuthRequest.query = { status: DocumentStatus.APPROVED };
      const mockDocuments = [
        {
          id: 1,
          title: 'Document 1',
          status: DocumentStatus.APPROVED,
          category: 'Quality',
        },
      ];
      (DocumentModel.findAll as jest.Mock).mockResolvedValue(mockDocuments);

      await getDocuments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.findAll).toHaveBeenCalledWith({
        status: DocumentStatus.APPROVED,
        category: undefined,
        documentType: undefined,
      });
      expect(mockJson).toHaveBeenCalledWith(mockDocuments);
    });

    it('should return 500 on database error', async () => {
      (DocumentModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getDocuments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get documents' });
    });
  });

  describe('getDocumentById', () => {
    it('should return document by id', async () => {
      mockAuthRequest.params = { id: '1' };
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        status: DocumentStatus.APPROVED,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(mockDocument);

      await getDocumentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(mockDocument);
    });

    it('should return 404 if document not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await getDocumentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getDocumentById(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get document' });
    });
  });

  describe('updateDocument', () => {
    it('should return 400 if validation fails', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Validation error' }],
      });
      mockAuthRequest.params = { id: '1' };

      await updateDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
    });

    it('should return 404 if document not found', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '999' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await updateDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should update document successfully', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (DocumentModel.update as jest.Mock).mockResolvedValue(undefined);

      await updateDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.update).toHaveBeenCalledWith(1, mockAuthRequest.body);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Document updated successfully' });
    });

    it('should return 500 on database error', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (DocumentModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update document' });
    });
  });

  describe('deleteDocument', () => {
    it('should return 403 if user is not admin or superuser', async () => {
      mockAuthRequest.user!.roles = [UserRole.USER];
      mockAuthRequest.params = { id: '1' };

      await deleteDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should delete document successfully as admin', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Document deleted successfully' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete document' });
    });
  });

  describe('createDocumentVersion', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;
      mockAuthRequest.params = { id: '1' };

      await createDocumentVersion(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should create document version successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.createVersion as jest.Mock).mockResolvedValue(456);

      await createDocumentVersion(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.createVersion).toHaveBeenCalledWith(1, 1);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Document version created successfully',
        documentId: 456,
      });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.createVersion as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createDocumentVersion(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create document version' });
    });
  });

  describe('uploadDocumentFile', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;
      mockAuthRequest.params = { id: '1' };

      await uploadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if document not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await uploadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should return 400 if no file uploaded', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({ id: 1 });
      mockAuthRequest.file = undefined;

      await uploadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should upload document file successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({ id: 1 });
      mockAuthRequest.file = {
        path: '/uploads/documents/test-file.pdf',
        originalname: 'test-file.pdf',
        size: 12345,
      } as Express.Multer.File;
      (DocumentModel.update as jest.Mock).mockResolvedValue(undefined);

      await uploadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.update).toHaveBeenCalledWith(1, {
        filePath: '/uploads/documents/test-file.pdf',
        fileName: 'test-file.pdf',
        fileSize: 12345,
      });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Document file uploaded successfully',
        file: {
          fileName: 'test-file.pdf',
          fileSize: 12345,
          filePath: '/uploads/documents/test-file.pdf',
        },
      });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({ id: 1 });
      mockAuthRequest.file = {
        path: '/uploads/documents/test-file.pdf',
        originalname: 'test-file.pdf',
        size: 12345,
      } as Express.Multer.File;
      (DocumentModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await uploadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to upload document file' });
    });
  });
});
