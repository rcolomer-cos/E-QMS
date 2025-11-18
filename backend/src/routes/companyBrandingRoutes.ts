import express from 'express';
import { body } from 'express-validator';
import {
  getCompanyBranding,
  updateCompanyBranding,
  createCompanyBranding,
} from '../controllers/companyBrandingController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @route   GET /api/company-branding
 * @desc    Get company branding information
 * @access  Public (everyone should see company branding)
 */
router.get('/', getCompanyBranding);

/**
 * @route   POST /api/company-branding
 * @desc    Create company branding (only if it doesn't exist)
 * @access  Private (Admin/Superuser only)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('primaryColor').optional().trim(),
    body('secondaryColor').optional().trim(),
    body('companyLogoUrl').optional().trim(),
    body('companyLogoPath').optional().trim(),
    body('companyWebsite').optional().trim(),
    body('companyEmail').optional().isEmail().withMessage('Valid email is required'),
    body('companyPhone').optional().trim(),
    body('companyAddress').optional().trim(),
    body('companyCity').optional().trim(),
    body('companyState').optional().trim(),
    body('companyPostalCode').optional().trim(),
    body('companyCountry').optional().trim(),
    body('tagline').optional().trim(),
    body('description').optional().trim(),
  ],
  createCompanyBranding
);

/**
 * @route   PUT /api/company-branding
 * @desc    Update company branding
 * @access  Private (Admin/Superuser only)
 */
router.put(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPERUSER),
  [
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('primaryColor').optional().trim(),
    body('secondaryColor').optional().trim(),
    body('companyLogoUrl').optional().trim(),
    body('companyLogoPath').optional().trim(),
    body('companyWebsite').optional().trim(),
    body('companyEmail').optional().isEmail().withMessage('Valid email is required'),
    body('companyPhone').optional().trim(),
    body('companyAddress').optional().trim(),
    body('companyCity').optional().trim(),
    body('companyState').optional().trim(),
    body('companyPostalCode').optional().trim(),
    body('companyCountry').optional().trim(),
    body('tagline').optional().trim(),
    body('description').optional().trim(),
  ],
  updateCompanyBranding
);

export default router;
