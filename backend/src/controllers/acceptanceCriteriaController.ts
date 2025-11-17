import { Response } from 'express';
import {
  AcceptanceCriteriaModel,
  AcceptanceCriteria,
  CriteriaStatus,
  CriteriaSeverity,
  MeasurementType,
} from '../models/AcceptanceCriteriaModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createAcceptanceCriteria = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const criteria: AcceptanceCriteria = {
      ...req.body,
      createdBy: req.user.id,
    };

    const criteriaId = await AcceptanceCriteriaModel.create(criteria);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'AcceptanceCriteria',
      entityId: criteriaId,
      entityIdentifier: `${criteria.criteriaCode} - ${criteria.criteriaName}`,
      newValues: criteria,
    });

    res.status(201).json({
      message: 'Acceptance criteria created successfully',
      id: criteriaId,
    });
  } catch (error) {
    console.error('Create acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to create acceptance criteria' });
  }
};

export const getAcceptanceCriteria = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      inspectionType,
      equipmentCategory,
      status,
      severity,
      mandatory,
      safetyRelated,
      regulatoryRequirement,
      measurementType,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' });
      return;
    }

    const filters = {
      inspectionType: inspectionType as string | undefined,
      equipmentCategory: equipmentCategory as string | undefined,
      status: status as CriteriaStatus | undefined,
      severity: severity as CriteriaSeverity | undefined,
      mandatory: mandatory ? mandatory === 'true' : undefined,
      safetyRelated: safetyRelated ? safetyRelated === 'true' : undefined,
      regulatoryRequirement: regulatoryRequirement ? regulatoryRequirement === 'true' : undefined,
      measurementType: measurementType as MeasurementType | undefined,
    };

    const allCriteria = await AcceptanceCriteriaModel.findAll(filters);

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCriteria = allCriteria.slice(startIndex, endIndex);

    res.json({
      data: paginatedCriteria,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allCriteria.length,
        pages: Math.ceil(allCriteria.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to get acceptance criteria' });
  }
};

export const getAcceptanceCriteriaById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const criteria = await AcceptanceCriteriaModel.findById(parseInt(id, 10));
    if (!criteria) {
      res.status(404).json({ error: 'Acceptance criteria not found' });
      return;
    }

    res.json(criteria);
  } catch (error) {
    console.error('Get acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to get acceptance criteria' });
  }
};

export const getAcceptanceCriteriaByCriteriaCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { criteriaCode } = req.params;

    const criteria = await AcceptanceCriteriaModel.findByCriteriaCode(criteriaCode);
    if (!criteria) {
      res.status(404).json({ error: 'Acceptance criteria not found' });
      return;
    }

    res.json(criteria);
  } catch (error) {
    console.error('Get acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to get acceptance criteria' });
  }
};

export const getAcceptanceCriteriaByInspectionType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionType } = req.params;

    const criteria = await AcceptanceCriteriaModel.findByInspectionType(inspectionType);

    res.json(criteria);
  } catch (error) {
    console.error('Get acceptance criteria by inspection type error:', error);
    res.status(500).json({ error: 'Failed to get acceptance criteria' });
  }
};

export const getActiveAcceptanceCriteria = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const criteria = await AcceptanceCriteriaModel.findActive();

    res.json(criteria);
  } catch (error) {
    console.error('Get active acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to get active acceptance criteria' });
  }
};

export const getMandatoryCriteria = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const criteria = await AcceptanceCriteriaModel.findMandatory();

    res.json(criteria);
  } catch (error) {
    console.error('Get mandatory criteria error:', error);
    res.status(500).json({ error: 'Failed to get mandatory criteria' });
  }
};

export const getSafetyRelatedCriteria = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const criteria = await AcceptanceCriteriaModel.findSafetyRelated();

    res.json(criteria);
  } catch (error) {
    console.error('Get safety-related criteria error:', error);
    res.status(500).json({ error: 'Failed to get safety-related criteria' });
  }
};

export const updateAcceptanceCriteria = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedBy: req.user.id,
    };

    // Check if criteria exists
    const criteria = await AcceptanceCriteriaModel.findById(parseInt(id, 10));
    if (!criteria) {
      res.status(404).json({ error: 'Acceptance criteria not found' });
      return;
    }

    await AcceptanceCriteriaModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'AcceptanceCriteria',
      entityId: parseInt(id, 10),
      entityIdentifier: `${criteria.criteriaCode} - ${criteria.criteriaName}`,
      oldValues: criteria,
      newValues: updates,
    });

    res.json({ message: 'Acceptance criteria updated successfully' });
  } catch (error) {
    console.error('Update acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to update acceptance criteria' });
  }
};

export const deleteAcceptanceCriteria = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if criteria exists
    const criteria = await AcceptanceCriteriaModel.findById(parseInt(id, 10));
    if (!criteria) {
      res.status(404).json({ error: 'Acceptance criteria not found' });
      return;
    }

    await AcceptanceCriteriaModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'AcceptanceCriteria',
      entityId: parseInt(id, 10),
      entityIdentifier: `${criteria.criteriaCode} - ${criteria.criteriaName}`,
      oldValues: criteria,
    });

    res.json({ message: 'Acceptance criteria deleted successfully' });
  } catch (error) {
    console.error('Delete acceptance criteria error:', error);
    res.status(500).json({ error: 'Failed to delete acceptance criteria' });
  }
};

export const validateMeasurement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { measuredValue } = req.body;

    if (measuredValue === undefined || measuredValue === null) {
      res.status(400).json({ error: 'Measured value is required' });
      return;
    }

    const result = await AcceptanceCriteriaModel.validateMeasurement(parseInt(id, 10), measuredValue);

    res.json(result);
  } catch (error) {
    console.error('Validate measurement error:', error);
    res.status(500).json({ error: 'Failed to validate measurement' });
  }
};
