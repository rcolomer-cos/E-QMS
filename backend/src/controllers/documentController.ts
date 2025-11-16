import { Response } from 'express';
import { DocumentModel, Document } from '../models/DocumentModel';
import { AuthRequest, DocumentStatus } from '../types';
import { validationResult } from 'express-validator';

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
    const { status, category, documentType } = req.query;

    const documents = await DocumentModel.findAll({
      status: status as DocumentStatus | undefined,
      category: category as string | undefined,
      documentType: documentType as string | undefined,
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
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
    const updates = req.body;
    await DocumentModel.update(documentId, updates);

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

    await DocumentModel.delete(parseInt(id, 10));

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
    await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'approve',
      comments || 'Document approved',
      undefined,
      document.status,
      DocumentStatus.APPROVED
    );

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
    await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'update',
      `Document rejected: ${reason}`,
      reason,
      document.status,
      DocumentStatus.DRAFT
    );

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
    await DocumentModel.createRevision(
      documentId,
      req.user.id,
      'update',
      `Changes requested: ${changes}`,
      changes,
      document.status,
      DocumentStatus.DRAFT
    );

    res.json({ message: 'Changes requested successfully' });
  } catch (error) {
    console.error('Request changes error:', error);
    res.status(500).json({ error: 'Failed to request changes' });
  }
};
