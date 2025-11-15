import { body, param, ValidationChain } from 'express-validator';

export const validateUser = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must not exceed 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must not exceed 100 characters'),
  body('roleIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned'),
  body('roleIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateDocument = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('documentType')
    .isIn(['procedure', 'work_instruction', 'form', 'record', 'policy', 'manual'])
    .withMessage('Invalid document type'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
];

export const validateId: ValidationChain = param('id')
  .isInt({ min: 1 })
  .withMessage('Invalid ID');
