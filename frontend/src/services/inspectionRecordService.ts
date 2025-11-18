import api from './api';

export interface InspectionRecord {
  id?: number;
  equipmentId: number;
  equipmentName?: string;
  equipmentNumber?: string;
  inspectionDate: string;
  dueDate?: string;
  nextDueDate?: string;
  inspectedBy: number;
  inspectedByName?: string;
  reviewedBy?: number;
  reviewedByName?: string;
  inspectionType: string;
  inspectionChecklist?: string;
  result: 'pending' | 'passed' | 'passed_with_observations' | 'failed' | 'conditional';
  findings?: string;
  defectsFound?: string;
  passed: boolean;
  safetyCompliant?: boolean;
  operationalCompliant?: boolean;
  measurementsTaken?: string;
  parameters?: string;
  correctiveAction?: string;
  recommendedAction?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  attachments?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  severity?: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  duration?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface InspectionRecordFilters {
  equipmentId?: number;
  status?: string;
  result?: string;
  inspectionType?: string;
  page?: number;
  limit?: number;
}

export interface InspectionRecordResponse {
  data: InspectionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getInspectionRecords = async (filters?: InspectionRecordFilters): Promise<InspectionRecordResponse> => {
  const params = new URLSearchParams();
  if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.result) params.append('result', filters.result);
  if (filters?.inspectionType) params.append('inspectionType', filters.inspectionType);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/inspection-records?${params.toString()}`);
  return response.data;
};

export const getInspectionRecordById = async (id: number): Promise<InspectionRecord> => {
  const response = await api.get(`/inspection-records/${id}`);
  return response.data;
};

export const createInspectionRecord = async (record: Omit<InspectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> => {
  const response = await api.post('/inspection-records', record);
  return response.data;
};

export const updateInspectionRecord = async (id: number, record: Partial<InspectionRecord>): Promise<void> => {
  await api.put(`/inspection-records/${id}`, record);
};

export const deleteInspectionRecord = async (id: number): Promise<void> => {
  await api.delete(`/inspection-records/${id}`);
};

export interface CreateNCRFromInspectionData {
  title?: string;
  description?: string;
  source?: string;
  category?: string;
  severity?: string;
  assignedTo?: number;
}

export const createNCRFromInspection = async (
  inspectionRecordId: number, 
  data?: CreateNCRFromInspectionData
): Promise<{ id: number; ncrNumber: string; message: string }> => {
  const response = await api.post(`/inspection-records/${inspectionRecordId}/create-ncr`, data || {});
  return response.data;
};
