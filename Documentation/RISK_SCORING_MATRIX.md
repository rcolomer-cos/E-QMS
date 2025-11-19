# Risk Scoring Matrix - Visual Reference

## Quick Reference Guide

This document provides a visual reference for the risk scoring system implemented in the E-QMS application.

---

## Scoring Formula

```
Risk Score = Likelihood × Impact
```

Both Likelihood and Impact use a 5-point scale, resulting in risk scores from 1 to 25.

---

## 5×5 Risk Matrix

| Impact → <br> Likelihood ↓ | 1<br>Negligible | 2<br>Minor | 3<br>Moderate | 4<br>Major | 5<br>Catastrophic |
|---------------------------|-----------------|------------|---------------|------------|-------------------|
| **5 - Very Likely** | 5<br>🟢 LOW | 10<br>🟡 MEDIUM | 15<br>🟠 HIGH | 20<br>🔴 CRITICAL | 25<br>🔴 CRITICAL |
| **4 - Likely** | 4<br>🟢 LOW | 8<br>🟡 MEDIUM | 12<br>🟠 HIGH | 16<br>🟠 HIGH | 20<br>🔴 CRITICAL |
| **3 - Possible** | 3<br>🟢 LOW | 6<br>🟡 MEDIUM | 9<br>🟡 MEDIUM | 12<br>🟠 HIGH | 15<br>🟠 HIGH |
| **2 - Unlikely** | 2<br>🟢 LOW | 4<br>🟢 LOW | 6<br>🟡 MEDIUM | 8<br>🟡 MEDIUM | 10<br>🟡 MEDIUM |
| **1 - Very Unlikely** | 1<br>🟢 LOW | 2<br>🟢 LOW | 3<br>🟢 LOW | 4<br>🟢 LOW | 5<br>🟢 LOW |

---

## Risk Level Definitions

### 🔴 CRITICAL (20-25)
**Action Required:** Immediate action necessary. Work cannot proceed without risk mitigation.

**Characteristics:**
- Score: 20-25
- Color: Red (#d32f2f)
- Response: Urgent mitigation required
- Review Frequency: Weekly or more frequent
- Escalation: Executive management must be notified

**Examples:**
- Very Likely (5) × Major (4) = 20
- Likely (4) × Catastrophic (5) = 20
- Very Likely (5) × Catastrophic (5) = 25

**Management Response:**
- Stop work if necessary
- Implement immediate controls
- Assign dedicated resources
- Daily monitoring

---

### 🟠 HIGH (12-19)
**Action Required:** Significant attention and resources needed. Senior management involvement.

**Characteristics:**
- Score: 12-19
- Color: Orange (#f57c00)
- Response: Active mitigation planning and execution
- Review Frequency: Bi-weekly to monthly
- Escalation: Senior management awareness required

**Examples:**
- Possible (3) × Major (4) = 12
- Likely (4) × Moderate (3) = 12
- Likely (4) × Major (4) = 16
- Possible (3) × Catastrophic (5) = 15

**Management Response:**
- Develop comprehensive mitigation plan
- Allocate necessary resources
- Regular progress reviews
- Document mitigation effectiveness

---

### 🟡 MEDIUM (6-11)
**Action Required:** Moderate attention needed. Include in regular management reviews.

**Characteristics:**
- Score: 6-11
- Color: Yellow (#fbc02d)
- Response: Scheduled mitigation with monitoring
- Review Frequency: Monthly to quarterly
- Escalation: Line management oversight

**Examples:**
- Unlikely (2) × Moderate (3) = 6
- Possible (3) × Minor (2) = 6
- Unlikely (2) × Major (4) = 8
- Possible (3) × Moderate (3) = 9
- Very Likely (5) × Minor (2) = 10

**Management Response:**
- Include in risk register
- Develop mitigation strategy
- Regular monitoring
- Periodic reassessment

---

### 🟢 LOW (1-5)
**Action Required:** Accept and monitor. Document in risk register.

**Characteristics:**
- Score: 1-5
- Color: Green (#388e3c)
- Response: Monitor and periodic review
- Review Frequency: Quarterly to annually
- Escalation: Operational management

**Examples:**
- Very Unlikely (1) × Negligible (1) = 1
- Unlikely (2) × Negligible (1) = 2
- Unlikely (2) × Minor (2) = 4
- Very Unlikely (1) × Catastrophic (5) = 5
- Very Likely (5) × Negligible (1) = 5

**Management Response:**
- Document in risk register
- Routine monitoring
- No immediate action required
- Annual review acceptable

---

## Likelihood Scale Definitions

### 5 - Very Likely
- **Probability:** > 80% chance of occurrence
- **Frequency:** Expected to occur frequently (multiple times per year)
- **Historical:** Has occurred repeatedly in similar situations
- **Expert Opinion:** Subject matter experts agree event is almost certain

### 4 - Likely
- **Probability:** 60-80% chance of occurrence
- **Frequency:** Expected to occur regularly (once or twice per year)
- **Historical:** Has occurred several times in the organization or industry
- **Expert Opinion:** Subject matter experts believe it will probably occur

### 3 - Possible
- **Probability:** 40-60% chance of occurrence
- **Frequency:** Might occur occasionally (every few years)
- **Historical:** Has occurred occasionally in the organization or frequently in industry
- **Expert Opinion:** Could happen, but not certain

### 2 - Unlikely
- **Probability:** 20-40% chance of occurrence
- **Frequency:** Rare but possible (once every 5-10 years)
- **Historical:** Has occurred rarely in the organization, occasionally in industry
- **Expert Opinion:** Not expected but cannot be ruled out

### 1 - Very Unlikely
- **Probability:** < 20% chance of occurrence
- **Frequency:** Extremely rare (less than once every 10 years)
- **Historical:** Virtually no history of occurrence
- **Expert Opinion:** Almost impossible but theoretically possible

---

## Impact Scale Definitions

### 5 - Catastrophic
**Financial:**
- Major financial loss (> 10% of annual revenue)
- Business viability threatened
- Significant market share loss

**Operational:**
- Complete operational shutdown
- Inability to deliver products/services
- Major supply chain disruption

**Safety/Health:**
- Multiple fatalities or permanent disabilities
- Widespread health impacts
- Regulatory shutdown

**Reputation:**
- Irreparable brand damage
- Loss of major customer base
- National/international media coverage

**Regulatory/Legal:**
- Major regulatory sanctions
- Criminal prosecution
- Business license revocation

### 4 - Major
**Financial:**
- Significant financial loss (5-10% of annual revenue)
- Major budget overruns
- Substantial unplanned costs

**Operational:**
- Major service disruption
- Significant productivity loss
- Extended recovery time (weeks)

**Safety/Health:**
- Single fatality or permanent disability
- Multiple serious injuries
- Long-term health impacts

**Reputation:**
- Significant negative publicity
- Loss of key customers
- Regional media coverage

**Regulatory/Legal:**
- Significant fines or penalties
- Major compliance violations
- Legal proceedings initiated

### 3 - Moderate
**Financial:**
- Moderate financial loss (1-5% of annual revenue)
- Budget overruns
- Unplanned costs requiring management approval

**Operational:**
- Moderate service disruption
- Reduced productivity
- Recovery time measured in days

**Safety/Health:**
- Serious injury requiring hospitalization
- Temporary disability
- Moderate health impacts

**Reputation:**
- Local negative publicity
- Customer complaints
- Minor brand impact

**Regulatory/Legal:**
- Moderate fines
- Compliance violations requiring corrective action
- Formal warnings received

### 2 - Minor
**Financial:**
- Minor financial loss (< 1% of annual revenue)
- Manageable within existing budgets
- Small unplanned costs

**Operational:**
- Minor service disruption
- Temporary productivity impact
- Quick recovery (hours)

**Safety/Health:**
- Minor injury requiring first aid
- No lost time
- Temporary discomfort

**Reputation:**
- Isolated customer dissatisfaction
- Minimal external awareness
- Internal complaints only

**Regulatory/Legal:**
- Minor compliance issues
- Administrative warnings
- Easily correctable violations

### 1 - Negligible
**Financial:**
- Negligible financial impact
- Absorbed in routine operations
- No budget impact

**Operational:**
- No significant disruption
- Minimal impact on operations
- Immediate recovery

**Safety/Health:**
- No injury
- No health impact
- No first aid required

**Reputation:**
- No external impact
- No customer awareness
- No complaints

**Regulatory/Legal:**
- No compliance issues
- No regulatory interest
- No legal exposure

---

## Residual Risk Assessment

After implementing mitigation controls, reassess the risk using the same matrix:

### Mitigation Effectiveness Example

**Initial Risk:**
- Likelihood: 4 (Likely)
- Impact: 4 (Major)
- **Risk Score: 16 (HIGH) 🟠**

**After Controls:**
- Residual Likelihood: 2 (Unlikely) - Controls reduce probability
- Residual Impact: 3 (Moderate) - Controls reduce severity
- **Residual Risk Score: 6 (MEDIUM) 🟡**

**Result:** Risk successfully reduced from HIGH to MEDIUM through effective controls.

---

## Decision Making Guidelines

### Risk Acceptance Criteria

| Risk Level | Acceptance | Authority Required |
|-----------|-----------|-------------------|
| 🔴 CRITICAL | Never accept without exceptional justification | Executive Board |
| 🟠 HIGH | Rarely accept; require comprehensive mitigation | Senior Management |
| 🟡 MEDIUM | May accept with documented mitigation plan | Line Management |
| 🟢 LOW | Generally acceptable with monitoring | Operational Management |

### Mitigation Investment Guidelines

**Return on Risk Investment (RORI):**
```
RORI = (Risk Reduction Value) / (Mitigation Cost)
```

- Prioritize mitigation efforts for HIGH and CRITICAL risks
- MEDIUM risks should be evaluated for cost-effective mitigation
- LOW risks typically do not justify significant investment

---

## Best Practices

### 1. Consistent Assessment
- Use the same scales across all risk assessments
- Document the rationale for likelihood and impact ratings
- Involve subject matter experts in assessments
- Review assessments periodically

### 2. Documentation
- Record all assumptions
- Document evidence supporting ratings
- Maintain audit trail of changes
- Include context and environmental factors

### 3. Review and Update
- Reassess risks regularly based on their level:
  - Critical: Weekly
  - High: Bi-weekly to Monthly
  - Medium: Monthly to Quarterly
  - Low: Quarterly to Annually
- Update after significant organizational changes
- Review when new information becomes available

### 4. Mitigation Planning
- Focus resources on highest risks first
- Set SMART objectives for mitigation
- Assign clear ownership and accountability
- Monitor mitigation effectiveness
- Measure residual risk

### 5. Communication
- Use color coding for quick visual understanding
- Present risk matrix in management reviews
- Ensure stakeholders understand the methodology
- Report trends over time

---

## Common Risk Assessment Errors to Avoid

### ❌ Overestimating Likelihood
**Error:** Rating all potential risks as "Likely" or "Very Likely"
**Solution:** Use historical data and expert judgment objectively

### ❌ Impact Inflation
**Error:** Rating every impact as "Major" or "Catastrophic"
**Solution:** Calibrate against actual organizational impact definitions

### ❌ Ignoring Probability
**Error:** Focusing only on worst-case impact, ignoring how likely it is
**Solution:** Use both likelihood and impact equally in assessment

### ❌ Recency Bias
**Error:** Over-weighting recent events in likelihood assessment
**Solution:** Look at longer-term patterns and industry data

### ❌ Optimism Bias
**Error:** Underestimating risks to avoid dealing with them
**Solution:** Use independent review and diverse perspectives

---

## ISO 9001:2015 Alignment

This risk scoring methodology supports:

- **Clause 6.1.1** - Determination of risks and opportunities
- **Clause 6.1.2** - Planning actions to address risks
- **Clause 9.1** - Monitoring and measurement
- **Clause 9.3** - Management review

The systematic, documented approach provides evidence of:
- Risk-based thinking
- Proportional response to risk levels
- Monitoring and review processes
- Management accountability

---

## Quick Decision Tree

```
Is the Risk Score > 19?
├─ YES → 🔴 CRITICAL - Immediate action required
└─ NO → Is the Risk Score > 11?
    ├─ YES → 🟠 HIGH - Active mitigation needed
    └─ NO → Is the Risk Score > 5?
        ├─ YES → 🟡 MEDIUM - Planned mitigation and monitoring
        └─ NO → 🟢 LOW - Accept and monitor
```

---

## Contact and Support

For questions about risk assessment methodology:
- Review the Risk Management procedure in the QMS
- Consult with the Risk Management team
- Reference ISO 31000 Risk Management standard
- Escalate to Quality Manager for guidance

---

**Last Updated:** November 17, 2025  
**Version:** 1.0  
**Related Documents:**
- RISK_API_DOCUMENTATION.md
- P4_1_3_IMPLEMENTATION_SUMMARY.md
- ISO 9001:2015 Risk Management Procedure
