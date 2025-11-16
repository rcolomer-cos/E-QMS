/**
 * NCR Classification Constants - Frontend
 * 
 * These constants mirror the backend classification rules
 * and ensure consistency across the application
 */

export enum NCRSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum NCRSource {
  INTERNAL_AUDIT = 'Internal Audit',
  EXTERNAL_AUDIT = 'External Audit',
  CUSTOMER_COMPLAINT = 'Customer Complaint',
  SUPPLIER_ISSUE = 'Supplier Issue',
  PROCESS_MONITORING = 'Process Monitoring',
  INSPECTION = 'Inspection',
  MANAGEMENT_REVIEW = 'Management Review',
  EMPLOYEE_REPORT = 'Employee Report',
  OTHER = 'Other',
}

export enum NCRType {
  PRODUCT_QUALITY = 'Product Quality',
  PROCESS_DEVIATION = 'Process Deviation',
  DOCUMENTATION = 'Documentation',
  EQUIPMENT_FACILITY = 'Equipment/Facility',
  PERSONNEL_TRAINING = 'Personnel/Training',
  SAFETY = 'Safety',
  ENVIRONMENTAL = 'Environmental',
  REGULATORY_COMPLIANCE = 'Regulatory Compliance',
  SUPPLIER_QUALITY = 'Supplier Quality',
  OTHER = 'Other',
}

export const IMPACT_SCORES: Record<NCRSeverity, number> = {
  [NCRSeverity.MINOR]: 1,
  [NCRSeverity.MAJOR]: 5,
  [NCRSeverity.CRITICAL]: 10,
};

export const SEVERITY_DESCRIPTIONS: Record<NCRSeverity, string> = {
  [NCRSeverity.MINOR]: 'Low impact to quality, safety, or compliance. Minimal disruption to operations.',
  [NCRSeverity.MAJOR]: 'Significant impact to quality, safety, or compliance. Requires prompt attention.',
  [NCRSeverity.CRITICAL]: 'Severe impact to quality, safety, or compliance. Requires immediate action.',
};

export function getImpactScore(severity: NCRSeverity | string): number {
  const severityKey = severity as NCRSeverity;
  return IMPACT_SCORES[severityKey] || 0;
}

export function getAllSeverities(): string[] {
  return Object.values(NCRSeverity);
}

export function getAllSources(): string[] {
  return Object.values(NCRSource);
}

export function getAllTypes(): string[] {
  return Object.values(NCRType);
}
