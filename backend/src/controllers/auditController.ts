import { Response } from 'express';
import { AuditModel, Audit } from '../models/AuditModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export const createAudit = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const audit: Audit = {
      ...req.body,
      createdBy: req.user.id,
    };

    const auditId = await AuditModel.create(audit);

    res.status(201).json({
      message: 'Audit created successfully',
      auditId,
    });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
};

export const getAudits = async (req: AuthRequest, res: Response) => {
  try {
    const { status, auditType } = req.query;

    const audits = await AuditModel.findAll({
      status: status as any,
      auditType: auditType as string,
    });

    res.json(audits);
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ error: 'Failed to get audits' });
  }
};

export const getAuditById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const audit = await AuditModel.findById(parseInt(id, 10));
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json(audit);
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({ error: 'Failed to get audit' });
  }
};

export const updateAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await AuditModel.update(parseInt(id, 10), updates);

    res.json({ message: 'Audit updated successfully' });
  } catch (error) {
    console.error('Update audit error:', error);
    res.status(500).json({ error: 'Failed to update audit' });
  }
};

export const deleteAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await AuditModel.delete(parseInt(id, 10));

    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ error: 'Failed to delete audit' });
  }
};
