import api from './api';

export interface UserDepartmentAssignment {
  id: number;
  userId: number;
  departmentId: number;
  isPrimary: boolean;
  assignedBy: number;
  assignedAt: string;
  active: boolean;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  departmentCode?: string;
  assignedByName?: string;
}

export interface CreateUserDepartmentData {
  userId: number;
  departmentId: number;
  isPrimary?: boolean;
}

export interface UpdateUserDepartmentData {
  isPrimary?: boolean;
}

/**
 * Get all user-department assignments
 */
export const getUserDepartments = async (): Promise<UserDepartmentAssignment[]> => {
  const response = await api.get<UserDepartmentAssignment[]>('/user-departments');
  return response.data;
};

/**
 * Get assignments for a specific user
 */
export const getUserDepartmentsByUserId = async (userId: number): Promise<UserDepartmentAssignment[]> => {
  const response = await api.get<UserDepartmentAssignment[]>(`/user-departments/user/${userId}`);
  return response.data;
};

/**
 * Get assignments for a specific department
 */
export const getUserDepartmentsByDepartmentId = async (departmentId: number): Promise<UserDepartmentAssignment[]> => {
  const response = await api.get<UserDepartmentAssignment[]>(`/user-departments/department/${departmentId}`);
  return response.data;
};

/**
 * Get assignment by ID
 */
export const getUserDepartmentById = async (id: number): Promise<UserDepartmentAssignment> => {
  const response = await api.get<UserDepartmentAssignment>(`/user-departments/${id}`);
  return response.data;
};

/**
 * Create a new user-department assignment
 */
export const createUserDepartment = async (data: CreateUserDepartmentData): Promise<{ assignmentId: number }> => {
  const response = await api.post<{ assignmentId: number }>('/user-departments', data);
  return response.data;
};

/**
 * Update user-department assignment
 */
export const updateUserDepartment = async (id: number, data: UpdateUserDepartmentData): Promise<void> => {
  await api.put(`/user-departments/${id}`, data);
};

/**
 * Delete (deactivate) user-department assignment
 */
export const deleteUserDepartment = async (id: number): Promise<void> => {
  await api.delete(`/user-departments/${id}`);
};

/**
 * Set assignment as primary department
 */
export const setPrimaryDepartment = async (id: number): Promise<void> => {
  await api.patch(`/user-departments/${id}/primary`);
};
