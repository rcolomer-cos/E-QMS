import { Response } from 'express';
import { AuditModel, Audit } from '../models/AuditModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';

export const createAudit = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Generate audit number server-side (ignoring any client-provided auditNumber)
    const auditNumber = await AuditModel.generateAuditNumber();

    const audit: Audit = {
      auditNumber,
      title: req.body.title,
      description: req.body.description,
      auditType: req.body.auditType,
      scope: req.body.scope,
      status: req.body.status,
      scheduledDate: new Date(req.body.scheduledDate),
      leadAuditorId: req.body.leadAuditorId,
      department: req.body.department,
      auditCriteria: req.body.auditCriteria,
      relatedProcesses: req.body.relatedProcesses,
      externalAuditorName: req.body.externalAuditorName,
      externalAuditorOrganization: req.body.externalAuditorOrganization,
      externalAuditorEmail: req.body.externalAuditorEmail,
      externalAuditorPhone: req.body.externalAuditorPhone,
      createdBy: req.user.id,
    };

    const auditId = await AuditModel.create(audit);

    res.status(201).json({
      message: 'Audit created successfully',
      auditId,
      auditNumber,
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

export const getAuditById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const audit = await AuditModel.findById(parseInt(id, 10));
    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
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

export const submitAuditForReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const audit = await AuditModel.findById(parseInt(id, 10));
    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    if (audit.status !== 'completed') {
      res.status(400).json({ error: 'Only completed audits can be submitted for review' });
      return;
    }

    await AuditModel.submitForReview(parseInt(id, 10));

    res.json({ message: 'Audit submitted for review successfully' });
  } catch (error) {
    console.error('Submit audit for review error:', error);
    res.status(500).json({ error: 'Failed to submit audit for review' });
  }
};

export const approveAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewComments } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const audit = await AuditModel.findById(parseInt(id, 10));
    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    if (audit.status !== 'pending_review') {
      res.status(400).json({ error: 'Only audits pending review can be approved' });
      return;
    }

    await AuditModel.approveAudit(parseInt(id, 10), req.user.id, reviewComments);

    res.json({ message: 'Audit approved successfully' });
  } catch (error) {
    console.error('Approve audit error:', error);
    res.status(500).json({ error: 'Failed to approve audit' });
  }
};

export const rejectAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewComments } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!reviewComments || reviewComments.trim() === '') {
      res.status(400).json({ error: 'Review comments are required when rejecting an audit' });
      return;
    }

    const audit = await AuditModel.findById(parseInt(id, 10));
    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    if (audit.status !== 'pending_review') {
      res.status(400).json({ error: 'Only audits pending review can be rejected' });
      return;
    }

    await AuditModel.rejectAudit(parseInt(id, 10), req.user.id, reviewComments);

    res.json({ message: 'Audit rejected successfully' });
  } catch (error) {
    console.error('Reject audit error:', error);
    res.status(500).json({ error: 'Failed to reject audit' });
  }
};
