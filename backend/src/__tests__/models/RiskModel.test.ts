import { RiskModel, Risk } from '../../models/RiskModel';
import { getConnection } from '../../config/database';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('RiskModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new risk and return its ID', async () => {
      const risk: Risk = {
        riskNumber: 'RISK-2024-001',
        title: 'Supply chain disruption',
        description: 'Potential disruption in raw material supply',
        category: 'operational',
        source: 'process review',
        likelihood: 3,
        impact: 4,
        mitigationStrategy: 'Identify alternative suppliers',
        riskOwner: 5,
        department: 'Procurement',
        status: 'identified',
        identifiedDate: new Date('2024-01-15'),
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await RiskModel.create(risk);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('riskNumber', expect.anything(), risk.riskNumber);
      expect(mockPool.input).toHaveBeenCalledWith('likelihood', expect.anything(), risk.likelihood);
      expect(mockPool.input).toHaveBeenCalledWith('impact', expect.anything(), risk.impact);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Risks'));
    });

    it('should calculate risk level correctly', async () => {
      const risk: Risk = {
        riskNumber: 'RISK-2024-002',
        title: 'Test Risk',
        description: 'Test description',
        category: 'operational',
        likelihood: 5,
        impact: 5,
        riskOwner: 1,
        status: 'identified',
        identifiedDate: new Date(),
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 2 }] });

      await RiskModel.create(risk);

      // Verify that riskLevel is calculated (5 * 5 = 25, which is 'critical')
      expect(mockPool.input).toHaveBeenCalledWith('riskLevel', expect.anything(), 'critical');
    });
  });

  describe('findById', () => {
    it('should return a risk by ID', async () => {
      const mockRisk = {
        id: 1,
        riskNumber: 'RISK-2024-001',
        title: 'Supply chain disruption',
        description: 'Potential disruption in raw material supply',
        category: 'operational',
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'high',
        status: 'identified',
        identifiedDate: new Date('2024-01-15'),
        riskOwner: 5,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockRisk] });

      const result = await RiskModel.findById(1);

      expect(result).toEqual(mockRisk);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Risks'));
    });

    it('should return null if risk not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await RiskModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a risk and recalculate risk level', async () => {
      const mockCurrentRisk = {
        id: 1,
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'high',
      };

      mockPool.query
        .mockResolvedValueOnce({ recordset: [mockCurrentRisk] }) // findById call
        .mockResolvedValueOnce({ rowsAffected: [1] }); // update call

      const updates = {
        likelihood: 2,
        impact: 2,
      };

      await RiskModel.update(1, updates);

      // Verify that riskLevel is recalculated (2 * 2 = 4, which is 'low')
      // The implementation uses request.input(key, value) without SQL type for updates
      expect(mockPool.input).toHaveBeenCalledWith('riskLevel', 'low');
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE Risks'));
    });
  });

  describe('findAll', () => {
    it('should return all risks with filters', async () => {
      const mockRisks = [
        {
          id: 1,
          riskNumber: 'RISK-2024-001',
          title: 'Risk 1',
          riskLevel: 'high',
          status: 'monitoring',
        },
        {
          id: 2,
          riskNumber: 'RISK-2024-002',
          title: 'Risk 2',
          riskLevel: 'medium',
          status: 'identified',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockRisks });

      const result = await RiskModel.findAll(
        { status: 'monitoring', riskLevel: 'high' },
        { sortBy: 'riskScore', sortOrder: 'DESC' }
      );

      expect(result).toEqual(mockRisks);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM Risks'));
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY'));
    });
  });

  describe('getStatistics', () => {
    it('should return risk statistics', async () => {
      mockPool.query
        .mockResolvedValueOnce({ recordset: [{ count: 25 }] }) // total
        .mockResolvedValueOnce({ recordset: [{ status: 'identified', count: 5 }] }) // by status
        .mockResolvedValueOnce({ recordset: [{ riskLevel: 'low', count: 5 }] }) // by level
        .mockResolvedValueOnce({ recordset: [{ category: 'operational', count: 15 }] }); // by category

      const result = await RiskModel.getStatistics();

      expect(result.totalRisks).toBe(25);
      expect(result.byStatus).toBeDefined();
      expect(result.byLevel).toBeDefined();
      expect(result.byCategory).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a risk by ID', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await RiskModel.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Risks'));
    });
  });

  describe('risk level calculation', () => {
    it.each([
      [1, 1, 'low'],
      [2, 2, 'low'],
      [1, 5, 'low'],
      [2, 3, 'medium'],
      [3, 3, 'medium'],
      [3, 4, 'high'],
      [4, 4, 'high'],
      [4, 5, 'critical'],
      [5, 5, 'critical'],
    ])(
      'should calculate risk level correctly for likelihood=%i and impact=%i',
      async (likelihood, impact, expectedLevel) => {
        const risk: Risk = {
          riskNumber: `RISK-TEST-${likelihood}-${impact}`,
          title: 'Test Risk',
          description: 'Test',
          category: 'test',
          likelihood,
          impact,
          riskOwner: 1,
          status: 'identified',
          identifiedDate: new Date(),
          createdBy: 1,
        };

        mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

        await RiskModel.create(risk);

        expect(mockPool.input).toHaveBeenCalledWith('riskLevel', expect.anything(), expectedLevel);
      }
    );
  });
});
