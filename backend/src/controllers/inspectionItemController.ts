import { Response } from 'express';
import { InspectionItemModel, InspectionItem, InspectionItemStatus } from '../models/InspectionItemModel';
import { InspectionScoringService } from '../services/inspectionScoringService';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createInspectionItem = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const item: InspectionItem = {
      ...req.body,
      createdBy: req.user.id,
    };

    const itemId = await InspectionItemModel.create(item);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionItem',
      entityId: itemId,
      entityIdentifier: `Inspection Record ${item.inspectionRecordId} - Criteria ${item.acceptanceCriteriaId}`,
      newValues: item,
    });

    res.status(201).json({
      message: 'Inspection item created successfully',
      id: itemId,
    });
  } catch (error) {
    console.error('Create inspection item error:', error);
    res.status(500).json({ error: 'Failed to create inspection item' });
  }
};

export const getInspectionItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      inspectionRecordId,
      acceptanceCriteriaId,
      passed,
      status,
      severity,
      mandatory,
      autoScored,
      overridden,
    } = req.query;

    const filters = {
      inspectionRecordId: inspectionRecordId ? parseInt(inspectionRecordId as string, 10) : undefined,
      acceptanceCriteriaId: acceptanceCriteriaId ? parseInt(acceptanceCriteriaId as string, 10) : undefined,
      passed: passed !== undefined ? passed === 'true' : undefined,
      status: status as InspectionItemStatus | undefined,
      severity: severity as string | undefined,
      mandatory: mandatory !== undefined ? mandatory === 'true' : undefined,
      autoScored: autoScored !== undefined ? autoScored === 'true' : undefined,
      overridden: overridden !== undefined ? overridden === 'true' : undefined,
    };

    const items = await InspectionItemModel.findAll(filters);

    res.json({ data: items });
  } catch (error) {
    console.error('Get inspection items error:', error);
    res.status(500).json({ error: 'Failed to get inspection items' });
  }
};

export const getInspectionItemById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await InspectionItemModel.findById(parseInt(id, 10));
    if (!item) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Get inspection item error:', error);
    res.status(500).json({ error: 'Failed to get inspection item' });
  }
};

export const getInspectionItemsByRecordId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;
    const { includeCriteria } = req.query;

    let items;
    if (includeCriteria === 'true') {
      items = await InspectionItemModel.findByInspectionRecordIdWithCriteria(parseInt(inspectionRecordId, 10));
    } else {
      items = await InspectionItemModel.findByInspectionRecordId(parseInt(inspectionRecordId, 10));
    }

    res.json({ data: items });
  } catch (error) {
    console.error('Get inspection items by record error:', error);
    res.status(500).json({ error: 'Failed to get inspection items' });
  }
};

export const getFailedItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const items = await InspectionItemModel.findFailedItems(parseInt(inspectionRecordId, 10));

    res.json({ data: items });
  } catch (error) {
    console.error('Get failed items error:', error);
    res.status(500).json({ error: 'Failed to get failed items' });
  }
};

export const getMandatoryFailedItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const items = await InspectionItemModel.findMandatoryFailedItems(parseInt(inspectionRecordId, 10));

    res.json({ data: items });
  } catch (error) {
    console.error('Get mandatory failed items error:', error);
    res.status(500).json({ error: 'Failed to get mandatory failed items' });
  }
};

export const getInspectionStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const stats = await InspectionItemModel.getInspectionStatistics(parseInt(inspectionRecordId, 10));

    res.json(stats);
  } catch (error) {
    console.error('Get inspection statistics error:', error);
    res.status(500).json({ error: 'Failed to get inspection statistics' });
  }
};

export const updateInspectionItem = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if item exists
    const item = await InspectionItemModel.findById(parseInt(id, 10));
    if (!item) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    await InspectionItemModel.update(parseInt(id, 10), updates);

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionItem',
      entityId: parseInt(id, 10),
      entityIdentifier: `Inspection Record ${item.inspectionRecordId} - Criteria ${item.acceptanceCriteriaId}`,
      oldValues: item,
      newValues: updates,
    });

    res.json({ message: 'Inspection item updated successfully' });
  } catch (error) {
    console.error('Update inspection item error:', error);
    res.status(500).json({ error: 'Failed to update inspection item' });
  }
};

export const deleteInspectionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if item exists
    const item = await InspectionItemModel.findById(parseInt(id, 10));
    if (!item) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    await InspectionItemModel.delete(parseInt(id, 10));

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.INSPECTION,
      entityType: 'InspectionItem',
      entityId: parseInt(id, 10),
      entityIdentifier: `Inspection Record ${item.inspectionRecordId} - Criteria ${item.acceptanceCriteriaId}`,
      oldValues: item,
    });

    res.json({ message: 'Inspection item deleted successfully' });
  } catch (error) {
    console.error('Delete inspection item error:', error);
    res.status(500).json({ error: 'Failed to delete inspection item' });
  }
};

// Auto-scoring endpoints

export const scoreInspectionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { measuredValue } = req.body;

    if (measuredValue === undefined || measuredValue === null) {
      res.status(400).json({ error: 'Measured value is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const scoredItem = await InspectionScoringService.scoreItem(parseInt(id, 10), measuredValue, req.user.id);

    if (!scoredItem) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    res.json({
      message: 'Item scored successfully',
      item: scoredItem,
    });
  } catch (error) {
    console.error('Score inspection item error:', error);
    res.status(500).json({ error: 'Failed to score inspection item' });
  }
};

export const scoreMultipleItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const scoredItems = await InspectionScoringService.scoreMultipleItems(items, req.user.id);

    res.json({
      message: `${scoredItems.length} items scored successfully`,
      items: scoredItems,
    });
  } catch (error) {
    console.error('Score multiple items error:', error);
    res.status(500).json({ error: 'Failed to score items' });
  }
};

export const calculateInspectionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const statusResult = await InspectionScoringService.calculateOverallInspectionStatus(
      parseInt(inspectionRecordId, 10)
    );

    res.json(statusResult);
  } catch (error) {
    console.error('Calculate inspection status error:', error);
    res.status(500).json({ error: 'Failed to calculate inspection status' });
  }
};

export const updateInspectionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;

    const statusResult = await InspectionScoringService.updateInspectionRecordStatus(
      parseInt(inspectionRecordId, 10)
    );

    res.json({
      message: 'Inspection status updated successfully',
      status: statusResult,
    });
  } catch (error) {
    console.error('Update inspection status error:', error);
    res.status(500).json({ error: 'Failed to update inspection status' });
  }
};

export const createItemsFromCriteria = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inspectionRecordId } = req.params;
    const { inspectionType } = req.body;

    if (!inspectionType) {
      res.status(400).json({ error: 'Inspection type is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const items = await InspectionScoringService.createItemsFromCriteria(
      parseInt(inspectionRecordId, 10),
      inspectionType,
      req.user.id
    );

    res.status(201).json({
      message: `${items.length} inspection items created successfully`,
      items,
    });
  } catch (error) {
    console.error('Create items from criteria error:', error);
    res.status(500).json({ error: 'Failed to create inspection items' });
  }
};

export const overrideItemScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { passed, overrideReason } = req.body;

    if (passed === undefined || passed === null) {
      res.status(400).json({ error: 'Passed value is required' });
      return;
    }

    if (!overrideReason || overrideReason.trim() === '') {
      res.status(400).json({ error: 'Override reason is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const item = await InspectionScoringService.overrideItemScore(
      parseInt(id, 10),
      passed,
      overrideReason,
      req.user.id
    );

    if (!item) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    res.json({
      message: 'Item score overridden successfully',
      item,
    });
  } catch (error) {
    console.error('Override item score error:', error);
    res.status(500).json({ error: 'Failed to override item score' });
  }
};
