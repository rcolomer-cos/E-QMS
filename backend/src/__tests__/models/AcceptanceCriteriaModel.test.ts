import {
  AcceptanceCriteriaModel,
  AcceptanceCriteria,
  MeasurementType,
  RuleType,
  CriteriaSeverity,
  CriteriaStatus,
  FailureAction,
} from '../../models/AcceptanceCriteriaModel';
import { getConnection } from '../../config/database';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('AcceptanceCriteriaModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new acceptance criteria and return its ID', async () => {
      const criteria: AcceptanceCriteria = {
        criteriaCode: 'AC-001',
        criteriaName: 'Temperature Range Check',
        description: 'Check operating temperature within acceptable range',
        inspectionType: 'routine',
        equipmentCategory: 'HVAC',
        parameterName: 'Operating Temperature',
        unit: '°C',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 18,
        maxValue: 24,
        severity: CriteriaSeverity.NORMAL,
        mandatory: true,
        safetyRelated: false,
        regulatoryRequirement: false,
        failureAction: FailureAction.FAIL_INSPECTION,
        allowOverride: false,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await AcceptanceCriteriaModel.create(criteria);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('criteriaCode', expect.anything(), criteria.criteriaCode);
      expect(mockPool.input).toHaveBeenCalledWith('criteriaName', expect.anything(), criteria.criteriaName);
      expect(mockPool.input).toHaveBeenCalledWith('measurementType', expect.anything(), criteria.measurementType);
      expect(mockPool.input).toHaveBeenCalledWith('ruleType', expect.anything(), criteria.ruleType);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO AcceptanceCriteria'));
    });
  });

  describe('findById', () => {
    it('should return acceptance criteria by ID', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'AC-001',
        criteriaName: 'Temperature Range Check',
        inspectionType: 'routine',
        parameterName: 'Operating Temperature',
        measurementType: MeasurementType.QUANTITATIVE,
        ruleType: RuleType.RANGE,
        minValue: 18,
        maxValue: 24,
        severity: CriteriaSeverity.NORMAL,
        mandatory: true,
        failureAction: FailureAction.FAIL_INSPECTION,
        status: CriteriaStatus.ACTIVE,
        effectiveDate: new Date('2024-01-01'),
        version: '1.0',
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

      const result = await AcceptanceCriteriaModel.findById(1);

      expect(result).toEqual(mockCriteria);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM AcceptanceCriteria WHERE id = @id');
    });

    it('should return null if criteria not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await AcceptanceCriteriaModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByCriteriaCode', () => {
    it('should return acceptance criteria by criteria code', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'AC-001',
        criteriaName: 'Temperature Range Check',
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

      const result = await AcceptanceCriteriaModel.findByCriteriaCode('AC-001');

      expect(result).toEqual(mockCriteria);
      expect(mockPool.input).toHaveBeenCalledWith('criteriaCode', expect.anything(), 'AC-001');
    });
  });

  describe('findByInspectionType', () => {
    it('should return active criteria for inspection type', async () => {
      const mockCriteria = [
        {
          id: 1,
          criteriaCode: 'AC-001',
          inspectionType: 'routine',
          mandatory: true,
          severity: CriteriaSeverity.CRITICAL,
          status: CriteriaStatus.ACTIVE,
        },
        {
          id: 2,
          criteriaCode: 'AC-002',
          inspectionType: 'routine',
          mandatory: false,
          severity: CriteriaSeverity.NORMAL,
          status: CriteriaStatus.ACTIVE,
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockCriteria });

      const result = await AcceptanceCriteriaModel.findByInspectionType('routine');

      expect(result).toEqual(mockCriteria);
      expect(mockPool.input).toHaveBeenCalledWith('inspectionType', expect.anything(), 'routine');
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("status = 'active'"));
    });
  });

  describe('findAll', () => {
    it('should return all criteria without filters', async () => {
      const mockCriteria = [
        { id: 1, criteriaCode: 'AC-001' },
        { id: 2, criteriaCode: 'AC-002' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockCriteria });

      const result = await AcceptanceCriteriaModel.findAll();

      expect(result).toEqual(mockCriteria);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM AcceptanceCriteria'));
    });

    it('should apply filters correctly', async () => {
      const filters = {
        inspectionType: 'routine',
        status: CriteriaStatus.ACTIVE,
        severity: CriteriaSeverity.CRITICAL,
        mandatory: true,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await AcceptanceCriteriaModel.findAll(filters);

      expect(mockPool.input).toHaveBeenCalledWith('inspectionType', expect.anything(), 'routine');
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), CriteriaStatus.ACTIVE);
      expect(mockPool.input).toHaveBeenCalledWith('severity', expect.anything(), CriteriaSeverity.CRITICAL);
      expect(mockPool.input).toHaveBeenCalledWith('mandatory', expect.anything(), true);
    });
  });

  describe('validateMeasurement', () => {
    describe('range validation', () => {
      it('should pass when value is within range', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-001',
          criteriaName: 'Temperature Check',
          ruleType: RuleType.RANGE,
          minValue: 18,
          maxValue: 24,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, 20);

        expect(result.passed).toBe(true);
        expect(result.message).toContain('within range');
      });

      it('should fail when value is outside range', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-001',
          criteriaName: 'Temperature Check',
          ruleType: RuleType.RANGE,
          minValue: 18,
          maxValue: 24,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, 30);

        expect(result.passed).toBe(false);
        expect(result.message).toContain('outside range');
      });
    });

    describe('tolerance validation', () => {
      it('should pass when value is within tolerance', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-002',
          criteriaName: 'Pressure Check',
          ruleType: RuleType.TOLERANCE,
          targetValue: 100,
          tolerancePlus: 5,
          toleranceMinus: 5,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, 103);

        expect(result.passed).toBe(true);
        expect(result.message).toContain('within tolerance');
      });

      it('should fail when value exceeds tolerance', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-002',
          criteriaName: 'Pressure Check',
          ruleType: RuleType.TOLERANCE,
          targetValue: 100,
          tolerancePlus: 5,
          toleranceMinus: 5,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, 110);

        expect(result.passed).toBe(false);
        expect(result.message).toContain('outside tolerance');
      });
    });

    describe('pass/fail validation', () => {
      it('should pass with boolean true', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-003',
          criteriaName: 'Visual Check',
          ruleType: RuleType.PASS_FAIL,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, true);

        expect(result.passed).toBe(true);
        expect(result.message).toContain('passed');
      });

      it('should pass with string "pass"', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-003',
          criteriaName: 'Visual Check',
          ruleType: RuleType.PASS_FAIL,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, 'pass');

        expect(result.passed).toBe(true);
        expect(result.message).toContain('passed');
      });

      it('should fail with boolean false', async () => {
        const mockCriteria = {
          id: 1,
          criteriaCode: 'AC-003',
          criteriaName: 'Visual Check',
          ruleType: RuleType.PASS_FAIL,
          status: CriteriaStatus.ACTIVE,
          effectiveDate: new Date('2024-01-01'),
          expiryDate: null,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

        const result = await AcceptanceCriteriaModel.validateMeasurement(1, false);

        expect(result.passed).toBe(false);
        expect(result.message).toContain('failed');
      });
    });

    it('should fail if criteria is not active', async () => {
      const mockCriteria = {
        id: 1,
        criteriaCode: 'AC-001',
        criteriaName: 'Temperature Check',
        ruleType: RuleType.RANGE,
        minValue: 18,
        maxValue: 24,
        status: CriteriaStatus.INACTIVE,
        effectiveDate: new Date('2024-01-01'),
        expiryDate: null,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockCriteria] });

      const result = await AcceptanceCriteriaModel.validateMeasurement(1, 20);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('not active');
    });
  });

  describe('update', () => {
    it('should update acceptance criteria', async () => {
      const updates = {
        status: CriteriaStatus.INACTIVE,
        notes: 'Updated notes',
        updatedBy: 2,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await AcceptanceCriteriaModel.update(1, updates);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), CriteriaStatus.INACTIVE);
      expect(mockPool.input).toHaveBeenCalledWith('notes', expect.anything(), 'Updated notes');
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE AcceptanceCriteria'));
    });
  });

  describe('delete', () => {
    it('should delete acceptance criteria', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await AcceptanceCriteriaModel.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM AcceptanceCriteria WHERE id = @id');
    });
  });
});
