import { DocumentRevisionModel, DocumentRevision } from '../../models/DocumentRevisionModel';
import { getConnection } from '../../config/database';

// Mock database connection
jest.mock('../../config/database');

describe('DocumentRevisionModel', () => {
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
    it('should create a revision successfully', async () => {
      const revision: DocumentRevision = {
        documentId: 1,
        version: '1.0',
        revisionNumber: 1,
        changeType: 'create',
        changeDescription: 'Initial creation',
        authorId: 1,
        statusAfter: 'draft',
      };

      mockQuery.mockResolvedValue({
        recordset: [{ id: 123 }],
      });

      const result = await DocumentRevisionModel.create(revision);

      expect(result).toBe(123);
      expect(mockRequest).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('findByDocumentId', () => {
    it('should retrieve revisions for a document', async () => {
      const mockRevisions = [
        {
          id: 1,
          documentId: 1,
          version: '1.0',
          revisionNumber: 1,
          changeType: 'create',
          authorId: 1,
          authorFirstName: 'John',
          authorLastName: 'Doe',
          authorEmail: 'john@example.com',
        },
      ];

      mockQuery.mockResolvedValue({
        recordset: mockRevisions,
      });

      const result = await DocumentRevisionModel.findByDocumentId(1);

      expect(result).toEqual(mockRevisions);
      expect(mockInput).toHaveBeenCalledWith('documentId', expect.anything(), 1);
    });
  });

  describe('findLatestByDocumentId', () => {
    it('should retrieve the latest revision', async () => {
      const mockRevision = {
        id: 3,
        documentId: 1,
        version: '1.2',
        revisionNumber: 3,
        changeType: 'update',
        authorId: 1,
      };

      mockQuery.mockResolvedValue({
        recordset: [mockRevision],
      });

      const result = await DocumentRevisionModel.findLatestByDocumentId(1);

      expect(result).toEqual(mockRevision);
    });
  });

  describe('getNextRevisionNumber', () => {
    it('should return 1 for first revision', async () => {
      mockQuery.mockResolvedValue({
        recordset: [{ nextRevisionNumber: 1 }],
      });

      const result = await DocumentRevisionModel.getNextRevisionNumber(1);

      expect(result).toBe(1);
    });

    it('should return incremented revision number', async () => {
      mockQuery.mockResolvedValue({
        recordset: [{ nextRevisionNumber: 5 }],
      });

      const result = await DocumentRevisionModel.getNextRevisionNumber(1);

      expect(result).toBe(5);
    });
  });

  describe('getRevisionCount', () => {
    it('should return count of revisions', async () => {
      mockQuery.mockResolvedValue({
        recordset: [{ count: 10 }],
      });

      const result = await DocumentRevisionModel.getRevisionCount(1);

      expect(result).toBe(10);
    });

    it('should return 0 if no revisions exist', async () => {
      mockQuery.mockResolvedValue({
        recordset: [],
      });

      const result = await DocumentRevisionModel.getRevisionCount(1);

      expect(result).toBe(0);
    });
  });
});
