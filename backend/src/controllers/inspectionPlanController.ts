import { Response } from 'express';
import { InspectionPlanModel, InspectionPlan, InspectionPlanFilters } from '../models/InspectionPlanModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createInspectionPlan = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const plan: InspectionPlan = {
      ...req.body,
      createdBy: req.user.id,
    };

    const planId = await InspectionPlanModel.create(plan);

    await logCreate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionPlan',
      entityId: planId,
      entityIdentifier: plan.planNumber,
      newValues: plan,
    });

    res.status(201).json({
      message: 'Inspection plan created successfully',
      id: planId,
    });
  } catch (error) {
    console.error('Create inspection plan error:', error);
    res.status(500).json({ error: 'Failed to create inspection plan' });
  }
};

export const getInspectionPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      equipmentId,
      inspectionType,
      status,
      priority,
      responsibleInspectorId,
      overdue,
      dueDateFrom,
      dueDateTo,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters' });
      return;
    }

    const filters: InspectionPlanFilters = {
      equipmentId: equipmentId ? parseInt(equipmentId as string, 10) : undefined,
      inspectionType: inspectionType as string | undefined,
      status: status as string | undefined,
      priority: priority as string | undefined,
      responsibleInspectorId: responsibleInspectorId ? parseInt(responsibleInspectorId as string, 10) : undefined,
      overdue: overdue === 'true',
      dueDateFrom: dueDateFrom as string | undefined,
      dueDateTo: dueDateTo as string | undefined,
    };

    const allPlans = await InspectionPlanModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPlans = allPlans.slice(startIndex, endIndex);

    res.json({
      data: paginatedPlans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allPlans.length,
        pages: Math.ceil(allPlans.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inspection plans error:', error);
    res.status(500).json({ error: 'Failed to get inspection plans' });
  }
};

export const getInspectionPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await InspectionPlanModel.findById(parseInt(id, 10));
    if (!plan) {
      res.status(404).json({ error: 'Inspection plan not found' });
      return;
    }

    res.json(plan);
  } catch (error) {
    console.error('Get inspection plan error:', error);
    res.status(500).json({ error: 'Failed to get inspection plan' });
  }
};

export const getInspectionPlanByPlanNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planNumber } = req.params;

    const plan = await InspectionPlanModel.findByPlanNumber(planNumber);
    if (!plan) {
      res.status(404).json({ error: 'Inspection plan not found' });
      return;
    }

    res.json(plan);
  } catch (error) {
    console.error('Get inspection plan by number error:', error);
    res.status(500).json({ error: 'Failed to get inspection plan' });
  }
};

export const updateInspectionPlan = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const planId = parseInt(id, 10);

    const existingPlan = await InspectionPlanModel.findById(planId);
    if (!existingPlan) {
      res.status(404).json({ error: 'Inspection plan not found' });
      return;
    }

    const updates: Partial<InspectionPlan> = {
      ...req.body,
      updatedBy: req.user.id,
    };

    await InspectionPlanModel.update(planId, updates);

    await logUpdate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionPlan',
      entityId: planId,
      entityIdentifier: existingPlan.planNumber,
      oldValues: existingPlan,
      newValues: updates,
    });

    res.json({ message: 'Inspection plan updated successfully' });
  } catch (error) {
    console.error('Update inspection plan error:', error);
    res.status(500).json({ error: 'Failed to update inspection plan' });
  }
};

export const deleteInspectionPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const planId = parseInt(id, 10);

    const existingPlan = await InspectionPlanModel.findById(planId);
    if (!existingPlan) {
      res.status(404).json({ error: 'Inspection plan not found' });
      return;
    }

    await InspectionPlanModel.delete(planId);

    await logDelete({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionPlan',
      entityId: planId,
      entityIdentifier: existingPlan.planNumber,
      oldValues: existingPlan,
    });

    res.json({ message: 'Inspection plan deleted successfully' });
  } catch (error) {
    console.error('Delete inspection plan error:', error);
    res.status(500).json({ error: 'Failed to delete inspection plan' });
  }
};

export const getUpcomingInspections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { daysAhead = '30' } = req.query;
    const days = parseInt(daysAhead as string, 10);

    const plans = await InspectionPlanModel.getUpcomingInspections(days);
    res.json(plans);
  } catch (error) {
    console.error('Get upcoming inspections error:', error);
    res.status(500).json({ error: 'Failed to get upcoming inspections' });
  }
};

export const getOverdueInspections = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plans = await InspectionPlanModel.getOverdueInspections();
    res.json(plans);
  } catch (error) {
    console.error('Get overdue inspections error:', error);
    res.status(500).json({ error: 'Failed to get overdue inspections' });
  }
};

export const getInspectionsByInspector = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectorId } = req.params;
    const id = parseInt(inspectorId, 10);

    const plans = await InspectionPlanModel.getInspectionsByInspector(id);
    res.json(plans);
  } catch (error) {
    console.error('Get inspections by inspector error:', error);
    res.status(500).json({ error: 'Failed to get inspections by inspector' });
  }
};

export const getInspectionTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const types = await InspectionPlanModel.getInspectionTypes();
    res.json(types);
  } catch (error) {
    console.error('Get inspection types error:', error);
    res.status(500).json({ error: 'Failed to get inspection types' });
  }
};
