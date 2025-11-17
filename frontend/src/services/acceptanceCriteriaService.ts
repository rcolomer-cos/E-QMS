import api from './api';

export interface AcceptanceCriteria {
  id?: number;
  criteriaCode: string;
  criteriaName: string;
  description?: string;
  inspectionType: string;
  equipmentCategory?: string;
  parameterName: string;
  unit?: string;
  measurementType: 'quantitative' | 'qualitative' | 'binary' | 'range' | 'checklist';
  ruleType: 'range' | 'min' | 'max' | 'exact' | 'tolerance' | 'checklist' | 'pass_fail';
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  tolerancePlus?: number;
  toleranceMinus?: number;
  acceptableValues?: string;
  unacceptableValues?: string;
  severity: 'critical' | 'major' | 'minor' | 'normal';
  mandatory: boolean;
  safetyRelated?: boolean;
  regulatoryRequirement?: boolean;
  failureAction: 'fail_inspection' | 'flag_for_review' | 'warning_only' | 'conditional_pass';
  allowOverride?: boolean;
  overrideAuthorizationLevel?: string;
  standardReference?: string;
  procedureReference?: string;
  status: 'active' | 'inactive' | 'draft' | 'obsolete';
  effectiveDate: string;
  expiryDate?: string;
  version: string;
  supersedes?: number;
  inspectionMethod?: string;
  requiredEquipment?: string;
  frequency?: string;
  sampleSize?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface AcceptanceCriteriaFilters {
  inspectionType?: string;
  equipmentCategory?: string;
  status?: string;
  severity?: string;
  mandatory?: boolean;
  safetyRelated?: boolean;
  regulatoryRequirement?: boolean;
  measurementType?: string;
  page?: number;
  limit?: number;
}

export interface AcceptanceCriteriaResponse {
  data: AcceptanceCriteria[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ValidationResult {
  passed: boolean;
  message: string;
}

class AcceptanceCriteriaService {
  private readonly basePath = '/acceptance-criteria';

  /**
   * Create a new acceptance criteria
   */
  async createAcceptanceCriteria(criteria: AcceptanceCriteria): Promise<{ message: string; id: number }> {
    const response = await api.post(this.basePath, criteria);
    return response.data;
  }

  /**
   * Get all acceptance criteria with optional filters
   */
  async getAcceptanceCriteria(filters?: AcceptanceCriteriaFilters): Promise<AcceptanceCriteriaResponse> {
    const params = new URLSearchParams();
    
    if (filters?.inspectionType) params.append('inspectionType', filters.inspectionType);
    if (filters?.equipmentCategory) params.append('equipmentCategory', filters.equipmentCategory);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.mandatory !== undefined) params.append('mandatory', filters.mandatory.toString());
    if (filters?.safetyRelated !== undefined) params.append('safetyRelated', filters.safetyRelated.toString());
    if (filters?.regulatoryRequirement !== undefined) params.append('regulatoryRequirement', filters.regulatoryRequirement.toString());
    if (filters?.measurementType) params.append('measurementType', filters.measurementType);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`${this.basePath}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get acceptance criteria by ID
   */
  async getAcceptanceCriteriaById(id: number): Promise<AcceptanceCriteria> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Get acceptance criteria by criteria code
   */
  async getAcceptanceCriteriaByCriteriaCode(criteriaCode: string): Promise<AcceptanceCriteria> {
    const response = await api.get(`${this.basePath}/code/${criteriaCode}`);
    return response.data;
  }

  /**
   * Get acceptance criteria by inspection type
   */
  async getAcceptanceCriteriaByInspectionType(inspectionType: string): Promise<AcceptanceCriteria[]> {
    const response = await api.get(`${this.basePath}/inspection-type/${inspectionType}`);
    return response.data;
  }

  /**
   * Get all active acceptance criteria
   */
  async getActiveAcceptanceCriteria(): Promise<AcceptanceCriteria[]> {
    const response = await api.get(`${this.basePath}/active`);
    return response.data;
  }

  /**
   * Get all mandatory criteria
   */
  async getMandatoryCriteria(): Promise<AcceptanceCriteria[]> {
    const response = await api.get(`${this.basePath}/mandatory`);
    return response.data;
  }

  /**
   * Get all safety-related criteria
   */
  async getSafetyRelatedCriteria(): Promise<AcceptanceCriteria[]> {
    const response = await api.get(`${this.basePath}/safety-related`);
    return response.data;
  }

  /**
   * Update an existing acceptance criteria
   */
  async updateAcceptanceCriteria(id: number, updates: Partial<AcceptanceCriteria>): Promise<{ message: string }> {
    const response = await api.put(`${this.basePath}/${id}`, updates);
    return response.data;
  }

  /**
   * Delete an acceptance criteria
   */
  async deleteAcceptanceCriteria(id: number): Promise<{ message: string }> {
    const response = await api.delete(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Validate a measured value against acceptance criteria
   */
  async validateMeasurement(id: number, measuredValue: number | string | boolean): Promise<ValidationResult> {
    const response = await api.post(`${this.basePath}/${id}/validate`, { measuredValue });
    return response.data;
  }
}

export default new AcceptanceCriteriaService();
