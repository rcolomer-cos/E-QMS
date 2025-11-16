import api from './api';
import { Process } from '../types';

export interface CreateProcessData {
  name: string;
  code: string;
  description?: string;
  departmentId?: number;
  processCategory?: string;
  objective?: string;
  scope?: string;
}

export interface UpdateProcessData {
  name?: string;
  code?: string;
  description?: string;
  departmentId?: number;
  processCategory?: string;
  objective?: string;
  scope?: string;
}

/**
 * Get all processes
 */
export const getProcesses = async (): Promise<Process[]> => {
  const response = await api.get<Process[]>('/processes');
  return response.data;
};

/**
 * Get process by ID
 */
export const getProcessById = async (id: number): Promise<Process> => {
  const response = await api.get<Process>(`/processes/${id}`);
  return response.data;
};

/**
 * Create a new process
 */
export const createProcess = async (data: CreateProcessData): Promise<{ processId: number }> => {
  const response = await api.post<{ processId: number }>('/processes', data);
  return response.data;
};

/**
 * Update process
 */
export const updateProcess = async (id: number, data: UpdateProcessData): Promise<void> => {
  await api.put(`/processes/${id}`, data);
};

/**
 * Delete (deactivate) process
 */
export const deleteProcess = async (id: number): Promise<void> => {
  await api.delete(`/processes/${id}`);
};
