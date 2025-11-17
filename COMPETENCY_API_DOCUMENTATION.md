# Competency Management API Documentation

## Overview

The Competency Management API provides endpoints for managing competency definitions and tracking user competency achievements. This supports ISO 9001:2015 competence management requirements including training completions, validity periods, and expiration rules.

## Base URL

```
/api/competencies
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Competency Definitions

#### Create Competency

Create a new competency definition.

**Endpoint:** `POST /api/competencies`

**Authorization:** Admin or Manager role required

**Request Body:**

```json
{
  "competencyCode": "COMP-001",
  "name": "ISO 9001 Lead Auditor",
  "description": "Competency for conducting ISO 9001 audits",
  "category": "Quality",
  "subCategory": "Auditing",
  "competencyType": "Certification",
  "level": "Advanced",
  "version": "1.0",
  "isRegulatory": true,
  "isMandatory": false,
  "mandatoryForRoles": "auditor,manager",
  "prerequisiteCompetencies": "10,11",
  "hasExpiry": true,
  "defaultValidityMonths": 36,
  "renewalRequired": true,
  "relatedTrainingIds": "5,12",
  "minimumTrainingHours": 40.0,
  "requiresAssessment": true,
  "assessmentCriteria": "Written exam and practical assessment",
  "minimumScore": 80.0,
  "status": "active",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "notes": "Required for internal audit team members",
  "externalReference": "ISO 19011:2018"
}
```

**Required Fields:**
- `competencyCode` (string, max 100 chars): Unique identifier
- `name` (string, max 500 chars): Competency name
- `category` (string, max 200 chars): Category (e.g., Quality, Safety, Technical)
- `status` (string): One of: `active`, `deprecated`, `draft`, `obsolete`
- `isRegulatory` (boolean): Whether this is a regulatory requirement
- `isMandatory` (boolean): Whether mandatory for certain roles
- `hasExpiry` (boolean): Whether competency expires
- `renewalRequired` (boolean): Whether renewal is required
- `requiresAssessment` (boolean): Whether assessment is required

**Response:**

```json
{
  "message": "Competency created successfully",
  "id": 1
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Validation error
- `401`: Not authenticated
- `403`: Insufficient permissions
- `500`: Server error

---

#### Get All Competencies

Retrieve all competencies with optional filtering and pagination.

**Endpoint:** `GET /api/competencies`

**Authorization:** All authenticated users

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `deprecated`, `draft`, `obsolete`)
- `category` (optional): Filter by category
- `isMandatory` (optional): Filter by mandatory flag (`true`, `false`)
- `isRegulatory` (optional): Filter by regulatory flag (`true`, `false`)
- `page` (optional, default: 1): Page number (min 1)
- `limit` (optional, default: 50, max: 100): Results per page

**Example Request:**

```
GET /api/competencies?status=active&category=Quality&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "competencyCode": "COMP-001",
      "name": "ISO 9001 Lead Auditor",
      "description": "Competency for conducting ISO 9001 audits",
      "category": "Quality",
      "status": "active",
      "isRegulatory": true,
      "isMandatory": false,
      "hasExpiry": true,
      "defaultValidityMonths": 36,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid pagination parameters
- `401`: Not authenticated
- `500`: Server error

---

#### Get Competency by ID

Retrieve a specific competency by ID.

**Endpoint:** `GET /api/competencies/:id`

**Authorization:** All authenticated users

**Path Parameters:**
- `id` (integer): Competency ID

**Response:**

```json
{
  "id": 1,
  "competencyCode": "COMP-001",
  "name": "ISO 9001 Lead Auditor",
  "description": "Competency for conducting ISO 9001 audits",
  "category": "Quality",
  "subCategory": "Auditing",
  "competencyType": "Certification",
  "level": "Advanced",
  "status": "active",
  "isRegulatory": true,
  "isMandatory": false,
  "hasExpiry": true,
  "defaultValidityMonths": 36,
  "renewalRequired": true,
  "requiresAssessment": true,
  "minimumScore": 80.0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Competency not found
- `500`: Server error

---

#### Update Competency

Update an existing competency definition.

**Endpoint:** `PUT /api/competencies/:id`

**Authorization:** Admin or Manager role required

**Path Parameters:**
- `id` (integer): Competency ID

**Request Body:**

```json
{
  "name": "Updated Competency Name",
  "status": "deprecated",
  "notes": "Updated notes",
  "obsoleteDate": "2024-12-31T00:00:00Z"
}
```

**Response:**

```json
{
  "message": "Competency updated successfully"
}
```

**Status Codes:**
- `200`: Updated successfully
- `400`: Validation error
- `401`: Not authenticated
- `403`: Insufficient permissions
- `404`: Competency not found
- `500`: Server error

---

### User Competency Assignments

#### Assign Competency to User

Assign a competency to a user with acquisition details.

**Endpoint:** `POST /api/competencies/assignments`

**Authorization:** Admin or Manager role required

**Request Body:**

```json
{
  "userId": 10,
  "competencyId": 1,
  "acquiredDate": "2024-01-15T00:00:00Z",
  "acquisitionMethod": "Training",
  "trainingId": 5,
  "trainingAttendeeId": 25,
  "certificateId": 15,
  "proficiencyLevel": "Advanced",
  "assessmentScore": 92.5,
  "assessedBy": 2,
  "assessedAt": "2024-01-15T00:00:00Z",
  "assessmentNotes": "Excellent performance on practical assessment",
  "effectiveDate": "2024-01-15T00:00:00Z",
  "expiryDate": "2027-01-15T00:00:00Z",
  "status": "active",
  "verified": true,
  "verifiedBy": 2,
  "verifiedAt": "2024-01-16T00:00:00Z",
  "verificationMethod": "Direct observation",
  "evidenceDescription": "Training certificate and assessment results",
  "notes": "Initial competency assessment"
}
```

**Required Fields:**
- `userId` (integer): User ID
- `competencyId` (integer): Competency ID
- `acquiredDate` (ISO 8601 date): Date competency was acquired
- `effectiveDate` (ISO 8601 date): Date competency becomes effective
- `status` (string): One of: `active`, `expired`, `suspended`, `revoked`, `pending`
- `verified` (boolean): Verification status

**Auto-calculated Fields:**
- If `expiryDate` is not provided and the competency has `hasExpiry=true` and `defaultValidityMonths`, the expiry date will be automatically calculated
- If renewal is required, `nextRenewalDate` will be set to the expiry date

**Response:**

```json
{
  "message": "Competency assigned to user successfully",
  "id": 42
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Validation error
- `401`: Not authenticated
- `403`: Insufficient permissions
- `500`: Server error

---

#### Get User Competencies

Retrieve all competencies for a specific user.

**Endpoint:** `GET /api/competencies/users/:userId`

**Authorization:** 
- Users can view their own competencies
- Admin and Manager roles can view any user's competencies

**Path Parameters:**
- `userId` (integer): User ID

**Query Parameters:**
- `status` (optional): Filter by status
- `isExpired` (optional): Filter by expiry status (`true`, `false`)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Results per page

**Example Request:**

```
GET /api/competencies/users/10?status=active&isExpired=false&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": 42,
      "userId": 10,
      "competencyId": 1,
      "competencyName": "ISO 9001 Lead Auditor",
      "competencyCode": "COMP-001",
      "competencyCategory": "Quality",
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "trainingTitle": "ISO 9001:2015 Lead Auditor Course",
      "certificateNumber": "CERT-2024-001",
      "acquiredDate": "2024-01-15T00:00:00Z",
      "effectiveDate": "2024-01-15T00:00:00Z",
      "expiryDate": "2027-01-15T00:00:00Z",
      "isExpired": false,
      "status": "active",
      "proficiencyLevel": "Advanced",
      "assessmentScore": 92.5,
      "verified": true,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `403`: Forbidden (trying to view another user's competencies without permission)
- `500`: Server error

---

#### Get Expiring Competencies for User

Retrieve competencies that are expiring soon for a specific user.

**Endpoint:** `GET /api/competencies/users/:userId/expiring`

**Authorization:** 
- Users can view their own expiring competencies
- Admin and Manager roles can view any user's expiring competencies

**Path Parameters:**
- `userId` (integer): User ID

**Query Parameters:**
- `daysThreshold` (optional, default: 30): Number of days ahead to check for expiring competencies

**Example Request:**

```
GET /api/competencies/users/10/expiring?daysThreshold=60
```

**Response:**

```json
{
  "data": [
    {
      "id": 42,
      "userId": 10,
      "competencyId": 1,
      "competencyName": "ISO 9001 Lead Auditor",
      "competencyCode": "COMP-001",
      "competencyCategory": "Quality",
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "expiryDate": "2024-03-15T00:00:00Z",
      "status": "active"
    }
  ],
  "total": 1
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `403`: Forbidden
- `500`: Server error

---

#### Get Users by Competency

Retrieve all users who have a specific competency.

**Endpoint:** `GET /api/competencies/:competencyId/users`

**Authorization:** All authenticated users

**Path Parameters:**
- `competencyId` (integer): Competency ID

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Results per page

**Example Request:**

```
GET /api/competencies/1/users?status=active&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": 42,
      "userId": 10,
      "competencyId": 1,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "competencyName": "ISO 9001 Lead Auditor",
      "proficiencyLevel": "Advanced",
      "effectiveDate": "2024-01-15T00:00:00Z",
      "expiryDate": "2027-01-15T00:00:00Z",
      "status": "active",
      "verified": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

#### Update User Competency

Update a user's competency assignment.

**Endpoint:** `PUT /api/competencies/assignments/:id`

**Authorization:** Admin or Manager role required

**Path Parameters:**
- `id` (integer): User competency assignment ID

**Request Body:**

```json
{
  "status": "expired",
  "verified": true,
  "verifiedBy": 2,
  "verifiedAt": "2024-01-20T00:00:00Z",
  "statusReason": "Certificate expired, renewal in progress",
  "notes": "Renewal training scheduled for next month"
}
```

**Note:** When updating `status`, the system automatically tracks `statusChangedBy` and `statusChangedAt`.

**Response:**

```json
{
  "message": "User competency updated successfully"
}
```

**Status Codes:**
- `200`: Updated successfully
- `400`: Validation error
- `401`: Not authenticated
- `403`: Insufficient permissions
- `500`: Server error

---

## Common Error Responses

### 400 Bad Request

```json
{
  "errors": [
    {
      "msg": "Competency code is required and must not exceed 100 characters",
      "param": "competencyCode",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "User not authenticated"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden: Cannot view other users competencies"
}
```

### 404 Not Found

```json
{
  "error": "Competency not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create Competency"
}
```

---

## Data Models

### Competency

```typescript
interface Competency {
  id?: number;
  competencyCode: string;
  name: string;
  description?: string;
  category: string;
  subCategory?: string;
  competencyType?: string;
  level?: string;
  version?: string;
  isRegulatory: boolean;
  isMandatory: boolean;
  mandatoryForRoles?: string;
  prerequisiteCompetencies?: string;
  hasExpiry: boolean;
  defaultValidityMonths?: number;
  renewalRequired: boolean;
  relatedTrainingIds?: string;
  minimumTrainingHours?: number;
  requiresAssessment: boolean;
  assessmentCriteria?: string;
  minimumScore?: number;
  status: 'active' | 'deprecated' | 'draft' | 'obsolete';
  effectiveDate?: Date;
  obsoleteDate?: Date;
  notes?: string;
  externalReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
}
```

### UserCompetency

```typescript
interface UserCompetency {
  id?: number;
  userId: number;
  competencyId: number;
  acquiredDate: Date;
  acquisitionMethod?: string;
  trainingId?: number;
  trainingAttendeeId?: number;
  certificateId?: number;
  proficiencyLevel?: string;
  assessmentScore?: number;
  assessedBy?: number;
  assessedAt?: Date;
  assessmentNotes?: string;
  effectiveDate: Date;
  expiryDate?: Date;
  isExpired?: boolean;
  lastRenewalDate?: Date;
  nextRenewalDate?: Date;
  renewalCount?: number;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  statusReason?: string;
  statusChangedAt?: Date;
  statusChangedBy?: number;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: Date;
  verificationMethod?: string;
  verificationNotes?: string;
  evidenceDescription?: string;
  evidenceFileIds?: string;
  notes?: string;
  externalReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: number;
}
```

---

## Usage Examples

### Example 1: Create a Mandatory Safety Competency

```bash
curl -X POST http://localhost:3000/api/competencies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "competencyCode": "SAFE-001",
    "name": "Workplace Safety Awareness",
    "description": "Basic workplace safety and emergency procedures",
    "category": "Safety",
    "status": "active",
    "isRegulatory": true,
    "isMandatory": true,
    "mandatoryForRoles": "user,manager",
    "hasExpiry": true,
    "defaultValidityMonths": 12,
    "renewalRequired": true,
    "requiresAssessment": true,
    "minimumScore": 80.0
  }'
```

### Example 2: Assign Competency to User After Training

```bash
curl -X POST http://localhost:3000/api/competencies/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 25,
    "competencyId": 1,
    "acquiredDate": "2024-02-01",
    "acquisitionMethod": "Training",
    "trainingId": 10,
    "trainingAttendeeId": 150,
    "effectiveDate": "2024-02-01",
    "status": "active",
    "verified": false,
    "assessmentScore": 85.5,
    "assessedBy": 2,
    "assessedAt": "2024-02-01"
  }'
```

### Example 3: Check User's Expiring Competencies

```bash
curl -X GET "http://localhost:3000/api/competencies/users/25/expiring?daysThreshold=90" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Find All Users with a Specific Competency

```bash
curl -X GET "http://localhost:3000/api/competencies/1/users?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Integration Notes

### Integration with Training Management

The competency system integrates with the existing training management module:
- Link competencies to trainings via `relatedTrainingIds`
- Auto-assign competencies when training is completed
- Reference training records in user competency assignments

### Integration with Certificate Management

User competencies can reference certificates:
- Link to training certificates via `certificateId`
- Track certificate numbers and expiry dates
- Store certificate files as attachments

### Audit Trail

All competency operations are logged to the audit log system:
- Competency definition changes
- User competency assignments
- Status changes and verifications

---

## Best Practices

1. **Competency Codes**: Use a consistent naming convention (e.g., `DEPT-NNN`)
2. **Categories**: Define standard categories organization-wide
3. **Expiry Management**: Set appropriate validity periods and enable renewal reminders
4. **Assessment**: Document assessment criteria clearly for consistency
5. **Verification**: Always verify competencies before marking as complete
6. **Evidence**: Maintain evidence documentation for regulatory compliance
7. **Prerequisites**: Define prerequisite competencies to enforce learning paths

---

## Rate Limiting

All endpoints are subject to rate limiting:
- General API: 100 requests per 15 minutes per IP
- Create/Update operations: Additional rate limiting may apply

---

## Changelog

### Version 1.0.0 (2024-11-17)
- Initial release
- Competency definition management
- User competency tracking
- Expiry and renewal management
- Verification workflows
