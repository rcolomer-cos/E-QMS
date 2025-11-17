import { TrainingCertificateService } from '../../services/trainingCertificateService';
import { getConnection, sql } from '../../config/database';

// Mock the database module
jest.mock('../../config/database', () => ({
  getConnection: jest.fn(),
  sql: {
    Int: 'Int',
    NVarChar: 'NVarChar',
    DateTime: 'DateTime',
    Bit: 'Bit',
    Decimal: 'Decimal',
  },
}));

describe('TrainingCertificateService', () => {
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExpiringCertificates', () => {
    it('should return expiring certificates with default parameters', async () => {
      const mockRecords = [
        {
          id: 1,
          certificateNumber: 'CERT-001',
          certificateName: 'Safety Training',
          userId: 10,
          userFirstName: 'John',
          userLastName: 'Doe',
          userEmail: 'john.doe@example.com',
          expiryDate: new Date('2025-01-15'),
          issueDate: new Date('2024-01-15'),
          status: 'active',
          certificateType: 'Safety',
          competencyArea: 'Workplace Safety',
          requiresRenewal: 0,
          nextRenewalDate: null,
          daysUntilExpiry: 30,
          isExpired: 0,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockRecords });

      const result = await TrainingCertificateService.getExpiringCertificates(90, true);

      expect(getConnection).toHaveBeenCalled();
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith('daysThreshold', sql.Int, 90);
      expect(mockRequest.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].certificateNumber).toBe('CERT-001');
      expect(result[0].isExpired).toBe(false);
      expect(result[0].requiresRenewal).toBe(false);
    });

    it('should handle certificates with renewal dates', async () => {
      const mockRecords = [
        {
          id: 2,
          certificateNumber: 'CERT-002',
          certificateName: 'Professional Certification',
          userId: 11,
          userFirstName: 'Jane',
          userLastName: 'Smith',
          userEmail: 'jane.smith@example.com',
          expiryDate: null,
          issueDate: new Date('2024-01-01'),
          status: 'active',
          certificateType: 'Professional',
          competencyArea: 'Quality Management',
          requiresRenewal: 1,
          nextRenewalDate: new Date('2025-02-01'),
          daysUntilExpiry: 45,
          isExpired: 0,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockRecords });

      const result = await TrainingCertificateService.getExpiringCertificates(60, true);

      expect(result).toHaveLength(1);
      expect(result[0].requiresRenewal).toBe(true);
      expect(result[0].nextRenewalDate).toEqual(new Date('2025-02-01'));
    });

    it('should handle expired certificates', async () => {
      const mockRecords = [
        {
          id: 3,
          certificateNumber: 'CERT-003',
          certificateName: 'Expired Cert',
          userId: 12,
          userFirstName: 'Bob',
          userLastName: 'Johnson',
          userEmail: 'bob.j@example.com',
          expiryDate: new Date('2024-11-01'),
          issueDate: new Date('2023-11-01'),
          status: 'active',
          certificateType: 'Technical',
          competencyArea: 'Technical Skills',
          requiresRenewal: 0,
          nextRenewalDate: null,
          daysUntilExpiry: -16,
          isExpired: 1,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockRecords });

      const result = await TrainingCertificateService.getExpiringCertificates(90, true);

      expect(result).toHaveLength(1);
      expect(result[0].isExpired).toBe(true);
      expect(result[0].daysUntilExpiry).toBe(-16);
    });

    it('should use custom threshold parameter', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await TrainingCertificateService.getExpiringCertificates(30, false);

      expect(mockRequest.input).toHaveBeenCalledWith('daysThreshold', sql.Int, 30);
    });
  });

  describe('getExpiringAttendeeRecords', () => {
    it('should return expiring attendee records', async () => {
      const mockRecords = [
        {
          id: 100,
          trainingId: 5,
          trainingTitle: 'First Aid Training',
          trainingNumber: 'TRN-005',
          userId: 10,
          userFirstName: 'John',
          userLastName: 'Doe',
          userEmail: 'john.doe@example.com',
          expiryDate: new Date('2025-01-20'),
          certificateDate: new Date('2024-01-20'),
          daysUntilExpiry: 35,
          isExpired: 0,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockRecords });

      const result = await TrainingCertificateService.getExpiringAttendeeRecords(90, true);

      expect(getConnection).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith('daysThreshold', sql.Int, 90);
      expect(result).toHaveLength(1);
      expect(result[0].trainingTitle).toBe('First Aid Training');
      expect(result[0].isExpired).toBe(false);
    });

    it('should handle empty result set', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await TrainingCertificateService.getExpiringAttendeeRecords(90, false);

      expect(result).toHaveLength(0);
    });
  });

  describe('getExpiringCertificatesForUser', () => {
    it('should return expiring certificates for a specific user', async () => {
      const userId = 10;
      const mockRecords = [
        {
          id: 1,
          certificateNumber: 'CERT-001',
          certificateName: 'Safety Training',
          userId: userId,
          userFirstName: 'John',
          userLastName: 'Doe',
          userEmail: 'john.doe@example.com',
          expiryDate: new Date('2025-01-15'),
          issueDate: new Date('2024-01-15'),
          status: 'active',
          certificateType: 'Safety',
          competencyArea: 'Workplace Safety',
          requiresRenewal: 0,
          nextRenewalDate: null,
          daysUntilExpiry: 30,
          isExpired: 0,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockRecords });

      const result = await TrainingCertificateService.getExpiringCertificatesForUser(userId, 60);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, userId);
      expect(mockRequest.input).toHaveBeenCalledWith('daysThreshold', sql.Int, 60);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(userId);
    });

    it('should return empty array when user has no expiring certificates', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await TrainingCertificateService.getExpiringCertificatesForUser(999, 90);

      expect(result).toHaveLength(0);
    });
  });
});
