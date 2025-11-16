import api from './api';

export interface ServiceMaintenanceRecord {
  id?: number;
  equipmentId: number;
  equipmentName?: string;
  equipmentNumber?: string;
  serviceDate: string;
  dueDate?: string;
  nextDueDate?: string;
  performedBy: number;
  performedByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  serviceType: 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'breakdown' | 'routine' | 'upgrade' | 'installation' | 'decommission';
  workOrderNumber?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  description: string;
  workPerformed?: string;
  hoursSpent?: number;
  partsUsed?: string;
  partsReplaced?: string;
  materialsCost?: number;
  laborCost?: number;
  totalCost?: number;
  externalProvider?: string;
  providerContact?: string;
  invoiceNumber?: string;
  outcome: 'completed' | 'partially_completed' | 'failed' | 'deferred' | 'cancelled';
  equipmentCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  issuesResolved?: boolean;
  problemsIdentified?: string;
  rootCause?: string;
  preventiveActions?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  recommendations?: string;
  functionalTestPerformed?: boolean;
  testResults?: string;
  downtimeStart?: string;
  downtimeEnd?: string;
  downtimeHours?: number;
  attachments?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled' | 'on_hold';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface ServiceRecordFilters {
  equipmentId?: number;
  status?: string;
  serviceType?: string;
  page?: number;
  limit?: number;
}

export interface ServiceRecordResponse {
  data: ServiceMaintenanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getServiceRecords = async (filters?: ServiceRecordFilters): Promise<ServiceRecordResponse> => {
  const params = new URLSearchParams();
  if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.serviceType) params.append('serviceType', filters.serviceType);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/service-maintenance-records?${params.toString()}`);
  return response.data;
};

export const getServiceRecordById = async (id: number): Promise<ServiceMaintenanceRecord> => {
  const response = await api.get(`/service-maintenance-records/${id}`);
  return response.data;
};

export const createServiceRecord = async (record: Omit<ServiceMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> => {
  const response = await api.post('/service-maintenance-records', record);
  return response.data;
};

export const updateServiceRecord = async (id: number, record: Partial<ServiceMaintenanceRecord>): Promise<void> => {
  await api.put(`/service-maintenance-records/${id}`, record);
};

export const deleteServiceRecord = async (id: number): Promise<void> => {
  await api.delete(`/service-maintenance-records/${id}`);
};
