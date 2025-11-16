import api from './api';
import { NCR } from '../types';

export interface CreateNCRData {
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
}

export interface UpdateNCRData {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  assignedTo?: number;
  rootCause?: string;
  containmentAction?: string;
  correctiveAction?: string;
}

export interface NCRListResponse {
  data: NCR[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NCRFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
}

/**
 * Get all NCRs with optional filtering
 */
export const getNCRs = async (filters?: NCRFilters): Promise<NCRListResponse> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.severity) params.append('severity', filters.severity);

  const response = await api.get<NCRListResponse>(`/ncrs?${params.toString()}`);
  return response.data;
};

/**
 * Get NCR by ID
 */
export const getNCRById = async (id: number): Promise<NCR> => {
  const response = await api.get<NCR>(`/ncrs/${id}`);
  return response.data;
};

/**
 * Create a new NCR
 */
export const createNCR = async (data: CreateNCRData): Promise<{ message: string; id: number }> => {
  const response = await api.post<{ message: string; id: number }>('/ncrs', data);
  return response.data;
};

/**
 * Update an existing NCR
 */
export const updateNCR = async (id: number, data: UpdateNCRData): Promise<void> => {
  await api.put(`/ncrs/${id}`, data);
};

/**
 * Update NCR status
 */
export const updateNCRStatus = async (
  id: number,
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected'
): Promise<void> => {
  await api.put(`/ncrs/${id}/status`, { status });
};

/**
 * Assign NCR to a user
 */
export const assignNCR = async (id: number, assignedTo: number): Promise<void> => {
  await api.put(`/ncrs/${id}/assign`, { assignedTo });
};

/**
 * Delete an NCR (Admin only)
 */
export const deleteNCR = async (id: number): Promise<void> => {
  await api.delete(`/ncrs/${id}`);
};
