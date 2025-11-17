import api from './api';

export interface InspectionPlan {
  id?: number;
  planNumber: string;
  planName: string;
  description?: string;
  equipmentId: number;
  equipmentName?: string;
  equipmentNumber?: string;
  inspectionType: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  planType: 'recurring' | 'one_time';
  frequency?: string;
  frequencyInterval?: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  lastInspectionDate?: string;
  reminderDays?: number;
  responsibleInspectorId: number;
  responsibleInspectorName?: string;
  backupInspectorId?: number;
  backupInspectorName?: string;
  checklistReference?: string;
  inspectionStandard?: string;
  requiredCompetencies?: string;
  estimatedDuration?: number;
  requiredTools?: string;
  status: 'active' | 'inactive' | 'on_hold' | 'completed' | 'cancelled';
  regulatoryRequirement?: boolean;
  complianceReference?: string;
  autoSchedule?: boolean;
  notifyOnOverdue?: boolean;
  escalationDays?: number;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  safetyRelated?: boolean;
  qualityImpact?: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
  daysOverdue?: number;
}

export interface InspectionPlanFilters {
  equipmentId?: number;
  inspectionType?: string;
  status?: string;
  priority?: string;
  responsibleInspectorId?: number;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}

export interface InspectionPlanResponse {
  data: InspectionPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getInspectionPlans = async (filters?: InspectionPlanFilters): Promise<InspectionPlanResponse> => {
  const params = new URLSearchParams();
  if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId.toString());
  if (filters?.inspectionType) params.append('inspectionType', filters.inspectionType);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.responsibleInspectorId) params.append('responsibleInspectorId', filters.responsibleInspectorId.toString());
  if (filters?.overdue !== undefined) params.append('overdue', filters.overdue.toString());
  if (filters?.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
  if (filters?.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/inspection-plans?${params.toString()}`);
  return response.data;
};

export const getInspectionPlanById = async (id: number): Promise<InspectionPlan> => {
  const response = await api.get(`/inspection-plans/${id}`);
  return response.data;
};

export const getInspectionPlanByPlanNumber = async (planNumber: string): Promise<InspectionPlan> => {
  const response = await api.get(`/inspection-plans/plan-number/${planNumber}`);
  return response.data;
};

export const createInspectionPlan = async (plan: Omit<InspectionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> => {
  const response = await api.post('/inspection-plans', plan);
  return response.data;
};

export const updateInspectionPlan = async (id: number, plan: Partial<InspectionPlan>): Promise<void> => {
  await api.put(`/inspection-plans/${id}`, plan);
};

export const deleteInspectionPlan = async (id: number): Promise<void> => {
  await api.delete(`/inspection-plans/${id}`);
};

export const getUpcomingInspections = async (daysAhead?: number): Promise<InspectionPlan[]> => {
  const params = daysAhead ? `?daysAhead=${daysAhead}` : '';
  const response = await api.get(`/inspection-plans/upcoming${params}`);
  return response.data;
};

export const getOverdueInspections = async (): Promise<InspectionPlan[]> => {
  const response = await api.get('/inspection-plans/overdue');
  return response.data;
};

export const getInspectionsByInspector = async (inspectorId: number): Promise<InspectionPlan[]> => {
  const response = await api.get(`/inspection-plans/inspector/${inspectorId}`);
  return response.data;
};

export const getInspectionTypes = async (): Promise<string[]> => {
  const response = await api.get('/inspection-plans/types');
  return response.data;
};
