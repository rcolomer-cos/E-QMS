export interface RoleRef {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string; // legacy single-role support
  roles?: RoleRef[]; // preferred: array of roles
  roleNames?: string[]; // optional convenience from backend
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
  reviewerId?: number;
  reviewedAt?: string;
  reviewComments?: string;
  completedDate?: string;
  scope?: string;
  description?: string;
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
  inspectionRecordId?: number;
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
  processType?: 'main' | 'sub' | 'support';
  parentProcessId?: number | null;
  displayOrder?: number;
  objective?: string;
  scope?: string;
  flowchartSvg?: string | null;
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

export interface AuditFinding {
  id?: number;
  findingNumber: string;
  auditId: number;
  title: string;
  description: string;
  category: string;
  severity: 'observation' | 'minor' | 'major' | 'critical';
  evidence?: string;
  rootCause?: string;
  auditCriteria?: string;
  clauseReference?: string;
  recommendations?: string;
  requiresNCR: boolean;
  ncrId?: number;
  status: 'open' | 'under_review' | 'action_planned' | 'resolved' | 'closed';
  identifiedDate: string;
  targetCloseDate?: string;
  closedDate?: string;
  identifiedBy: number;
  assignedTo?: number;
  verifiedBy?: number;
  verifiedDate?: string;
  department?: string;
  processId?: number;
  affectedArea?: string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditFindingStats {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface Risk {
  id: number;
  riskNumber: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  likelihood: number;
  impact: number;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategy?: string;
  mitigationActions?: string;
  contingencyPlan?: string;
  riskOwner: number;
  riskOwnerName?: string;
  department?: string;
  process?: string;
  status: 'identified' | 'assessed' | 'mitigating' | 'monitoring' | 'closed' | 'accepted';
  identifiedDate: string;
  reviewDate?: string;
  nextReviewDate?: string;
  reviewFrequency?: number;
  closedDate?: string;
  residualLikelihood?: number;
  residualImpact?: number;
  residualRiskScore?: number;
  affectedStakeholders?: string;
  regulatoryImplications?: string;
  relatedRisks?: string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
  lastReviewedBy?: number;
}

export interface RiskStatistics {
  totalRisks: number;
  byStatus: Record<string, number>;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface ImprovementIdea {
  id?: number;
  ideaNumber: string;
  title: string;
  description: string;
  category: string;
  expectedImpact?: string;
  impactArea?: string;
  submittedBy: number;
  submitterFirstName?: string;
  submitterLastName?: string;
  submitterEmail?: string;
  responsibleUser?: number;
  responsibleFirstName?: string;
  responsibleLastName?: string;
  responsibleEmail?: string;
  department?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'implemented' | 'closed';
  submittedDate: string;
  reviewedDate?: string;
  implementedDate?: string;
  reviewComments?: string;
  reviewedBy?: number;
  reviewerFirstName?: string;
  reviewerLastName?: string;
  reviewerEmail?: string;
  implementationNotes?: string;
  estimatedCost?: number;
  estimatedBenefit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImprovementIdeaStatistics {
  totalIdeas: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  inProgress: number;
  implemented: number;
  closed: number;
  byCategory: Record<string, number>;
  byImpactArea: Record<string, number>;
  byDepartment: Record<string, number>;
}
