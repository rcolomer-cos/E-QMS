import { EmailTemplateModel, EmailTemplate } from '../../models/EmailTemplateModel';
import { getConnection } from '../../config/database';

// Mock database connection
jest.mock('../../config/database');

describe('EmailTemplateModel', () => {
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

  describe('create', () => {
    it('should create an email template successfully', async () => {
      const template: EmailTemplate = {
        name: 'test_template',
        displayName: 'Test Template',
        type: 'ncr_notification',
        category: 'ncr',
        subject: 'Test Subject {{ncrNumber}}',
        body: 'Test body with {{placeholder}}',
        description: 'Test description',
        placeholders: '["ncrNumber", "placeholder"]',
        isActive: true,
        isDefault: false,
        createdBy: 1,
      };

      mockQuery.mockResolvedValue({
        recordset: [{ id: 123 }],
      });

      const result = await EmailTemplateModel.create(template);

      expect(result).toBe(123);
      expect(mockRequest).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should retrieve a template by ID', async () => {
      const mockTemplate = {
        id: 1,
        name: 'test_template',
        displayName: 'Test Template',
        type: 'ncr_notification',
        category: 'ncr',
        subject: 'Test Subject',
        body: 'Test body',
        isActive: true,
        isDefault: false,
      };

      mockQuery.mockResolvedValue({
        recordset: [mockTemplate],
      });

      const result = await EmailTemplateModel.findById(1);

      expect(result).toEqual(mockTemplate);
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
    });

    it('should return null if template not found', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      const result = await EmailTemplateModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should retrieve all templates', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'template1',
          type: 'ncr_notification',
          category: 'ncr',
          isActive: true,
        },
        {
          id: 2,
          name: 'template2',
          type: 'training_reminder',
          category: 'training',
          isActive: true,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockTemplates,
      });

      const result = await EmailTemplateModel.findAll();

      expect(result).toEqual(mockTemplates);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should filter templates by type', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'template1',
          type: 'ncr_notification',
          category: 'ncr',
          isActive: true,
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockTemplates,
      });

      const result = await EmailTemplateModel.findAll({ type: 'ncr_notification' });

      expect(result).toEqual(mockTemplates);
      expect(mockInput).toHaveBeenCalledWith('type', expect.anything(), 'ncr_notification');
    });
  });

  describe('findDefaultByType', () => {
    it('should retrieve the default template for a type', async () => {
      const mockTemplate = {
        id: 1,
        name: 'default_ncr',
        type: 'ncr_notification',
        category: 'ncr',
        isActive: true,
        isDefault: true,
      };

      mockQuery.mockResolvedValue({
        recordset: [mockTemplate],
      });

      const result = await EmailTemplateModel.findDefaultByType('ncr_notification');

      expect(result).toEqual(mockTemplate);
      expect(mockInput).toHaveBeenCalledWith('type', expect.anything(), 'ncr_notification');
    });

    it('should return null if no default template found', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      const result = await EmailTemplateModel.findDefaultByType('ncr_notification');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a template successfully', async () => {
      mockQuery.mockResolvedValue({
        rowsAffected: [1],
      });

      const updates = {
        displayName: 'Updated Name',
        subject: 'Updated Subject',
      };

      const result = await EmailTemplateModel.update(1, updates);

      expect(result).toBe(true);
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
    });

    it('should return false if template not found', async () => {
      mockQuery.mockResolvedValue({
        rowsAffected: [0],
      });

      const result = await EmailTemplateModel.update(999, { displayName: 'Updated' });

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a template successfully', async () => {
      mockQuery.mockResolvedValue({
        rowsAffected: [1],
      });

      const result = await EmailTemplateModel.delete(1);

      expect(result).toBe(true);
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1);
    });

    it('should return false if template not found', async () => {
      mockQuery.mockResolvedValue({
        rowsAffected: [0],
      });

      const result = await EmailTemplateModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('getTemplateTypes', () => {
    it('should retrieve all template types', async () => {
      const mockTypes = [
        { type: 'ncr_notification' },
        { type: 'training_reminder' },
        { type: 'audit_assignment' },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockTypes,
      });

      const result = await EmailTemplateModel.getTemplateTypes();

      expect(result).toEqual(['ncr_notification', 'training_reminder', 'audit_assignment']);
    });
  });

  describe('getTemplateCategories', () => {
    it('should retrieve all template categories', async () => {
      const mockCategories = [
        { category: 'ncr' },
        { category: 'training' },
        { category: 'audit' },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockCategories,
      });

      const result = await EmailTemplateModel.getTemplateCategories();

      expect(result).toEqual(['ncr', 'training', 'audit']);
    });
  });
});
