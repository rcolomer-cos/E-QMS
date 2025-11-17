import { SupplierEvaluationModel, SupplierEvaluation } from '../../models/SupplierEvaluationModel';
import { getConnection } from '../../config/database';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('SupplierEvaluationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new supplier evaluation and return its ID', async () => {
      const evaluation: SupplierEvaluation = {
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-001',
        evaluationDate: new Date('2024-01-15'),
        evaluationType: 'Annual',
        qualityRating: 4,
        onTimeDeliveryRate: 92.5,
        complianceStatus: 'Compliant',
        evaluationStatus: 'draft',
        evaluatedBy: 5,
        createdBy: 5,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await SupplierEvaluationModel.create(evaluation);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('supplierId', expect.anything(), evaluation.supplierId);
      expect(mockPool.input).toHaveBeenCalledWith('evaluationNumber', expect.anything(), evaluation.evaluationNumber);
      expect(mockPool.input).toHaveBeenCalledWith('qualityRating', expect.anything(), evaluation.qualityRating);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO SupplierEvaluations'));
    });

    it('should calculate overall score correctly', async () => {
      const evaluation: SupplierEvaluation = {
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-002',
        evaluationDate: new Date('2024-01-15'),
        evaluationType: 'Quarterly',
        qualityRating: 5,
        onTimeDeliveryRate: 100,
        complianceStatus: 'Compliant',
        communicationScore: 95,
        technicalCapabilityScore: 90,
        priceCompetitivenessScore: 85,
        evaluationStatus: 'draft',
        evaluatedBy: 5,
        createdBy: 5,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 2 }] });

      const result = await SupplierEvaluationModel.create(evaluation);

      // Verify that the evaluation was created
      expect(result).toBe(2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO SupplierEvaluations'));
    });

    it('should set overall rating to Excellent for high scores', async () => {
      const evaluation: SupplierEvaluation = {
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-003',
        evaluationDate: new Date('2024-01-15'),
        evaluationType: 'Annual',
        qualityRating: 5,
        onTimeDeliveryRate: 98,
        complianceStatus: 'Compliant',
        evaluationStatus: 'draft',
        evaluatedBy: 5,
        createdBy: 5,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 3 }] });

      const result = await SupplierEvaluationModel.create(evaluation);

      // Verify that the evaluation was created
      expect(result).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO SupplierEvaluations'));
    });
  });

  describe('findById', () => {
    it('should return a supplier evaluation by ID', async () => {
      const mockEvaluation = {
        id: 1,
        supplierId: 1,
        evaluationNumber: 'EVAL-2024-001',
        evaluationDate: new Date('2024-01-15'),
        evaluationType: 'Annual',
        qualityRating: 4,
        onTimeDeliveryRate: 92.5,
        complianceStatus: 'Compliant',
        overallScore: 88.5,
        overallRating: 'Good',
        evaluationStatus: 'completed',
        evaluatedBy: 5,
        createdBy: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockEvaluation] });

      const result = await SupplierEvaluationModel.findById(1);

      expect(result).toEqual(mockEvaluation);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM SupplierEvaluations'));
    });

    it('should return null if evaluation not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await SupplierEvaluationModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findBySupplier', () => {
    it('should return all evaluations for a supplier', async () => {
      const mockEvaluations = [
        {
          id: 1,
          supplierId: 1,
          evaluationNumber: 'EVAL-2024-001',
          evaluationDate: new Date('2024-01-15'),
          qualityRating: 4,
          overallScore: 88.5,
          evaluationStatus: 'completed',
        },
        {
          id: 2,
          supplierId: 1,
          evaluationNumber: 'EVAL-2024-002',
          evaluationDate: new Date('2024-04-15'),
          qualityRating: 5,
          overallScore: 95.0,
          evaluationStatus: 'completed',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockEvaluations });

      const result = await SupplierEvaluationModel.findBySupplier(1);

      expect(result).toEqual(mockEvaluations);
      expect(mockPool.input).toHaveBeenCalledWith('supplierId', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY evaluationDate DESC'));
    });
  });

  describe('findAll', () => {
    it('should return paginated evaluations with filters', async () => {
      const mockEvaluations = [
        {
          id: 1,
          supplierId: 1,
          evaluationNumber: 'EVAL-2024-001',
          evaluationDate: new Date('2024-01-15'),
          qualityRating: 4,
          complianceStatus: 'Compliant',
          overallScore: 88.5,
          evaluationStatus: 'completed',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: [{ total: 1 }] });
      mockPool.query.mockResolvedValueOnce({ recordset: mockEvaluations });

      const result = await SupplierEvaluationModel.findAll(
        { complianceStatus: 'Compliant' },
        { sortBy: 'evaluationDate', sortOrder: 'DESC' },
        1,
        10
      );

      expect(result.data).toEqual(mockEvaluations);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPool.input).toHaveBeenCalledWith('complianceStatus', expect.anything(), 'Compliant');
    });
  });

  describe('updateStatus', () => {
    it('should update evaluation status', async () => {
      mockPool.query.mockResolvedValueOnce({});

      await SupplierEvaluationModel.updateStatus(1, 'approved', 5);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('evaluationStatus', expect.anything(), 'approved');
      expect(mockPool.input).toHaveBeenCalledWith('userId', expect.anything(), 5);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE SupplierEvaluations'));
    });
  });

  describe('getStatistics', () => {
    it('should return evaluation statistics', async () => {
      const mockStats = {
        totalEvaluations: 10,
        avgQualityRating: 4.2,
        avgOnTimeDeliveryRate: 92.5,
        avgOverallScore: 87.3,
        compliantCount: 8,
        nonCompliantCount: 2,
        excellentCount: 3,
        goodCount: 5,
        satisfactoryCount: 2,
        needsImprovementCount: 0,
        unacceptableCount: 0,
        approvedCount: 9,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockStats] });

      const result = await SupplierEvaluationModel.getStatistics(1);

      expect(result).toEqual(mockStats);
      expect(mockPool.input).toHaveBeenCalledWith('supplierId', expect.anything(), 1);
    });

    it('should return statistics for all suppliers when no supplierId provided', async () => {
      const mockStats = {
        totalEvaluations: 25,
        avgQualityRating: 4.0,
        avgOnTimeDeliveryRate: 90.0,
        avgOverallScore: 85.0,
        compliantCount: 20,
        nonCompliantCount: 5,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockStats] });

      const result = await SupplierEvaluationModel.getStatistics();

      expect(result).toEqual(mockStats);
      expect(mockPool.input).not.toHaveBeenCalledWith('supplierId', expect.anything(), expect.anything());
    });
  });
});
