import { body, param, ValidationChain } from 'express-validator';

export const validateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
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
  body('role')
    .isIn(['admin', 'manager', 'auditor', 'user', 'viewer'])
    .withMessage('Invalid role'),
];

export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
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

export const validateUserUpdate = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'auditor', 'user', 'viewer'])
    .withMessage('Invalid role'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
];

export const validateId: ValidationChain = param('id')
  .isInt({ min: 1 })
  .withMessage('Invalid ID');
