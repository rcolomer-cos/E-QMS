import { NotificationModel, Notification } from '../models/NotificationModel';
import { DocumentModel } from '../models/DocumentModel';
import { DocumentGroupModel } from '../models/DocumentGroupModel';

export interface NotificationData {
  userId: number;
  type: 'document_approved' | 'document_rejected' | 'document_changes_requested' | 'document_created' | 'document_updated';
  documentId: number;
  revisionId?: number;
  actorName: string; // Name of the person who triggered the notification
  reason?: string; // Reason for rejection or change request
}

export class NotificationService {
  /**
   * Send notification when a document is approved
   */
  static async notifyDocumentApproved(data: NotificationData): Promise<void> {
    try {
      const document = await DocumentModel.findById(data.documentId);
      if (!document) {
        console.error('Document not found for notification:', data.documentId);
        return;
      }

      const notification: Notification = {
        userId: data.userId,
        type: 'document_approved',
        title: 'Document Approved',
        message: `Your document "${document.title}" (v${document.version}) has been approved by ${data.actorName}.`,
        documentId: data.documentId,
        revisionId: data.revisionId,
      };

      await NotificationModel.create(notification);
      
      // TODO: Email notification support
      // When email service is added, send email notification here
      // Example: await EmailService.sendDocumentApprovedEmail(notification, userEmail);
    } catch (error) {
      console.error('Error sending document approval notification:', error);
      // Don't throw error to prevent notification failures from blocking the approval process
    }
  }

  /**
   * Send notification when a document is rejected
   */
  static async notifyDocumentRejected(data: NotificationData): Promise<void> {
    try {
      const document = await DocumentModel.findById(data.documentId);
      if (!document) {
        console.error('Document not found for notification:', data.documentId);
        return;
      }

      const reasonText = data.reason ? ` Reason: ${data.reason}` : '';
      
      const notification: Notification = {
        userId: data.userId,
        type: 'document_rejected',
        title: 'Document Rejected',
        message: `Your document "${document.title}" (v${document.version}) has been rejected by ${data.actorName}.${reasonText}`,
        documentId: data.documentId,
        revisionId: data.revisionId,
      };

      await NotificationModel.create(notification);
      
      // TODO: Email notification support
      // When email service is added, send email notification here
    } catch (error) {
      console.error('Error sending document rejection notification:', error);
    }
  }

  /**
   * Send notification when changes are requested for a document
   */
  static async notifyDocumentChangesRequested(data: NotificationData): Promise<void> {
    try {
      const document = await DocumentModel.findById(data.documentId);
      if (!document) {
        console.error('Document not found for notification:', data.documentId);
        return;
      }

      const changesText = data.reason ? ` Changes requested: ${data.reason}` : '';
      
      const notification: Notification = {
        userId: data.userId,
        type: 'document_changes_requested',
        title: 'Document Changes Requested',
        message: `Changes have been requested for your document "${document.title}" (v${document.version}) by ${data.actorName}.${changesText}`,
        documentId: data.documentId,
        revisionId: data.revisionId,
      };

      await NotificationModel.create(notification);
      
      // TODO: Email notification support
      // When email service is added, send email notification here
    } catch (error) {
      console.error('Error sending document change request notification:', error);
    }
  }

  /**
   * Send notification to all users in groups assigned to a document
   * Used when a document is created or updated
   */
  static async notifyDocumentGroupMembers(documentId: number, actorName: string, isUpdate: boolean = false): Promise<void> {
    try {
      const document = await DocumentModel.findById(documentId);
      if (!document) {
        console.error('Document not found for group notification:', documentId);
        return;
      }

      // Get all user IDs that have access through groups
      const userIds = await DocumentGroupModel.getUserIdsForDocument(documentId);

      if (userIds.length === 0) {
        // No groups assigned to this document
        return;
      }

      const notificationType = isUpdate ? 'document_updated' : 'document_created';
      const title = isUpdate ? 'Document Updated' : 'New Document Available';
      const action = isUpdate ? 'updated' : 'added';

      // Create notifications for all users in the groups
      for (const userId of userIds) {
        const notification: Notification = {
          userId,
          type: notificationType as any,
          title,
          message: `A new document "${document.title}" (v${document.version}) has been ${action} by ${actorName}. You have access through your group membership.`,
          documentId,
        };

        await NotificationModel.create(notification);
      }

      // TODO: Email notification support
      // When email service is added, send email notifications here
    } catch (error) {
      console.error('Error sending document group notifications:', error);
      // Don't throw error to prevent notification failures from blocking document operations
    }
  }

  /**
   * Send notification when a document is created
   */
  static async notifyDocumentCreated(documentId: number, actorName: string): Promise<void> {
    await this.notifyDocumentGroupMembers(documentId, actorName, false);
  }

  /**
   * Send notification when a document is updated
   */
  static async notifyDocumentUpdated(documentId: number, actorName: string): Promise<void> {
    await this.notifyDocumentGroupMembers(documentId, actorName, true);
  }
}
