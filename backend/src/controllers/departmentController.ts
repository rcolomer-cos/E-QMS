import { Response } from 'express';
import { DepartmentModel, CreateDepartmentData } from '../models/DepartmentModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

/**
 * Get all departments
 */
export const getAllDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await DepartmentModel.findAll();
    res.json(departments);
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await DepartmentModel.findById(parseInt(id, 10));

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json(department);
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

/**
 * Get department by code
 */
export const getDepartmentByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const department = await DepartmentModel.findByCode(code);

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json(department);
  } catch (error) {
    console.error('Get department by code error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

/**
 * Create a new department (admin/superuser only)
 */
export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { name, code, description, managerId } = req.body;

    // Check if department code already exists
    const codeExists = await DepartmentModel.codeExists(code);
    if (codeExists) {
      res.status(409).json({ error: 'Department with this code already exists' });
      return;
    }

    // Check if department name already exists
    const nameExists = await DepartmentModel.nameExists(name);
    if (nameExists) {
      res.status(409).json({ error: 'Department with this name already exists' });
      return;
    }

    // Create department
    const departmentData: CreateDepartmentData = {
      name,
      code,
      description,
      managerId,
      createdBy: req.user.id,
    };

    const departmentId = await DepartmentModel.create(departmentData);

    res.status(201).json({
      message: 'Department created successfully',
      departmentId,
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

/**
 * Update department information (admin/superuser only)
 */
export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const departmentId = parseInt(id, 10);
    const { name, code, description, managerId } = req.body;

    const department = await DepartmentModel.findById(departmentId);
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    // Check if new code conflicts with existing department
    if (code && code !== department.code) {
      const codeExists = await DepartmentModel.codeExists(code, departmentId);
      if (codeExists) {
        res.status(409).json({ error: 'Department with this code already exists' });
        return;
      }
    }

    // Check if new name conflicts with existing department
    if (name && name !== department.name) {
      const nameExists = await DepartmentModel.nameExists(name, departmentId);
      if (nameExists) {
        res.status(409).json({ error: 'Department with this name already exists' });
        return;
      }
    }

    await DepartmentModel.update(departmentId, {
      name,
      code,
      description,
      managerId,
    });

    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

/**
 * Delete/deactivate department (admin/superuser only)
 */
export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const departmentId = parseInt(id, 10);

    const department = await DepartmentModel.findById(departmentId);
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    await DepartmentModel.delete(departmentId);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
