import api from './api';

export interface RoleTrainingRequirement {
  id?: number;
  roleId: number;
  competencyId: number;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
  gracePeriodDays?: number;
  complianceDeadline?: string;
  minimumProficiencyLevel?: string;
  refreshFrequencyMonths?: number;
  status: 'active' | 'inactive' | 'deprecated';
  effectiveDate?: string;
  endDate?: string;
  justification?: string;
  regulatoryReference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  roleName?: string;
  roleDisplayName?: string;
  competencyCode?: string;
  competencyName?: string;
  competencyCategory?: string;
  competencyHasExpiry?: boolean;
  competencyDefaultValidityMonths?: number;
}

export interface MissingCompetency {
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleName: string;
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: string;
  gracePeriodDays?: number;
  complianceDeadline?: string;
  status: 'missing' | 'expired' | 'expiring_soon';
  daysUntilExpiry?: number;
}

/**
 * Create a new role training requirement
 */
export const createRoleTrainingRequirement = async (
  data: Omit<RoleTrainingRequirement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<{ message: string; id: number }> => {
  const response = await api.post('/role-training-requirements', data);
  return response.data;
};

/**
 * Get all role training requirements with optional filters
 */
export const getRoleTrainingRequirements = async (filters?: {
  roleId?: number;
  competencyId?: number;
  status?: string;
  isMandatory?: boolean;
  isRegulatory?: boolean;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: RoleTrainingRequirement[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const response = await api.get('/role-training-requirements', { params: filters });
  return response.data;
};

/**
 * Get a specific role training requirement by ID
 */
export const getRoleTrainingRequirementById = async (
  id: number
): Promise<RoleTrainingRequirement> => {
  const response = await api.get(`/role-training-requirements/${id}`);
  return response.data;
};

/**
 * Get all competencies required for a specific role
 */
export const getRequiredCompetenciesForRole = async (
  roleId: number,
  includeInactive = false
): Promise<{ data: RoleTrainingRequirement[]; total: number }> => {
  const response = await api.get(
    `/role-training-requirements/roles/${roleId}/competencies`,
    { params: { includeInactive } }
  );
  return response.data;
};

/**
 * Get missing or outdated competencies for a user
 */
export const getMissingCompetenciesForUser = async (
  userId: number,
  daysThreshold = 30
): Promise<{ data: MissingCompetency[]; total: number }> => {
  const response = await api.get(
    `/role-training-requirements/users/${userId}/missing`,
    { params: { daysThreshold } }
  );
  return response.data;
};

/**
 * Get all users with missing competencies (compliance gap report)
 */
export const getUsersWithMissingCompetencies = async (filters?: {
  roleId?: number;
  competencyId?: number;
  page?: number;
  limit?: number;
}): Promise<{
  data: MissingCompetency[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const response = await api.get('/role-training-requirements/compliance/gaps', {
    params: filters,
  });
  return response.data;
};

/**
 * Update a role training requirement
 */
export const updateRoleTrainingRequirement = async (
  id: number,
  updates: Partial<RoleTrainingRequirement>
): Promise<{ message: string }> => {
  const response = await api.put(`/role-training-requirements/${id}`, updates);
  return response.data;
};

/**
 * Delete (soft delete) a role training requirement
 */
export const deleteRoleTrainingRequirement = async (
  id: number
): Promise<{ message: string }> => {
  const response = await api.delete(`/role-training-requirements/${id}`);
  return response.data;
};
