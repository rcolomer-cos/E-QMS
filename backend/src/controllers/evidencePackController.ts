import { Response } from 'express';
import { AuthRequest } from '../types';
import { EvidencePackService } from '../services/evidencePackService';
import { logAudit } from '../services/auditLogService';

export class EvidencePackController {
  /**
   * Generate and download evidence pack PDF
   * POST /api/evidence-pack/generate
   */
  static async generateEvidencePack(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        includeDocuments = true,
        includeNCRs = true,
        includeCAPAs = true,
        includeTraining = true,
        includeAudits = true,
        includeAttachments = true,
      } = req.body;

      // Parse dates if provided
      const filters = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeDocuments,
        includeNCRs,
        includeCAPAs,
        includeTraining,
        includeAudits,
        includeAttachments,
      };

      // Generate the PDF
      const pdfBuffer = await EvidencePackService.generateEvidencePack(filters);

      // Log the action
      await logAudit({
        req,
        action: 'generate',
        actionCategory: 'system',
        actionDescription: 'Generated evidence pack PDF for external audit',
        entityType: 'system',
        entityId: 0,
        additionalData: {
          filters,
          generatedAt: new Date(),
        },
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `QMS_Evidence_Pack_${timestamp}.pdf`;

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating evidence pack:', error);

      // Log the error
      if (req.user) {
        await logAudit({
          req,
          action: 'generate',
          actionCategory: 'system',
          actionDescription: 'Failed to generate evidence pack PDF',
          entityType: 'system',
          entityId: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      res.status(500).json({
        error: 'Failed to generate evidence pack',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get available filters and options for evidence pack generation
   * GET /api/evidence-pack/options
   */
  static async getOptions(_req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({
        options: {
          includeDocuments: {
            type: 'boolean',
            default: true,
            description: 'Include document listings and status',
          },
          includeNCRs: {
            type: 'boolean',
            default: true,
            description: 'Include Non-Conformance Reports',
          },
          includeCAPAs: {
            type: 'boolean',
            default: true,
            description: 'Include Corrective & Preventive Actions',
          },
          includeTraining: {
            type: 'boolean',
            default: true,
            description: 'Include training records and matrices',
          },
          includeAudits: {
            type: 'boolean',
            default: true,
            description: 'Include audit records',
          },
          includeAttachments: {
            type: 'boolean',
            default: true,
            description: 'Include attachment summaries',
          },
          startDate: {
            type: 'date',
            required: false,
            description: 'Start date for filtering records (ISO 8601 format)',
          },
          endDate: {
            type: 'date',
            required: false,
            description: 'End date for filtering records (ISO 8601 format)',
          },
        },
      });
    } catch (error) {
      console.error('Error getting evidence pack options:', error);
      res.status(500).json({
        error: 'Failed to retrieve options',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
