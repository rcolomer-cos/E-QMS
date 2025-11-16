import { Response } from 'express';
import { DocumentModel, Document } from '../models/DocumentModel';
import { AuthRequest, UserRole, DocumentStatus } from '../types';
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
    
    // Check if document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

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
    if (!req.user || !req.user.roles.includes(UserRole.ADMIN) && !req.user.roles.includes(UserRole.SUPERUSER)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

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
