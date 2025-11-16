export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface InitStatus {
  needsSetup: boolean;
  hasDatabase: boolean;
  hasSuperUser: boolean;
  databaseReady?: boolean;
  missingTables?: string[];
}

export interface CreateSuperUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  version: string;
  parentDocumentId?: number;
  status: string;
  ownerId?: number;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: string;
  effectiveDate?: string;
  reviewDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentRevision {
  id: number;
  documentId: number;
  version: string;
  revisionNumber: number;
  changeDescription?: string;
  changeType: 'create' | 'update' | 'approve' | 'obsolete' | 'review' | 'version';
  changeReason?: string;
  authorId: number;
  authorName?: string;
  authorFirstName?: string;
  authorLastName?: string;
  authorEmail?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  statusBefore?: string;
  statusAfter: string;
  previousRevisionId?: number;
  revisionDate?: string;
}

export interface PendingDocument extends Document {
  creatorFirstName?: string;
  creatorLastName?: string;
  creatorEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  latestRevisionNumber?: number;
  latestChangeDescription?: string;
  latestChangeType?: string;
  latestRevisionDate?: string;
  latestRevisionAuthorId?: number;
  latestRevisionAuthorFirstName?: string;
  latestRevisionAuthorLastName?: string;
}

export interface Audit {
  id: number;
  auditNumber: string;
  title: string;
  auditType: string;
  status: string;
  scheduledDate: string;
  leadAuditorId: number;
}

export interface NCR {
  id: number;
  ncrNumber: string;
  title: string;
  description: string;
  source: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  severity: 'minor' | 'major' | 'critical';
  detectedDate: string;
  reportedBy: number;
  assignedTo?: number;
  rootCause?: string;
  containmentAction?: string;
  correctiveAction?: string;
  verifiedBy?: number;
  verifiedDate?: string;
  closedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CAPA {
  id: number;
  capaNumber: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive';
  source: string;
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ncrId?: number;
  auditId?: number;
  rootCause?: string;
  proposedAction: string;
  actionOwner: number;
  actionOwnerName?: string;
  targetDate: string;
  completedDate?: string;
  effectiveness?: string;
  verifiedBy?: number;
  verifiedByName?: string;
  verifiedDate?: string;
  closedDate?: string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipment {
  id: number;
  equipmentNumber: string;
  name: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  department?: string;
  status: string;
  purchaseDate?: string;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  calibrationInterval?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceInterval?: number;
  qrCode?: string;
  responsiblePerson?: number;
  responsiblePersonName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Training {
  id: number;
  trainingNumber: string;
  title: string;
  status: string;
  scheduledDate: string;
  category: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Process {
  id: number;
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  processCategory?: string;
  objective?: string;
  scope?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessOwner {
  id: number;
  processId: number;
  ownerId: number;
  ownerName?: string;
  ownerEmail?: string;
  assignedAt?: string;
  assignedBy?: number;
  assignedByName?: string;
  isPrimaryOwner: boolean;
  active: boolean;
  notes?: string;
}

export interface AuditLogEntry {
  id: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  action: string;
  actionCategory: string;
  actionDescription?: string;
  entityType: string;
  entityId?: number;
  entityIdentifier?: string;
  oldValues?: string;
  newValues?: string;
  changedFields?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  success: boolean;
  errorMessage?: string;
  statusCode?: number;
  timestamp: string;
  sessionId?: string;
  additionalData?: string;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  actionCategory?: string;
  entityType?: string;
  entityId?: number;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
