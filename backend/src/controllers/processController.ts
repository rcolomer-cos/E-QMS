import { Response } from 'express';
import { ProcessModel, CreateProcessData } from '../models/ProcessModel';
import { ProcessOwnerModel, CreateProcessOwnerData } from '../models/ProcessOwnerModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

/**
 * Get all processes
 */
export const getAllProcesses = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const processes = await ProcessModel.findAll();
    res.json(processes);
  } catch (error) {
    console.error('Get all processes error:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
};

/**
 * Get process by ID
 */
export const getProcessById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const process = await ProcessModel.findById(parseInt(id, 10));

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    res.json(process);
  } catch (error) {
    console.error('Get process by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
};

/**
 * Get process by code
 */
export const getProcessByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const process = await ProcessModel.findByCode(code);

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    res.json(process);
  } catch (error) {
    console.error('Get process by code error:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
};

/**
 * Create a new process (admin/superuser only)
 */
export const createProcess = async (req: AuthRequest, res: Response): Promise<void> => {
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

    let { name, code, description, departmentId, processCategory, processType, parentProcessId, displayOrder, objective, scope, flowchartSvg } = req.body;

    // Defaults: ensure non-null values for critical fields
    if (!processType) {
      processType = 'main';
    }
    if (displayOrder === undefined || displayOrder === null) {
      try {
        const { getConnection } = await import('../config/database');
        const pool = await getConnection();
        const next = await pool.request().query('SELECT ISNULL(MAX(displayOrder), 0) + 10 AS nextOrder FROM Processes');
        displayOrder = next.recordset?.[0]?.nextOrder ?? 10;
      } catch {
        displayOrder = 10;
      }
    }

    // Auto-generate code if missing: 50-char uppercase alphanumeric
    const genCode = async (): Promise<string> => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const rand = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      for (let i = 0; i < 5; i++) {
        const candidate = rand(50);
        const exists = await ProcessModel.codeExists(candidate);
        if (!exists) return candidate;
      }
      return rand(50);
    };
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      code = await genCode();
    }

    // Check if process code already exists (after generation)
    const codeExists = await ProcessModel.codeExists(code);
    if (codeExists) {
      res.status(409).json({ error: 'Process with this code already exists' });
      return;
    }

    // Check if process name already exists
    const nameExists = await ProcessModel.nameExists(name);
    if (nameExists) {
      res.status(409).json({ error: 'Process with this name already exists' });
      return;
    }

    // Create process
    const processData: CreateProcessData = {
      name,
      code,
      description,
      departmentId,
      processCategory,
      processType,
      parentProcessId,
      displayOrder,
      objective,
      scope,
      flowchartSvg,
      createdBy: req.user.id,
    };

    const processId = await ProcessModel.create(processData);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.PROCESS,
      entityType: 'Process',
      entityId: processId,
      entityIdentifier: `${code} - ${name}`,
      newValues: processData,
    });

    res.status(201).json({
      message: 'Process created successfully',
      processId,
    });
  } catch (error) {
    console.error('Create process error:', error);
    res.status(500).json({ error: 'Failed to create process' });
  }
};

/**
 * Update process information (admin/superuser only)
 */
export const updateProcess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const processId = parseInt(id, 10);
    const { name, code, description, departmentId, processCategory, processType, parentProcessId, displayOrder, objective, scope, flowchartSvg } = req.body;

    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // Check if new code conflicts with existing process
    if (code && code !== process.code) {
      const codeExists = await ProcessModel.codeExists(code, processId);
      if (codeExists) {
        res.status(409).json({ error: 'Process with this code already exists' });
        return;
      }
    }

    // Check if new name conflicts with existing process
    if (name && name !== process.name) {
      const nameExists = await ProcessModel.nameExists(name, processId);
      if (nameExists) {
        res.status(409).json({ error: 'Process with this name already exists' });
        return;
      }
    }

    const updates = {
      name,
      code,
      description,
      departmentId,
      processCategory,
      processType,
      parentProcessId,
      displayOrder,
      objective,
      scope,
      flowchartSvg,
    };

    await ProcessModel.update(processId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.PROCESS,
      entityType: 'Process',
      entityId: processId,
      entityIdentifier: `${process.code} - ${process.name}`,
      oldValues: process,
      newValues: updates,
    });

    res.json({ message: 'Process updated successfully' });
  } catch (error) {
    console.error('Update process error:', error);
    res.status(500).json({ error: 'Failed to update process' });
  }
};

/**
 * Delete/deactivate process (admin/superuser only)
 */
export const deleteProcess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const processId = parseInt(id, 10);

    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    await ProcessModel.delete(processId);

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.PROCESS,
      entityType: 'Process',
      entityId: processId,
      entityIdentifier: `${process.code} - ${process.name}`,
      oldValues: process,
    });

    res.json({ message: 'Process deleted successfully' });
  } catch (error) {
    console.error('Delete process error:', error);
    res.status(500).json({ error: 'Failed to delete process' });
  }
};

/**
 * Get all owners for a process
 */
export const getProcessOwners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const processId = parseInt(id, 10);

    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    const owners = await ProcessOwnerModel.findByProcessId(processId);
    res.json(owners);
  } catch (error) {
    console.error('Get process owners error:', error);
    res.status(500).json({ error: 'Failed to fetch process owners' });
  }
};

/**
 * Assign an owner to a process (admin/superuser only)
 */
export const assignProcessOwner = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const processId = parseInt(id, 10);
    const { ownerId, isPrimaryOwner, notes } = req.body;

    // Verify process exists
    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // Check if ownership already exists
    const ownershipExists = await ProcessOwnerModel.ownershipExists(processId, ownerId);
    if (ownershipExists) {
      res.status(409).json({ error: 'User is already assigned as an owner to this process' });
      return;
    }

    // Create ownership assignment
    const ownerData: CreateProcessOwnerData = {
      processId,
      ownerId,
      assignedBy: req.user.id,
      isPrimaryOwner,
      notes,
    };

    const ownershipId = await ProcessOwnerModel.create(ownerData);

    res.status(201).json({
      message: 'Process owner assigned successfully',
      ownershipId,
    });
  } catch (error) {
    console.error('Assign process owner error:', error);
    res.status(500).json({ error: 'Failed to assign process owner' });
  }
};

/**
 * Remove an owner from a process (admin/superuser only)
 */
export const removeProcessOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id, ownerId } = req.params;
    const processId = parseInt(id, 10);
    const ownerIdInt = parseInt(ownerId, 10);

    // Verify process exists
    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // Check if ownership exists
    const ownershipExists = await ProcessOwnerModel.ownershipExists(processId, ownerIdInt);
    if (!ownershipExists) {
      res.status(404).json({ error: 'Process owner assignment not found' });
      return;
    }

    await ProcessOwnerModel.delete(processId, ownerIdInt);

    res.json({ message: 'Process owner removed successfully' });
  } catch (error) {
    console.error('Remove process owner error:', error);
    res.status(500).json({ error: 'Failed to remove process owner' });
  }
};

/**
 * Get all documents linked to a process
 */
export const getProcessDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const processId = parseInt(id, 10);

    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    const documents = await ProcessModel.getLinkedDocuments(processId);
    res.json(documents);
  } catch (error) {
    console.error('Get process documents error:', error);
    res.status(500).json({ error: 'Failed to fetch process documents' });
  }
};

/**
 * Link a document to a process
 */
export const linkDocumentToProcess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const processId = parseInt(id, 10);
    const { documentId } = req.body;

    if (!documentId) {
      res.status(400).json({ error: 'documentId is required' });
      return;
    }

    // Verify process exists
    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // Check if link already exists
    const linkExists = await ProcessModel.documentLinkExists(processId, documentId);
    if (linkExists) {
      res.status(409).json({ error: 'Document is already linked to this process' });
      return;
    }

    await ProcessModel.linkDocument(processId, documentId, req.user.id);

    res.status(201).json({ message: 'Document linked to process successfully' });
  } catch (error) {
    console.error('Link document to process error:', error);
    res.status(500).json({ error: 'Failed to link document to process' });
  }
};

/**
 * Unlink a document from a process
 */
export const unlinkDocumentFromProcess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id, documentId } = req.params;
    const processId = parseInt(id, 10);
    const docId = parseInt(documentId, 10);

    // Verify process exists
    const process = await ProcessModel.findById(processId);
    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    // Check if link exists
    const linkExists = await ProcessModel.documentLinkExists(processId, docId);
    if (!linkExists) {
      res.status(404).json({ error: 'Document link not found' });
      return;
    }

    await ProcessModel.unlinkDocument(processId, docId);

    res.json({ message: 'Document unlinked from process successfully' });
  } catch (error) {
    console.error('Unlink document from process error:', error);
    res.status(500).json({ error: 'Failed to unlink document from process' });
  }
};
