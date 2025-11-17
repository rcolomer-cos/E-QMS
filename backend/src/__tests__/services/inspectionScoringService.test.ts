import { InspectionScoringService } from '../../services/inspectionScoringService';
import { AcceptanceCriteriaModel, RuleType, MeasurementType, CriteriaSeverity, FailureAction, CriteriaStatus } from '../../models/AcceptanceCriteriaModel';
import { InspectionItemModel, InspectionItemStatus } from '../../models/InspectionItemModel';
import { InspectionRecordModel, InspectionResult, InspectionSeverity } from '../../models/InspectionRecordModel';

// Mock the models
jest.mock('../../models/AcceptanceCriteriaModel');
jest.mock('../../models/InspectionItemModel');
jest.mock('../../models/InspectionRecordModel');

describe('InspectionScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateItem', () => {
    it('should evaluate a quantitative range criteria and pass', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'TEST-001',
        criteriaName: 'Temperature Range',
        inspectionType: 'routine',
        parameterName: 'Temperature',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 20,
        maxValue: 25,
        severity: CriteriaSeverity.CRITICAL,
        mandatory: true,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
        failureAction: FailureAction.FAIL_INSPECTION,
      };

      (AcceptanceCriteriaModel.validateMeasurement as jest.Mock).mockResolvedValue({
        passed: true,
        message: 'Value 22 is within range [20, 25]',
      });

      (AcceptanceCriteriaModel.findById as jest.Mock).mockResolvedValue(mockCriteria);

      const result = await InspectionScoringService.evaluateItem(1, 22);

      expect(result.passed).toBe(true);
      expect(result.validationMessage).toContain('within range');
      expect(result.severity).toBe(CriteriaSeverity.CRITICAL);
      expect(result.mandatory).toBe(true);
    });

    it('should evaluate a quantitative range criteria and fail', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'TEST-001',
        criteriaName: 'Temperature Range',
        inspectionType: 'routine',
        parameterName: 'Temperature',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 20,
        maxValue: 25,
        severity: CriteriaSeverity.CRITICAL,
        mandatory: true,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
        failureAction: FailureAction.FAIL_INSPECTION,
      };

      (AcceptanceCriteriaModel.validateMeasurement as jest.Mock).mockResolvedValue({
        passed: false,
        message: 'Value 30 is outside range [20, 25]',
      });

      (AcceptanceCriteriaModel.findById as jest.Mock).mockResolvedValue(mockCriteria);

      const result = await InspectionScoringService.evaluateItem(1, 30);

      expect(result.passed).toBe(false);
      expect(result.validationMessage).toContain('outside range');
    });

    it('should handle string numeric values', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'TEST-001',
        criteriaName: 'Temperature Range',
        inspectionType: 'routine',
        parameterName: 'Temperature',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 20,
        maxValue: 25,
        severity: CriteriaSeverity.CRITICAL,
        mandatory: true,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
        failureAction: FailureAction.FAIL_INSPECTION,
      };

      (AcceptanceCriteriaModel.validateMeasurement as jest.Mock).mockResolvedValue({
        passed: true,
        message: 'Value 23 is within range [20, 25]',
      });

      (AcceptanceCriteriaModel.findById as jest.Mock).mockResolvedValue(mockCriteria);

      const result = await InspectionScoringService.evaluateItem(1, '23');

      expect(result.passed).toBe(true);
      expect(AcceptanceCriteriaModel.validateMeasurement).toHaveBeenCalledWith(1, 23);
    });
  });

  describe('calculateOverallInspectionStatus', () => {
    it('should return PASSED when all items pass', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 5,
        failedItems: 0,
        mandatoryFailedItems: 0,
        criticalFailedItems: 0,
        majorFailedItems: 0,
        minorFailedItems: 0,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.PASSED);
      expect(result.passed).toBe(true);
      expect(result.severity).toBe(InspectionSeverity.NONE);
      expect(result.summary).toContain('All 5 item(s) passed');
    });

    it('should return FAILED when mandatory items fail', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 4,
        failedItems: 1,
        mandatoryFailedItems: 1,
        criticalFailedItems: 0,
        majorFailedItems: 0,
        minorFailedItems: 0,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.FAILED);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(InspectionSeverity.MAJOR);
      expect(result.summary).toContain('1 mandatory item(s) failed');
    });

    it('should return FAILED when critical items fail', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 4,
        failedItems: 1,
        mandatoryFailedItems: 0,
        criticalFailedItems: 1,
        majorFailedItems: 0,
        minorFailedItems: 0,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.FAILED);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(InspectionSeverity.CRITICAL);
      expect(result.summary).toContain('1 critical item(s) failed');
    });

    it('should return FAILED when major items fail', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 4,
        failedItems: 1,
        mandatoryFailedItems: 0,
        criticalFailedItems: 0,
        majorFailedItems: 1,
        minorFailedItems: 0,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.FAILED);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(InspectionSeverity.MAJOR);
      expect(result.summary).toContain('1 major item(s) failed');
    });

    it('should return PASSED_WITH_OBSERVATIONS when minor items fail', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 4,
        failedItems: 1,
        mandatoryFailedItems: 0,
        criticalFailedItems: 0,
        majorFailedItems: 0,
        minorFailedItems: 1,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.PASSED_WITH_OBSERVATIONS);
      expect(result.passed).toBe(true);
      expect(result.severity).toBe(InspectionSeverity.MINOR);
      expect(result.summary).toContain('passed with observations');
    });

    it('should return PENDING when items are not completed', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 3,
        passedItems: 3,
        failedItems: 0,
        mandatoryFailedItems: 0,
        criticalFailedItems: 0,
        majorFailedItems: 0,
        minorFailedItems: 0,
        pendingItems: 2,
        autoScoredItems: 3,
        overriddenItems: 0,
      });

      const result = await InspectionScoringService.calculateOverallInspectionStatus(1);

      expect(result.overallResult).toBe(InspectionResult.PENDING);
      expect(result.passed).toBe(false);
      expect(result.summary).toContain('2 item(s) pending');
    });
  });

  describe('scoreItem', () => {
    it('should score an item and update it with results', async () => {
      const mockItem = {
        id: 1,
        inspectionRecordId: 1,
        acceptanceCriteriaId: 1,
        passed: false,
        autoScored: false,
        status: InspectionItemStatus.PENDING,
      };

      const mockCriteria = {
        id: 1,
        criteriaCode: 'TEST-001',
        criteriaName: 'Temperature Range',
        inspectionType: 'routine',
        parameterName: 'Temperature',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 20,
        maxValue: 25,
        severity: CriteriaSeverity.CRITICAL,
        mandatory: true,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
        failureAction: FailureAction.FAIL_INSPECTION,
      };

      (InspectionItemModel.findById as jest.Mock).mockResolvedValue(mockItem);
      (AcceptanceCriteriaModel.validateMeasurement as jest.Mock).mockResolvedValue({
        passed: true,
        message: 'Value 22 is within range [20, 25]',
      });
      (AcceptanceCriteriaModel.findById as jest.Mock).mockResolvedValue(mockCriteria);
      (InspectionItemModel.update as jest.Mock).mockResolvedValue(undefined);

      const updatedItem = {
        ...mockItem,
        measuredValue: '22',
        passed: true,
        autoScored: true,
        validationMessage: 'Value 22 is within range [20, 25]',
        status: InspectionItemStatus.COMPLETED,
      };
      (InspectionItemModel.findById as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(updatedItem);

      const result = await InspectionScoringService.scoreItem(1, 22, 1);

      expect(InspectionItemModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          measuredValue: '22',
          passed: true,
          autoScored: true,
          status: InspectionItemStatus.COMPLETED,
          updatedBy: 1,
        })
      );
      expect(result?.passed).toBe(true);
    });
  });

  describe('updateInspectionRecordStatus', () => {
    it('should calculate and update inspection record status', async () => {
      (InspectionItemModel.getInspectionStatistics as jest.Mock).mockResolvedValue({
        totalItems: 5,
        completedItems: 5,
        passedItems: 5,
        failedItems: 0,
        mandatoryFailedItems: 0,
        criticalFailedItems: 0,
        majorFailedItems: 0,
        minorFailedItems: 0,
        pendingItems: 0,
        autoScoredItems: 5,
        overriddenItems: 0,
      });

      (InspectionRecordModel.update as jest.Mock).mockResolvedValue(undefined);

      const result = await InspectionScoringService.updateInspectionRecordStatus(1);

      expect(InspectionRecordModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          result: InspectionResult.PASSED,
          passed: true,
          severity: InspectionSeverity.NONE,
        })
      );
      expect(result.overallResult).toBe(InspectionResult.PASSED);
    });
  });

  describe('createItemsFromCriteria', () => {
    it('should create inspection items from acceptance criteria', async () => {
      const mockCriteria = [
        {
          id: 1,
          criteriaCode: 'TEST-001',
          criteriaName: 'Temperature Range',
          inspectionType: 'routine',
          parameterName: 'Temperature',
          unit: '°C',
          measurementType: MeasurementType.QUANTITATIVE,
          ruleType: RuleType.RANGE,
          minValue: 20,
          maxValue: 25,
          severity: CriteriaSeverity.CRITICAL,
          mandatory: true,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          version: '1.0',
          createdBy: 1,
          failureAction: FailureAction.FAIL_INSPECTION,
        },
        {
          id: 2,
          criteriaCode: 'TEST-002',
          criteriaName: 'Pressure Check',
          inspectionType: 'routine',
          parameterName: 'Pressure',
          unit: 'psi',
          measurementType: MeasurementType.QUANTITATIVE,
          ruleType: RuleType.MIN,
          minValue: 50,
          severity: CriteriaSeverity.MAJOR,
          mandatory: true,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          version: '1.0',
          createdBy: 1,
          failureAction: FailureAction.FAIL_INSPECTION,
        },
      ];

      (AcceptanceCriteriaModel.findByInspectionType as jest.Mock).mockResolvedValue(mockCriteria);
      (InspectionItemModel.create as jest.Mock).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
      (InspectionItemModel.findById as jest.Mock)
        .mockResolvedValueOnce({ id: 1, acceptanceCriteriaId: 1 })
        .mockResolvedValueOnce({ id: 2, acceptanceCriteriaId: 2 });

      const items = await InspectionScoringService.createItemsFromCriteria(1, 'routine', 1);

      expect(items).toHaveLength(2);
      expect(InspectionItemModel.create).toHaveBeenCalledTimes(2);
      expect(InspectionItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inspectionRecordId: 1,
          acceptanceCriteriaId: 1,
          status: InspectionItemStatus.PENDING,
          itemOrder: 1,
        })
      );
    });
  });

  describe('overrideItemScore', () => {
    it('should override an item score with reason', async () => {
      const mockItem = {
        id: 1,
        inspectionRecordId: 1,
        acceptanceCriteriaId: 1,
        passed: false,
        autoScored: true,
        status: InspectionItemStatus.COMPLETED,
      };

      (InspectionItemModel.findById as jest.Mock).mockResolvedValue(mockItem);
      (InspectionItemModel.update as jest.Mock).mockResolvedValue(undefined);

      const overriddenItem = {
        ...mockItem,
        passed: true,
        overridden: true,
        overrideReason: 'Approved by supervisor',
      };
      (InspectionItemModel.findById as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(overriddenItem);

      const result = await InspectionScoringService.overrideItemScore(1, true, 'Approved by supervisor', 1);

      expect(InspectionItemModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          passed: true,
          overridden: true,
          overrideReason: 'Approved by supervisor',
          overriddenBy: 1,
          updatedBy: 1,
        })
      );
      expect(result?.overridden).toBe(true);
    });
  });
});
