import { Response } from 'express';
import { DocumentComplianceAcknowledgementModel } from '../models/DocumentComplianceAcknowledgementModel';
import { DocumentModel } from '../models/DocumentModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, AuditActionCategory } from '../services/auditLogService';
import { NotificationService } from '../services/notificationService';
import { DocumentGroupModel } from '../models/DocumentGroupModel';

/**
 * Record a user's acknowledgement of a compliance-required document
 */
export const acknowledgeDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { documentId } = req.params;
    const docId = parseInt(documentId, 10);

    // Get document details
    const document = await DocumentModel.findById(docId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check if document requires compliance
    if (!document.complianceRequired) {
      res.status(400).json({ error: 'Document does not require compliance acknowledgement' });
      return;
    }

    // Check if user has access to document through groups
    const hasAccess = await DocumentGroupModel.userHasAccess(req.user.id, docId);
    if (!hasAccess) {
      res.status(403).json({ error: 'You do not have access to this document' });
      return;
    }

    // Check if already acknowledged
    const alreadyAcknowledged = await DocumentComplianceAcknowledgementModel.hasAcknowledged(
      req.user.id,
      docId,
      document.version
    );

    if (alreadyAcknowledged) {
      res.status(400).json({ error: 'You have already acknowledged this document version' });
      return;
    }

    // Record acknowledgement
    const acknowledgementId = await DocumentComplianceAcknowledgementModel.create({
      documentId: docId,
      userId: req.user.id,
      documentVersion: document.version,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'DocumentComplianceAcknowledgement',
      entityId: acknowledgementId,
      entityIdentifier: `${document.title} v${document.version}`,
      newValues: {
        documentId: docId,
        userId: req.user.id,
        documentVersion: document.version,
      },
    });

    res.status(201).json({
      message: 'Document acknowledgement recorded successfully',
      acknowledgementId,
    });
  } catch (error) {
    console.error('Acknowledge document error:', error);
    res.status(500).json({ error: 'Failed to record document acknowledgement' });
  }
};

/**
 * Get compliance status for a specific document and user
 */
export const getComplianceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { documentId } = req.params;
    const docId = parseInt(documentId, 10);

    const status = await DocumentComplianceAcknowledgementModel.getComplianceStatus(req.user.id, docId);

    res.json(status);
  } catch (error) {
    console.error('Get compliance status error:', error);
    res.status(500).json({ error: 'Failed to get compliance status' });
  }
};

/**
 * Get detailed compliance report for a document (admin only)
 */
export const getDocumentComplianceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { documentId } = req.params;
    const docId = parseInt(documentId, 10);

    const report = await DocumentComplianceAcknowledgementModel.getDocumentComplianceReport(docId);

    if (!report) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(report);
  } catch (error) {
    console.error('Get document compliance report error:', error);
    res.status(500).json({ error: 'Failed to get compliance report' });
  }
};

/**
 * Get all pending documents requiring acknowledgement for current user
 */
export const getPendingDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const pendingDocuments = await DocumentComplianceAcknowledgementModel.getPendingDocumentsForUser(req.user.id);

    res.json(pendingDocuments);
  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ error: 'Failed to get pending documents' });
  }
};

/**
 * Get all compliance-required documents for current user with status
 */
export const getComplianceDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const documents = await DocumentComplianceAcknowledgementModel.getComplianceDocumentsForUser(req.user.id);

    res.json(documents);
  } catch (error) {
    console.error('Get compliance documents error:', error);
    res.status(500).json({ error: 'Failed to get compliance documents' });
  }
};

/**
 * Toggle compliance requirement for a document (admin only)
 */
export const toggleComplianceRequired = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { documentId } = req.params;
    const { complianceRequired } = req.body;
    const docId = parseInt(documentId, 10);

    const document = await DocumentModel.findById(docId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Update compliance requirement
    await DocumentModel.update(docId, { complianceRequired });

    // If enabling compliance and document is approved, notify users in assigned groups
    if (complianceRequired && document.status === 'approved') {
      const actorName = `${req.user.firstName} ${req.user.lastName}`;
      await NotificationService.notifyComplianceDocumentAdded(docId, actorName);
    }

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Document',
      entityId: docId,
      entityIdentifier: document.title,
      newValues: { complianceRequired },
    });

    res.json({
      message: 'Document compliance requirement updated successfully',
      complianceRequired,
    });
  } catch (error) {
    console.error('Toggle compliance required error:', error);
    res.status(500).json({ error: 'Failed to update compliance requirement' });
  }
};
