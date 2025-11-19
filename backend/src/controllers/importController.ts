import { Response } from 'express';
import { AuthRequest } from '../types';
import { ImportTemplateService, ImportTemplateType } from '../services/importTemplateService';
import { ImportParserService } from '../services/importParserService';
import { ImportExecutionService } from '../services/importExecutionService';
import { DataImportModel } from '../models/DataImportModel';
import fs from 'fs';
import path from 'path';

/**
 * Get list of available import templates
 */
export const getAvailableTemplates = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = ImportTemplateService.getAvailableTemplates();
    
    const templateInfo = templates.map(type => ({
      type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      description: `Import ${type} data from Excel`,
    }));

    res.json(templateInfo);
  } catch (error) {
    console.error('Get available templates error:', error);
    res.status(500).json({ error: 'Failed to fetch available templates' });
  }
};

/**
 * Download Excel template for a specific type
 */
export const downloadTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    if (!ImportTemplateService.getAvailableTemplates().includes(type as ImportTemplateType)) {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    const workbook = await ImportTemplateService.generateTemplate(type as ImportTemplateType);

    // Set response headers
    const fileName = `${type}_import_template.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

/**
 * Upload and parse Excel file for preview
 */
export const uploadAndPreview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { type } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!type || !ImportTemplateService.getAvailableTemplates().includes(type as ImportTemplateType)) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      res.status(400).json({ error: 'Invalid import type' });
      return;
    }

    try {
      // Parse and validate file
      const parseResult = await ImportParserService.parseFile(file.path, type as ImportTemplateType);

      // Store file path in session/temp for later import execution
      // For now, we'll keep the file and return its path
      const tempFilePath = file.path;

      res.json({
        success: true,
        fileName: file.originalname,
        fileSize: file.size,
        tempFilePath,
        preview: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows,
          hasErrors: parseResult.hasErrors,
          rows: parseResult.rows.slice(0, 10), // Return first 10 rows for preview
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      fs.unlinkSync(file.path);
      throw error;
    }
  } catch (error) {
    console.error('Upload and preview error:', error);
    res.status(500).json({ 
      error: 'Failed to parse file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * Execute import after preview confirmation
 */
export const executeImport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { type, tempFilePath, fileName, fileSize } = req.body;

    if (!type || !tempFilePath) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    if (!fs.existsSync(tempFilePath)) {
      res.status(400).json({ error: 'Uploaded file not found. Please upload the file again.' });
      return;
    }

    // Parse file again to get all rows
    const parseResult = await ImportParserService.parseFile(tempFilePath, type as ImportTemplateType);

    // Create import log
    const importLog = await DataImportModel.create({
      importType: type,
      fileName: fileName || path.basename(tempFilePath),
      fileSize: fileSize || fs.statSync(tempFilePath).size,
      totalRows: parseResult.totalRows,
      importedBy: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    try {
      // Execute import
      const result = await ImportExecutionService.executeImport(
        parseResult.rows,
        type as ImportTemplateType,
        req.user.id
      );

      // Update import log with results
      const status = result.failureCount === 0 
        ? 'completed' 
        : result.successCount === 0 
          ? 'failed' 
          : 'partial';

      await DataImportModel.update(importLog.id!, {
        status,
        successRows: result.successCount,
        failedRows: result.failureCount,
        errorDetails: result.errors,
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      res.json({
        success: result.failureCount === 0,
        importLogId: importLog.id,
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.errors,
        },
      });
    } catch (error) {
      // Update import log as failed
      await DataImportModel.update(importLog.id!, {
        status: 'failed',
        successRows: 0,
        failedRows: parseResult.totalRows,
        errorDetails: [{
          row: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }],
      });

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      throw error;
    }
  } catch (error) {
    console.error('Execute import error:', error);
    res.status(500).json({ 
      error: 'Failed to execute import', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * Get import history
 */
export const getImportHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { importType, status, page = 1, limit = 50 } = req.query;

    const options: any = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    if (importType) {
      options.importType = importType as string;
    }

    if (status) {
      options.status = status as string;
    }

    const result = await DataImportModel.findAll(options);

    res.json({
      logs: result.logs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / options.limit),
      },
    });
  } catch (error) {
    console.error('Get import history error:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
};

/**
 * Get import log details by ID
 */
export const getImportLogDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const importLog = await DataImportModel.findById(parseInt(id, 10));

    if (!importLog) {
      res.status(404).json({ error: 'Import log not found' });
      return;
    }

    res.json(importLog);
  } catch (error) {
    console.error('Get import log details error:', error);
    res.status(500).json({ error: 'Failed to fetch import log details' });
  }
};
