import { Response, NextFunction } from 'express';
import { checkDocumentPermission, DocumentAction, documentPermissions } from '../../middleware/documentPermissions';
import { DocumentModel, Document } from '../../models/DocumentModel';
import { AuthRequest, UserRole, DocumentStatus } from '../../types';

// Mock DocumentModel
jest.mock('../../models/DocumentModel');

describe('Document Permissions Middleware', () => {
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    mockAuthRequest = {
      params: { id: '1' },
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

  describe('checkDocumentPermission - VIEW action', () => {
    const middleware = checkDocumentPermission(DocumentAction.VIEW);

    it('should allow viewing approved documents for all authenticated users', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.APPROVED,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(DocumentModel.findById).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalled();
      expect(mockAuthRequest.document).toBe(document);
    });

    it('should allow viewing own draft documents', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 1,
        ownerId: 1,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny viewing draft documents created by others', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Access denied: insufficient permissions to view this document',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow admins to view any document', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow managers to view any document', async () => {
      mockAuthRequest.user!.roles = [UserRole.MANAGER];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 404 if document not found', async () => {
      (DocumentModel.findById as jest.Mock).mockResolvedValue(null);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Document not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not authenticated' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkDocumentPermission - EDIT action', () => {
    const middleware = checkDocumentPermission(DocumentAction.EDIT);

    it('should allow editing own draft documents', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 1,
        ownerId: 1,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow editing own documents in review', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.REVIEW,
        createdBy: 1,
        ownerId: 1,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny editing approved documents for regular users', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.APPROVED,
        createdBy: 1,
        ownerId: 1,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Access denied: insufficient permissions to edit this document',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny editing documents created by others', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow admins to edit any document', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.APPROVED,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow managers to edit draft and review documents', async () => {
      mockAuthRequest.user!.roles = [UserRole.MANAGER];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.REVIEW,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkDocumentPermission - APPROVE action', () => {
    const middleware = checkDocumentPermission(DocumentAction.APPROVE);

    it('should allow managers to approve documents in review', async () => {
      mockAuthRequest.user!.roles = [UserRole.MANAGER];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.REVIEW,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny approval for regular users', async () => {
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.REVIEW,
        createdBy: 1,
        ownerId: 1,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Access denied: insufficient permissions to approve this document',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny approval for draft documents', async () => {
      mockAuthRequest.user!.roles = [UserRole.MANAGER];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.DRAFT,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow admins to approve documents in review', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];
      const document: Document = {
        id: 1,
        title: 'Test Document',
        documentType: 'policy',
        category: 'Quality',
        version: '1.0',
        status: DocumentStatus.REVIEW,
        createdBy: 2,
        ownerId: 2,
      };
      (DocumentModel.findById as jest.Mock).mockResolvedValue(document);

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkDocumentPermission - DELETE action', () => {
    const middleware = checkDocumentPermission(DocumentAction.DELETE);

    it('should allow admins to delete documents', async () => {
      mockAuthRequest.user!.roles = [UserRole.ADMIN];

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(DocumentModel.findById).not.toHaveBeenCalled();
    });

    it('should allow superusers to delete documents', async () => {
      mockAuthRequest.user!.roles = [UserRole.SUPERUSER];

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny deletion for regular users', async () => {
      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Access denied: insufficient permissions to delete document',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny deletion for managers', async () => {
      mockAuthRequest.user!.roles = [UserRole.MANAGER];

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Permission helper functions', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: [UserRole.USER],
      roleIds: [1],
    };

    describe('canViewDocument', () => {
      it('should return true for approved documents', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.APPROVED,
          createdBy: 2,
        };
        expect(documentPermissions.canViewDocument(mockUser, document)).toBe(true);
      });

      it('should return true for own draft documents', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.DRAFT,
          createdBy: 1,
        };
        expect(documentPermissions.canViewDocument(mockUser, document)).toBe(true);
      });

      it('should return false for draft documents by others', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.DRAFT,
          createdBy: 2,
        };
        expect(documentPermissions.canViewDocument(mockUser, document)).toBe(false);
      });
    });

    describe('canEditDocument', () => {
      it('should return true for own draft documents', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.DRAFT,
          createdBy: 1,
        };
        expect(documentPermissions.canEditDocument(mockUser, document)).toBe(true);
      });

      it('should return false for approved documents', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.APPROVED,
          createdBy: 1,
        };
        expect(documentPermissions.canEditDocument(mockUser, document)).toBe(false);
      });
    });

    describe('canApproveDocument', () => {
      it('should return false for users without manager/admin role', () => {
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.REVIEW,
          createdBy: 1,
        };
        expect(documentPermissions.canApproveDocument(mockUser, document)).toBe(false);
      });

      it('should return true for managers with document in review', () => {
        const managerUser = { ...mockUser, roles: [UserRole.MANAGER] };
        const document: Document = {
          id: 1,
          title: 'Test',
          documentType: 'policy',
          category: 'Quality',
          version: '1.0',
          status: DocumentStatus.REVIEW,
          createdBy: 1,
        };
        expect(documentPermissions.canApproveDocument(managerUser, document)).toBe(true);
      });
    });

    describe('canDeleteDocument', () => {
      it('should return false for regular users', () => {
        expect(documentPermissions.canDeleteDocument(mockUser)).toBe(false);
      });

      it('should return true for admins', () => {
        const adminUser = { ...mockUser, roles: [UserRole.ADMIN] };
        expect(documentPermissions.canDeleteDocument(adminUser)).toBe(true);
      });

      it('should return true for superusers', () => {
        const superUser = { ...mockUser, roles: [UserRole.SUPERUSER] };
        expect(documentPermissions.canDeleteDocument(superUser)).toBe(true);
      });
    });
  });

  describe('Error handling', () => {
    const middleware = checkDocumentPermission(DocumentAction.VIEW);

    it('should handle database errors gracefully', async () => {
      (DocumentModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to check document permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid document ID', async () => {
      mockAuthRequest.params = { id: 'invalid' };

      await middleware(mockAuthRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid document ID' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
