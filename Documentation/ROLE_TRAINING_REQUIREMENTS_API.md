# Role Training Requirements API Documentation

This document describes the API endpoints for managing training requirements per role in the E-QMS system.

## Overview

The Role Training Requirements module allows administrators to define which competencies are mandatory for specific user roles. This supports ISO 9001:2015 competence management by:

1. Defining required competencies for each role
2. Tracking compliance with role-based training requirements
3. Identifying users with missing or outdated competencies
4. Managing priority levels and regulatory requirements

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Create Role Training Requirement](#create-role-training-requirement)
  - [Get All Requirements](#get-all-requirements)
  - [Get Requirement by ID](#get-requirement-by-id)
  - [Get Required Competencies for Role](#get-required-competencies-for-role)
  - [Get Missing Competencies for User](#get-missing-competencies-for-user)
  - [Get Users with Missing Competencies](#get-users-with-missing-competencies)
  - [Update Requirement](#update-requirement)
  - [Delete Requirement](#delete-requirement)
- [Data Models](#data-models)
- [Error Responses](#error-responses)

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Create Role Training Requirement

Create a new requirement that links a role to a required competency.

**Endpoint:** `POST /api/role-training-requirements`

**Authorization:** Admin, Manager, Superuser

**Request Body:**

```json
{
  "roleId": 2,
  "competencyId": 5,
  "isMandatory": true,
  "isRegulatory": false,
  "priority": "high",
  "gracePeriodDays": 30,
  "minimumProficiencyLevel": "Intermediate",
  "refreshFrequencyMonths": 12,
  "status": "active",
  "effectiveDate": "2025-01-01T00:00:00Z",
  "justification": "Required for quality auditor role",
  "notes": "Must be completed within 30 days of role assignment"
}
```

**Required Fields:**
- `roleId` (integer): ID of the role
- `competencyId` (integer): ID of the required competency
- `isMandatory` (boolean): Whether this is mandatory
- `isRegulatory` (boolean): Whether this is a regulatory requirement
- `priority` (string): One of 'critical', 'high', 'normal', 'low'

**Optional Fields:**
- `gracePeriodDays` (integer): Days allowed after role assignment
- `complianceDeadline` (datetime): Specific deadline
- `minimumProficiencyLevel` (string): Required proficiency level
- `refreshFrequencyMonths` (integer): How often to refresh
- `status` (string): 'active', 'inactive', 'deprecated' (default: 'active')
- `effectiveDate` (datetime): When requirement becomes effective
- `endDate` (datetime): When requirement expires
- `justification` (string): Why this is required
- `regulatoryReference` (string): Reference to regulation/standard
- `notes` (string): Additional notes

**Response:**

```json
{
  "message": "Role training requirement created successfully",
  "id": 15
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Competency already required for this role

---

### Get All Requirements

Retrieve all role training requirements with optional filtering.

**Endpoint:** `GET /api/role-training-requirements`

**Authorization:** All authenticated users

**Query Parameters:**
- `roleId` (integer): Filter by role
- `competencyId` (integer): Filter by competency
- `status` (string): Filter by status ('active', 'inactive', 'deprecated')
- `isMandatory` (boolean): Filter by mandatory status
- `isRegulatory` (boolean): Filter by regulatory status
- `priority` (string): Filter by priority level
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)

**Example Request:**

```
GET /api/role-training-requirements?roleId=2&status=active&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": 15,
      "roleId": 2,
      "competencyId": 5,
      "isMandatory": true,
      "isRegulatory": false,
      "priority": "high",
      "gracePeriodDays": 30,
      "minimumProficiencyLevel": "Intermediate",
      "refreshFrequencyMonths": 12,
      "status": "active",
      "effectiveDate": "2025-01-01T00:00:00Z",
      "justification": "Required for quality auditor role",
      "notes": "Must be completed within 30 days",
      "createdAt": "2025-11-17T10:00:00Z",
      "updatedAt": "2025-11-17T10:00:00Z",
      "createdBy": 1,
      "roleName": "manager",
      "roleDisplayName": "Manager",
      "competencyCode": "ISO9001-AUDIT",
      "competencyName": "ISO 9001 Internal Auditor",
      "competencyCategory": "Quality",
      "competencyHasExpiry": true,
      "competencyDefaultValidityMonths": 24
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

---

### Get Requirement by ID

Retrieve details of a specific requirement.

**Endpoint:** `GET /api/role-training-requirements/:id`

**Authorization:** All authenticated users

**Response:**

```json
{
  "id": 15,
  "roleId": 2,
  "competencyId": 5,
  "isMandatory": true,
  "isRegulatory": false,
  "priority": "high",
  "gracePeriodDays": 30,
  "minimumProficiencyLevel": "Intermediate",
  "refreshFrequencyMonths": 12,
  "status": "active",
  "effectiveDate": "2025-01-01T00:00:00Z",
  "justification": "Required for quality auditor role",
  "notes": "Must be completed within 30 days",
  "createdAt": "2025-11-17T10:00:00Z",
  "updatedAt": "2025-11-17T10:00:00Z",
  "createdBy": 1,
  "roleName": "manager",
  "roleDisplayName": "Manager",
  "competencyCode": "ISO9001-AUDIT",
  "competencyName": "ISO 9001 Internal Auditor",
  "competencyCategory": "Quality",
  "competencyHasExpiry": true,
  "competencyDefaultValidityMonths": 24
}
```

**Error Responses:**
- `404 Not Found`: Requirement not found

---

### Get Required Competencies for Role

Get all competencies required for a specific role.

**Endpoint:** `GET /api/role-training-requirements/roles/:roleId/competencies`

**Authorization:** All authenticated users

**Query Parameters:**
- `includeInactive` (boolean): Include inactive requirements (default: false)

**Example Request:**

```
GET /api/role-training-requirements/roles/2/competencies?includeInactive=false
```

**Response:**

```json
{
  "data": [
    {
      "id": 15,
      "roleId": 2,
      "competencyId": 5,
      "isMandatory": true,
      "isRegulatory": false,
      "priority": "high",
      "gracePeriodDays": 30,
      "status": "active",
      "roleName": "manager",
      "roleDisplayName": "Manager",
      "competencyCode": "ISO9001-AUDIT",
      "competencyName": "ISO 9001 Internal Auditor",
      "competencyCategory": "Quality",
      "competencyHasExpiry": true,
      "competencyDefaultValidityMonths": 24
    }
  ],
  "total": 1
}
```

---

### Get Missing Competencies for User

Get all missing, expired, or expiring-soon competencies for a specific user based on their role(s).

**Endpoint:** `GET /api/role-training-requirements/users/:userId/missing`

**Authorization:** Users can view their own; Admin/Manager/Superuser can view any

**Query Parameters:**
- `daysThreshold` (integer): Days until expiry to consider "expiring soon" (default: 30)

**Example Request:**

```
GET /api/role-training-requirements/users/25/missing?daysThreshold=30
```

**Response:**

```json
{
  "data": [
    {
      "userId": 25,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "roleId": 2,
      "roleName": "manager",
      "competencyId": 5,
      "competencyCode": "ISO9001-AUDIT",
      "competencyName": "ISO 9001 Internal Auditor",
      "competencyCategory": "Quality",
      "isMandatory": true,
      "isRegulatory": false,
      "priority": "high",
      "gracePeriodDays": 30,
      "complianceDeadline": null,
      "status": "missing",
      "daysUntilExpiry": null
    },
    {
      "userId": 25,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "roleId": 2,
      "roleName": "manager",
      "competencyId": 8,
      "competencyCode": "SAFETY-BASIC",
      "competencyName": "Basic Safety Training",
      "competencyCategory": "Safety",
      "isMandatory": true,
      "isRegulatory": true,
      "priority": "critical",
      "gracePeriodDays": 7,
      "complianceDeadline": null,
      "status": "expiring_soon",
      "daysUntilExpiry": 15
    }
  ],
  "total": 2
}
```

**Status Values:**
- `missing`: User does not have this competency
- `expired`: User's competency has expired
- `expiring_soon`: User's competency expires within the threshold

**Error Responses:**
- `403 Forbidden`: Cannot view other users' competencies

---

### Get Users with Missing Competencies

Get all users who are missing required competencies (compliance gap report).

**Endpoint:** `GET /api/role-training-requirements/compliance/gaps`

**Authorization:** Admin, Manager, Superuser

**Query Parameters:**
- `roleId` (integer): Filter by specific role
- `competencyId` (integer): Filter by specific competency
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)

**Example Request:**

```
GET /api/role-training-requirements/compliance/gaps?roleId=2&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "userId": 25,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "roleId": 2,
      "roleName": "manager",
      "competencyId": 5,
      "competencyCode": "ISO9001-AUDIT",
      "competencyName": "ISO 9001 Internal Auditor",
      "competencyCategory": "Quality",
      "isMandatory": true,
      "isRegulatory": false,
      "priority": "high",
      "gracePeriodDays": 30,
      "status": "missing",
      "daysUntilExpiry": null
    },
    {
      "userId": 26,
      "userName": "Jane Smith",
      "userEmail": "jane.smith@example.com",
      "roleId": 2,
      "roleName": "manager",
      "competencyId": 5,
      "competencyCode": "ISO9001-AUDIT",
      "competencyName": "ISO 9001 Internal Auditor",
      "competencyCategory": "Quality",
      "isMandatory": true,
      "isRegulatory": false,
      "priority": "high",
      "gracePeriodDays": 30,
      "status": "expired",
      "daysUntilExpiry": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

---

### Update Requirement

Update an existing role training requirement.

**Endpoint:** `PUT /api/role-training-requirements/:id`

**Authorization:** Admin, Manager, Superuser

**Request Body:** (all fields optional)

```json
{
  "isMandatory": false,
  "priority": "normal",
  "gracePeriodDays": 60,
  "status": "inactive",
  "notes": "Updated requirements"
}
```

**Response:**

```json
{
  "message": "Role training requirement updated successfully"
}
```

**Error Responses:**
- `404 Not Found`: Requirement not found

---

### Delete Requirement

Soft delete a requirement (sets status to 'inactive').

**Endpoint:** `DELETE /api/role-training-requirements/:id`

**Authorization:** Admin, Superuser

**Response:**

```json
{
  "message": "Role training requirement deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Requirement not found

---

## Data Models

### RoleTrainingRequirement

```typescript
interface RoleTrainingRequirement {
  id: number;
  roleId: number;
  competencyId: number;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
  gracePeriodDays?: number;
  complianceDeadline?: Date;
  minimumProficiencyLevel?: string;
  refreshFrequencyMonths?: number;
  status: 'active' | 'inactive' | 'deprecated';
  effectiveDate?: Date;
  endDate?: Date;
  justification?: string;
  regulatoryReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}
```

### RoleTrainingRequirementWithDetails

Extends `RoleTrainingRequirement` with:

```typescript
interface RoleTrainingRequirementWithDetails extends RoleTrainingRequirement {
  roleName: string;
  roleDisplayName: string;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
  competencyHasExpiry: boolean;
  competencyDefaultValidityMonths?: number;
}
```

### MissingCompetency

```typescript
interface MissingCompetency {
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleName: string;
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
  isMandatory: boolean;
  isRegulatory: boolean;
  priority: string;
  gracePeriodDays?: number;
  complianceDeadline?: Date;
  status: 'missing' | 'expired' | 'expiring_soon';
  daysUntilExpiry?: number;
}
```

---

## Error Responses

### 400 Bad Request

Validation errors:

```json
{
  "errors": [
    {
      "msg": "Valid role ID is required",
      "param": "roleId",
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
  "error": "Forbidden: Cannot view other users missing competencies"
}
```

### 404 Not Found

```json
{
  "error": "Role training requirement not found"
}
```

### 409 Conflict

```json
{
  "error": "This competency is already required for this role"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create role training requirement"
}
```

---

## Use Cases

### 1. Define Required Competencies for a Role

As an administrator, define that the "Manager" role requires ISO 9001 Internal Auditor competency:

```bash
POST /api/role-training-requirements
{
  "roleId": 2,
  "competencyId": 5,
  "isMandatory": true,
  "isRegulatory": false,
  "priority": "high",
  "gracePeriodDays": 30
}
```

### 2. Check User's Missing Competencies

As a user or manager, check what competencies a user is missing:

```bash
GET /api/role-training-requirements/users/25/missing?daysThreshold=30
```

### 3. Generate Compliance Gap Report

As an administrator, get all users missing required competencies:

```bash
GET /api/role-training-requirements/compliance/gaps?roleId=2
```

### 4. View Role Requirements

As any user, view all competencies required for the "Manager" role:

```bash
GET /api/role-training-requirements/roles/2/competencies
```

---

## Database Schema

The `RoleTrainingRequirements` table is created by migration script `26_create_role_training_requirements_table.sql`.

**Key Features:**
- Junction table linking Roles to Competencies
- Priority levels for requirement urgency
- Grace periods and compliance deadlines
- Refresh frequency for periodic renewal
- Status lifecycle management
- Comprehensive indexing for performance
- Full audit trail

**Relationships:**
- `roleId` → `Roles.id`
- `competencyId` → `Competencies.id`
- `createdBy` → `Users.id`

**Constraints:**
- Unique constraint: One requirement per role-competency combination
- Check constraints on priority, status, and numeric values

---

## Notes

1. **Authorization**: Most endpoints require authentication. Some require admin/manager roles.
2. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.
3. **Soft Delete**: Delete operations set status to 'inactive' rather than removing records.
4. **Audit Trail**: All operations are logged to the audit log system.
5. **Compliance**: Missing competencies include both expired and expiring-soon statuses based on the threshold.
6. **Priority Levels**: 'critical' should be used for regulatory/safety requirements, 'high' for important skills, 'normal' for standard requirements, 'low' for optional/nice-to-have competencies.

---

## Related Documentation

- [Competency API Documentation](COMPETENCY_API_DOCUMENTATION.md)
- [Training Tables Implementation](TRAINING_TABLES_IMPLEMENTATION.md)
- [User Management](USER_MANAGEMENT_IMPLEMENTATION.md)
- [API Authentication Reference](API_AUTH_REFERENCE.md)
