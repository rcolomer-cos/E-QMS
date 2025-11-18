import { SystemSettingsModel, SystemSetting } from '../../models/SystemSettingsModel';
import { getConnection } from '../../config/database';

// Mock database connection
jest.mock('../../config/database');

describe('SystemSettingsModel', () => {
  let mockRequest: jest.Mock;
  let mockQuery: jest.Mock;
  let mockInput: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockInput = jest.fn().mockReturnThis();
    mockRequest = jest.fn().mockReturnValue({
      input: mockInput,
      query: mockQuery,
    });
    (getConnection as jest.Mock).mockResolvedValue({
      request: mockRequest,
    });
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should retrieve all system settings', async () => {
      const mockSettings = [
        {
          id: 1,
          setting_key: 'system_name',
          setting_value: 'E-QMS',
          setting_type: 'string',
          category: 'general',
          display_name: 'System Name',
          description: 'The name of the QMS',
          is_editable: true,
        },
        {
          id: 2,
          setting_key: 'reminder_training_days',
          setting_value: '30',
          setting_type: 'number',
          category: 'notifications',
          display_name: 'Training Reminder Days',
          description: 'Days before training expiry',
          is_editable: true,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockSettings,
      });

      const result = await SystemSettingsModel.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].settingKey).toBe('system_name');
      expect(result[1].settingKey).toBe('reminder_training_days');
      expect(mockRequest).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      mockQuery.mockResolvedValue({
        recordset: [{
          id: 1,
          setting_key: 'system_name',
          setting_value: 'E-QMS',
          setting_type: 'string',
          category: 'general',
          display_name: 'System Name',
          description: 'The name of the QMS',
          is_editable: true,
        }],
      });

      const result = await SystemSettingsModel.findAll({ category: 'general' });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('general');
      expect(mockInput).toHaveBeenCalledWith('category', expect.anything(), 'general');
    });
  });

  describe('findByKey', () => {
    it('should retrieve a setting by key', async () => {
      const mockSetting = {
        id: 1,
        setting_key: 'system_name',
        setting_value: 'E-QMS',
        setting_type: 'string',
        category: 'general',
        display_name: 'System Name',
        description: 'The name of the QMS',
        is_editable: true,
      };

      mockQuery.mockResolvedValue({
        recordset: [mockSetting],
      });

      const result = await SystemSettingsModel.findByKey('system_name');

      expect(result).not.toBeNull();
      expect(result?.settingKey).toBe('system_name');
      expect(mockInput).toHaveBeenCalledWith('key', expect.anything(), 'system_name');
    });

    it('should return null if setting not found', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      const result = await SystemSettingsModel.findByKey('non_existent_key');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a setting value', async () => {
      // Mock findByKey to return an editable setting
      mockQuery
        .mockResolvedValueOnce({
          recordset: [{
            id: 1,
            setting_key: 'system_name',
            setting_value: 'E-QMS',
            setting_type: 'string',
            category: 'general',
            display_name: 'System Name',
            description: 'The name of the QMS',
            is_editable: true,
          }],
        })
        .mockResolvedValueOnce({
          rowsAffected: [1],
        });

      const result = await SystemSettingsModel.update('system_name', 'New QMS Name');

      expect(result).toBe(true);
      expect(mockInput).toHaveBeenCalledWith('value', expect.anything(), 'New QMS Name');
    });

    it('should throw error if setting is not editable', async () => {
      mockQuery.mockResolvedValue({
        recordset: [{
          id: 1,
          setting_key: 'system_version',
          setting_value: '1.0.0',
          setting_type: 'string',
          category: 'general',
          display_name: 'System Version',
          description: 'Current version',
          is_editable: false,
        }],
      });

      await expect(
        SystemSettingsModel.update('system_version', '2.0.0')
      ).rejects.toThrow("Setting 'system_version' is not editable");
    });

    it('should throw error if setting not found', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      await expect(
        SystemSettingsModel.update('non_existent', 'value')
      ).rejects.toThrow("Setting with key 'non_existent' not found");
    });
  });

  describe('create', () => {
    it('should create a new system setting', async () => {
      const newSetting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'> = {
        settingKey: 'new_setting',
        settingValue: 'test_value',
        settingType: 'string',
        category: 'general',
        displayName: 'New Setting',
        description: 'A new setting for testing',
        isEditable: true,
      };

      mockQuery.mockResolvedValue({
        recordset: [{ id: 123 }],
      });

      const result = await SystemSettingsModel.create(newSetting);

      expect(result).toBe(123);
      expect(mockRequest).toHaveBeenCalled();
      expect(mockInput).toHaveBeenCalledWith('settingKey', expect.anything(), 'new_setting');
    });
  });

  describe('findByCategory', () => {
    it('should group settings by category', async () => {
      const mockSettings = [
        {
          id: 1,
          setting_key: 'system_name',
          setting_value: 'E-QMS',
          setting_type: 'string',
          category: 'general',
          display_name: 'System Name',
          is_editable: true,
        },
        {
          id: 2,
          setting_key: 'reminder_training_days',
          setting_value: '30',
          setting_type: 'number',
          category: 'notifications',
          display_name: 'Training Reminder Days',
          is_editable: true,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockSettings,
      });

      const result = await SystemSettingsModel.findByCategory();

      expect(result).toHaveProperty('general');
      expect(result).toHaveProperty('notifications');
      expect(result.general).toHaveLength(1);
      expect(result.notifications).toHaveLength(1);
    });
  });
});
