import { Response } from 'express';
import {
  createDocument,
  getDocuments,
  getPendingDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
  uploadDocumentFile,
  downloadDocumentFile,
  getDocumentRevisionHistory,
  createDocumentRevision,
  approveDocument,
  rejectDocument,
  requestChangesDocument,
} from '../../controllers/documentController';
import { DocumentModel } from '../../models/DocumentModel';
import { AuthRequest, UserRole, DocumentStatus } from '../../types';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../models/DocumentModel');
jest.mock('../../models/DocumentRevisionModel');
jest.mock('../../config/database');
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

  describe('getPendingDocuments', () => {
    let mockPool: any;

    beforeEach(() => {
      mockPool = {
        request: jest.fn().mockReturnThis(),
        query: jest.fn(),
      };
      const { getConnection } = require('../../config/database');
      (getConnection as jest.Mock).mockResolvedValue(mockPool);
    });

    it('should return pending documents with enriched data', async () => {
      const mockPendingDocs = [
        {
          id: 1,
          title: 'Document Pending Review',
          status: 'review',
          creatorFirstName: 'John',
          creatorLastName: 'Doe',
          latestRevisionNumber: 2,
          latestChangeDescription: 'Updated content',
        },
      ];
      mockPool.query.mockResolvedValue({ recordset: mockPendingDocs });

      await getPendingDocuments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockPool.query).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockPendingDocs);
    });

    it('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await getPendingDocuments(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get pending documents' });
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

    it('should update document successfully', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
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
    it('should delete document successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.delete as jest.Mock).mockResolvedValue(undefined);

      await deleteDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Document deleted successfully' });
    });

    it('should return 500 on database error', async () => {
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

  describe('downloadDocumentFile', () => {
    let mockDownload: jest.Mock;

    beforeEach(() => {
      mockDownload = jest.fn((_path, _filename, callback) => {
        callback(null);
      });
      mockResponse.download = mockDownload;
    });

    it('should return 404 if document not found', async () => {
      mockAuthRequest.params = { id: '999' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await downloadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should return 404 if document has no file', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        filePath: null,
        fileName: null,
      });

      await downloadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document file not found' });
    });

    it('should download document file successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        filePath: '/uploads/documents/test-file.pdf',
        fileName: 'test-file.pdf',
      });

      await downloadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockDownload).toHaveBeenCalledWith(
        '/uploads/documents/test-file.pdf',
        'test-file.pdf',
        expect.any(Function)
      );
    });

    it('should handle download error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        filePath: '/uploads/documents/test-file.pdf',
        fileName: 'test-file.pdf',
      });
      mockDownload.mockImplementation((_path, _filename, callback) => {
        callback(new Error('File not accessible'));
      });
      (mockResponse as Response & { headersSent: boolean }).headersSent = false;

      await downloadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to download file' });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await downloadDocumentFile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to download document file' });
    });
  });

  describe('approveDocument', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;
      mockAuthRequest.params = { id: '1' };

      await approveDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should approve document successfully without comments', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockResolvedValue(undefined);
      (DocumentModel.createRevision as jest.Mock).mockResolvedValue(1);

      await approveDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.update).toHaveBeenCalledWith(1, {
        status: DocumentStatus.APPROVED,
        approvedBy: 1,
        approvedAt: expect.any(Date),
      });
      expect(DocumentModel.createRevision).toHaveBeenCalledWith(
        1,
        1,
        'approve',
        'Document approved',
        undefined,
        DocumentStatus.REVIEW,
        DocumentStatus.APPROVED
      );
      expect(mockJson).toHaveBeenCalledWith({ message: 'Document approved successfully' });
    });

    it('should return 500 on database error', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await approveDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to approve document' });
    });
  });

  describe('getDocumentRevisionHistory', () => {
    it('should return 404 if document not found', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await getDocumentRevisionHistory(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should retrieve revision history successfully', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        status: DocumentStatus.APPROVED,
      };
      const mockRevisions = [
        {
          id: 1,
          documentId: 1,
          version: '1.0',
          revisionNumber: 1,
          changeType: 'create',
          authorId: 1,
          statusAfter: 'draft',
        },
      ];

      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(mockDocument);
      (DocumentModel.getRevisionHistory as jest.Mock).mockResolvedValue(mockRevisions);

      await getDocumentRevisionHistory(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.findById).toHaveBeenCalledWith(1);
      expect(DocumentModel.getRevisionHistory).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(mockRevisions);
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getDocumentRevisionHistory(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get revision history' });
    });
  });

  describe('createDocumentRevision', () => {
    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await createDocumentRevision(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if document not found', async () => {
      mockAuthRequest.params = { id: '1' };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await createDocumentRevision(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should create revision successfully', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        status: DocumentStatus.APPROVED,
      };

      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        changeType: 'update',
        changeDescription: 'Updated content',
        changeReason: 'Regulatory change',
        statusBefore: 'approved',
        statusAfter: 'approved',
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(mockDocument);
      (DocumentModel.createRevision as jest.Mock).mockResolvedValue(123);

      await createDocumentRevision(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.createRevision).toHaveBeenCalledWith(
        1,
        1,
        'update',
        'Updated content',
        'Regulatory change',
        'approved',
        'approved'
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Revision created successfully',
        revisionId: 123,
      });
    });

    it('should return 500 on database error', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {
        changeType: 'update',
        changeDescription: 'Test',
      };
      (DocumentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createDocumentRevision(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create revision' });
    });
  });

  describe('rejectDocument', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await rejectDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 if rejection reason is missing', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};

      await rejectDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Rejection reason is required' });
    });

    it('should return 404 if document is not found', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reason: 'Does not meet requirements' };
      mockAuthRequest.document = undefined;

      await rejectDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should reject document successfully and update status to draft', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reason: 'Does not meet quality standards' };
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockResolvedValue(undefined);
      (DocumentModel.createRevision as jest.Mock).mockResolvedValue(1);

      await rejectDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.update).toHaveBeenCalledWith(1, {
        status: DocumentStatus.DRAFT,
      });
      expect(DocumentModel.createRevision).toHaveBeenCalledWith(
        1,
        1,
        'update',
        'Document rejected: Does not meet quality standards',
        'Does not meet quality standards',
        DocumentStatus.REVIEW,
        DocumentStatus.DRAFT
      );
      expect(mockJson).toHaveBeenCalledWith({ message: 'Document rejected successfully' });
    });

    it('should return 500 if rejection fails', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { reason: 'Does not meet requirements' };
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await rejectDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to reject document' });
    });
  });

  describe('requestChangesDocument', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await requestChangesDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 400 if change request description is missing', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = {};

      await requestChangesDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Change request description is required' });
    });

    it('should return 404 if document is not found', async () => {
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { changes: 'Update section 3.2' };
      mockAuthRequest.document = undefined;

      await requestChangesDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should request changes successfully and update status to draft', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { changes: 'Please update section 3.2 with more details' };
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockResolvedValue(undefined);
      (DocumentModel.createRevision as jest.Mock).mockResolvedValue(1);

      await requestChangesDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(DocumentModel.update).toHaveBeenCalledWith(1, {
        status: DocumentStatus.DRAFT,
      });
      expect(DocumentModel.createRevision).toHaveBeenCalledWith(
        1,
        1,
        'update',
        'Changes requested: Please update section 3.2 with more details',
        'Please update section 3.2 with more details',
        DocumentStatus.REVIEW,
        DocumentStatus.DRAFT
      );
      expect(mockJson).toHaveBeenCalledWith({ message: 'Changes requested successfully' });
    });

    it('should return 500 if request changes fails', async () => {
      const mockDocument = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        status: DocumentStatus.REVIEW,
        version: '1.0',
        createdBy: 1,
      };
      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = { changes: 'Update required' };
      mockAuthRequest.document = mockDocument;
      (DocumentModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await requestChangesDocument(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to request changes' });
    });
  });

});
