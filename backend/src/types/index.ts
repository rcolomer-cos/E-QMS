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
