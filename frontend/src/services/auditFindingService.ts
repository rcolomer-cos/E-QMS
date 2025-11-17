import api from './api';
import { AuditFinding, AuditFindingStats } from '../types';

export const createAuditFinding = async (finding: Partial<AuditFinding>): Promise<{ findingId: number }> => {
  const response = await api.post('/audit-findings', finding);
  return response.data;
};

export const getAuditFindings = async (filters?: {
  status?: string;
  severity?: string;
  auditId?: number;
  assignedTo?: number;
  category?: string;
}): Promise<AuditFinding[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.auditId) params.append('auditId', filters.auditId.toString());
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
  if (filters?.category) params.append('category', filters.category);

  const response = await api.get(`/audit-findings?${params.toString()}`);
  return response.data;
};

export const getAuditFindingById = async (id: number): Promise<AuditFinding> => {
  const response = await api.get(`/audit-findings/${id}`);
  return response.data;
};

export const getAuditFindingsByAuditId = async (auditId: number): Promise<AuditFinding[]> => {
  const response = await api.get(`/audit-findings/audit/${auditId}`);
  return response.data;
};

export const updateAuditFinding = async (id: number, updates: Partial<AuditFinding>): Promise<void> => {
  await api.put(`/audit-findings/${id}`, updates);
};

export const deleteAuditFinding = async (id: number): Promise<void> => {
  await api.delete(`/audit-findings/${id}`);
};

export const linkFindingToNCR = async (findingId: number, ncrId: number): Promise<void> => {
  await api.post(`/audit-findings/${findingId}/link-ncr`, { ncrId });
};

export const getAuditFindingStats = async (auditId: number): Promise<AuditFindingStats> => {
  const response = await api.get(`/audit-findings/audit/${auditId}/stats`);
  return response.data;
};
