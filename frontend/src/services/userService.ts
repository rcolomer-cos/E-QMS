import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface UpdateUserData {
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: CreateUserData): Promise<{ userId: number }> => {
  const response = await api.post<{ userId: number }>('/users', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: UpdateUserData): Promise<void> => {
  await api.put(`/users/${id}`, userData);
};

export const deactivateUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};
