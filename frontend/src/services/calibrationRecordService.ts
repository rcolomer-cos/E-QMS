import api from './api';

export interface CalibrationRecord {
  id?: number;
  equipmentId: number;
  equipmentName?: string;
  equipmentNumber?: string;
  calibrationDate: string;
  dueDate?: string;
  nextDueDate?: string;
  performedBy: number;
  performedByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  calibrationType?: string;
  calibrationStandard?: string;
  certificateNumber?: string;
  result: 'pending' | 'passed' | 'failed' | 'conditional';
  resultValue?: string;
  toleranceMin?: string;
  toleranceMax?: string;
  passed: boolean;
  findings?: string;
  correctiveAction?: string;
  attachments?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  externalProvider?: string;
  providerCertification?: string;
  cost?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface CalibrationRecordFilters {
  equipmentId?: number;
  status?: string;
  result?: string;
  page?: number;
  limit?: number;
}

export interface CalibrationRecordResponse {
  data: CalibrationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getCalibrationRecords = async (filters?: CalibrationRecordFilters): Promise<CalibrationRecordResponse> => {
  const params = new URLSearchParams();
  if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.result) params.append('result', filters.result);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/calibration-records?${params.toString()}`);
  return response.data;
};

export const getCalibrationRecordById = async (id: number): Promise<CalibrationRecord> => {
  const response = await api.get(`/calibration-records/${id}`);
  return response.data;
};

export const createCalibrationRecord = async (record: Omit<CalibrationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> => {
  const response = await api.post('/calibration-records', record);
  return response.data;
};

export const updateCalibrationRecord = async (id: number, record: Partial<CalibrationRecord>): Promise<void> => {
  await api.put(`/calibration-records/${id}`, record);
};

export const deleteCalibrationRecord = async (id: number): Promise<void> => {
  await api.delete(`/calibration-records/${id}`);
};
