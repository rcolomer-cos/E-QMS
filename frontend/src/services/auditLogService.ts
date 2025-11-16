import api from './api';
import { AuditLogEntry, AuditLogFilters, AuditLogResponse } from '../types';

/**
 * Get all audit logs with optional filters
 */
export const getAuditLogs = async (filters?: AuditLogFilters): Promise<AuditLogResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.userId) params.append('userId', filters.userId.toString());
  if (filters?.action) params.append('action', filters.action);
  if (filters?.actionCategory) params.append('actionCategory', filters.actionCategory);
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.entityId) params.append('entityId', filters.entityId.toString());
  if (filters?.success !== undefined) params.append('success', filters.success.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const response = await api.get(`/audit-logs?${params.toString()}`);
  return response.data;
};

/**
 * Get a specific audit log by ID
 */
export const getAuditLogById = async (id: number): Promise<AuditLogEntry> => {
  const response = await api.get(`/audit-logs/${id}`);
  return response.data;
};

/**
 * Get audit trail for a specific entity
 */
export const getEntityAuditTrail = async (
  entityType: string,
  entityId: number,
  limit?: number
): Promise<{ entityType: string; entityId: number; auditTrail: AuditLogEntry[] }> => {
  const params = limit ? `?limit=${limit}` : '';
  const response = await api.get(`/audit-logs/entity/${entityType}/${entityId}${params}`);
  return response.data;
};

/**
 * Get activity logs for a specific user
 */
export const getUserActivity = async (
  userId: number,
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<{ userId: number; activity: AuditLogEntry[] }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (limit) params.append('limit', limit.toString());

  const response = await api.get(`/audit-logs/user/${userId}?${params.toString()}`);
  return response.data;
};

/**
 * Get failed actions for security monitoring
 */
export const getFailedActions = async (
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<{ failedActions: AuditLogEntry[]; count: number }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (limit) params.append('limit', limit.toString());

  const response = await api.get(`/audit-logs/security/failed-actions?${params.toString()}`);
  return response.data;
};

/**
 * Get audit statistics summary
 */
export const getAuditStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<{ statistics: Record<string, unknown> }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get(`/audit-logs/statistics/summary?${params.toString()}`);
  return response.data;
};
