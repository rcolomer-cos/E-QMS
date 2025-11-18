import { Response } from 'express';
import { EmailTemplateModel, EmailTemplate } from '../models/EmailTemplateModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logCreate, logUpdate, logDelete, AuditActionCategory } from '../services/auditLogService';

export const createEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const template: EmailTemplate = {
      ...req.body,
      createdBy: req.user.id,
    };

    const templateId = await EmailTemplateModel.create(template);

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'EmailTemplate',
      entityId: templateId,
      entityIdentifier: template.name,
      newValues: template,
    });

    res.status(201).json({
      message: 'Email template created successfully',
      id: templateId,
    });
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
};

export const getEmailTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, category, isActive } = req.query;

    const filters = {
      type: type as string | undefined,
      category: category as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    };

    const templates = await EmailTemplateModel.findAll(filters);

    res.json(templates);
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ error: 'Failed to get email templates' });
  }
};

export const getEmailTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await EmailTemplateModel.findById(parseInt(id, 10));
    if (!template) {
      res.status(404).json({ error: 'Email template not found' });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error('Get email template by ID error:', error);
    res.status(500).json({ error: 'Failed to get email template' });
  }
};

export const getEmailTemplatesByType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const { activeOnly } = req.query;

    const templates = await EmailTemplateModel.findByType(
      type,
      activeOnly !== 'false'
    );

    res.json(templates);
  } catch (error) {
    console.error('Get email templates by type error:', error);
    res.status(500).json({ error: 'Failed to get email templates by type' });
  }
};

export const getDefaultEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    const template = await EmailTemplateModel.findDefaultByType(type);
    if (!template) {
      res.status(404).json({ error: 'Default email template not found for this type' });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error('Get default email template error:', error);
    res.status(500).json({ error: 'Failed to get default email template' });
  }
};

export const updateEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const templateId = parseInt(id, 10);

    // Get old values for audit
    const oldTemplate = await EmailTemplateModel.findById(templateId);
    if (!oldTemplate) {
      res.status(404).json({ error: 'Email template not found' });
      return;
    }

    const updates: Partial<EmailTemplate> = {
      ...req.body,
      updatedBy: req.user.id,
    };

    const success = await EmailTemplateModel.update(templateId, updates);

    if (!success) {
      res.status(404).json({ error: 'Email template not found or no changes made' });
      return;
    }

    // Log audit entry
    await logUpdate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'EmailTemplate',
      entityId: templateId,
      entityIdentifier: oldTemplate.name,
      oldValues: oldTemplate,
      newValues: updates,
    });

    res.json({ message: 'Email template updated successfully' });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
};

export const deleteEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const templateId = parseInt(id, 10);

    // Get template for audit log before deletion
    const template = await EmailTemplateModel.findById(templateId);
    if (!template) {
      res.status(404).json({ error: 'Email template not found' });
      return;
    }

    const success = await EmailTemplateModel.delete(templateId);

    if (!success) {
      res.status(404).json({ error: 'Email template not found' });
      return;
    }

    // Log audit entry
    await logDelete({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'EmailTemplate',
      entityId: templateId,
      entityIdentifier: template.name,
      oldValues: template,
    });

    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
};

export const getTemplateTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const types = await EmailTemplateModel.getTemplateTypes();
    res.json(types);
  } catch (error) {
    console.error('Get template types error:', error);
    res.status(500).json({ error: 'Failed to get template types' });
  }
};

export const getTemplateCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await EmailTemplateModel.getTemplateCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get template categories error:', error);
    res.status(500).json({ error: 'Failed to get template categories' });
  }
};
