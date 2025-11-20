import { body, param, ValidationChain } from 'express-validator';
import { getAllSeverities, getAllSources, getAllTypes } from '../constants/ncrClassification';

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
    .notEmpty()
    .withMessage('Process/Category is required')
    .isLength({ max: 100 })
    .withMessage('Process/Category must not exceed 100 characters'),
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
    .optional({ nullable: true })
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
  body('processType')
    .optional()
    .isIn(['main', 'support', 'sub'])
    .withMessage("Invalid processType. Must be one of: 'main', 'support', 'sub'"),
  body('parentProcessId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('parentProcessId must be a positive integer')
    .toInt(),
  body('displayOrder')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('displayOrder must be a non-negative integer')
    .toInt(),
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
  body('processType')
    .optional()
    .isIn(['main', 'support', 'sub'])
    .withMessage("Invalid processType. Must be one of: 'main', 'support', 'sub'"),
  body('parentProcessId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('parentProcessId must be a positive integer')
    .toInt(),
  body('displayOrder')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('displayOrder must be a non-negative integer')
    .toInt(),
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
    .isLength({ min: 1, max: 200 })
    .withMessage('Location must not be empty and must not exceed 200 characters'),
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

// NCR validators
export const validateNCR = [
  body('ncrNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('NCR number is required and must not exceed 100 characters'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title is required and must not exceed 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must not exceed 2000 characters'),
  body('source')
    .trim()
    .isIn(getAllSources())
    .withMessage(`Invalid source. Must be one of: ${getAllSources().join(', ')}`),
  body('category')
    .trim()
    .isIn(getAllTypes())
    .withMessage(`Invalid category. Must be one of: ${getAllTypes().join(', ')}`),
  body('status')
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status'),
  body('severity')
    .trim()
    .isIn(getAllSeverities())
    .withMessage(`Invalid severity. Must be one of: ${getAllSeverities().join(', ')}`),
  body('detectedDate')
    .isISO8601()
    .withMessage('Detected date must be a valid date'),
  body('reportedBy')
    .isInt({ min: 1 })
    .withMessage('Reporter ID is required and must be a valid user ID'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
];

export const validateNCRUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('source')
    .optional()
    .trim()
    .isIn(getAllSources())
    .withMessage(`Invalid source. Must be one of: ${getAllSources().join(', ')}`),
  body('category')
    .optional()
    .trim()
    .isIn(getAllTypes())
    .withMessage(`Invalid category. Must be one of: ${getAllTypes().join(', ')}`),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status'),
  body('severity')
    .optional()
    .trim()
    .isIn(getAllSeverities())
    .withMessage(`Invalid severity. Must be one of: ${getAllSeverities().join(', ')}`),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
  body('rootCause')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Root cause must not exceed 2000 characters'),
  body('containmentAction')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Containment action must not exceed 2000 characters'),
  body('correctiveAction')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Corrective action must not exceed 2000 characters'),
];

export const validateNCRStatus = [
  body('status')
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status. Must be one of: open, in_progress, resolved, closed, rejected'),
];

export const validateNCRAssignment = [
  body('assignedTo')
    .isInt({ min: 1 })
    .withMessage('Assigned user ID is required and must be a valid user ID'),
];

// CAPA validators
export const validateCAPA = [
  body('capaNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('CAPA number is required and must not exceed 100 characters'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title is required and must not exceed 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must not exceed 2000 characters'),
  body('type')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Type is required and must not exceed 100 characters'),
  body('source')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Source is required and must not exceed 200 characters'),
  body('status')
    .isIn(['open', 'in_progress', 'completed', 'verified', 'closed'])
    .withMessage('Invalid status'),
  body('priority')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Priority is required and must not exceed 50 characters'),
  body('proposedAction')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Proposed action is required and must not exceed 2000 characters'),
  body('actionOwner')
    .isInt({ min: 1 })
    .withMessage('Action owner ID is required and must be a valid user ID'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('createdBy')
    .isInt({ min: 1 })
    .withMessage('Creator ID is required and must be a valid user ID'),
  body('ncrId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid NCR ID'),
  body('auditId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid audit ID'),
];

export const validateCAPAUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'completed', 'verified', 'closed'])
    .withMessage('Invalid status'),
  body('proposedAction')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Proposed action must not exceed 2000 characters'),
  body('rootCause')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Root cause must not exceed 2000 characters'),
  body('effectiveness')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Effectiveness must not exceed 2000 characters'),
];

// Training validators
export const validateTraining = [
  body('trainingNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Training number is required and must not exceed 100 characters'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title is required and must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required and must not exceed 100 characters'),
  body('status')
    .isIn(['scheduled', 'completed', 'expired', 'cancelled'])
    .withMessage('Invalid status'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('createdBy')
    .isInt({ min: 1 })
    .withMessage('Creator ID is required and must be a valid user ID'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('expiryMonths')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Expiry months must be a positive integer'),
];

export const validateTrainingUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'expired', 'cancelled'])
    .withMessage('Invalid status'),
  body('completedDate')
    .optional()
    .isISO8601()
    .withMessage('Completed date must be a valid date'),
];

// Calibration Record validators
export const validateCalibrationRecord = [
  body('equipmentId')
    .isInt({ min: 1 })
    .withMessage('Equipment ID is required and must be a valid ID'),
  body('calibrationDate')
    .isISO8601()
    .withMessage('Calibration date must be a valid date'),
  body('performedBy')
    .isInt({ min: 1 })
    .withMessage('Performed by ID is required and must be a valid user ID'),
  body('result')
    .isIn(['pending', 'passed', 'failed', 'conditional'])
    .withMessage('Invalid result'),
  body('passed')
    .isBoolean()
    .withMessage('Passed must be a boolean value'),
  body('status')
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('createdBy')
    .isInt({ min: 1 })
    .withMessage('Creator ID is required and must be a valid user ID'),
  body('nextDueDate')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid date'),
  body('certificateNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Certificate number must not exceed 100 characters'),
];

export const validateCalibrationRecordUpdate = [
  body('result')
    .optional()
    .isIn(['pending', 'passed', 'failed', 'conditional'])
    .withMessage('Invalid result'),
  body('passed')
    .optional()
    .isBoolean()
    .withMessage('Passed must be a boolean value'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('findings')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Findings must not exceed 2000 characters'),
  body('correctiveAction')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Corrective action must not exceed 2000 characters'),
];

// Inspection Record validators
export const validateInspectionRecord = [
  body('equipmentId')
    .isInt({ min: 1 })
    .withMessage('Equipment ID is required and must be a valid ID'),
  body('inspectionDate')
    .isISO8601()
    .withMessage('Inspection date must be a valid date'),
  body('inspectedBy')
    .isInt({ min: 1 })
    .withMessage('Inspected by ID is required and must be a valid user ID'),
  body('inspectionType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Inspection type is required and must not exceed 100 characters'),
  body('result')
    .isIn(['pending', 'passed', 'passed_with_observations', 'failed', 'conditional'])
    .withMessage('Invalid result'),
  body('passed')
    .isBoolean()
    .withMessage('Passed must be a boolean value'),
  body('status')
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('createdBy')
    .isInt({ min: 1 })
    .withMessage('Creator ID is required and must be a valid user ID'),
];

export const validateInspectionRecordUpdate = [
  body('result')
    .optional()
    .isIn(['pending', 'passed', 'passed_with_observations', 'failed', 'conditional'])
    .withMessage('Invalid result'),
  body('passed')
    .optional()
    .isBoolean()
    .withMessage('Passed must be a boolean value'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('findings')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Findings must not exceed 2000 characters'),
];

// Service/Maintenance Record validators
export const validateServiceMaintenanceRecord = [
  body('equipmentId')
    .isInt({ min: 1 })
    .withMessage('Equipment ID is required and must be a valid ID'),
  body('serviceDate')
    .isISO8601()
    .withMessage('Service date must be a valid date'),
  body('performedBy')
    .isInt({ min: 1 })
    .withMessage('Performed by ID is required and must be a valid user ID'),
  body('serviceType')
    .isIn(['preventive', 'corrective', 'predictive', 'emergency', 'breakdown', 'routine', 'upgrade', 'installation', 'decommission'])
    .withMessage('Invalid service type'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must not exceed 2000 characters'),
  body('outcome')
    .isIn(['completed', 'partially_completed', 'failed', 'deferred', 'cancelled'])
    .withMessage('Invalid outcome'),
  body('status')
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled', 'on_hold'])
    .withMessage('Invalid status'),
  body('createdBy')
    .isInt({ min: 1 })
    .withMessage('Creator ID is required and must be a valid user ID'),
];

export const validateServiceMaintenanceRecordUpdate = [
  body('outcome')
    .optional()
    .isIn(['completed', 'partially_completed', 'failed', 'deferred', 'cancelled'])
    .withMessage('Invalid outcome'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled', 'on_hold'])
    .withMessage('Invalid status'),
  body('workPerformed')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Work performed must not exceed 2000 characters'),
];

// Attachment validators
export const validateAttachmentUpload = [
  body('entityType')
    .trim()
    .isIn(['equipment', 'document', 'calibration', 'inspection', 'service_maintenance', 'training', 'ncr', 'capa', 'audit'])
    .withMessage('Invalid entity type'),
  body('entityId')
    .trim()
    .notEmpty()
    .withMessage('Entity ID is required')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('version')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

export const validateAttachmentUpdate = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('version')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Version must not exceed 50 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

// CAPA workflow validators
export const validateCAPAAssignment = [
  body('actionOwner')
    .isInt({ min: 1 })
    .withMessage('Action owner ID is required and must be a valid user ID'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date'),
];

export const validateCAPAStatusUpdate = [
  body('status')
    .isIn(['open', 'in_progress', 'completed', 'verified', 'closed'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
];

export const validateCAPACompletion = [
  body('rootCause')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Root cause must not exceed 2000 characters'),
  body('proposedAction')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Proposed action must not exceed 2000 characters'),
];

export const validateCAPAVerification = [
  body('effectiveness')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Effectiveness verification is required and must not exceed 2000 characters'),
];

export const validateCompetency = [
  body('competencyCode')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Competency code is required and must not exceed 100 characters'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Name is required and must not exceed 500 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category is required and must not exceed 200 characters'),
  body('status')
    .isIn(['active', 'deprecated', 'draft', 'obsolete'])
    .withMessage('Invalid status'),
  body('isRegulatory')
    .isBoolean()
    .withMessage('isRegulatory must be a boolean'),
  body('isMandatory')
    .isBoolean()
    .withMessage('isMandatory must be a boolean'),
  body('hasExpiry')
    .isBoolean()
    .withMessage('hasExpiry must be a boolean'),
  body('renewalRequired')
    .isBoolean()
    .withMessage('renewalRequired must be a boolean'),
  body('requiresAssessment')
    .isBoolean()
    .withMessage('requiresAssessment must be a boolean'),
  body('defaultValidityMonths')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default validity months must be a positive integer'),
  body('minimumScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum score must be between 0 and 100'),
];

export const validateCompetencyUpdate = [
  body('competencyCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Competency code must not exceed 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Name must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'deprecated', 'draft', 'obsolete'])
    .withMessage('Invalid status'),
];

export const validateUserCompetency = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('competencyId')
    .isInt({ min: 1 })
    .withMessage('Valid competency ID is required'),
  body('acquiredDate')
    .isISO8601()
    .withMessage('Valid acquired date is required'),
  body('effectiveDate')
    .isISO8601()
    .withMessage('Valid effective date is required'),
  body('status')
    .isIn(['active', 'expired', 'suspended', 'revoked', 'pending'])
    .withMessage('Invalid status'),
  body('verified')
    .isBoolean()
    .withMessage('verified must be a boolean'),
  body('assessmentScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assessment score must be between 0 and 100'),
];

export const validateUserCompetencyUpdate = [
  body('status')
    .optional()
    .isIn(['active', 'expired', 'suspended', 'revoked', 'pending'])
    .withMessage('Invalid status'),
  body('verified')
    .optional()
    .isBoolean()
    .withMessage('verified must be a boolean'),
  body('assessmentScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assessment score must be between 0 and 100'),
];

export const validateRoleTrainingRequirement = [
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Valid role ID is required'),
  body('competencyId')
    .isInt({ min: 1 })
    .withMessage('Valid competency ID is required'),
  body('isMandatory')
    .isBoolean()
    .withMessage('isMandatory must be a boolean'),
  body('isRegulatory')
    .isBoolean()
    .withMessage('isRegulatory must be a boolean'),
  body('priority')
    .isIn(['critical', 'high', 'normal', 'low'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('Invalid status'),
  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Grace period days must be a non-negative integer'),
  body('refreshFrequencyMonths')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Refresh frequency must be a positive integer'),
  body('complianceDeadline')
    .optional()
    .isISO8601()
    .withMessage('Compliance deadline must be a valid date'),
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
];

export const validateRoleTrainingRequirementUpdate = [
  body('isMandatory')
    .optional()
    .isBoolean()
    .withMessage('isMandatory must be a boolean'),
  body('isRegulatory')
    .optional()
    .isBoolean()
    .withMessage('isRegulatory must be a boolean'),
  body('priority')
    .optional()
    .isIn(['critical', 'high', 'normal', 'low'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('Invalid status'),
  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Grace period days must be a non-negative integer'),
  body('refreshFrequencyMonths')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Refresh frequency must be a positive integer'),
  body('complianceDeadline')
    .optional()
    .isISO8601()
    .withMessage('Compliance deadline must be a valid date'),
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
];

export const validateAuditFinding = [
  body('findingNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Finding number is required and must not exceed 100 characters'),
  body('auditId')
    .isInt({ min: 1 })
    .withMessage('Audit ID is required and must be a valid integer'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title is required and must not exceed 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description is required'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category is required and must not exceed 200 characters'),
  body('severity')
    .isIn(['observation', 'minor', 'major', 'critical'])
    .withMessage('Invalid severity. Must be one of: observation, minor, major, critical'),
  body('evidence')
    .optional()
    .trim(),
  body('rootCause')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Root cause must not exceed 2000 characters'),
  body('auditCriteria')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Audit criteria must not exceed 1000 characters'),
  body('clauseReference')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Clause reference must not exceed 200 characters'),
  body('recommendations')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Recommendations must not exceed 2000 characters'),
  body('requiresNCR')
    .optional()
    .isBoolean()
    .withMessage('requiresNCR must be a boolean'),
  body('ncrId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('NCR ID must be a valid integer'),
  body('status')
    .optional()
    .isIn(['open', 'under_review', 'action_planned', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('identifiedDate')
    .isISO8601()
    .withMessage('Identified date is required and must be a valid date'),
  body('targetCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Target close date must be a valid date'),
  body('identifiedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Identified by must be a valid user ID'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('processId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Process ID must be a valid integer'),
  body('affectedArea')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Affected area must not exceed 500 characters'),
];

export const validateAuditFindingUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description cannot be empty'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category must not exceed 200 characters'),
  body('severity')
    .optional()
    .isIn(['observation', 'minor', 'major', 'critical'])
    .withMessage('Invalid severity'),
  body('rootCause')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Root cause must not exceed 2000 characters'),
  body('recommendations')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Recommendations must not exceed 2000 characters'),
  body('requiresNCR')
    .optional()
    .isBoolean()
    .withMessage('requiresNCR must be a boolean'),
  body('ncrId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('NCR ID must be a valid integer'),
  body('status')
    .optional()
    .isIn(['open', 'under_review', 'action_planned', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('targetCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Target close date must be a valid date'),
  body('closedDate')
    .optional()
    .isISO8601()
    .withMessage('Closed date must be a valid date'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  body('verifiedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Verified by must be a valid user ID'),
  body('verifiedDate')
    .optional()
    .isISO8601()
    .withMessage('Verified date must be a valid date'),
];

// Risk validators
export const validateRisk = [
  // riskNumber is auto-generated, so no validation needed
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title is required and must not exceed 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must not exceed 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category is required and must not exceed 200 characters'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Source must not exceed 200 characters'),
  body('likelihood')
    .isInt({ min: 1, max: 5 })
    .withMessage('Likelihood must be an integer between 1 and 5'),
  body('impact')
    .isInt({ min: 1, max: 5 })
    .withMessage('Impact must be an integer between 1 and 5'),
  body('mitigationStrategy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mitigation strategy must not exceed 2000 characters'),
  body('mitigationActions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mitigation actions must not exceed 2000 characters'),
  body('contingencyPlan')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Contingency plan must not exceed 2000 characters'),
  body('riskOwner')
    .isInt({ min: 1 })
    .withMessage('Risk owner is required and must be a valid user ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('process')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Process must not exceed 200 characters'),
  body('status')
    .isIn(['identified', 'assessed', 'mitigating', 'monitoring', 'closed', 'accepted'])
    .withMessage('Invalid status. Must be one of: identified, assessed, mitigating, monitoring, closed, accepted'),
  body('identifiedDate')
    .isISO8601()
    .withMessage('Identified date must be a valid date'),
  body('reviewDate')
    .optional()
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('nextReviewDate')
    .optional()
    .isISO8601()
    .withMessage('Next review date must be a valid date'),
  body('reviewFrequency')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Review frequency must be a positive integer'),
  body('residualLikelihood')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Residual likelihood must be an integer between 1 and 5'),
  body('residualImpact')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Residual impact must be an integer between 1 and 5'),
  body('affectedStakeholders')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Affected stakeholders must not exceed 1000 characters'),
  body('regulatoryImplications')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Regulatory implications must not exceed 1000 characters'),
  body('relatedRisks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Related risks must not exceed 500 characters'),
];

export const validateRiskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Category must not exceed 200 characters'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Source must not exceed 200 characters'),
  body('likelihood')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Likelihood must be an integer between 1 and 5'),
  body('impact')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Impact must be an integer between 1 and 5'),
  body('mitigationStrategy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mitigation strategy must not exceed 2000 characters'),
  body('mitigationActions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mitigation actions must not exceed 2000 characters'),
  body('contingencyPlan')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Contingency plan must not exceed 2000 characters'),
  body('riskOwner')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Risk owner must be a valid user ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('process')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Process must not exceed 200 characters'),
  body('status')
    .optional()
    .isIn(['identified', 'assessed', 'mitigating', 'monitoring', 'closed', 'accepted'])
    .withMessage('Invalid status. Must be one of: identified, assessed, mitigating, monitoring, closed, accepted'),
  body('reviewDate')
    .optional()
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('nextReviewDate')
    .optional()
    .isISO8601()
    .withMessage('Next review date must be a valid date'),
  body('reviewFrequency')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Review frequency must be a positive integer'),
  body('residualLikelihood')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Residual likelihood must be an integer between 1 and 5'),
  body('residualImpact')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Residual impact must be an integer between 1 and 5'),
  body('affectedStakeholders')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Affected stakeholders must not exceed 1000 characters'),
  body('regulatoryImplications')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Regulatory implications must not exceed 1000 characters'),
  body('relatedRisks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Related risks must not exceed 500 characters'),
  body('lastReviewedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Last reviewed by must be a valid user ID'),
];

export const validateRiskStatus = [
  body('status')
    .isIn(['identified', 'assessed', 'mitigating', 'monitoring', 'closed', 'accepted'])
    .withMessage('Invalid status. Must be one of: identified, assessed, mitigating, monitoring, closed, accepted'),
];

export const validateSupplierEvaluation = [
  body('supplierId')
    .isInt({ min: 1 })
    .withMessage('Supplier ID is required and must be a valid integer'),
  body('evaluationNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Evaluation number is required and must not exceed 100 characters'),
  body('evaluationDate')
    .isISO8601()
    .withMessage('Evaluation date must be a valid date'),
  body('evaluationType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Evaluation type is required and must not exceed 100 characters'),
  body('qualityRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality rating is required and must be between 1 and 5'),
  body('onTimeDeliveryRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('On-time delivery rate is required and must be between 0 and 100'),
  body('complianceStatus')
    .isIn(['Compliant', 'Non-Compliant', 'Under Review', 'Not Assessed'])
    .withMessage('Invalid compliance status. Must be one of: Compliant, Non-Compliant, Under Review, Not Assessed'),
  body('evaluationStatus')
    .isIn(['draft', 'completed', 'under_review', 'approved', 'rejected'])
    .withMessage('Invalid evaluation status. Must be one of: draft, completed, under_review, approved, rejected'),
  body('evaluationPeriodStart')
    .optional()
    .isISO8601()
    .withMessage('Evaluation period start must be a valid date'),
  body('evaluationPeriodEnd')
    .optional()
    .isISO8601()
    .withMessage('Evaluation period end must be a valid date'),
  body('qualityScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quality score must be between 0 and 100'),
  body('deliveryScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Delivery score must be between 0 and 100'),
  body('communicationScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Communication score must be between 0 and 100'),
  body('technicalCapabilityScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Technical capability score must be between 0 and 100'),
  body('priceCompetitivenessScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Price competitiveness score must be between 0 and 100'),
  body('overallScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Overall score must be between 0 and 100'),
  body('overallRating')
    .optional()
    .isIn(['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unacceptable'])
    .withMessage('Invalid overall rating. Must be one of: Excellent, Good, Satisfactory, Needs Improvement, Unacceptable'),
  body('decision')
    .optional()
    .isIn(['Continue', 'Conditional Continue', 'Suspend', 'Terminate', 'Probation'])
    .withMessage('Invalid decision. Must be one of: Continue, Conditional Continue, Suspend, Terminate, Probation'),
  body('defectRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Defect rate must be between 0 and 100'),
  body('returnRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Return rate must be between 0 and 100'),
  body('leadTimeAdherence')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Lead time adherence must be between 0 and 100'),
  body('documentationAccuracy')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Documentation accuracy must be between 0 and 100'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
  body('nextEvaluationDate')
    .optional()
    .isISO8601()
    .withMessage('Next evaluation date must be a valid date'),
  body('reviewedDate')
    .optional()
    .isISO8601()
    .withMessage('Reviewed date must be a valid date'),
  body('approvedDate')
    .optional()
    .isISO8601()
    .withMessage('Approved date must be a valid date'),
];

export const validateSupplierEvaluationUpdate = [
  body('evaluationNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Evaluation number must not exceed 100 characters'),
  body('evaluationDate')
    .optional()
    .isISO8601()
    .withMessage('Evaluation date must be a valid date'),
  body('evaluationType')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Evaluation type must not exceed 100 characters'),
  body('qualityRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality rating must be between 1 and 5'),
  body('onTimeDeliveryRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('On-time delivery rate must be between 0 and 100'),
  body('complianceStatus')
    .optional()
    .isIn(['Compliant', 'Non-Compliant', 'Under Review', 'Not Assessed'])
    .withMessage('Invalid compliance status. Must be one of: Compliant, Non-Compliant, Under Review, Not Assessed'),
  body('evaluationStatus')
    .optional()
    .isIn(['draft', 'completed', 'under_review', 'approved', 'rejected'])
    .withMessage('Invalid evaluation status. Must be one of: draft, completed, under_review, approved, rejected'),
  body('qualityScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quality score must be between 0 and 100'),
  body('deliveryScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Delivery score must be between 0 and 100'),
  body('communicationScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Communication score must be between 0 and 100'),
  body('technicalCapabilityScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Technical capability score must be between 0 and 100'),
  body('priceCompetitivenessScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Price competitiveness score must be between 0 and 100'),
  body('overallScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Overall score must be between 0 and 100'),
  body('overallRating')
    .optional()
    .isIn(['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unacceptable'])
    .withMessage('Invalid overall rating. Must be one of: Excellent, Good, Satisfactory, Needs Improvement, Unacceptable'),
  body('decision')
    .optional()
    .isIn(['Continue', 'Conditional Continue', 'Suspend', 'Terminate', 'Probation'])
    .withMessage('Invalid decision. Must be one of: Continue, Conditional Continue, Suspend, Terminate, Probation'),
];

export const validateSupplierEvaluationStatus = [
  body('status')
    .isIn(['draft', 'completed', 'under_review', 'approved', 'rejected'])
    .withMessage('Invalid status. Must be one of: draft, completed, under_review, approved, rejected'),
];

export const validateImprovementIdea = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category is required and must not exceed 200 characters'),
  body('expectedImpact')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Expected impact must not exceed 2000 characters'),
  body('impactArea')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Impact area must not exceed 200 characters'),
  body('responsibleUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid responsible user ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a non-negative number'),
  body('estimatedBenefit')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Estimated benefit must not exceed 1000 characters'),
];

export const validateImprovementIdeaUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Category must not exceed 200 characters'),
  body('expectedImpact')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Expected impact must not exceed 2000 characters'),
  body('impactArea')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Impact area must not exceed 200 characters'),
  body('responsibleUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid responsible user ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  body('reviewComments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review comments must not exceed 2000 characters'),
  body('implementationNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Implementation notes must not exceed 2000 characters'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a non-negative number'),
  body('estimatedBenefit')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Estimated benefit must not exceed 1000 characters'),
];

export const validateImprovementIdeaStatus = [
  body('status')
    .isIn(['submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'implemented', 'closed'])
    .withMessage('Invalid status. Must be one of: submitted, under_review, approved, rejected, in_progress, implemented, closed'),
  body('reviewComments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review comments must not exceed 2000 characters'),
];

export const validateImprovementIdeaApproval = [
  body('reviewComments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review comments must not exceed 2000 characters'),
  body('responsibleUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Responsible user must be a valid user ID'),
  body('implementationNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Implementation notes must not exceed 2000 characters'),
];

export const validateImprovementIdeaRejection = [
  body('reviewComments')
    .notEmpty()
    .withMessage('Review comments are required when rejecting an idea')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review comments must not exceed 2000 characters'),
];

// ========================================
// Implementation Task Validators
// ========================================

export const validateImplementationTask = [
  body('improvementIdeaId')
    .isInt({ min: 1 })
    .withMessage('Valid improvement idea ID is required'),
  body('taskName')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Task name is required and must not exceed 500 characters'),
  body('taskDescription')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Task description must not exceed 2000 characters'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid status'),
  body('progressPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
];

export const validateImplementationTaskUpdate = [
  body('taskName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Task name must not exceed 500 characters'),
  body('taskDescription')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Task description must not exceed 2000 characters'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid assigned user ID'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid status'),
  body('progressPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
  body('completionEvidence')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Completion evidence must not exceed 2000 characters'),
];

export const validateImplementationTaskComplete = [
  body('completionEvidence')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Completion evidence must not exceed 2000 characters'),
];

export const validateIdParam: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter'),
];

export const validateImprovementIdeaIdParam: ValidationChain[] = [
  param('improvementIdeaId')
    .isInt({ min: 1 })
    .withMessage('Invalid improvement idea ID parameter'),
];

// Email Template Validators
export const validateEmailTemplate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Display name must be between 1 and 200 characters'),
  body('type')
    .trim()
    .isIn([
      'ncr_notification',
      'ncr_assignment',
      'ncr_status_update',
      'training_reminder',
      'training_assignment',
      'training_expiry_warning',
      'audit_assignment',
      'audit_notification',
      'audit_finding',
      'capa_assignment',
      'capa_deadline_reminder'
    ])
    .withMessage('Invalid template type'),
  body('category')
    .trim()
    .isIn(['ncr', 'training', 'audit', 'capa', 'general'])
    .withMessage('Invalid category'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Subject must be between 1 and 500 characters'),
  body('body')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Body is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('placeholders')
    .optional()
    .trim(),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isDefault')
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

export const validateEmailTemplateUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Display name must be between 1 and 200 characters'),
  body('type')
    .optional()
    .trim()
    .isIn([
      'ncr_notification',
      'ncr_assignment',
      'ncr_status_update',
      'training_reminder',
      'training_assignment',
      'training_expiry_warning',
      'audit_assignment',
      'audit_notification',
      'audit_finding',
      'capa_assignment',
      'capa_deadline_reminder'
    ])
    .withMessage('Invalid template type'),
  body('category')
    .optional()
    .trim()
    .isIn(['ncr', 'training', 'audit', 'capa', 'general'])
    .withMessage('Invalid category'),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Subject must be between 1 and 500 characters'),
  body('body')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Body must not be empty'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('placeholders')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

// SWOT Entry Validators
export const validateSwotEntry = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .isIn(['Strength', 'Weakness', 'Opportunity', 'Threat'])
    .withMessage('Category must be one of: Strength, Weakness, Opportunity, Threat'),
  body('owner')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid owner ID'),
  body('priority')
    .optional({ nullable: true })
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('reviewDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('nextReviewDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Next review date must be a valid date'),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'addressed'])
    .withMessage('Status must be one of: active, archived, addressed'),
];

// SWOT Entry Update Validator - allows null values for optional fields
export const validateSwotEntryUpdate = [
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
  body('category')
    .optional()
    .isIn(['Strength', 'Weakness', 'Opportunity', 'Threat'])
    .withMessage('Category must be one of: Strength, Weakness, Opportunity, Threat'),
  body('owner')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid owner ID'),
  body('priority')
    .optional({ nullable: true })
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('displayOrder')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('displayOrder must be a positive integer'),
  body('reviewDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Review date must be a valid date'),
  body('nextReviewDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Next review date must be a valid date'),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'addressed'])
    .withMessage('Status must be one of: active, archived, addressed'),
];

