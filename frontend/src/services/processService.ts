import api from './api';
import { Process, ProcessOwner } from '../types';

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

export interface AssignProcessOwnerData {
  ownerId: number;
  isPrimaryOwner?: boolean;
  notes?: string;
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

/**
 * Get all owners for a process
 */
export const getProcessOwners = async (processId: number): Promise<ProcessOwner[]> => {
  const response = await api.get<ProcessOwner[]>(`/processes/${processId}/owners`);
  return response.data;
};

/**
 * Assign an owner to a process
 */
export const assignProcessOwner = async (
  processId: number,
  data: AssignProcessOwnerData
): Promise<{ ownershipId: number }> => {
  const response = await api.post<{ ownershipId: number }>(`/processes/${processId}/owners`, data);
  return response.data;
};

/**
 * Remove an owner from a process
 */
export const removeProcessOwner = async (processId: number, ownerId: number): Promise<void> => {
  await api.delete(`/processes/${processId}/owners/${ownerId}`);
};
