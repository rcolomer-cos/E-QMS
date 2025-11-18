import { AcceptanceCriteriaModel } from '../models/AcceptanceCriteriaModel';
import { InspectionItemModel, InspectionItem, InspectionItemStatus } from '../models/InspectionItemModel';
import { InspectionRecordModel, InspectionResult, InspectionSeverity } from '../models/InspectionRecordModel';

/**
 * Result of evaluating a single inspection item against acceptance criteria
 */
export interface ItemEvaluationResult {
  passed: boolean;
  validationMessage: string;
  severity?: string;
  mandatory?: boolean;
}

/**
 * Overall inspection status based on all items
 */
export interface InspectionStatusResult {
  overallResult: InspectionResult;
  passed: boolean;
  severity?: InspectionSeverity;
  summary: string;
  statistics: {
    totalItems: number;
    passedItems: number;
    failedItems: number;
    mandatoryFailedItems: number;
    criticalFailedItems: number;
  };
}

/**
 * Service for automatic scoring of inspection items and calculating overall inspection status
 */
export class InspectionScoringService {
  /**
   * Evaluate a single inspection item against its acceptance criteria
   * @param acceptanceCriteriaId ID of the acceptance criteria to evaluate against
   * @param measuredValue The measured/observed value
   * @returns Evaluation result with pass/fail and validation message
   */
  static async evaluateItem(
    acceptanceCriteriaId: number,
    measuredValue: string | number | boolean
  ): Promise<ItemEvaluationResult> {
    try {
      // Convert string values to appropriate types for numeric criteria
      let processedValue: string | number | boolean = measuredValue;
      if (typeof measuredValue === 'string') {
        const numValue = parseFloat(measuredValue);
        if (!isNaN(numValue)) {
          processedValue = numValue;
        }
      }

      // Use the validation method from AcceptanceCriteriaModel
      const validationResult = await AcceptanceCriteriaModel.validateMeasurement(
        acceptanceCriteriaId,
        processedValue
      );

      // Get criteria details for severity and mandatory flags
      const criteria = await AcceptanceCriteriaModel.findById(acceptanceCriteriaId);

      return {
        passed: validationResult.passed,
        validationMessage: validationResult.message,
        severity: criteria?.severity,
        mandatory: criteria?.mandatory,
      };
    } catch (error) {
      console.error('Error evaluating inspection item:', error);
      return {
        passed: false,
        validationMessage: 'Error evaluating item: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Score a single inspection item and save the result
   * @param inspectionItemId ID of the inspection item to score
   * @param measuredValue The measured/observed value
   * @param userId ID of the user performing the evaluation (for audit trail)
   * @returns Updated inspection item with scoring results
   */
  static async scoreItem(
    inspectionItemId: number,
    measuredValue: string | number | boolean,
    userId?: number
  ): Promise<InspectionItem | null> {
    try {
      const item = await InspectionItemModel.findById(inspectionItemId);
      if (!item) {
        throw new Error('Inspection item not found');
      }

      // Evaluate against acceptance criteria
      const evaluation = await this.evaluateItem(item.acceptanceCriteriaId, measuredValue);

      // Update the item with evaluation results
      await InspectionItemModel.update(inspectionItemId, {
        measuredValue: String(measuredValue),
        passed: evaluation.passed,
        autoScored: true,
        validationMessage: evaluation.validationMessage,
        status: InspectionItemStatus.COMPLETED,
        severity: evaluation.severity,
        mandatory: evaluation.mandatory,
        updatedBy: userId,
      });

      return await InspectionItemModel.findById(inspectionItemId);
    } catch (error) {
      console.error('Error scoring inspection item:', error);
      throw error;
    }
  }

  /**
   * Score multiple inspection items at once
   * @param items Array of items with measured values to score
   * @param userId ID of the user performing the evaluation
   * @returns Array of scored items
   */
  static async scoreMultipleItems(
    items: Array<{ inspectionItemId: number; measuredValue: string | number | boolean }>,
    userId?: number
  ): Promise<InspectionItem[]> {
    const results: InspectionItem[] = [];

    for (const item of items) {
      try {
        const scoredItem = await this.scoreItem(item.inspectionItemId, item.measuredValue, userId);
        if (scoredItem) {
          results.push(scoredItem);
        }
      } catch (error) {
        console.error(`Error scoring item ${item.inspectionItemId}:`, error);
        // Continue with other items even if one fails
      }
    }

    return results;
  }

  /**
   * Calculate the overall inspection status based on all items
   * @param inspectionRecordId ID of the inspection record
   * @returns Overall inspection status result
   */
  static async calculateOverallInspectionStatus(
    inspectionRecordId: number
  ): Promise<InspectionStatusResult> {
    try {
      // Get statistics for the inspection
      const stats = await InspectionItemModel.getInspectionStatistics(inspectionRecordId);

      // Determine overall result based on failures
      let overallResult: InspectionResult;
      let passed: boolean;
      let severity: InspectionSeverity | undefined;
      let summary: string;

      // Check if all items are completed
      if (stats.pendingItems > 0) {
        overallResult = InspectionResult.PENDING;
        passed = false;
        summary = `Inspection incomplete: ${stats.pendingItems} item(s) pending`;
      }
      // Check for mandatory failures - immediate fail
      else if (stats.mandatoryFailedItems > 0) {
        overallResult = InspectionResult.FAILED;
        passed = false;
        severity = InspectionSeverity.MAJOR;
        summary = `Inspection failed: ${stats.mandatoryFailedItems} mandatory item(s) failed`;
      }
      // Check for critical failures - fail the inspection
      else if (stats.criticalFailedItems > 0) {
        overallResult = InspectionResult.FAILED;
        passed = false;
        severity = InspectionSeverity.CRITICAL;
        summary = `Inspection failed: ${stats.criticalFailedItems} critical item(s) failed`;
      }
      // Check for major failures - fail the inspection
      else if (stats.majorFailedItems > 0) {
        overallResult = InspectionResult.FAILED;
        passed = false;
        severity = InspectionSeverity.MAJOR;
        summary = `Inspection failed: ${stats.majorFailedItems} major item(s) failed`;
      }
      // Minor failures - pass with observations
      else if (stats.minorFailedItems > 0) {
        overallResult = InspectionResult.PASSED_WITH_OBSERVATIONS;
        passed = true;
        severity = InspectionSeverity.MINOR;
        summary = `Inspection passed with observations: ${stats.minorFailedItems} minor item(s) failed`;
      }
      // Any other failures - pass with observations
      else if (stats.failedItems > 0) {
        overallResult = InspectionResult.PASSED_WITH_OBSERVATIONS;
        passed = true;
        severity = InspectionSeverity.MINOR;
        summary = `Inspection passed with observations: ${stats.failedItems} item(s) failed`;
      }
      // All passed
      else {
        overallResult = InspectionResult.PASSED;
        passed = true;
        severity = InspectionSeverity.NONE;
        summary = `Inspection passed: All ${stats.completedItems} item(s) passed`;
      }

      return {
        overallResult,
        passed,
        severity,
        summary,
        statistics: {
          totalItems: stats.totalItems,
          passedItems: stats.passedItems,
          failedItems: stats.failedItems,
          mandatoryFailedItems: stats.mandatoryFailedItems,
          criticalFailedItems: stats.criticalFailedItems,
        },
      };
    } catch (error) {
      console.error('Error calculating overall inspection status:', error);
      throw error;
    }
  }

  /**
   * Update the inspection record with the calculated overall status
   * @param inspectionRecordId ID of the inspection record to update
   * @returns Updated status result
   */
  static async updateInspectionRecordStatus(inspectionRecordId: number): Promise<InspectionStatusResult> {
    try {
      const statusResult = await this.calculateOverallInspectionStatus(inspectionRecordId);

      // Update the inspection record
      await InspectionRecordModel.update(inspectionRecordId, {
        result: statusResult.overallResult,
        passed: statusResult.passed,
        severity: statusResult.severity,
        findings: statusResult.summary,
      });

      return statusResult;
    } catch (error) {
      console.error('Error updating inspection record status:', error);
      throw error;
    }
  }

  /**
   * Create inspection items from acceptance criteria for a specific inspection type
   * @param inspectionRecordId ID of the inspection record
   * @param inspectionType Type of inspection to get criteria for
   * @param userId ID of the user creating the items
   * @returns Array of created inspection items
   */
  static async createItemsFromCriteria(
    inspectionRecordId: number,
    inspectionType: string,
    userId: number
  ): Promise<InspectionItem[]> {
    try {
      // Get all active acceptance criteria for this inspection type
      const criteriaList = await AcceptanceCriteriaModel.findByInspectionType(inspectionType);

      if (criteriaList.length === 0) {
        console.warn(`No acceptance criteria found for inspection type: ${inspectionType}`);
        return [];
      }

      // Create an inspection item for each criteria
      const items: InspectionItem[] = [];
      let order = 1;

      for (const criteria of criteriaList) {
        const itemId = await InspectionItemModel.create({
          inspectionRecordId,
          acceptanceCriteriaId: criteria.id!,
          passed: false,
          autoScored: false,
          status: InspectionItemStatus.PENDING,
          severity: criteria.severity,
          mandatory: criteria.mandatory,
          measurementUnit: criteria.unit,
          itemOrder: order++,
          createdBy: userId,
        });

        const item = await InspectionItemModel.findById(itemId);
        if (item) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      console.error('Error creating items from criteria:', error);
      throw error;
    }
  }

  /**
   * Override the auto-score result for an inspection item
   * @param inspectionItemId ID of the inspection item
   * @param newPassed New pass/fail value
   * @param overrideReason Reason for the override
   * @param userId ID of the user performing the override
   * @returns Updated inspection item
   */
  static async overrideItemScore(
    inspectionItemId: number,
    newPassed: boolean,
    overrideReason: string,
    userId: number
  ): Promise<InspectionItem | null> {
    try {
      const item = await InspectionItemModel.findById(inspectionItemId);
      if (!item) {
        throw new Error('Inspection item not found');
      }

      // Update the item with override information
      await InspectionItemModel.update(inspectionItemId, {
        passed: newPassed,
        overridden: true,
        overrideReason,
        overriddenBy: userId,
        overriddenAt: new Date(),
        updatedBy: userId,
      });

      return await InspectionItemModel.findById(inspectionItemId);
    } catch (error) {
      console.error('Error overriding item score:', error);
      throw error;
    }
  }
}
