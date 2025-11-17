import { ChecklistTemplateModel, ChecklistTemplate } from '../../models/ChecklistTemplateModel';
import { getConnection } from '../../config/database';
import { ChecklistTemplateStatus } from '../../types';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('ChecklistTemplateModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new checklist template and return its ID', async () => {
      const template: ChecklistTemplate = {
        templateCode: 'CHKT-ISO9001-001',
        templateName: 'ISO 9001 Internal Audit Checklist',
        description: 'Standard checklist for ISO 9001 internal audits',
        category: 'ISO 9001',
        auditType: 'Internal',
        status: ChecklistTemplateStatus.ACTIVE,
        version: '1.0',
        isStandard: true,
        requiresCompletion: true,
        allowCustomQuestions: false,
        createdBy: 1,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await ChecklistTemplateModel.create(template);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('templateCode', expect.anything(), template.templateCode);
      expect(mockPool.input).toHaveBeenCalledWith('templateName', expect.anything(), template.templateName);
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), template.category);
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), template.status);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ChecklistTemplates'));
    });
  });

  describe('findById', () => {
    it('should return a checklist template by ID', async () => {
      const mockTemplate = {
        id: 1,
        templateCode: 'CHKT-ISO9001-001',
        templateName: 'ISO 9001 Internal Audit Checklist',
        category: 'ISO 9001',
        status: ChecklistTemplateStatus.ACTIVE,
        version: '1.0',
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockTemplate] });

      const result = await ChecklistTemplateModel.findById(1);

      expect(result).toEqual(mockTemplate);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM ChecklistTemplates WHERE id = @id');
    });

    it('should return null if template is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await ChecklistTemplateModel.findById(999);

      expect(result).toBeNull();
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 999);
    });
  });

  describe('findByCode', () => {
    it('should return a checklist template by code', async () => {
      const mockTemplate = {
        id: 1,
        templateCode: 'CHKT-ISO9001-001',
        templateName: 'ISO 9001 Internal Audit Checklist',
        category: 'ISO 9001',
        status: ChecklistTemplateStatus.ACTIVE,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockTemplate] });

      const result = await ChecklistTemplateModel.findByCode('CHKT-ISO9001-001');

      expect(result).toEqual(mockTemplate);
      expect(mockPool.input).toHaveBeenCalledWith('templateCode', expect.anything(), 'CHKT-ISO9001-001');
    });
  });

  describe('findAll', () => {
    it('should return all templates without filters', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', templateName: 'Template 1', category: 'ISO 9001' },
        { id: 2, templateCode: 'CHKT-002', templateName: 'Template 2', category: 'ISO 14001' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.findAll();

      expect(result).toEqual(mockTemplates);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY category, templateName'));
    });

    it('should filter templates by status', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', templateName: 'Active Template', status: ChecklistTemplateStatus.ACTIVE },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.findAll({ status: ChecklistTemplateStatus.ACTIVE });

      expect(result).toEqual(mockTemplates);
      expect(mockPool.input).toHaveBeenCalledWith('status', expect.anything(), ChecklistTemplateStatus.ACTIVE);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('AND status = @status'));
    });

    it('should filter templates by category', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', templateName: 'ISO Template', category: 'ISO 9001' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.findAll({ category: 'ISO 9001' });

      expect(result).toEqual(mockTemplates);
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), 'ISO 9001');
    });

    it('should filter templates by audit type', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', templateName: 'Internal Template', auditType: 'Internal' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.findAll({ auditType: 'Internal' });

      expect(result).toEqual(mockTemplates);
      expect(mockPool.input).toHaveBeenCalledWith('auditType', expect.anything(), 'Internal');
    });
  });

  describe('update', () => {
    it('should update a checklist template', async () => {
      const updates = {
        templateName: 'Updated Template Name',
        status: ChecklistTemplateStatus.ARCHIVED,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await ChecklistTemplateModel.update(1, updates);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('templateName', updates.templateName);
      expect(mockPool.input).toHaveBeenCalledWith('status', updates.status);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE ChecklistTemplates SET'));
    });
  });

  describe('delete', () => {
    it('should delete a checklist template', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      await ChecklistTemplateModel.delete(1);

      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM ChecklistTemplates WHERE id = @id');
    });
  });

  describe('getActiveTemplates', () => {
    it('should return only active templates', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', status: ChecklistTemplateStatus.ACTIVE },
        { id: 2, templateCode: 'CHKT-002', status: ChecklistTemplateStatus.ACTIVE },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.getActiveTemplates();

      expect(result).toEqual(mockTemplates);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE status = 'active'"));
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return active templates for a specific category', async () => {
      const mockTemplates = [
        { id: 1, templateCode: 'CHKT-001', category: 'ISO 9001', status: ChecklistTemplateStatus.ACTIVE },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockTemplates });

      const result = await ChecklistTemplateModel.getTemplatesByCategory('ISO 9001');

      expect(result).toEqual(mockTemplates);
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), 'ISO 9001');
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE category = @category AND status = 'active'"));
    });
  });
});
