import api from './api';
import { Department } from '../types';

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  managerId?: number;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string;
  managerId?: number;
}

/**
 * Get all departments
 */
export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>('/departments');
  return response.data;
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await api.get<Department>(`/departments/${id}`);
  return response.data;
};

/**
 * Create a new department
 */
export const createDepartment = async (data: CreateDepartmentData): Promise<{ departmentId: number }> => {
  const response = await api.post<{ departmentId: number }>('/departments', data);
  return response.data;
};

/**
 * Update department
 */
export const updateDepartment = async (id: number, data: UpdateDepartmentData): Promise<void> => {
  await api.put(`/departments/${id}`, data);
};

/**
 * Delete (deactivate) department
 */
export const deleteDepartment = async (id: number): Promise<void> => {
  await api.delete(`/departments/${id}`);
};

/**
 * Get organizational chart flow data (single JSON blob)
 */
export const getOrgChartData = async (): Promise<{ orgChartData: string | null }> => {
  const response = await api.get<{ orgChartData: string | null }>(`/departments/orgchart/data`);
  return response.data;
};

/**
 * Update organizational chart flow data
 */
export const updateOrgChartData = async (orgChartData: string): Promise<void> => {
  await api.put(`/departments/orgchart/data`, { orgChartData });
};
