import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface UserWorkRole {
  id?: number;
  userId: number;
  workRoleId: number;
  skillLevelId?: number;
  assignedDate: Date | string;
  effectiveDate: Date | string;
  expiryDate?: Date | string;
  status: string;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: Date | string;
  verificationNotes?: string;
  notes?: string;
  trainingRequired: boolean;
  trainingCompleted: boolean;
  trainingCompletedDate?: Date | string;
  certificationRequired: boolean;
  certificationId?: number;
  lastAssessmentDate?: Date | string;
  lastAssessmentScore?: number;
  lastAssessedBy?: number;
  nextAssessmentDate?: Date | string;
  assignedBy: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  updatedBy?: number;
  active: boolean;
}

export interface UserWorkRoleWithDetails extends UserWorkRole {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userDepartment?: string;
  workRoleCode: string;
  workRoleName: string;
  workRoleCategory?: string;
  workRoleLevel?: string;
  workRoleDepartmentName?: string;
  skillLevel?: number;
  skillLevelName?: string;
  skillLevelDescription?: string;
  assignedByName?: string;
  verifiedByName?: string;
  lastAssessedByName?: string;
  updatedByName?: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
  daysUntilNextAssessment?: number;
  yearsInRole?: number;
  monthsInRole?: number;
  daysInRole?: number;
  tenureDisplay?: string;
}

export interface UserWorkRoleFilters {
  userId?: number;
  workRoleId?: number;
  skillLevelId?: number;
  status?: string;
  verified?: boolean;
  departmentId?: number;
  category?: string;
  expiringWithinDays?: number;
  assessmentDueWithinDays?: number;
  trainingRequired?: boolean;
  certificationRequired?: boolean;
}

export interface UserWorkRoleStatistics {
  totalAssignments: number;
  activeAssignments: number;
  expiredAssignments: number;
  pendingVerification: number;
  trainingRequired: number;
  trainingCompleted: number;
  certificationRequired: number;
  bySkillLevel: {
    skillLevel: number;
    count: number;
  }[];
  byWorkRole: {
    workRoleId: number;
    workRoleName: string;
    count: number;
  }[];
}

/**
 * Get the auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Get axios config with auth token
 */
const getConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Assign a work role to a user
 */
export const assignWorkRole = async (data: Partial<UserWorkRole>): Promise<{ message: string; id: number }> => {
  const response = await axios.post(`${API_URL}/user-work-roles`, data, getConfig());
  return response.data;
};

/**
 * Get all work roles assigned to a specific user
 */
export const getUserWorkRoles = async (userId: number, filters?: UserWorkRoleFilters): Promise<UserWorkRoleWithDetails[]> => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.workRoleId) params.append('workRoleId', filters.workRoleId.toString());
    if (filters.skillLevelId) params.append('skillLevelId', filters.skillLevelId.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.expiringWithinDays) params.append('expiringWithinDays', filters.expiringWithinDays.toString());
  }
  
  const response = await axios.get(`${API_URL}/user-work-roles/user/${userId}?${params.toString()}`, getConfig());
  return response.data;
};

/**
 * Get all users assigned to a specific work role
 */
export const getWorkRoleUsers = async (workRoleId: number, filters?: UserWorkRoleFilters): Promise<UserWorkRoleWithDetails[]> => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.skillLevelId) params.append('skillLevelId', filters.skillLevelId.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
  }
  
  const response = await axios.get(`${API_URL}/user-work-roles/work-role/${workRoleId}?${params.toString()}`, getConfig());
  return response.data;
};

/**
 * Get all user work role assignments with filters
 */
export const getAllAssignments = async (filters?: UserWorkRoleFilters): Promise<UserWorkRoleWithDetails[]> => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.workRoleId) params.append('workRoleId', filters.workRoleId.toString());
    if (filters.skillLevelId) params.append('skillLevelId', filters.skillLevelId.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.expiringWithinDays) params.append('expiringWithinDays', filters.expiringWithinDays.toString());
    if (filters.assessmentDueWithinDays) params.append('assessmentDueWithinDays', filters.assessmentDueWithinDays.toString());
    if (filters.trainingRequired !== undefined) params.append('trainingRequired', filters.trainingRequired.toString());
    if (filters.certificationRequired !== undefined) params.append('certificationRequired', filters.certificationRequired.toString());
  }
  
  const response = await axios.get(`${API_URL}/user-work-roles?${params.toString()}`, getConfig());
  return response.data;
};

/**
 * Get a single user work role assignment by ID
 */
export const getAssignmentById = async (id: number): Promise<UserWorkRoleWithDetails> => {
  const response = await axios.get(`${API_URL}/user-work-roles/${id}`, getConfig());
  return response.data;
};

/**
 * Update a user work role assignment
 */
export const updateAssignment = async (id: number, data: Partial<UserWorkRole>): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/user-work-roles/${id}`, data, getConfig());
  return response.data;
};

/**
 * Soft delete (deactivate) a user work role assignment
 */
export const deleteAssignment = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/user-work-roles/${id}`, getConfig());
  return response.data;
};

/**
 * Hard delete a user work role assignment (permanent)
 */
export const hardDeleteAssignment = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/user-work-roles/${id}/permanent`, getConfig());
  return response.data;
};

/**
 * Get statistics for user work role assignments
 */
export const getStatistics = async (filters?: UserWorkRoleFilters): Promise<UserWorkRoleStatistics> => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.workRoleId) params.append('workRoleId', filters.workRoleId.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
    if (filters.category) params.append('category', filters.category);
  }
  
  const response = await axios.get(`${API_URL}/user-work-roles/statistics?${params.toString()}`, getConfig());
  return response.data;
};
