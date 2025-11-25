import api from './api';

export interface WorkRoleKPI {
  id: number;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  level?: string;
  departmentName?: string;
  employeeCount: number;
  avgWorkExperienceYears: number;
  avgSkillLevel: number;
  status: string;
}

export interface WorkRoleKPIDetail extends WorkRoleKPI {
  responsibilitiesAndAuthorities?: string;
  requiredQualifications?: string;
  requiredExperienceYears?: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level4Count: number;
  level5Count: number;
}

export interface WorkRoleKPISummary {
  totalWorkRoles: number;
  totalEmployeesWithRoles: number;
  overallAvgExperience: number;
  overallAvgSkillLevel: number;
  categoriesCount: number;
  activeRolesCount: number;
  inactiveRolesCount: number;
}

/**
 * Get KPI statistics for all work roles
 */
export const getWorkRoleKPIs = async (): Promise<WorkRoleKPI[]> => {
  try {
    const response = await api.get('/work-role-kpis');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching work role KPIs:', error);
    throw error;
  }
};

/**
 * Get detailed KPI statistics for a specific work role
 */
export const getWorkRoleKPIById = async (id: number): Promise<WorkRoleKPIDetail> => {
  try {
    const response = await api.get(`/work-role-kpis/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching work role KPI for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get summary KPI statistics across all work roles
 */
export const getWorkRoleKPISummary = async (): Promise<WorkRoleKPISummary> => {
  try {
    const response = await api.get('/work-role-kpis/summary');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching work role KPI summary:', error);
    throw error;
  }
};
