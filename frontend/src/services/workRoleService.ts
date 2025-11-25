import api from './api';

export interface WorkRole {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
  category?: string;
  level?: string;
  status: string;
  displayOrder?: number;
  active?: boolean;
  responsibilitiesAndAuthorities?: string;
  requiredQualifications?: string;
  experienceYears?: number;
  notes?: string;
  attachmentPath?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: number;
  updatedBy?: number;
  createdByName?: string;
  updatedByName?: string;
}

export interface WorkRoleFilters {
  status?: string;
  category?: string;
  level?: string;
  departmentId?: number;
  active?: boolean;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface WorkRolesResponse {
  workRoles: WorkRole[];
  total: number;
}

export interface CategoriesResponse {
  categories: string[];
}

export interface LevelsResponse {
  levels: string[];
}

export interface StatisticsResponse {
  statistics: {
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    archivedRoles: number;
    totalCategories: number;
    departmentsWithRoles: number;
  };
}

/**
 * Get all work roles with optional filtering and sorting
 */
export const getWorkRoles = async (filters?: WorkRoleFilters): Promise<WorkRolesResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const response = await api.get(`/work-roles?${params.toString()}`);
  return response.data;
};

/**
 * Get a work role by ID
 */
export const getWorkRoleById = async (id: number): Promise<WorkRole> => {
  const response = await api.get(`/work-roles/${id}`);
  return response.data.workRole;
};

/**
 * Create a new work role
 */
export const createWorkRole = async (workRole: Omit<WorkRole, 'id' | 'createdBy'>): Promise<WorkRole> => {
  const response = await api.post('/work-roles', workRole);
  return response.data.workRole;
};

/**
 * Update an existing work role
 */
export const updateWorkRole = async (id: number, workRole: Partial<WorkRole>): Promise<WorkRole> => {
  const response = await api.put(`/work-roles/${id}`, workRole);
  return response.data.workRole;
};

/**
 * Delete a work role (soft delete)
 */
export const deleteWorkRole = async (id: number): Promise<void> => {
  await api.delete(`/work-roles/${id}`);
};

/**
 * Get unique categories
 */
export const getCategories = async (): Promise<string[]> => {
  const response = await api.get<CategoriesResponse>('/work-roles/categories');
  return response.data.categories;
};

/**
 * Get unique levels
 */
export const getLevels = async (): Promise<string[]> => {
  const response = await api.get<LevelsResponse>('/work-roles/levels');
  return response.data.levels;
};

/**
 * Get work roles by department
 */
export const getWorkRolesByDepartment = async (departmentId: number): Promise<WorkRolesResponse> => {
  const response = await api.get(`/work-roles/department/${departmentId}`);
  return response.data;
};

/**
 * Get work roles statistics
 */
export const getStatistics = async (): Promise<StatisticsResponse['statistics']> => {
  const response = await api.get<StatisticsResponse>('/work-roles/statistics');
  return response.data.statistics;
};
