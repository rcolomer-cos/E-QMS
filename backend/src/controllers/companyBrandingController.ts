import { Response } from 'express';
import { CompanyBrandingModel } from '../models/CompanyBrandingModel';
import { AuthRequest } from '../types';
import { validationResult } from 'express-validator';
import { logUpdate, logCreate, AuditActionCategory } from '../services/auditLogService';

/**
 * Get company branding information
 */
export const getCompanyBranding = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branding = await CompanyBrandingModel.get();

    if (!branding) {
      res.status(404).json({ error: 'Company branding not found' });
      return;
    }

    res.json(branding);
  } catch (error) {
    console.error('Get company branding error:', error);
    res.status(500).json({ error: 'Failed to get company branding' });
  }
};

/**
 * Update company branding
 */
export const updateCompanyBranding = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const {
      companyName,
      companyLogoUrl,
      companyLogoPath,
      primaryColor,
      secondaryColor,
      companyWebsite,
      companyEmail,
      companyPhone,
      companyAddress,
      companyCity,
      companyState,
      companyPostalCode,
      companyCountry,
      tagline,
      description,
    } = req.body;

    // Get old values for audit log
    const oldBranding = await CompanyBrandingModel.get();

    // Update the branding
    const updated = await CompanyBrandingModel.update(
      {
        companyName,
        companyLogoUrl,
        companyLogoPath,
        primaryColor,
        secondaryColor,
        companyWebsite,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyState,
        companyPostalCode,
        companyCountry,
        tagline,
        description,
      },
      req.user.id
    );

    if (!updated) {
      res.status(400).json({ error: 'Failed to update company branding' });
      return;
    }

    // Get updated values
    const newBranding = await CompanyBrandingModel.get();

    // Log audit entry
    if (oldBranding && newBranding) {
      await logUpdate({
        req,
        actionCategory: AuditActionCategory.SYSTEM,
        entityType: 'CompanyBranding',
        entityId: 1,
        entityIdentifier: 'Company Branding',
        oldValues: oldBranding,
        newValues: newBranding,
      });
    }

    res.json({
      message: 'Company branding updated successfully',
      branding: newBranding,
    });
  } catch (error) {
    console.error('Update company branding error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update company branding',
    });
  }
};

/**
 * Create company branding (only if it doesn't exist)
 */
export const createCompanyBranding = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if branding already exists
    const existing = await CompanyBrandingModel.get();
    if (existing) {
      res.status(400).json({ error: 'Company branding already exists. Use update endpoint instead.' });
      return;
    }

    const {
      companyName,
      companyLogoUrl,
      companyLogoPath,
      primaryColor,
      secondaryColor,
      companyWebsite,
      companyEmail,
      companyPhone,
      companyAddress,
      companyCity,
      companyState,
      companyPostalCode,
      companyCountry,
      tagline,
      description,
    } = req.body;

    const brandingId = await CompanyBrandingModel.create(
      {
        companyName,
        companyLogoUrl,
        companyLogoPath,
        primaryColor,
        secondaryColor,
        companyWebsite,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyState,
        companyPostalCode,
        companyCountry,
        tagline,
        description,
      },
      req.user.id
    );

    // Get the created branding
    const branding = await CompanyBrandingModel.get();

    // Log audit entry
    await logCreate({
      req,
      actionCategory: AuditActionCategory.SYSTEM,
      entityType: 'CompanyBranding',
      entityId: brandingId,
      entityIdentifier: 'Company Branding',
      newValues: branding,
    });

    res.status(201).json({
      message: 'Company branding created successfully',
      branding,
    });
  } catch (error) {
    console.error('Create company branding error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create company branding',
    });
  }
};
