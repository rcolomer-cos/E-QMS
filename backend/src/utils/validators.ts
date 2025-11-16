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
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('documentType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Document type is required and must not exceed 100 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required and must not exceed 100 characters'),
  body('version')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'review', 'approved', 'obsolete'])
    .withMessage('Invalid status'),
  body('ownerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid owner ID'),
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid date'),
  body('reviewDate')
    .optional()
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
];

export const validateDocumentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('documentType')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Document type must not exceed 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('version')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'review', 'approved', 'obsolete'])
    .withMessage('Invalid status'),
  body('ownerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid owner ID'),
  body('filePath')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('File path must not exceed 1000 characters'),
  body('fileName')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('File name must not exceed 500 characters'),
  body('fileSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('File size must be a non-negative integer'),
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid date'),
  body('reviewDate')
    .optional()
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('approvedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid approver ID'),
  body('approvedAt')
    .optional()
    .isISO8601()
    .withMessage('Approval date must be a valid date'),
];

export const validateId: ValidationChain = param('id')
  .isInt({ min: 1 })
  .withMessage('Invalid ID');

export const validateUserUpdate = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'auditor', 'user', 'viewer'])
    .withMessage('Invalid role'),
];

export const validateRoleUpdate = [
  body('role')
    .isIn(['admin', 'manager', 'auditor', 'user', 'viewer'])
    .withMessage('Invalid role'),
];

export const validatePasswordChange = [
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

export const validateDepartment = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department name is required and must not exceed 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Department code is required and must not exceed 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Department code must contain only uppercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid manager ID'),
];

export const validateDepartmentUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department name must not exceed 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Department code must not exceed 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Department code must contain only uppercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid manager ID'),
];

export const validateProcess = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Process name is required and must not exceed 200 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Process code is required and must not exceed 50 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Process code must contain only uppercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),
  body('processCategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Process category must not exceed 100 characters'),
  body('objective')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Objective must not exceed 500 characters'),
  body('scope')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Scope must not exceed 500 characters'),
];

export const validateProcessUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Process name must not exceed 200 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Process code must not exceed 50 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Process code must contain only uppercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),
  body('processCategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Process category must not exceed 100 characters'),
  body('objective')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Objective must not exceed 500 characters'),
  body('scope')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Scope must not exceed 500 characters'),
];

export const validateProcessOwner = [
  body('ownerId')
    .isInt({ min: 1 })
    .withMessage('Owner ID is required and must be a valid user ID'),
  body('isPrimaryOwner')
    .optional()
    .isBoolean()
    .withMessage('isPrimaryOwner must be a boolean value'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

export const validateEquipment = [
  body('equipmentNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Equipment number is required and must not exceed 100 characters'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Equipment name is required and must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Manufacturer must not exceed 200 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Model must not exceed 200 characters'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Serial number must not exceed 200 characters'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location is required and must not exceed 200 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('status')
    .isIn(['operational', 'maintenance', 'out_of_service', 'calibration_due'])
    .withMessage('Invalid status. Must be one of: operational, maintenance, out_of_service, calibration_due'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),
  body('calibrationInterval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Calibration interval must be a positive integer'),
  body('maintenanceInterval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maintenance interval must be a positive integer'),
  body('responsiblePerson')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid responsible person ID'),
];

export const validateEquipmentUpdate = [
  body('equipmentNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Equipment number must not exceed 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Equipment name must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Manufacturer must not exceed 200 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Model must not exceed 200 characters'),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Serial number must not exceed 200 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['operational', 'maintenance', 'out_of_service', 'calibration_due'])
    .withMessage('Invalid status. Must be one of: operational, maintenance, out_of_service, calibration_due'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),
  body('lastCalibrationDate')
    .optional()
    .isISO8601()
    .withMessage('Last calibration date must be a valid date'),
  body('nextCalibrationDate')
    .optional()
    .isISO8601()
    .withMessage('Next calibration date must be a valid date'),
  body('calibrationInterval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Calibration interval must be a positive integer'),
  body('lastMaintenanceDate')
    .optional()
    .isISO8601()
    .withMessage('Last maintenance date must be a valid date'),
  body('nextMaintenanceDate')
    .optional()
    .isISO8601()
    .withMessage('Next maintenance date must be a valid date'),
  body('maintenanceInterval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maintenance interval must be a positive integer'),
  body('responsiblePerson')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid responsible person ID'),
];
