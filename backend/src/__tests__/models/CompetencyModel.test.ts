import { CompetencyModel, Competency, UserCompetency } from '../../models/CompetencyModel';
import { getConnection } from '../../config/database';
import { CompetencyStatus } from '../../types';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('CompetencyModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new competency and return its ID', async () => {
      const competency: Competency = {
        competencyCode: 'COMP-001',
        name: 'ISO 9001 Lead Auditor',
        description: 'Competency for conducting ISO 9001 audits',
        category: 'Quality',
        status: CompetencyStatus.ACTIVE,
        isRegulatory: true,
        isMandatory: false,
        hasExpiry: true,
        defaultValidityMonths: 36,
        renewalRequired: true,
        requiresAssessment: true,
        minimumScore: 80,
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await CompetencyModel.create(competency);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('competencyCode', expect.anything(), competency.competencyCode);
      expect(mockPool.input).toHaveBeenCalledWith('name', expect.anything(), competency.name);
      expect(mockPool.input).toHaveBeenCalledWith('isRegulatory', expect.anything(), competency.isRegulatory);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Competencies'));
    });
  });

  describe('findById', () => {
    it('should return a competency by ID', async () => {
      const mockCompetency = {
        id: 1,
        competencyCode: 'COMP-001',
        name: 'ISO 9001 Lead Auditor',
        category: 'Quality',
        status: CompetencyStatus.ACTIVE,
        isRegulatory: true,
        isMandatory: false,
        hasExpiry: true,
        defaultValidityMonths: 36,
        renewalRequired: true,
        requiresAssessment: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockCompetency] });

      const result = await CompetencyModel.findById(1);

      expect(result).toEqual(mockCompetency);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM Competencies WHERE id = @id');
    });

    it('should return null if competency is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await CompetencyModel.findById(999);

      expect(result).toBeNull();
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 999);
    });
  });

  describe('findByCode', () => {
    it('should return a competency by code', async () => {
      const mockCompetency = {
        id: 1,
        competencyCode: 'COMP-001',
        name: 'ISO 9001 Lead Auditor',
        category: 'Quality',
        status: CompetencyStatus.ACTIVE,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockCompetency] });

      const result = await CompetencyModel.findByCode('COMP-001');

      expect(result).toEqual(mockCompetency);
      expect(mockPool.input).toHaveBeenCalledWith('competencyCode', expect.anything(), 'COMP-001');
    });
  });

  describe('findAll', () => {
    it('should return all competencies without filters', async () => {
      const mockCompetencies = [
        { id: 1, competencyCode: 'COMP-001', name: 'Competency 1', category: 'Quality' },
        { id: 2, competencyCode: 'COMP-002', name: 'Competency 2', category: 'Safety' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockCompetencies });

      const result = await CompetencyModel.findAll();

      expect(result).toEqual(mockCompetencies);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY category, name'));
    });

    it('should filter competencies by status', async () => {
      const mockCompetencies = [
        { id: 1, competencyCode: 'COMP-001', name: 'Active Competency', status: CompetencyStatus.ACTIVE },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockCompetencies });

      const result = await CompetencyModel.findAll({ status: CompetencyStatus.ACTIVE });

      expect(result).toEqual(mockCompetencies);
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), CompetencyStatus.ACTIVE);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('AND status = @status'));
    });

    it('should filter competencies by category', async () => {
      const mockCompetencies = [
        { id: 1, competencyCode: 'COMP-001', name: 'Quality Competency', category: 'Quality' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockCompetencies });

      const result = await CompetencyModel.findAll({ category: 'Quality' });

      expect(result).toEqual(mockCompetencies);
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), 'Quality');
    });
  });

  describe('update', () => {
    it('should update a competency', async () => {
      const updates = {
        name: 'Updated Competency Name',
        status: CompetencyStatus.DEPRECATED,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await CompetencyModel.update(1, updates);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('name', updates.name);
      expect(mockPool.input).toHaveBeenCalledWith('status', updates.status);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE Competencies SET'));
    });
  });

  describe('assignToUser', () => {
    it('should assign a competency to a user and return the assignment ID', async () => {
      const userCompetency: UserCompetency = {
        userId: 1,
        competencyId: 1,
        acquiredDate: new Date('2024-01-01'),
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2027-01-01'),
        status: 'active',
        verified: false,
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await CompetencyModel.assignToUser(userCompetency);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('userId', expect.anything(), userCompetency.userId);
      expect(mockPool.input).toHaveBeenCalledWith('competencyId', expect.anything(), userCompetency.competencyId);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO UserCompetencies'));
    });
  });

  describe('getUserCompetencies', () => {
    it('should return user competencies with details', async () => {
      const mockUserCompetencies = [
        {
          id: 1,
          userId: 1,
          competencyId: 1,
          competencyName: 'ISO 9001 Lead Auditor',
          competencyCode: 'COMP-001',
          competencyCategory: 'Quality',
          status: 'active',
          expiryDate: new Date('2027-01-01'),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockUserCompetencies });

      const result = await CompetencyModel.getUserCompetencies(1);

      expect(result).toEqual(mockUserCompetencies);
      expect(mockPool.input).toHaveBeenCalledWith('userId', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM UserCompetencies uc'));
    });

    it('should filter user competencies by status', async () => {
      const mockUserCompetencies = [
        {
          id: 1,
          userId: 1,
          competencyId: 1,
          status: 'active',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockUserCompetencies });

      const result = await CompetencyModel.getUserCompetencies(1, { status: 'active' });

      expect(result).toEqual(mockUserCompetencies);
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), 'active');
    });
  });

  describe('getUsersByCompetency', () => {
    it('should return users with a specific competency', async () => {
      const mockUsers = [
        {
          id: 1,
          userId: 1,
          competencyId: 1,
          userName: 'John Doe',
          userEmail: 'john@example.com',
          status: 'active',
        },
        {
          id: 2,
          userId: 2,
          competencyId: 1,
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          status: 'active',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockUsers });

      const result = await CompetencyModel.getUsersByCompetency(1);

      expect(result).toEqual(mockUsers);
      expect(mockPool.input).toHaveBeenCalledWith('competencyId', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE uc.competencyId = @competencyId'));
    });
  });

  describe('updateUserCompetency', () => {
    it('should update a user competency', async () => {
      const updates = {
        status: 'expired',
        verified: true,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await CompetencyModel.updateUserCompetency(1, updates);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('status', updates.status);
      expect(mockPool.input).toHaveBeenCalledWith('verified', updates.verified);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE UserCompetencies SET'));
    });
  });

  describe('getExpiringCompetencies', () => {
    it('should return expiring competencies within threshold', async () => {
      const mockExpiringCompetencies = [
        {
          id: 1,
          userId: 1,
          competencyId: 1,
          competencyName: 'ISO 9001 Lead Auditor',
          expiryDate: new Date('2024-02-15'),
          status: 'active',
        },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockExpiringCompetencies });

      const result = await CompetencyModel.getExpiringCompetencies(1, 30);

      expect(result).toEqual(mockExpiringCompetencies);
      expect(mockPool.input).toHaveBeenCalledWith('userId', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('daysThreshold', expect.anything(), 30);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE uc.userId = @userId'));
    });
  });
});
