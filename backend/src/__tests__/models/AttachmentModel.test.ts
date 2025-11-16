import { AttachmentModel, Attachment, EntityType } from '../../models/AttachmentModel';
import { getConnection } from '../../config/database';

// Mock the database connection
jest.mock('../../config/database');

const mockPool = {
  request: jest.fn().mockReturnThis(),
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

describe('AttachmentModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getConnection as jest.Mock).mockResolvedValue(mockPool);
  });

  describe('create', () => {
    it('should create a new attachment and return its ID', async () => {
      const attachment: Attachment = {
        fileName: 'test-certificate.pdf',
        storedFileName: 'test-certificate-123456789.pdf',
        filePath: '/uploads/calibration/test-certificate-123456789.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        fileExtension: '.pdf',
        entityType: EntityType.CALIBRATION,
        entityId: 1,
        description: 'Calibration certificate',
        category: 'certificate',
        version: '1.0',
        uploadedBy: 1,
        isPublic: false,
        active: true,
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

      const result = await AttachmentModel.create(attachment);

      expect(result).toBe(1);
      expect(mockPool.input).toHaveBeenCalledWith('fileName', expect.anything(), attachment.fileName);
      expect(mockPool.input).toHaveBeenCalledWith('entityType', expect.anything(), attachment.entityType);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Attachments'));
    });
  });

  describe('findById', () => {
    it('should return an attachment by ID', async () => {
      const mockAttachment = {
        id: 1,
        fileName: 'test-certificate.pdf',
        storedFileName: 'test-certificate-123456789.pdf',
        filePath: '/uploads/calibration/test-certificate-123456789.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        fileExtension: '.pdf',
        entityType: EntityType.CALIBRATION,
        entityId: 1,
        description: 'Calibration certificate',
        category: 'certificate',
        uploadedBy: 1,
        isPublic: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ recordset: [mockAttachment] });

      const result = await AttachmentModel.findById(1);

      expect(result).toEqual(mockAttachment);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = @id AND active = 1'));
    });

    it('should return null if attachment is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [] });

      const result = await AttachmentModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all active attachments without filters', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'file1.pdf', entityType: EntityType.CALIBRATION, active: true },
        { id: 2, fileName: 'file2.pdf', entityType: EntityType.EQUIPMENT, active: true },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockAttachments });

      const result = await AttachmentModel.findAll();

      expect(result).toEqual(mockAttachments);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('AND active = 1'));
    });

    it('should filter by entityType and entityId', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'file1.pdf', entityType: EntityType.CALIBRATION, entityId: 1 },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockAttachments });

      const result = await AttachmentModel.findAll({
        entityType: EntityType.CALIBRATION,
        entityId: 1,
      });

      expect(result).toEqual(mockAttachments);
      expect(mockPool.input).toHaveBeenCalledWith('entityType', expect.anything(), EntityType.CALIBRATION);
      expect(mockPool.input).toHaveBeenCalledWith('entityId', expect.anything(), 1);
    });

    it('should filter by category', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'certificate.pdf', category: 'certificate' },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockAttachments });

      const result = await AttachmentModel.findAll({ category: 'certificate' });

      expect(result).toEqual(mockAttachments);
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), 'certificate');
    });
  });

  describe('findByEntity', () => {
    it('should return attachments for a specific entity', async () => {
      const mockAttachments = [
        { id: 1, fileName: 'file1.pdf', entityType: EntityType.EQUIPMENT, entityId: 5 },
        { id: 2, fileName: 'file2.pdf', entityType: EntityType.EQUIPMENT, entityId: 5 },
      ];

      mockPool.query.mockResolvedValueOnce({ recordset: mockAttachments });

      const result = await AttachmentModel.findByEntity(EntityType.EQUIPMENT, 5);

      expect(result).toEqual(mockAttachments);
      expect(mockPool.input).toHaveBeenCalledWith('entityType', expect.anything(), EntityType.EQUIPMENT);
      expect(mockPool.input).toHaveBeenCalledWith('entityId', expect.anything(), 5);
    });
  });

  describe('update', () => {
    it('should update attachment metadata', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await AttachmentModel.update(1, {
        description: 'Updated description',
        category: 'updated-category',
      });

      expect(result).toBe(true);
      expect(mockPool.input).toHaveBeenCalledWith('description', expect.anything(), 'Updated description');
      expect(mockPool.input).toHaveBeenCalledWith('category', expect.anything(), 'updated-category');
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE Attachments'));
    });

    it('should return false if no fields to update', async () => {
      const result = await AttachmentModel.update(1, {});

      expect(result).toBe(false);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should return false if attachment not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await AttachmentModel.update(999, { description: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an attachment', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await AttachmentModel.softDelete(1, 2);

      expect(result).toBe(true);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.input).toHaveBeenCalledWith('deletedBy', expect.anything(), 2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SET active = 0'));
    });

    it('should return false if attachment not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await AttachmentModel.softDelete(999, 2);

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete an attachment', async () => {
      mockPool.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await AttachmentModel.hardDelete(1);

      expect(result).toBe(true);
      expect(mockPool.input).toHaveBeenCalledWith('id', expect.anything(), 1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM Attachments'));
    });
  });

  describe('countByEntity', () => {
    it('should return the count of attachments for an entity', async () => {
      mockPool.query.mockResolvedValueOnce({ recordset: [{ count: 5 }] });

      const result = await AttachmentModel.countByEntity(EntityType.EQUIPMENT, 1);

      expect(result).toBe(5);
      expect(mockPool.input).toHaveBeenCalledWith('entityType', expect.anything(), EntityType.EQUIPMENT);
      expect(mockPool.input).toHaveBeenCalledWith('entityId', expect.anything(), 1);
    });
  });
});
