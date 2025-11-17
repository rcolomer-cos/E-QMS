import { Request } from 'express';
import { Document } from '../models/DocumentModel';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[]; // Array of role names
    roleIds: number[]; // Array of role IDs
  };
  document?: Document; // Populated by permission middleware
}

export enum UserRole {
  SUPERUSER = 'superuser',
  ADMIN = 'admin',
  MANAGER = 'manager',
  AUDITOR = 'auditor',
  USER = 'user',
  VIEWER = 'viewer',
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  id: number;
  userId: number;
  roleId: number;
  assignedAt: Date;
  assignedBy?: number;
  expiresAt?: Date;
  active: boolean;
  notes?: string;
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  OBSOLETE = 'obsolete',
}

export enum AuditStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum NCRStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum CAPAStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CLOSED = 'closed',
}

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  CALIBRATION_DUE = 'calibration_due',
}

export enum TrainingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CalibrationResult {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum CalibrationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InspectionResult {
  PENDING = 'pending',
  PASSED = 'passed',
  PASSED_WITH_OBSERVATIONS = 'passed_with_observations',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InspectionSeverity {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum ServiceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
  EMERGENCY = 'emergency',
  BREAKDOWN = 'breakdown',
  ROUTINE = 'routine',
  UPGRADE = 'upgrade',
  INSTALLATION = 'installation',
  DECOMMISSION = 'decommission',
}

export enum ServicePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum ServiceOutcome {
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled',
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  FAILED = 'failed',
}

export enum ServiceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum CompetencyStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  DRAFT = 'draft',
  OBSOLETE = 'obsolete',
}

export enum UserCompetencyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  PENDING = 'pending',
}
