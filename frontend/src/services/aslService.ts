import api from './api';

export interface Supplier {
  id: number;
  supplierNumber: string;
  name: string;
  description?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  fax?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  category: string;
  supplierType?: string;
  industry?: string;
  productsServices?: string;
  approvalStatus: string;
  approvedDate?: string;
  approvedBy?: number;
  suspendedDate?: string;
  suspendedReason?: string;
  active: boolean;
  rating?: number;
  performanceScore?: number;
  qualityGrade?: string;
  certifications?: string;
  complianceStatus?: string;
  lastEvaluationDate?: string;
  nextEvaluationDate?: string;
  evaluationFrequency?: number;
  lastAuditDate?: string;
  nextAuditDate?: string;
  auditFrequency?: number;
  riskLevel?: string;
  criticalSupplier?: boolean;
  backupSupplierAvailable?: boolean;
  backupSupplierId?: number;
  businessRegistrationNumber?: string;
  dunsNumber?: string;
  establishedYear?: number;
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankName?: string;
  supplierManager?: number;
  department?: string;
  relationshipStartDate?: string;
  contractExpiryDate?: string;
  preferredSupplier?: boolean;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  responsiveness?: string;
  totalPurchaseValue?: number;
  iso9001Certified?: boolean;
  iso9001CertificateNumber?: string;
  iso9001ExpiryDate?: string;
  notes?: string;
  internalReference?: string;
  tags?: string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
  deactivatedAt?: string;
  deactivatedBy?: number;
}

export interface SupplierFilters {
  category?: string;
  approvalStatus?: string;
  riskLevel?: string;
  minRating?: number;
  maxRating?: number;
  minPerformanceScore?: number;
  maxPerformanceScore?: number;
  qualityGrade?: string;
  complianceStatus?: string;
  criticalSupplier?: boolean;
  preferredSupplier?: boolean;
  iso9001Certified?: boolean;
  supplierType?: string;
  industry?: string;
  active?: boolean;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getSuppliers = async (filters?: SupplierFilters): Promise<SuppliersResponse> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const response = await api.get<SuppliersResponse>(`/suppliers?${params.toString()}`);
  return response.data;
};

export const getSupplierById = async (id: number): Promise<Supplier> => {
  const response = await api.get<Supplier>(`/suppliers/${id}`);
  return response.data;
};

export const getSupplierByNumber = async (supplierNumber: string): Promise<Supplier> => {
  const response = await api.get<Supplier>(`/suppliers/number/${supplierNumber}`);
  return response.data;
};

export const createSupplier = async (supplier: Partial<Supplier>): Promise<{ message: string; id: number }> => {
  const response = await api.post<{ message: string; id: number }>('/suppliers', supplier);
  return response.data;
};

export const updateSupplier = async (id: number, supplier: Partial<Supplier>): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/suppliers/${id}`, supplier);
  return response.data;
};

export const updateSupplierApprovalStatus = async (
  id: number,
  approvalStatus: string
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/suppliers/${id}/approval-status`, { approvalStatus });
  return response.data;
};

export const deactivateSupplier = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/suppliers/${id}`);
  return response.data;
};

export const reactivateSupplier = async (id: number): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/suppliers/${id}/reactivate`);
  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/suppliers/categories');
  return response.data;
};

export const getSupplierTypes = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/suppliers/types');
  return response.data;
};

export const getIndustries = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/suppliers/industries');
  return response.data;
};

export const exportSuppliers = async (filters?: SupplierFilters): Promise<Blob> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
        params.append(key, value.toString());
      }
    });
  }

  const response = await api.get(`/suppliers/export?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};
