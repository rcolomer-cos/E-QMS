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
    .isLength({ min: 1, max: 200 })
    .withMessage('Source is required and must not exceed 200 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required and must not exceed 100 characters'),
  body('status')
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status'),
  body('severity')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Severity is required and must not exceed 50 characters'),
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
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'rejected'])
    .withMessage('Invalid status'),
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

