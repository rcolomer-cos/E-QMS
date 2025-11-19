# Risk Management API Documentation

## Overview
The Risk Management API provides comprehensive endpoints for managing risk items in the ISO 9001 Quality Management System. This API enables risk identification, assessment, mitigation planning, and monitoring with full audit trail support and role-based access control (RBAC).

## Base URL
```
/api/risks
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Risk Status Values
- `identified` - Risk has been identified but not yet assessed
- `assessed` - Risk has been assessed with likelihood and impact scores
- `mitigating` - Risk mitigation actions are in progress
- `monitoring` - Risk is being actively monitored
- `closed` - Risk has been closed (mitigation successful or risk no longer relevant)
- `accepted` - Risk has been accepted (no mitigation planned)

## Risk Level Values
Risk levels are automatically calculated based on risk score (likelihood × impact):
- `low` - Risk score 1-5
- `medium` - Risk score 6-11
- `high` - Risk score 12-19
- `critical` - Risk score 20-25

## Endpoints

### 1. Create Risk
Creates a new risk entry in the risk register.

**Endpoint:** `POST /api/risks`

**Authorization:** Requires ADMIN, MANAGER, or AUDITOR role

**Rate Limiting:** Applied

**Request Body:**
```json
{
  "riskNumber": "RISK-2024-001",
  "title": "Supply chain disruption",
  "description": "Potential disruption in raw material supply from primary vendor",
  "category": "operational",
  "source": "process review",
  "likelihood": 3,
  "impact": 4,
  "mitigationStrategy": "Identify alternative suppliers and maintain safety stock",
  "mitigationActions": "1. Research backup suppliers\n2. Increase inventory levels\n3. Establish vendor monitoring",
  "contingencyPlan": "Switch to alternative suppliers within 48 hours if primary supply fails",
  "riskOwner": 5,
  "department": "Procurement",
  "process": "Supply Chain Management",
  "status": "identified",
  "identifiedDate": "2024-01-15T10:00:00Z",
  "reviewFrequency": 90,
  "affectedStakeholders": "Production team, Quality team, Customers",
  "regulatoryImplications": "May impact product availability and delivery commitments"
}
```

**Response:** `201 Created`
```json
{
  "message": "Risk created successfully",
  "id": 1
}
```

**Validation Rules:**
- `riskNumber`: Required, 1-100 characters, must be unique
- `title`: Required, 1-500 characters
- `description`: Required, 1-2000 characters
- `category`: Required, 1-200 characters
- `source`: Optional, max 200 characters
- `likelihood`: Required, integer 1-5
- `impact`: Required, integer 1-5
- `riskOwner`: Required, valid user ID
- `status`: Required, valid status value
- `identifiedDate`: Required, valid ISO8601 date
- `reviewFrequency`: Optional, positive integer (days)

---

### 2. Get All Risks
Retrieves all risks with optional filtering and sorting.

**Endpoint:** `GET /api/risks`

**Authorization:** Accessible to all authenticated users

**Query Parameters:**
- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `riskLevel` (optional): Filter by risk level (low, medium, high, critical)
- `department` (optional): Filter by department
- `riskOwner` (optional): Filter by risk owner user ID
- `minRiskScore` (optional): Filter by minimum risk score
- `maxRiskScore` (optional): Filter by maximum risk score
- `sortBy` (optional): Sort field - one of: `riskScore`, `residualRiskScore`, `identifiedDate`, `nextReviewDate`, `title` (default: `riskScore`)
- `sortOrder` (optional): Sort order - `ASC` or `DESC` (default: `DESC`)
- `page` (optional): Page number for pagination (default: 1, min: 1)
- `limit` (optional): Results per page (default: 10, min: 1, max: 100)

**Example Request:**
```
GET /api/risks?status=monitoring&riskLevel=high&sortBy=riskScore&sortOrder=DESC&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "riskNumber": "RISK-2024-001",
      "title": "Supply chain disruption",
      "description": "Potential disruption in raw material supply from primary vendor",
      "category": "operational",
      "source": "process review",
      "likelihood": 3,
      "impact": 4,
      "riskScore": 12,
      "riskLevel": "high",
      "mitigationStrategy": "Identify alternative suppliers and maintain safety stock",
      "mitigationActions": "1. Research backup suppliers\n2. Increase inventory levels\n3. Establish vendor monitoring",
      "contingencyPlan": "Switch to alternative suppliers within 48 hours if primary supply fails",
      "riskOwner": 5,
      "department": "Procurement",
      "process": "Supply Chain Management",
      "status": "monitoring",
      "identifiedDate": "2024-01-15T10:00:00.000Z",
      "reviewDate": "2024-02-15T10:00:00.000Z",
      "nextReviewDate": "2024-05-15T10:00:00.000Z",
      "reviewFrequency": 90,
      "residualLikelihood": 2,
      "residualImpact": 2,
      "residualRiskScore": 4,
      "affectedStakeholders": "Production team, Quality team, Customers",
      "regulatoryImplications": "May impact product availability and delivery commitments",
      "relatedRisks": null,
      "createdBy": 1,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-02-15T14:30:00.000Z",
      "lastReviewedBy": 5,
      "closedDate": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

### 3. Get Risk by ID
Retrieves a specific risk by its ID.

**Endpoint:** `GET /api/risks/:id`

**Authorization:** Accessible to all authenticated users

**URL Parameters:**
- `id`: Risk ID (integer)

**Response:** `200 OK`
```json
{
  "id": 1,
  "riskNumber": "RISK-2024-001",
  "title": "Supply chain disruption",
  "description": "Potential disruption in raw material supply from primary vendor",
  "category": "operational",
  "source": "process review",
  "likelihood": 3,
  "impact": 4,
  "riskScore": 12,
  "riskLevel": "high",
  "mitigationStrategy": "Identify alternative suppliers and maintain safety stock",
  "mitigationActions": "1. Research backup suppliers\n2. Increase inventory levels\n3. Establish vendor monitoring",
  "contingencyPlan": "Switch to alternative suppliers within 48 hours if primary supply fails",
  "riskOwner": 5,
  "department": "Procurement",
  "process": "Supply Chain Management",
  "status": "monitoring",
  "identifiedDate": "2024-01-15T10:00:00.000Z",
  "reviewDate": "2024-02-15T10:00:00.000Z",
  "nextReviewDate": "2024-05-15T10:00:00.000Z",
  "reviewFrequency": 90,
  "residualLikelihood": 2,
  "residualImpact": 2,
  "residualRiskScore": 4,
  "affectedStakeholders": "Production team, Quality team, Customers",
  "regulatoryImplications": "May impact product availability and delivery commitments",
  "relatedRisks": null,
  "createdBy": 1,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-02-15T14:30:00.000Z",
  "lastReviewedBy": 5,
  "closedDate": null
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Risk not found"
}
```

---

### 4. Update Risk
Updates an existing risk entry.

**Endpoint:** `PUT /api/risks/:id`

**Authorization:** Requires ADMIN, MANAGER, or AUDITOR role

**URL Parameters:**
- `id`: Risk ID (integer)

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "likelihood": 2,
  "impact": 3,
  "mitigationStrategy": "Updated mitigation strategy",
  "residualLikelihood": 1,
  "residualImpact": 2,
  "reviewDate": "2024-03-15T10:00:00Z",
  "nextReviewDate": "2024-06-15T10:00:00Z",
  "lastReviewedBy": 5
}
```

**Response:** `200 OK`
```json
{
  "message": "Risk updated successfully"
}
```

**Notes:**
- When `likelihood` or `impact` is updated, `riskLevel` is automatically recalculated
- `riskScore` and `residualRiskScore` are calculated fields and cannot be directly updated
- All updates are logged in the audit trail

**Error Response:** `404 Not Found`
```json
{
  "error": "Risk not found"
}
```

---

### 5. Update Risk Status
Updates the status of a risk.

**Endpoint:** `PUT /api/risks/:id/status`

**Authorization:** 
- ADMIN, MANAGER, and AUDITOR can change status to any value except `closed` and `accepted`
- Only ADMIN and MANAGER can change status to `closed` or `accepted`

**URL Parameters:**
- `id`: Risk ID (integer)

**Request Body:**
```json
{
  "status": "monitoring"
}
```

**Response:** `200 OK`
```json
{
  "message": "Risk status updated successfully",
  "status": "monitoring"
}
```

**Notes:**
- When status is changed to `closed`, the `closedDate` is automatically set to the current date
- Status changes are logged in the audit trail with detailed change information

**Error Response:** `403 Forbidden` (when trying to close/accept without permission)
```json
{
  "error": "Only Admin and Manager can close or accept risks"
}
```

---

### 6. Delete Risk
Deletes a risk entry from the system.

**Endpoint:** `DELETE /api/risks/:id`

**Authorization:** Requires ADMIN role only

**URL Parameters:**
- `id`: Risk ID (integer)

**Response:** `200 OK`
```json
{
  "message": "Risk deleted successfully"
}
```

**Notes:**
- Deletion is permanent and logged in the audit trail
- Only administrators can delete risks to maintain data integrity

**Error Response:** `404 Not Found`
```json
{
  "error": "Risk not found"
}
```

---

### 7. Get Risk Statistics
Retrieves aggregate statistics about risks.

**Endpoint:** `GET /api/risks/statistics`

**Authorization:** Accessible to all authenticated users

**Response:** `200 OK`
```json
{
  "totalRisks": 25,
  "byStatus": {
    "identified": 3,
    "assessed": 5,
    "mitigating": 8,
    "monitoring": 6,
    "closed": 2,
    "accepted": 1
  },
  "byLevel": {
    "low": 5,
    "medium": 10,
    "high": 8,
    "critical": 2
  },
  "byCategory": {
    "operational": 10,
    "financial": 5,
    "compliance": 4,
    "strategic": 6
  }
}
```

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Endpoint | ADMIN | MANAGER | AUDITOR | USER | VIEWER |
|----------|-------|---------|---------|------|--------|
| POST /api/risks | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /api/risks | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/risks/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /api/risks/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /api/risks/:id/status | ✅ | ✅ | ✅* | ❌ | ❌ |
| DELETE /api/risks/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /api/risks/statistics | ✅ | ✅ | ✅ | ✅ | ✅ |

*AUDITOR can change status to any value except `closed` and `accepted`

---

## Risk Scoring Logic

### Risk Score Calculation
```
riskScore = likelihood × impact
```
Where:
- `likelihood`: Integer from 1 (very unlikely) to 5 (very likely)
- `impact`: Integer from 1 (negligible) to 5 (catastrophic)
- `riskScore`: Calculated value from 1 to 25

### Risk Level Determination
Based on the calculated risk score:
- **Low** (1-5): Minor risks that require monitoring
- **Medium** (6-11): Moderate risks requiring attention
- **High** (12-19): Significant risks requiring active mitigation
- **Critical** (20-25): Severe risks requiring immediate action

### Residual Risk
After mitigation actions are implemented:
```
residualRiskScore = residualLikelihood × residualImpact
```
This represents the remaining risk after controls are in place.

---

## Audit Trail
All risk operations (create, update, delete, status changes) are automatically logged in the audit trail with:
- User who performed the action
- Timestamp of the action
- Action category: `RISK`
- Entity type: `Risk`
- Entity identifier (risk number)
- Old and new values for updates
- IP address and user agent

---

## Error Responses

### 400 Bad Request
Invalid input data or validation errors.
```json
{
  "errors": [
    {
      "msg": "Likelihood must be an integer between 1 and 5",
      "param": "likelihood",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
Missing or invalid authentication token.
```json
{
  "error": "User not authenticated"
}
```

### 403 Forbidden
User does not have required permissions.
```json
{
  "error": "Only Admin and Manager can close or accept risks"
}
```

### 404 Not Found
Risk not found.
```json
{
  "error": "Risk not found"
}
```

### 500 Internal Server Error
Server error during processing.
```json
{
  "error": "Failed to create risk"
}
```

---

## Best Practices

1. **Risk Identification**: Use clear, descriptive titles and comprehensive descriptions
2. **Risk Assessment**: Be realistic and consistent when assigning likelihood and impact scores
3. **Mitigation Planning**: Document specific, actionable mitigation strategies
4. **Regular Reviews**: Set appropriate review frequencies based on risk level
5. **Status Management**: Update status as mitigation progresses
6. **Residual Risk**: Track residual risk after controls are implemented
7. **Documentation**: Keep detailed records of stakeholders and regulatory implications

---

## Integration Examples

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

// Create a new risk
const createRisk = async () => {
  const response = await axios.post('/api/risks', {
    riskNumber: 'RISK-2024-001',
    title: 'Supply chain disruption',
    description: 'Potential disruption in raw material supply',
    category: 'operational',
    likelihood: 3,
    impact: 4,
    riskOwner: 5,
    status: 'identified',
    identifiedDate: new Date().toISOString()
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

// Get risks with filtering
const getRisks = async () => {
  const response = await axios.get('/api/risks', {
    params: {
      status: 'monitoring',
      riskLevel: 'high',
      sortBy: 'riskScore',
      sortOrder: 'DESC',
      page: 1,
      limit: 20
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};
```

---

## Change Log

### Version 1.0.0 (2024-11-17)
- Initial implementation of Risk Management CRUD API
- Full CRUD operations with validation
- RBAC enforcement
- Automatic risk score and level calculation
- Advanced filtering and sorting
- Comprehensive audit trail
- Statistics endpoint
