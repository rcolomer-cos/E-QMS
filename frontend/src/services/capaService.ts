import api from './api';

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

export interface CreateCAPAData {
  capaNumber: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive';
  source: string;
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ncrId?: number;
  auditId?: number;
  proposedAction: string;
  actionOwner: number;
  targetDate: string;
  createdBy: number;
}

export interface UpdateCAPAData {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  proposedAction?: string;
  rootCause?: string;
  effectiveness?: string;
}

export interface CAPAListResponse {
  data: CAPA[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CAPAFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface AssignCAPAData {
  actionOwner: number;
  targetDate?: string;
}

export interface CompleteCAPAData {
  rootCause?: string;
  proposedAction?: string;
}

export interface VerifyCAPAData {
  effectiveness: string;
}

export interface CAPAStatusUpdateData {
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  notes?: string;
}

/**
 * Get all CAPAs with optional filtering
 */
export const getCAPAs = async (filters?: CAPAFilters): Promise<CAPAListResponse> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);

  const response = await api.get<CAPAListResponse>(`/capas?${params.toString()}`);
  return response.data;
};

/**
 * Get CAPA by ID
 */
export const getCAPAById = async (id: number): Promise<CAPA> => {
  const response = await api.get<CAPA>(`/capas/${id}`);
  return response.data;
};

/**
 * Create a new CAPA
 */
export const createCAPA = async (data: CreateCAPAData): Promise<{ message: string; id: number }> => {
  const response = await api.post<{ message: string; id: number }>('/capas', data);
  return response.data;
};

/**
 * Update an existing CAPA
 */
export const updateCAPA = async (id: number, data: UpdateCAPAData): Promise<void> => {
  await api.put(`/capas/${id}`, data);
};

/**
 * Delete a CAPA (Admin only)
 */
export const deleteCAPA = async (id: number): Promise<void> => {
  await api.delete(`/capas/${id}`);
};

/**
 * Assign CAPA to a user
 */
export const assignCAPA = async (id: number, data: AssignCAPAData): Promise<void> => {
  await api.post(`/capas/${id}/assign`, data);
};

/**
 * Update CAPA status
 */
export const updateCAPAStatus = async (id: number, data: CAPAStatusUpdateData): Promise<void> => {
  await api.put(`/capas/${id}/status`, data);
};

/**
 * Complete a CAPA
 */
export const completeCAPA = async (id: number, data: CompleteCAPAData): Promise<void> => {
  await api.post(`/capas/${id}/complete`, data);
};

/**
 * Verify CAPA effectiveness
 */
export const verifyCAPA = async (id: number, data: VerifyCAPAData): Promise<void> => {
  await api.post(`/capas/${id}/verify`, data);
};

/**
 * Get CAPAs assigned to the current user
 */
export const getCAPAsAssignedToMe = async (): Promise<{ data: CAPA[] }> => {
  const response = await api.get<{ data: CAPA[] }>('/capas/assigned-to-me');
  return response.data;
};

/**
 * Get overdue CAPAs
 */
export const getOverdueCAPAs = async (): Promise<{ data: CAPA[] }> => {
  const response = await api.get<{ data: CAPA[] }>('/capas/overdue');
  return response.data;
};

export interface CAPADashboardStats {
  totalOpen: number;
  totalInProgress: number;
  totalCompleted: number;
  totalVerified: number;
  totalClosed: number;
  totalOverdue: number;
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
}

/**
 * Get CAPA dashboard statistics
 */
export const getCAPADashboardStats = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<CAPADashboardStats> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const response = await api.get<CAPADashboardStats>(`/capas/dashboard/stats?${params.toString()}`);
  return response.data;
};

/**
 * Get CAPAs linked to a specific NCR
 */
export const getCAPAsByNCRId = async (ncrId: number): Promise<CAPA[]> => {
  const response = await api.get<{ data: CAPA[] }>(`/capas?ncrId=${ncrId}`);
  return response.data.data || response.data;
};
