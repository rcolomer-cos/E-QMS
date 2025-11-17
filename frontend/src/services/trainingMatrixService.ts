import api from './api';

export interface TrainingMatrixEntry {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
  hasExpiry: boolean;
  defaultValidityMonths: number;
  userCompetencyId: number | null;
  competencyStatus: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  isExpired: boolean | null;
  proficiencyLevel: string | null;
  assessmentScore: number | null;
  displayStatus: 'active' | 'missing' | 'expired' | 'expiring_soon';
  daysUntilExpiry: number | null;
  isMandatory: boolean | null;
  isRegulatory: boolean | null;
  priority: string | null;
}

export interface TrainingMatrixFilters {
  roleId?: number;
  departmentId?: number;
  competencyCategory?: string;
}

/**
 * Get training matrix data showing users vs competencies
 */
export const getTrainingMatrix = async (
  filters?: TrainingMatrixFilters
): Promise<{ data: TrainingMatrixEntry[]; total: number }> => {
  const response = await api.get('/competencies/training-matrix', { params: filters });
  return response.data;
};
