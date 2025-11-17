import api from './api';

export interface Supplier {
  id: number;
  name: string;
  supplierNumber: string;
  category: string;
  riskLevel: string;
  performanceScore?: number;
  qualityGrade?: string;
  rating?: number;
  approvalStatus: string;
  lastEvaluationDate?: string;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  criticalSupplier: boolean;
  preferredSupplier: boolean;
  latestEvaluationId?: number;
  latestOverallScore?: number;
  latestOverallRating?: string;
  latestEvaluationDate?: string;
  latestComplianceStatus?: string;
  totalEvaluations: number;
  nonCompliantEvaluations: number;
}

export interface RecentEvaluation {
  id: number;
  evaluationNumber: string;
  supplierId: number;
  supplierName: string;
  supplierNumber: string;
  evaluationDate: string;
  evaluationType: string;
  overallScore?: number;
  overallRating?: string;
  qualityRating: number;
  onTimeDeliveryRate: number;
  complianceStatus: string;
  evaluationStatus: string;
}

export interface DashboardStatistics {
  totalSuppliers: number;
  totalEvaluations: number;
  avgQualityRating?: number;
  avgOnTimeDeliveryRate?: number;
  avgOverallScore?: number;
  compliantCount: number;
  nonCompliantCount: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  criticalSuppliersCount: number;
  preferredSuppliersCount: number;
}

export interface RiskBreakdown {
  riskLevel: string;
  count: number;
}

export interface ComplianceTrend {
  month: string;
  totalEvaluations: number;
  compliant: number;
  nonCompliant: number;
}

export interface SupplierPerformanceDashboard {
  suppliers: Supplier[];
  recentEvaluations: RecentEvaluation[];
  statistics: DashboardStatistics;
  riskBreakdown: RiskBreakdown[];
  complianceTrend: ComplianceTrend[];
}

export const getSupplierPerformanceDashboard = async (): Promise<SupplierPerformanceDashboard> => {
  const response = await api.get<SupplierPerformanceDashboard>('/supplier-evaluations/dashboard');
  return response.data;
};
