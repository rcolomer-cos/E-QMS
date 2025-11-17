import { Response } from 'express';
import { EvidencePackController } from '../../controllers/evidencePackController';
import { EvidencePackService } from '../../services/evidencePackService';
import { AuthRequest } from '../../types';
import * as auditLogService from '../../services/auditLogService';

// Mock dependencies
jest.mock('../../services/evidencePackService');
jest.mock('../../services/auditLogService');

describe('EvidencePackController', () => {
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockSetHeader = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockAuthRequest = {
      body: {},
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        roleIds: [1],
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
      send: mockSend,
      setHeader: mockSetHeader,
    };
    jest.clearAllMocks();
  });

  describe('generateEvidencePack', () => {
    it('should generate PDF evidence pack successfully', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-data');
      (EvidencePackService.generateEvidencePack as jest.Mock).mockResolvedValue(mockPdfBuffer);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await EvidencePackController.generateEvidencePack(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(EvidencePackService.generateEvidencePack).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        includeDocuments: true,
        includeNCRs: true,
        includeCAPAs: true,
        includeTraining: true,
        includeAudits: true,
        includeAttachments: true,
      });

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Length', mockPdfBuffer.length);
      expect(mockSetHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="QMS_Evidence_Pack_\d{4}-\d{2}-\d{2}\.pdf"$/)
      );
      expect(mockSend).toHaveBeenCalledWith(mockPdfBuffer);
      expect(auditLogService.logAudit).toHaveBeenCalled();
    });

    it('should handle custom filters', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-data');
      (EvidencePackService.generateEvidencePack as jest.Mock).mockResolvedValue(mockPdfBuffer);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      mockAuthRequest.body = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeDocuments: false,
        includeNCRs: true,
      };

      await EvidencePackController.generateEvidencePack(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(EvidencePackService.generateEvidencePack).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        includeDocuments: false,
        includeNCRs: true,
        includeCAPAs: true,
        includeTraining: true,
        includeAudits: true,
        includeAttachments: true,
      });

      expect(mockSend).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('PDF generation failed');
      (EvidencePackService.generateEvidencePack as jest.Mock).mockRejectedValue(mockError);
      (auditLogService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await EvidencePackController.generateEvidencePack(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to generate evidence pack',
        message: 'PDF generation failed',
      });
      expect(auditLogService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'generate',
          success: false,
          errorMessage: 'PDF generation failed',
        })
      );
    });
  });

  describe('getOptions', () => {
    it('should return available options for evidence pack generation', async () => {
      await EvidencePackController.getOptions(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        options: expect.objectContaining({
          includeDocuments: expect.any(Object),
          includeNCRs: expect.any(Object),
          includeCAPAs: expect.any(Object),
          includeTraining: expect.any(Object),
          includeAudits: expect.any(Object),
          includeAttachments: expect.any(Object),
          startDate: expect.any(Object),
          endDate: expect.any(Object),
        }),
      });
    });

    it('should handle errors when getting options', async () => {
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      mockResponse.status = jest.fn().mockReturnValue({
        json: jest.fn(),
      });

      await EvidencePackController.getOptions(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
