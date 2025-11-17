import { Response } from 'express';
import { ChecklistTemplateModel } from '../models/ChecklistTemplateModel';
import { ChecklistQuestionModel } from '../models/ChecklistQuestionModel';
import { ChecklistResponseModel } from '../models/ChecklistResponseModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

// =============================================
// Checklist Template Controllers
// =============================================

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const template = {
      ...req.body,
      createdBy: req.user.id,
    };

    const templateId = await ChecklistTemplateModel.create(template);

    res.status(201).json({
      message: 'Checklist template created successfully',
      templateId,
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create checklist template' });
  }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, auditType } = req.query;

    const templates = await ChecklistTemplateModel.findAll({
      status: status as any,
      category: category as string,
      auditType: auditType as string,
    });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get checklist templates' });
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await ChecklistTemplateModel.findById(parseInt(id, 10));
    if (!template) {
      res.status(404).json({ error: 'Checklist template not found' });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get checklist template' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await ChecklistTemplateModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Checklist template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update checklist template' });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await ChecklistTemplateModel.delete(parseInt(id, 10));

    res.json({ message: 'Checklist template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete checklist template' });
  }
};

export const getActiveTemplates = async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await ChecklistTemplateModel.getActiveTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Get active templates error:', error);
    res.status(500).json({ error: 'Failed to get active templates' });
  }
};

// =============================================
// Checklist Question Controllers
// =============================================

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const question = {
      ...req.body,
      createdBy: req.user.id,
    };

    const questionId = await ChecklistQuestionModel.create(question);

    res.status(201).json({
      message: 'Checklist question created successfully',
      questionId,
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create checklist question' });
  }
};

export const getQuestionsByTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = req.params;

    const questions = await ChecklistQuestionModel.findByTemplate(parseInt(templateId, 10));

    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get checklist questions' });
  }
};

export const getQuestionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await ChecklistQuestionModel.findById(parseInt(id, 10));
    if (!question) {
      res.status(404).json({ error: 'Checklist question not found' });
      return;
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get checklist question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await ChecklistQuestionModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Checklist question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update checklist question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await ChecklistQuestionModel.delete(parseInt(id, 10));

    res.json({ message: 'Checklist question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete checklist question' });
  }
};

export const reorderQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const { questionOrders } = req.body;

    if (!Array.isArray(questionOrders)) {
      res.status(400).json({ error: 'questionOrders must be an array' });
      return;
    }

    await ChecklistQuestionModel.reorderQuestions(parseInt(templateId, 10), questionOrders);

    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
};

// =============================================
// Checklist Response Controllers
// =============================================

export const createResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const response = {
      ...req.body,
      respondedBy: req.user.id,
    };

    const responseId = await ChecklistResponseModel.create(response);

    res.status(201).json({
      message: 'Checklist response created successfully',
      responseId,
    });
  } catch (error) {
    console.error('Create response error:', error);
    res.status(500).json({ error: 'Failed to create checklist response' });
  }
};

export const getResponsesByAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    const responses = await ChecklistResponseModel.findByAudit(parseInt(auditId, 10));

    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to get checklist responses' });
  }
};

export const getResponsesByAuditAndTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId, templateId } = req.params;

    const responses = await ChecklistResponseModel.findByAuditAndTemplate(
      parseInt(auditId, 10),
      parseInt(templateId, 10)
    );

    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to get checklist responses' });
  }
};

export const getResponseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const response = await ChecklistResponseModel.findById(parseInt(id, 10));
    if (!response) {
      res.status(404).json({ error: 'Checklist response not found' });
      return;
    }

    res.json(response);
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: 'Failed to get checklist response' });
  }
};

export const updateResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await ChecklistResponseModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Checklist response updated successfully' });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Failed to update checklist response' });
  }
};

export const deleteResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await ChecklistResponseModel.delete(parseInt(id, 10));

    res.json({ message: 'Checklist response deleted successfully' });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ error: 'Failed to delete checklist response' });
  }
};

export const getNonCompliantResponses = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    const responses = await ChecklistResponseModel.getNonCompliantResponses(parseInt(auditId, 10));

    res.json(responses);
  } catch (error) {
    console.error('Get non-compliant responses error:', error);
    res.status(500).json({ error: 'Failed to get non-compliant responses' });
  }
};

export const getResponsesRequiringAction = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    const responses = await ChecklistResponseModel.getResponsesRequiringAction(parseInt(auditId, 10));

    res.json(responses);
  } catch (error) {
    console.error('Get responses requiring action error:', error);
    res.status(500).json({ error: 'Failed to get responses requiring action' });
  }
};

export const getAuditCompletionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    const stats = await ChecklistResponseModel.getAuditCompletionStats(parseInt(auditId, 10));

    res.json(stats);
  } catch (error) {
    console.error('Get audit completion stats error:', error);
    res.status(500).json({ error: 'Failed to get audit completion stats' });
  }
};
