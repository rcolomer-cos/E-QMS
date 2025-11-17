# P4:3:2 — Acceptance Criteria Model Implementation

## Overview
This document describes the implementation of the acceptance criteria model for the E-QMS system. The acceptance criteria model defines pass/fail rules, tolerances, and standardized criteria that can be linked to inspection types.

## Database Schema

### AcceptanceCriteria Table
The `AcceptanceCriteria` table stores comprehensive validation rules for inspections:

**Key Fields:**
- `criteriaCode`: Unique identifier for the criteria
- `criteriaName`: Descriptive name
- `inspectionType`: Type of inspection this criteria applies to
- `parameterName`: Name of the parameter being measured
- `measurementType`: Type of measurement (quantitative, qualitative, binary, range, checklist)
- `ruleType`: Type of validation rule (range, min, max, exact, tolerance, pass_fail)
- `minValue`, `maxValue`: Numeric range bounds
- `targetValue`, `tolerancePlus`, `toleranceMinus`: Tolerance-based validation
- `severity`: Importance level (critical, major, minor, normal)
- `mandatory`: Whether the criteria must be met
- `failureAction`: Action to take on failure

**Indexes:**
- Optimized for inspection type lookups
- Equipment category filtering
- Status and lifecycle queries
- Severity-based searches

## API Endpoints

### Base Path: `/api/acceptance-criteria`

#### Create Acceptance Criteria
- **POST** `/`
- **Auth**: Admin, Quality Manager
- **Body**: AcceptanceCriteria object
- **Returns**: { message, id }

#### Get All Acceptance Criteria
- **GET** `/`
- **Query Params**: inspectionType, equipmentCategory, status, severity, mandatory, safetyRelated, regulatoryRequirement, measurementType, page, limit
- **Returns**: { data: AcceptanceCriteria[], pagination }

#### Get Active Criteria
- **GET** `/active`
- **Returns**: AcceptanceCriteria[]

#### Get Mandatory Criteria
- **GET** `/mandatory`
- **Returns**: AcceptanceCriteria[]

#### Get Safety-Related Criteria
- **GET** `/safety-related`
- **Returns**: AcceptanceCriteria[]

#### Get by Inspection Type
- **GET** `/inspection-type/:inspectionType`
- **Returns**: AcceptanceCriteria[]

#### Get by Criteria Code
- **GET** `/code/:criteriaCode`
- **Returns**: AcceptanceCriteria

#### Get by ID
- **GET** `/:id`
- **Returns**: AcceptanceCriteria

#### Validate Measurement
- **POST** `/:id/validate`
- **Body**: { measuredValue }
- **Returns**: { passed: boolean, message: string }

#### Update Criteria
- **PUT** `/:id`
- **Auth**: Admin, Quality Manager
- **Body**: Partial AcceptanceCriteria
- **Returns**: { message }

#### Delete Criteria
- **DELETE** `/:id`
- **Auth**: Admin, Quality Manager
- **Returns**: { message }

## Validation Logic

The model includes built-in validation for different rule types:

### Range Validation
Checks if a value falls within min and max bounds:
```typescript
passed = value >= minValue && value <= maxValue
```

### Tolerance Validation
Checks if a value is within tolerance of a target:
```typescript
minAllowed = targetValue - toleranceMinus
maxAllowed = targetValue + tolerancePlus
passed = value >= minAllowed && value <= maxAllowed
```

### Min/Max Validation
Checks single bound:
```typescript
passed = value >= minValue  // for MIN
passed = value <= maxValue  // for MAX
```

### Pass/Fail Validation
Boolean or string-based evaluation:
```typescript
passed = value === true || value.toLowerCase() === 'pass'
```

## Frontend Integration

The `acceptanceCriteriaService.ts` provides a complete service layer for interacting with the API:

```typescript
import acceptanceCriteriaService from '@/services/acceptanceCriteriaService';

// Get criteria for an inspection type
const criteria = await acceptanceCriteriaService
  .getAcceptanceCriteriaByInspectionType('routine');

// Validate a measurement
const result = await acceptanceCriteriaService
  .validateMeasurement(criteriaId, measuredValue);

if (!result.passed) {
  console.log('Validation failed:', result.message);
}
```

## Testing

Comprehensive unit tests cover:
- CRUD operations
- Filtering and querying
- Measurement validation for all rule types
- Edge cases (inactive criteria, expired criteria)

Test coverage: 17 tests, all passing

## Security

- Role-based access control (RBAC) for create, update, delete operations
- Input validation using express-validator
- Audit logging for all modifications
- Parameterized SQL queries to prevent injection

## ISO 9001 Compliance

The acceptance criteria model supports ISO 9001:2015 requirements by:
- Defining clear pass/fail criteria for inspections
- Maintaining traceability with versioning
- Supporting regulatory compliance flags
- Enabling safety-related criteria designation
- Providing audit trail through logging
- Allowing for approved override processes

## Usage Example

```typescript
// Create acceptance criteria for temperature check
const criteria = {
  criteriaCode: 'TEMP-RANGE-001',
  criteriaName: 'Operating Temperature Range',
  description: 'Equipment must operate within safe temperature range',
  inspectionType: 'routine',
  equipmentCategory: 'HVAC',
  parameterName: 'Operating Temperature',
  unit: '°C',
  measurementType: 'quantitative',
  ruleType: 'range',
  minValue: 18,
  maxValue: 24,
  severity: 'critical',
  mandatory: true,
  safetyRelated: true,
  failureAction: 'fail_inspection',
  status: 'active',
  effectiveDate: new Date(),
  version: '1.0',
};

const result = await acceptanceCriteriaService.createAcceptanceCriteria(criteria);
```

## Future Enhancements

Potential improvements for future iterations:
1. Support for checklist-based criteria with multiple sub-items
2. Statistical sampling criteria (e.g., Cp, Cpk calculations)
3. Time-based criteria (e.g., response time measurements)
4. Multi-parameter composite criteria
5. Automated criteria recommendation based on equipment type
6. Integration with training records for inspector qualifications
