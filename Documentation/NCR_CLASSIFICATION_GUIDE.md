# NCR Classification and Severity Rules Guide

## Overview

This guide documents the standardized classification rules for Non-Conformance Reports (NCRs) in the E-QMS system. These rules ensure consistency in categorizing, assessing, and prioritizing non-conformances across the organization in compliance with ISO 9001:2015 requirements.

## Classification Categories

### 1. Severity Levels

NCRs are classified by severity based on their impact to quality, safety, and compliance:

| Severity | Impact Score | Description | Response Time |
|----------|--------------|-------------|---------------|
| **Minor** | 1 | Low impact to quality, safety, or compliance. Minimal disruption to operations. Does not affect product conformity. | Normal workflow |
| **Major** | 5 | Significant impact to quality, safety, or compliance. May affect product conformity or customer satisfaction. Requires prompt attention. | Within 48-72 hours |
| **Critical** | 10 | Severe impact to quality, safety, or compliance. Affects product safety, regulatory compliance, or could result in significant customer impact. Requires immediate action. | Immediate (within 24 hours) |

### 2. Source Categories

Sources identify where the non-conformance was discovered:

| Source | Description |
|--------|-------------|
| **Internal Audit** | Issues identified during internal quality system audits |
| **External Audit** | Issues identified during external or certification audits |
| **Customer Complaint** | Issues reported by customers regarding products or services |
| **Supplier Issue** | Issues related to supplier quality or delivery |
| **Process Monitoring** | Issues detected through ongoing process performance monitoring |
| **Inspection** | Issues found during product or process inspections |
| **Management Review** | Issues identified during management review meetings |
| **Employee Report** | Issues reported by employees through quality reporting channels |
| **Other** | Issues from other sources not listed above |

### 3. Type Categories

Types classify the area or nature of non-conformance:

| Type | Description |
|------|-------------|
| **Product Quality** | Non-conformances related to product specifications, characteristics, or quality requirements |
| **Process Deviation** | Deviations from established processes, procedures, or work instructions |
| **Documentation** | Issues with quality documentation, records, or document control |
| **Equipment/Facility** | Non-conformances related to equipment, tooling, or facility conditions |
| **Personnel/Training** | Issues related to personnel competence, training, or qualification |
| **Safety** | Safety-related non-conformances affecting personnel or workplace safety |
| **Environmental** | Environmental compliance or environmental management system issues |
| **Regulatory Compliance** | Non-conformances related to regulatory or statutory requirements |
| **Supplier Quality** | Issues with supplier quality, materials, or components |
| **Other** | Non-conformances not falling into other defined categories |

## Impact Scoring System

### Score Calculation

Each NCR is automatically assigned an impact score based on its severity:

- **Minor**: 1 point
- **Major**: 5 points
- **Critical**: 10 points

### Impact Score Usage

Impact scores are used for:

1. **Prioritization**: Higher scores indicate higher priority for resolution
2. **Metrics & Reporting**: Aggregate scores help track quality performance trends
3. **Resource Allocation**: Helps management allocate resources to critical issues
4. **Management Review**: Provides quantitative data for decision-making

### Example Calculations

**Individual NCR Impact:**
- 1 Critical NCR = 10 points
- 2 Major NCRs = 10 points (2 × 5)
- 5 Minor NCRs = 5 points (5 × 1)

**Total Impact Score:** 25 points

## Classification Guidelines

### How to Determine Severity

When creating an NCR, consider the following questions:

#### Critical Severity
- Does it affect product safety or regulatory compliance?
- Could it result in significant harm to customers or employees?
- Does it require immediate regulatory reporting?
- Would it cause major operational shutdown?
- Could it result in product recall?

#### Major Severity
- Does it affect product conformity to specifications?
- Could it impact customer satisfaction significantly?
- Does it represent a recurring pattern of issues?
- Would it require significant resources to correct?
- Could it lead to regulatory non-compliance if not addressed?

#### Minor Severity
- Is it an isolated incident with minimal impact?
- Can it be corrected through normal workflow?
- Does it not affect product conformity or customer satisfaction?
- Is there low risk of recurrence?

### Source Selection Guidelines

Choose the source that best represents where the issue was first identified:

- Use **Internal Audit** or **External Audit** for audit findings
- Use **Customer Complaint** for any issue reported by a customer
- Use **Process Monitoring** for issues found through regular quality checks
- Use **Inspection** for issues found during formal inspection activities
- Use **Employee Report** when staff members identify and report issues

### Type Selection Guidelines

Select the category that best represents the nature of the non-conformance:

- **Product Quality**: Physical characteristics, performance, specifications
- **Process Deviation**: Not following SOPs, work instructions, or procedures
- **Documentation**: Missing, incorrect, or outdated documents
- **Equipment/Facility**: Equipment malfunction, calibration, or facility issues
- **Personnel/Training**: Competence, training records, or qualification issues

## API Integration

### Backend Validation

The backend automatically validates NCR classification fields against standardized rules:

```typescript
// Valid severity values
['minor', 'major', 'critical']

// Valid sources (see Source Categories table)
// Valid types (see Type Categories table)
```

Any submission with invalid values will be rejected with a validation error.

### Frontend Dropdowns

The frontend NCRForm component uses the same standardized options, ensuring:
- Consistency between frontend and backend
- No possibility of invalid submissions
- Standardized terminology across the system

### Classification Options API

A dedicated endpoint provides classification metadata:

```
GET /api/ncrs/classification-options
```

**Response:**
```json
{
  "severities": ["minor", "major", "critical"],
  "sources": [...],
  "types": [...],
  "severityDescriptions": {...},
  "sourceDescriptions": {...},
  "typeDescriptions": {...},
  "impactScores": {
    "minor": 1,
    "major": 5,
    "critical": 10
  }
}
```

## Best Practices

### 1. Consistent Classification
- Always use the standardized categories
- Review severity guidelines before classifying
- Consult with quality manager for borderline cases

### 2. Timely Response
- Respond to NCRs based on severity levels
- Critical NCRs require immediate attention
- Document response times in the system

### 3. Root Cause Analysis
- All Major and Critical NCRs should have documented root cause analysis
- Minor NCRs may use simplified analysis
- Link NCRs to CAPAs when corrective action is needed

### 4. Trend Analysis
- Monitor impact scores over time
- Review patterns in sources and types
- Use data to drive continuous improvement

### 5. Regular Review
- Review classification rules annually
- Update based on organizational learning
- Ensure alignment with ISO 9001:2015 requirements

## Compliance with ISO 9001:2015

These classification rules support the following ISO 9001:2015 requirements:

- **8.7 Control of nonconforming outputs**: Proper categorization enables appropriate control measures
- **10.2 Nonconformity and corrective action**: Severity-based prioritization ensures timely corrective action
- **9.1 Monitoring, measurement, analysis and evaluation**: Impact scoring enables quantitative analysis
- **5.3 Organizational roles, responsibilities and authorities**: Clear classification supports accountability

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-11-16 | System | Initial implementation of standardized NCR classification rules |

## Questions?

For questions about NCR classification or this guide, contact:
- Quality Manager
- System Administrator
- Review the NCR API Documentation

---

**Document Control:**
- Document ID: NCR-GUIDE-001
- Classification: Internal Use
- Review Period: Annual
