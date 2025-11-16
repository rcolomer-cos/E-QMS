import api from './api';

export interface Equipment {
  id?: number;
  equipmentNumber: string;
  name: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  department?: string;
  status: string;
  purchaseDate?: string;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  calibrationInterval?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceInterval?: number;
  qrCode?: string;
  responsiblePerson?: number;
  responsiblePersonName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentFilters {
  status?: string;
  department?: string;
  location?: string;
}

export const getEquipment = async (filters?: EquipmentFilters): Promise<Equipment[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.department) params.append('department', filters.department);
  if (filters?.location) params.append('location', filters.location);

  const response = await api.get(`/equipment?${params.toString()}`);
  return response.data;
};

export const getEquipmentById = async (id: number): Promise<Equipment> => {
  const response = await api.get(`/equipment/${id}`);
  return response.data;
};

export const createEquipment = async (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'qrCode'>): Promise<{ equipmentId: number; qrCode: string }> => {
  const response = await api.post('/equipment', equipment);
  return response.data;
};

export const updateEquipment = async (id: number, equipment: Partial<Equipment>): Promise<void> => {
  await api.put(`/equipment/${id}`, equipment);
};

export const deleteEquipment = async (id: number): Promise<void> => {
  await api.delete(`/equipment/${id}`);
};

export const getCalibrationDue = async (days?: number): Promise<Equipment[]> => {
  const params = days ? `?days=${days}` : '';
  const response = await api.get(`/equipment/calibration-due${params}`);
  return response.data;
};
