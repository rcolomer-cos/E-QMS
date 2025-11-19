import { Response } from 'express';
import { DepartmentModel, CreateDepartmentData } from '../models/DepartmentModel';
import { ProcessModel } from '../models/ProcessModel';
import { ProcessOwnerModel } from '../models/ProcessOwnerModel';
import { SystemSettingsModel } from '../models/SystemSettingsModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

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

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.DEPARTMENT,
      entityType: 'Department',
      entityId: departmentId,
      entityIdentifier: code,
      newValues: departmentData,
    });

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

    const updates = {
      name,
      code,
      description,
      managerId,
    };
    await DepartmentModel.update(departmentId, updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.DEPARTMENT,
      entityType: 'Department',
      entityId: departmentId,
      entityIdentifier: department.code,
      oldValues: department,
      newValues: updates,
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

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.DEPARTMENT,
      entityType: 'Department',
      entityId: departmentId,
      entityIdentifier: department.code,
      oldValues: department,
    });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

/**
 * Get organizational hierarchy with departments, processes, and assignments
 */
export const getOrganizationalHierarchy = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all active departments with their managers
    const departments = await DepartmentModel.findAll();
    
    // Get all active processes with their department associations
    const processes = await ProcessModel.findAll();
    
    // Get all process ownership assignments
    const processOwnerships: any[] = [];
    for (const process of processes) {
      if (process.id) {
        const owners = await ProcessOwnerModel.findByProcessId(process.id);
        processOwnerships.push(...owners);
      }
    }
    
    // Build hierarchical structure
    const hierarchy = {
      departments: departments.map(dept => ({
        ...dept,
        processes: processes
          .filter(proc => proc.departmentId === dept.id)
          .map(proc => ({
            ...proc,
            owners: processOwnerships.filter(po => po.processId === proc.id),
          })),
      })),
      orphanProcesses: processes
        .filter(proc => !proc.departmentId)
        .map(proc => ({
          ...proc,
          owners: processOwnerships.filter(po => po.processId === proc.id),
        })),
    };
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Get organizational hierarchy error:', error);
    res.status(500).json({ error: 'Failed to fetch organizational hierarchy' });
  }
};

/**
 * Get organizational chart flow data (ReactFlow JSON) for all departments.
 * Returns a JSON structure { orgChartData: string | null }
 * All authenticated users can view.
 */
export const getOrgChartData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Store org chart data in system settings
    const setting = await SystemSettingsModel.findByKey('organizational_chart_data');
    const orgChartData = setting?.settingValue || null;
    res.json({ orgChartData });
  } catch (error) {
    console.error('Get org chart data error:', error);
    res.status(500).json({ error: 'Failed to fetch organizational chart data' });
  }
};

/**
 * Update organizational chart flow data.
 * Only superuser (100) and management (>=70) roles can edit.
 * Accepts body: { orgChartData: string }
 */
export const updateOrgChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Authorization: must have one of superuser, admin, manager roles
    const userRoles = (req.user.roles || []).map(r => r.toLowerCase());
    const allowed = ['superuser','admin','manager'];
    const hasAllowed = userRoles.some(r => allowed.includes(r));
    if (!hasAllowed) {
      res.status(403).json({ error: 'Insufficient permissions to update organizational chart' });
      return;
    }

    const { orgChartData } = req.body;
    if (typeof orgChartData !== 'string') {
      res.status(400).json({ error: 'orgChartData must be a string' });
      return;
    }

    // Store org chart data in system settings
    const existingSetting = await SystemSettingsModel.findByKey('organizational_chart_data');
    
    if (existingSetting) {
      await SystemSettingsModel.update('organizational_chart_data', orgChartData);
    } else {
      await SystemSettingsModel.create({
        settingKey: 'organizational_chart_data',
        settingValue: orgChartData,
        settingType: 'json',
        category: 'general',
        displayName: 'Organizational Chart Data',
        description: 'ReactFlow organizational chart structure',
        isEditable: true,
      });
    }

    // Audit log
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'SystemSetting',
      entityId: 0,
      entityIdentifier: 'organizational_chart_data',
      newValues: { orgChartData },
    });

    res.json({ message: 'Organizational chart updated successfully' });
  } catch (error) {
    console.error('Update org chart data error:', error);
    res.status(500).json({ error: 'Failed to update organizational chart data' });
  }
};
