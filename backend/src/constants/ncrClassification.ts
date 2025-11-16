/**
 * NCR Classification Constants
 * 
 * Standardized classification rules for Non-Conformance Reports (NCRs)
 * These rules ensure consistent categorization, severity assessment, and impact scoring
 * across the E-QMS system in compliance with ISO 9001:2015 requirements.
 */

/**
 * NCR Severity Levels
 * Defines the criticality of the non-conformance
 */
export enum NCRSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

/**
 * NCR Source Categories
 * Identifies where the non-conformance was discovered
 */
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

/**
 * NCR Type Categories
 * Classifies the type/area of non-conformance
 */
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

/**
 * Impact Score Configuration
 * Maps severity levels to numeric impact scores for prioritization and metrics
 */
export const IMPACT_SCORES: Record<NCRSeverity, number> = {
  [NCRSeverity.MINOR]: 1,
  [NCRSeverity.MAJOR]: 5,
  [NCRSeverity.CRITICAL]: 10,
};

/**
 * Severity Descriptions
 * Provides guidance for severity classification
 */
export const SEVERITY_DESCRIPTIONS: Record<NCRSeverity, string> = {
  [NCRSeverity.MINOR]: 'Low impact to quality, safety, or compliance. Minimal disruption to operations. Does not affect product conformity.',
  [NCRSeverity.MAJOR]: 'Significant impact to quality, safety, or compliance. May affect product conformity or customer satisfaction. Requires prompt attention.',
  [NCRSeverity.CRITICAL]: 'Severe impact to quality, safety, or compliance. Affects product safety, regulatory compliance, or could result in significant customer impact. Requires immediate action.',
};

/**
 * Source Descriptions
 * Provides context for each NCR source category
 */
export const SOURCE_DESCRIPTIONS: Record<NCRSource, string> = {
  [NCRSource.INTERNAL_AUDIT]: 'Issues identified during internal quality system audits',
  [NCRSource.EXTERNAL_AUDIT]: 'Issues identified during external or certification audits',
  [NCRSource.CUSTOMER_COMPLAINT]: 'Issues reported by customers regarding products or services',
  [NCRSource.SUPPLIER_ISSUE]: 'Issues related to supplier quality or delivery',
  [NCRSource.PROCESS_MONITORING]: 'Issues detected through ongoing process performance monitoring',
  [NCRSource.INSPECTION]: 'Issues found during product or process inspections',
  [NCRSource.MANAGEMENT_REVIEW]: 'Issues identified during management review meetings',
  [NCRSource.EMPLOYEE_REPORT]: 'Issues reported by employees through quality reporting channels',
  [NCRSource.OTHER]: 'Issues from other sources not listed above',
};

/**
 * Type Descriptions
 * Provides context for each NCR type category
 */
export const TYPE_DESCRIPTIONS: Record<NCRType, string> = {
  [NCRType.PRODUCT_QUALITY]: 'Non-conformances related to product specifications, characteristics, or quality requirements',
  [NCRType.PROCESS_DEVIATION]: 'Deviations from established processes, procedures, or work instructions',
  [NCRType.DOCUMENTATION]: 'Issues with quality documentation, records, or document control',
  [NCRType.EQUIPMENT_FACILITY]: 'Non-conformances related to equipment, tooling, or facility conditions',
  [NCRType.PERSONNEL_TRAINING]: 'Issues related to personnel competence, training, or qualification',
  [NCRType.SAFETY]: 'Safety-related non-conformances affecting personnel or workplace safety',
  [NCRType.ENVIRONMENTAL]: 'Environmental compliance or environmental management system issues',
  [NCRType.REGULATORY_COMPLIANCE]: 'Non-conformances related to regulatory or statutory requirements',
  [NCRType.SUPPLIER_QUALITY]: 'Issues with supplier quality, materials, or components',
  [NCRType.OTHER]: 'Non-conformances not falling into other defined categories',
};

/**
 * Get impact score for a given severity level
 * @param severity The NCR severity level
 * @returns The numeric impact score
 */
export function getImpactScore(severity: NCRSeverity | string): number {
  const severityKey = severity as NCRSeverity;
  return IMPACT_SCORES[severityKey] || 0;
}

/**
 * Validate severity level
 * @param severity The severity value to validate
 * @returns True if valid, false otherwise
 */
export function isValidSeverity(severity: string): severity is NCRSeverity {
  return Object.values(NCRSeverity).includes(severity as NCRSeverity);
}

/**
 * Validate source category
 * @param source The source value to validate
 * @returns True if valid, false otherwise
 */
export function isValidSource(source: string): source is NCRSource {
  return Object.values(NCRSource).includes(source as NCRSource);
}

/**
 * Validate type category
 * @param type The type value to validate
 * @returns True if valid, false otherwise
 */
export function isValidType(type: string): type is NCRType {
  return Object.values(NCRType).includes(type as NCRType);
}

/**
 * Get all valid severity values
 * @returns Array of valid severity values
 */
export function getAllSeverities(): string[] {
  return Object.values(NCRSeverity);
}

/**
 * Get all valid source values
 * @returns Array of valid source values
 */
export function getAllSources(): string[] {
  return Object.values(NCRSource);
}

/**
 * Get all valid type values
 * @returns Array of valid type values
 */
export function getAllTypes(): string[] {
  return Object.values(NCRType);
}
