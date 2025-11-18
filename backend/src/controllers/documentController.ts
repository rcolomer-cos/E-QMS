import { Response } from 'express';
import { DocumentModel, Document } from '../models/DocumentModel';
import { AuthRequest, DocumentStatus } from '../types';
import { validationResult } from 'express-validator';
import { getConnection } from '../config/database';
import { NotificationService } from '../services/notificationService';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';
import { DocumentContentModel } from '../models/DocumentContentModel';
import PDFDocument from 'pdfkit';
import { createReadStream } from 'fs';

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const document: Document = {
      ...req.body,
      createdBy: req.user.id,
    };

    const documentId = await DocumentModel.create(document);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Document',
      entityId: documentId,
      entityIdentifier: document.title,
      newValues: document,
    });

    res.status(201).json({
      message: 'Document created successfully',
      documentId,
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, documentType, processId, includeSubProcesses } = req.query as Record<string, string>;

    const documents = await DocumentModel.findAll({
      status: status as DocumentStatus | undefined,
      category: category as string | undefined,
      documentType: documentType as string | undefined,
      processId: processId ? parseInt(processId, 10) : undefined,
      includeSubProcesses: includeSubProcesses === 'true',
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

export const getPendingDocuments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = await getConnection();
    
    // Get documents in 'review' status with creator and latest revision information
    const result = await pool
      .request()
      .query(`
        SELECT 
          d.*,
          creator.firstName AS creatorFirstName,
          creator.lastName AS creatorLastName,
          creator.email AS creatorEmail,
          owner.firstName AS ownerFirstName,
          owner.lastName AS ownerLastName,
          owner.email AS ownerEmail,
          latestRev.revisionNumber AS latestRevisionNumber,
          latestRev.changeDescription AS latestChangeDescription,
          latestRev.changeType AS latestChangeType,
          latestRev.revisionDate AS latestRevisionDate,
          latestRev.authorId AS latestRevisionAuthorId,
          revAuthor.firstName AS latestRevisionAuthorFirstName,
          revAuthor.lastName AS latestRevisionAuthorLastName
        FROM Documents d
        LEFT JOIN Users creator ON d.createdBy = creator.id
        LEFT JOIN Users owner ON d.ownerId = owner.id
        LEFT JOIN (
          SELECT 
            dr.*,
            ROW_NUMBER() OVER (PARTITION BY dr.documentId ORDER BY dr.revisionDate DESC) AS rn
          FROM DocumentRevisions dr
        ) latestRev ON d.id = latestRev.documentId AND latestRev.rn = 1
        LEFT JOIN Users revAuthor ON latestRev.authorId = revAuthor.id
        WHERE d.status = 'review'
        ORDER BY d.updatedAt DESC, d.createdAt DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ error: 'Failed to get pending documents' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Document is already loaded by permission middleware and stored in req.document
    if (req.document) {
      res.json(req.document);
      return;
    }

    // Fallback if middleware didn't load document (shouldn't happen with permission middleware)
    const { id } = req.params;
    const document = await DocumentModel.findById(parseInt(id, 10));
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

export const updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    
    // Document existence and permissions already checked by middleware
    const document = req.document;
    const updates = req.body;
    await DocumentModel.update(documentId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Document',
      entityId: documentId,
      entityIdentifier: document?.title,
      oldValues: document,
      newValues: updates,
    });

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Permissions already checked by middleware
    const { id } = req.params;
    const document = req.document;

    await DocumentModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Document',
      entityId: parseInt(id, 10),
      entityIdentifier: document?.title,
      oldValues: document,
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const createDocumentVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const newDocId = await DocumentModel.createVersion(parseInt(id, 10), req.user.id);

    res.status(201).json({
      message: 'Document version created successfully',
      documentId: newDocId,
    });
  } catch (error) {
    console.error('Create document version error:', error);
    res.status(500).json({ error: 'Failed to create document version' });
  }
};

export const uploadDocumentFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);

    // Check if document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Update document with file information
    await DocumentModel.update(documentId, {
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    res.json({
      message: 'Document file uploaded successfully',
      file: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
      },
    });
  } catch (error) {
    console.error('Upload document file error:', error);
    res.status(500).json({ error: 'Failed to upload document file' });
  }
};

export const getDocumentVersionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id, 10);

    // Check if document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const versions = await DocumentModel.getVersionHistory(documentId);

    res.json(versions);
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({ error: 'Failed to get version history' });
  }
};

export const getDocumentRevisionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id, 10);

    // Check if document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const revisions = await DocumentModel.getRevisionHistory(documentId);

    res.json(revisions);
  } catch (error) {
    console.error('Get revision history error:', error);
    res.status(500).json({ error: 'Failed to get revision history' });
  }
};

export const getDocumentContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id, 10);

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const content = await DocumentContentModel.getByDocumentId(documentId);
    res.json(content || { documentId, content: '', contentFormat: 'prosemirror' });
  } catch (error) {
    console.error('Get document content error:', error);
    res.status(500).json({ error: 'Failed to get document content' });
  }
};

export const upsertDocumentContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const { content, contentFormat } = req.body as { content: string; contentFormat: 'html' | 'prosemirror' };

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    await DocumentContentModel.upsert({ documentId, content, contentFormat, updatedBy: req.user.id });

    res.json({ message: 'Content saved' });
  } catch (error) {
    console.error('Upsert document content error:', error);
    res.status(500).json({ error: 'Failed to save document content' });
  }
};

export const uploadDocumentContentImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Return a URL that frontend can use in the editor; here we use file path
    res.status(201).json({
      message: 'Image uploaded',
      url: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload content image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const exportDocumentPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const content = await DocumentContentModel.getByDocumentId(documentId);

    // Basic PDF export using PDFKit (text-only for this iteration)
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', (e) => console.error('PDF error:', e));

    // Watermark: UNCONTROLLED COPY diagonally on each page
    const addWatermark = () => {
      const { width, height } = doc.page;
      doc.save();
      doc.rotate(-45, { origin: [width / 2, height / 2] });
      doc.fontSize(50).fillColor('#cccccc').opacity(0.3).text('UNCONTROLLED COPY', width / 2 - 200, height / 2, {
        align: 'center',
      });
      doc.opacity(1).fillColor('#000000');
      doc.restore();
    };

    addWatermark();

    doc.font('Helvetica-Bold').fontSize(16).text(document.title);
    doc.moveDown();
    doc.font('Helvetica').fontSize(10).text(`Version: ${document.version} | Status: ${document.status}`);
    doc.moveDown();

    const raw = (content?.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    doc.fontSize(12).text(raw, { align: 'left' });

    doc.on('pageAdded', addWatermark);
    doc.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const fileName = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}-v${document.version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Export document PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};
export const createDocumentRevision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const { changeType, changeDescription, changeReason, statusBefore, statusAfter } = req.body;

    // Check if document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const revisionId = await DocumentModel.createRevision(
      documentId,
      req.user.id,
      changeType,
      changeDescription,
      changeReason,
      statusBefore,
      statusAfter
    );

    res.status(201).json({
      message: 'Revision created successfully',
      revisionId,
    });
  } catch (error) {
    console.error('Create revision error:', error);
    res.status(500).json({ error: 'Failed to create revision' });
  }
};

export const downloadDocumentFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Use document from middleware if available
    let document = req.document;
    
    if (!document) {
      const { id } = req.params;
      const documentId = parseInt(id, 10);
      const fetchedDocument = await DocumentModel.findById(documentId);
      
      if (!fetchedDocument) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      document = fetchedDocument;
    }

    // Check if document has a file
    if (!document.filePath || !document.fileName) {
      res.status(404).json({ error: 'Document file not found' });
      return;
    }

    // Send file
    res.download(document.filePath, document.fileName, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error) {
    console.error('Download document file error:', error);
    res.status(500).json({ error: 'Failed to download document file' });
  }
};

export const approveDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const { comments } = req.body;

    // Document existence and permissions already checked by middleware
    const document = req.document;
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Update document status to approved
    await DocumentModel.update(documentId, {
      status: DocumentStatus.APPROVED,
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    // Create revision entry for approval
    const revisionId = await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'approve',
      comments || 'Document approved',
      undefined,
      document.status,
      DocumentStatus.APPROVED
    );

    // Send notification to document creator
    await NotificationService.notifyDocumentApproved({
      userId: document.createdBy,
      type: 'document_approved',
      documentId,
      revisionId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
    });

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.DOCUMENT,
      entityType: 'Document',
      entityId: documentId,
      entityIdentifier: document.title,
      oldValues: { status: document.status },
      newValues: { status: DocumentStatus.APPROVED },
      actionDescription: `Document approved by ${req.user.firstName} ${req.user.lastName}`,
    });

    res.json({ message: 'Document approved successfully' });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ error: 'Failed to approve document' });
  }
};

export const rejectDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    // Document existence and permissions already checked by middleware
    const document = req.document;
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Update document status back to draft
    await DocumentModel.update(documentId, {
      status: DocumentStatus.DRAFT,
    });

    // Create revision entry for rejection
    const revisionId = await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'update',
      `Document rejected: ${reason}`,
      reason,
      document.status,
      DocumentStatus.DRAFT
    );

    // Send notification to document creator
    await NotificationService.notifyDocumentRejected({
      userId: document.createdBy,
      type: 'document_rejected',
      documentId,
      revisionId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      reason,
    });

    res.json({ message: 'Document rejected successfully' });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({ error: 'Failed to reject document' });
  }
};

export const requestChangesDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const documentId = parseInt(id, 10);
    const { changes } = req.body;

    if (!changes || changes.trim().length === 0) {
      res.status(400).json({ error: 'Change request description is required' });
      return;
    }

    // Document existence and permissions already checked by middleware
    const document = req.document;
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Update document status back to draft for changes
    await DocumentModel.update(documentId, {
      status: DocumentStatus.DRAFT,
    });

    // Create revision entry for change request
    const revisionId = await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'update',
      `Changes requested: ${changes}`,
      changes,
      document.status,
      DocumentStatus.DRAFT
    );

    // Send notification to document creator
    await NotificationService.notifyDocumentChangesRequested({
      userId: document.createdBy,
      type: 'document_changes_requested',
      documentId,
      revisionId,
      actorName: `${req.user.firstName} ${req.user.lastName}`,
      reason: changes,
    });

    res.json({ message: 'Changes requested successfully' });
  } catch (error) {
    console.error('Request changes error:', error);
    res.status(500).json({ error: 'Failed to request changes' });
  }
};

export const getDocumentProcesses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id, 10);

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('documentId', documentId)
      .query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.processType,
          pd.linkedAt,
          u.firstName + ' ' + u.lastName as linkedByName
        FROM ProcessDocuments pd
        INNER JOIN Processes p ON pd.processId = p.id
        LEFT JOIN Users u ON pd.linkedBy = u.id
        WHERE pd.documentId = @documentId AND p.active = 1
        ORDER BY pd.linkedAt DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Get document processes error:', error);
    res.status(500).json({ error: 'Failed to fetch document processes' });
  }
};
