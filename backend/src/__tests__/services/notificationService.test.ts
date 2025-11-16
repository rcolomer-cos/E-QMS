import { NotificationService } from '../../services/notificationService';
import { NotificationModel } from '../../models/NotificationModel';
import { DocumentModel } from '../../models/DocumentModel';

// Mock dependencies
jest.mock('../../models/NotificationModel');
jest.mock('../../models/DocumentModel');

describe('NotificationService', () => {
  const mockDocument = {
    id: 1,
    title: 'Test Document',
    version: '1.0',
    documentType: 'Policy',
    category: 'Quality',
    status: 'review',
    createdBy: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyDocumentApproved', () => {
    it('should create a notification when document is approved', async () => {
      const mockFindById = jest.spyOn(DocumentModel, 'findById').mockResolvedValue(mockDocument as any);
      const mockCreate = jest.spyOn(NotificationModel, 'create').mockResolvedValue(1);

      await NotificationService.notifyDocumentApproved({
        userId: 1,
        type: 'document_approved',
        documentId: 1,
        revisionId: 1,
        actorName: 'John Doe',
      });

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'document_approved',
          title: 'Document Approved',
          documentId: 1,
          revisionId: 1,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const mockFindById = jest.spyOn(DocumentModel, 'findById').mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationService.notifyDocumentApproved({
        userId: 1,
        type: 'document_approved',
        documentId: 1,
        actorName: 'John Doe',
      });

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing document', async () => {
      const mockFindById = jest.spyOn(DocumentModel, 'findById').mockResolvedValue(null);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationService.notifyDocumentApproved({
        userId: 1,
        type: 'document_approved',
        documentId: 999,
        actorName: 'John Doe',
      });

      expect(mockFindById).toHaveBeenCalledWith(999);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Document not found for notification:', 999);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('notifyDocumentRejected', () => {
    it('should create a notification when document is rejected', async () => {
      const mockFindById = jest.spyOn(DocumentModel, 'findById').mockResolvedValue(mockDocument as any);
      const mockCreate = jest.spyOn(NotificationModel, 'create').mockResolvedValue(1);

      await NotificationService.notifyDocumentRejected({
        userId: 1,
        type: 'document_rejected',
        documentId: 1,
        revisionId: 1,
        actorName: 'John Doe',
        reason: 'Missing required sections',
      });

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'document_rejected',
          title: 'Document Rejected',
          documentId: 1,
          revisionId: 1,
        })
      );
      
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.message).toContain('Missing required sections');
    });

    it('should create notification without reason', async () => {
      jest.spyOn(DocumentModel, 'findById').mockResolvedValue(mockDocument as any);
      const mockCreate = jest.spyOn(NotificationModel, 'create').mockResolvedValue(1);

      await NotificationService.notifyDocumentRejected({
        userId: 1,
        type: 'document_rejected',
        documentId: 1,
        actorName: 'John Doe',
      });

      expect(mockCreate).toHaveBeenCalled();
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.message).not.toContain('Reason:');
    });
  });

  describe('notifyDocumentChangesRequested', () => {
    it('should create a notification when changes are requested', async () => {
      const mockFindById = jest.spyOn(DocumentModel, 'findById').mockResolvedValue(mockDocument as any);
      const mockCreate = jest.spyOn(NotificationModel, 'create').mockResolvedValue(1);

      await NotificationService.notifyDocumentChangesRequested({
        userId: 1,
        type: 'document_changes_requested',
        documentId: 1,
        revisionId: 1,
        actorName: 'John Doe',
        reason: 'Please update section 3.2',
      });

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'document_changes_requested',
          title: 'Document Changes Requested',
          documentId: 1,
          revisionId: 1,
        })
      );
      
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.message).toContain('Please update section 3.2');
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(DocumentModel, 'findById').mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationService.notifyDocumentChangesRequested({
        userId: 1,
        type: 'document_changes_requested',
        documentId: 1,
        actorName: 'John Doe',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
