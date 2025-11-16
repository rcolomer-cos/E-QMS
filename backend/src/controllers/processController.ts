import { Response } from 'express';
import { ProcessModel, CreateProcessData } from '../models/ProcessModel';
import { ProcessOwnerModel, CreateProcessOwnerData } from '../models/ProcessOwnerModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

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

    const { name, code, description, departmentId, processCategory, objective, scope } = req.body;

    // Check if process code already exists
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
      objective,
      scope,
      createdBy: req.user.id,
    };

    const processId = await ProcessModel.create(processData);

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
    const { name, code, description, departmentId, processCategory, objective, scope } = req.body;

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

    await ProcessModel.update(processId, {
      name,
      code,
      description,
      departmentId,
      processCategory,
      objective,
      scope,
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
