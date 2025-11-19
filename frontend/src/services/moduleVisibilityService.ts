import api from './api';

export interface ModuleVisibility {
  id?: number;
  moduleKey: string;
  moduleName: string;
  description?: string;
  isEnabled: boolean;
  icon?: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all module visibility settings (Admin only)
 */
export const getAllModules = async (): Promise<ModuleVisibility[]> => {
  const response = await api.get('/modules');
  return response.data;
};

/**
 * Get enabled modules (admins get all, others get enabled only)
 */
export const getEnabledModules = async (): Promise<ModuleVisibility[]> => {
  const response = await api.get('/modules/enabled');
  return response.data;
};

/**
 * Get a specific module by key
 */
export const getModuleByKey = async (key: string): Promise<ModuleVisibility> => {
  const response = await api.get(`/modules/${key}`);
  return response.data;
};

/**
 * Update module visibility
 */
export const updateModuleVisibility = async (
  key: string,
  isEnabled: boolean
): Promise<{ message: string; module: ModuleVisibility }> => {
  const response = await api.put(`/modules/${key}`, { isEnabled });
  return response.data;
};

/**
 * Batch update module visibility
 */
export const batchUpdateModules = async (
  modules: { key: string; isEnabled: boolean }[]
): Promise<{ message: string; updatedCount: number }> => {
  const response = await api.post('/modules/batch', { modules });
  return response.data;
};
