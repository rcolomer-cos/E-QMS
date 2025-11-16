import { Response } from 'express';
import { AttachmentModel, Attachment, EntityType, AttachmentFilters } from '../models/AttachmentModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { entityType, entityId, description, category, version, isPublic } = req.body;

    // Validate entityType
    if (!Object.values(EntityType).includes(entityType)) {
      // Clean up uploaded file
      fs.unlink(req.file.path).catch(() => {});
      res.status(400).json({ error: 'Invalid entity type' });
      return;
    }

    // Validate entityId
    const parsedEntityId = parseInt(entityId, 10);
    if (isNaN(parsedEntityId) || parsedEntityId <= 0) {
      // Clean up uploaded file
      fs.unlink(req.file.path).catch(() => {});
      res.status(400).json({ error: 'Invalid entity ID' });
      return;
    }

    const attachment: Attachment = {
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      entityType: entityType as EntityType,
      entityId: parsedEntityId,
      description: description || null,
      category: category || null,
      version: version || null,
      uploadedBy: req.user.id,
      isPublic: isPublic === 'true' || isPublic === true,
      active: true,
    };

    const attachmentId = await AttachmentModel.create(attachment);

    res.status(201).json({
      message: 'Attachment uploaded successfully',
      id: attachmentId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

export const uploadMultipleAttachments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const { entityType, entityId, description, category, version, isPublic } = req.body;

    // Validate entityType
    if (!Object.values(EntityType).includes(entityType)) {
      // Clean up uploaded files
      Promise.all(files.map(f => fs.unlink(f.path).catch(() => {}))).catch(() => {});
      res.status(400).json({ error: 'Invalid entity type' });
      return;
    }

    // Validate entityId
    const parsedEntityId = parseInt(entityId, 10);
    if (isNaN(parsedEntityId) || parsedEntityId <= 0) {
      // Clean up uploaded files
      Promise.all(files.map(f => fs.unlink(f.path).catch(() => {}))).catch(() => {});
      res.status(400).json({ error: 'Invalid entity ID' });
      return;
    }

    const uploadedAttachments: Array<{ id: number; fileName: string; fileSize: number }> = [];

    for (const file of files) {
      const attachment: Attachment = {
        fileName: file.originalname,
        storedFileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileExtension: path.extname(file.originalname),
        entityType: entityType as EntityType,
        entityId: parsedEntityId,
        description: description || null,
        category: category || null,
        version: version || null,
        uploadedBy: req.user.id,
        isPublic: isPublic === 'true' || isPublic === true,
        active: true,
      };

      const attachmentId = await AttachmentModel.create(attachment);
      uploadedAttachments.push({
        id: attachmentId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
      });
    }

    res.status(201).json({
      message: `${uploadedAttachments.length} attachment(s) uploaded successfully`,
      attachments: uploadedAttachments,
    });
  } catch (error) {
    // Clean up uploaded files on error
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      Promise.all(files.map(f => fs.unlink(f.path).catch(() => {}))).catch(() => {});
    }
    console.error('Upload multiple attachments error:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
};

export const getAttachments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityType, entityId, category, uploadedBy, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters: AttachmentFilters = {
      entityType: entityType as EntityType | undefined,
      entityId: entityId ? parseInt(entityId as string, 10) : undefined,
      category: category as string | undefined,
      uploadedBy: uploadedBy ? parseInt(uploadedBy as string, 10) : undefined,
      active: true,
    };

    const allAttachments = await AttachmentModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAttachments = allAttachments.slice(startIndex, endIndex);

    res.json({
      data: paginatedAttachments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allAttachments.length,
        pages: Math.ceil(allAttachments.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
};

export const getAttachmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment = await AttachmentModel.findById(parseInt(id, 10));
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    res.json(attachment);
  } catch (error) {
    console.error('Get attachment by ID error:', error);
    res.status(500).json({ error: 'Failed to get attachment' });
  }
};

export const downloadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment = await AttachmentModel.findById(parseInt(id, 10));
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check if file exists
    try {
      await fs.access(attachment.filePath);
    } catch {
      res.status(404).json({ error: 'File not found on server' });
      return;
    }

    // Set response headers
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);

    // Stream the file
    const fileStream = createReadStream(attachment.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download attachment error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  }
};

export const updateAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { description, category, version, isPublic } = req.body;

    const attachment = await AttachmentModel.findById(parseInt(id, 10));
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const updates: Partial<Attachment> = {};
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (version !== undefined) updates.version = version;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const success = await AttachmentModel.update(parseInt(id, 10), updates);

    if (success) {
      res.json({ message: 'Attachment updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update attachment' });
    }
  } catch (error) {
    console.error('Update attachment error:', error);
    res.status(500).json({ error: 'Failed to update attachment' });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const attachment = await AttachmentModel.findById(parseInt(id, 10));
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Soft delete in database
    const success = await AttachmentModel.softDelete(parseInt(id, 10), req.user.id);

    if (success) {
      // Optionally delete the physical file (keeping it for now for audit purposes)
      // fs.unlink(attachment.filePath).catch(() => {});
      
      res.json({ message: 'Attachment deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

export const getAttachmentsByEntity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;

    // Validate entityType
    if (!Object.values(EntityType).includes(entityType as EntityType)) {
      res.status(400).json({ error: 'Invalid entity type' });
      return;
    }

    const parsedEntityId = parseInt(entityId, 10);
    if (isNaN(parsedEntityId) || parsedEntityId <= 0) {
      res.status(400).json({ error: 'Invalid entity ID' });
      return;
    }

    const attachments = await AttachmentModel.findByEntity(entityType as EntityType, parsedEntityId);
    const count = await AttachmentModel.countByEntity(entityType as EntityType, parsedEntityId);

    res.json({
      data: attachments,
      count,
    });
  } catch (error) {
    console.error('Get attachments by entity error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
};
