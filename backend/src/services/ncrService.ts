/**
 * NCR Service
 * 
 * Business logic for Non-Conformance Report operations
 * Handles impact scoring and classification rules
 */

import { NCR } from '../models/NCRModel';
import { getImpactScore, NCRSeverity } from '../constants/ncrClassification';

/**
 * Extended NCR interface with computed impact score
 */
export interface NCRWithImpact extends NCR {
  impactScore: number;
}

/**
 * Calculate impact score for an NCR based on its severity
 * @param ncr The NCR object
 * @returns The NCR with computed impact score
 */
export function addImpactScore(ncr: NCR): NCRWithImpact {
  const impactScore = getImpactScore(ncr.severity as NCRSeverity);
  return {
    ...ncr,
    impactScore,
  };
}

/**
 * Add impact scores to multiple NCRs
 * @param ncrs Array of NCR objects
 * @returns Array of NCRs with computed impact scores
 */
export function addImpactScores(ncrs: NCR[]): NCRWithImpact[] {
  return ncrs.map(addImpactScore);
}

/**
 * Validate NCR classification fields
 * @param source NCR source
 * @param category NCR category (type)
 * @param severity NCR severity
 * @returns Object with validation result and error messages
 */
export function validateClassification(
  source: string,
  category: string,
  severity: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Import validation functions
  const { isValidSource, isValidType, isValidSeverity } = 
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../constants/ncrClassification');

  if (!isValidSource(source)) {
    errors.push(`Invalid source: ${source}`);
  }

  if (!isValidType(category)) {
    errors.push(`Invalid category: ${category}`);
  }

  if (!isValidSeverity(severity)) {
    errors.push(`Invalid severity: ${severity}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get NCR priority based on severity
 * @param severity NCR severity level
 * @returns Priority level as string
 */
export function getPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (severity) {
    case NCRSeverity.CRITICAL:
      return 'critical';
    case NCRSeverity.MAJOR:
      return 'high';
    case NCRSeverity.MINOR:
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Calculate aggregate metrics for NCRs
 * @param ncrs Array of NCRs
 * @returns Aggregate metrics
 */
export function calculateMetrics(ncrs: NCR[]): {
  totalImpactScore: number;
  averageImpactScore: number;
  severityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
} {
  const totalImpactScore = ncrs.reduce((sum, ncr) => sum + getImpactScore(ncr.severity), 0);
  const averageImpactScore = ncrs.length > 0 ? totalImpactScore / ncrs.length : 0;

  const severityBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};
  const sourceBreakdown: Record<string, number> = {};

  ncrs.forEach((ncr) => {
    // Count by severity
    severityBreakdown[ncr.severity] = (severityBreakdown[ncr.severity] || 0) + 1;

    // Count by category
    categoryBreakdown[ncr.category] = (categoryBreakdown[ncr.category] || 0) + 1;

    // Count by source
    sourceBreakdown[ncr.source] = (sourceBreakdown[ncr.source] || 0) + 1;
  });

  return {
    totalImpactScore,
    averageImpactScore,
    severityBreakdown,
    categoryBreakdown,
    sourceBreakdown,
  };
}
