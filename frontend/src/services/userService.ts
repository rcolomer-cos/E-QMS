import api from './api';
import { User } from '../types';

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  role?: string;
}

export interface PasswordChange {
  currentPassword?: string;
  newPassword: string;
}

/**
 * Get all users (Admin only)
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (id: number, updates: UserUpdate): Promise<void> => {
  await api.put(`/users/${id}`, updates);
};

/**
 * Delete (deactivate) user (Admin only)
 */
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (id: number, role: string): Promise<void> => {
  await api.put(`/users/${id}/role`, { role });
};

/**
 * Change password
 */
export const changePassword = async (id: number, passwordData: PasswordChange): Promise<void> => {
  await api.put(`/users/${id}/password`, passwordData);
};
