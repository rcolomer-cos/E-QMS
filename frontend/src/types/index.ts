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
  status: string;
  severity: string;
  detectedDate: string;
}

export interface CAPA {
  id: number;
  capaNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  targetDate: string;
}

export interface Equipment {
  id: number;
  equipmentNumber: string;
  name: string;
  status: string;
  location: string;
  nextCalibrationDate?: string;
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
