import { ReminderLogModel, ReminderLog } from '../../models/ReminderLogModel';
import { getConnection } from '../../config/database';

// Mock the database connection
jest.mock('../../config/database');

describe('ReminderLogModel', () => {
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
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

  describe('create', () => {
    it('should create a new reminder log', async () => {
      const mockLog: ReminderLog = {
        reminderType: 'training_expiry',
        status: 'success',
        itemsProcessed: 10,
        itemsNotified: 8,
        executionDurationMs: 1500,
        configuration: JSON.stringify({ daysThreshold: 30 }),
      };

      mockRequest.query.mockResolvedValue({
        recordset: [{ id: 1 }],
      });

      const result = await ReminderLogModel.create(mockLog);

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('reminderType', expect.anything(), 'training_expiry');
      expect(mockRequest.input).toHaveBeenCalledWith('status', expect.anything(), 'success');
      expect(mockRequest.input).toHaveBeenCalledWith('itemsProcessed', expect.anything(), 10);
    });
  });

  describe('findById', () => {
    it('should find a reminder log by ID', async () => {
      const mockLog = {
        id: 1,
        reminderType: 'training_expiry',
        status: 'success',
        itemsProcessed: 10,
        itemsNotified: 8,
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockLog],
      });

      const result = await ReminderLogModel.findById(1);

      expect(result).toEqual(mockLog);
      expect(mockRequest.input).toHaveBeenCalledWith('id', expect.anything(), 1);
    });

    it('should return null if reminder log not found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [],
      });

      const result = await ReminderLogModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated reminder logs', async () => {
      const mockLogs = [
        { id: 1, reminderType: 'training_expiry', status: 'success' },
        { id: 2, reminderType: 'equipment_calibration', status: 'success' },
      ];

      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 2 }] })
        .mockResolvedValueOnce({ recordset: mockLogs });

      const result = await ReminderLogModel.findAll({}, 1, 10);

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by reminder type', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
        .mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      await ReminderLogModel.findAll({ reminderType: 'training_expiry' });

      expect(mockRequest.input).toHaveBeenCalledWith('reminderType', expect.anything(), 'training_expiry');
    });
  });

  describe('getLatestByType', () => {
    it('should return the latest log for a reminder type', async () => {
      const mockLog = {
        id: 1,
        reminderType: 'training_expiry',
        status: 'success',
        executionTime: new Date(),
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockLog],
      });

      const result = await ReminderLogModel.getLatestByType('training_expiry');

      expect(result).toEqual(mockLog);
      expect(mockRequest.input).toHaveBeenCalledWith('reminderType', expect.anything(), 'training_expiry');
    });
  });

  describe('getStatistics', () => {
    it('should return reminder execution statistics', async () => {
      const mockStats = {
        totalExecutions: 100,
        successfulExecutions: 90,
        failedExecutions: 5,
        partialExecutions: 5,
        totalItemsProcessed: 1000,
        totalItemsNotified: 900,
        averageDurationMs: 1500.5,
      };

      const mockByType = [
        { reminderType: 'training_expiry', count: 50, successRate: 95 },
        { reminderType: 'equipment_calibration', count: 50, successRate: 85 },
      ];

      mockRequest.query
        .mockResolvedValueOnce({ recordset: [mockStats] })
        .mockResolvedValueOnce({ recordset: mockByType });

      const result = await ReminderLogModel.getStatistics(30);

      expect(result.totalExecutions).toBe(100);
      expect(result.successfulExecutions).toBe(90);
      expect(result.byType).toHaveLength(2);
      expect(mockRequest.input).toHaveBeenCalledWith('days', expect.anything(), 30);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old reminder logs', async () => {
      mockRequest.query.mockResolvedValue({
        rowsAffected: [10],
      });

      const result = await ReminderLogModel.deleteOlderThan(90);

      expect(result).toBe(10);
      expect(mockRequest.input).toHaveBeenCalledWith('days', expect.anything(), 90);
    });
  });
});
