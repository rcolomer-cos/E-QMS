import api from './api';
import { User } from '../types';

// Re-export User type for convenience
export type { User } from '../types';

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
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  console.log('Calling getCurrentUser, baseURL:', api.defaults.baseURL);
  const response = await api.get<User>('/users/me');
  console.log('getCurrentUser response:', response.data);
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

/**
 * Create a new user
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  phone?: string;
  roleIds: number[];
  groupIds?: number[];
}

export interface CreateUserResponse {
  message: string;
  userId: number;
  email: string;
  password: string;
}

export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
  const response = await api.post<CreateUserResponse>('/users', userData);
  return response.data;
};

/**
 * Generate a friendly password
 */
export const generatePassword = async (): Promise<string> => {
  const response = await api.get<{ password: string }>('/users/generate-password-single');
  return response.data.password;
};

/**
 * Get all available roles
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  level: number;
  active: boolean;
}

export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get<Role[]>('/users/roles');
  return response.data;
};
