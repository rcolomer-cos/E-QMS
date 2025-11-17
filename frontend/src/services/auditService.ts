import api from './api';
import { Audit } from '../types';

export const getAudits = async (filters?: {
  status?: string;
  auditType?: string;
}): Promise<Audit[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.auditType) params.append('auditType', filters.auditType);

  const response = await api.get(`/audits?${params.toString()}`);
  return response.data;
};

export const getAuditById = async (id: number): Promise<Audit> => {
  const response = await api.get(`/audits/${id}`);
  return response.data;
};

export const submitAuditForReview = async (id: number): Promise<void> => {
  await api.post(`/audits/${id}/submit-for-review`);
};

export const approveAudit = async (id: number, reviewComments?: string): Promise<void> => {
  await api.post(`/audits/${id}/approve`, { reviewComments });
};

export const rejectAudit = async (id: number, reviewComments: string): Promise<void> => {
  await api.post(`/audits/${id}/reject`, { reviewComments });
};
