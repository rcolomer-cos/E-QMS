# NCR API Documentation

## Overview
Non-Conformance Report (NCR) API endpoints for managing quality non-conformances in compliance with ISO 9001:2015 requirements.

## Base URL
```
/api/ncrs
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create NCR
Create a new Non-Conformance Report.

**Endpoint:** `POST /api/ncrs`

**Required Roles:** Admin, Manager, Auditor

**Rate Limit:** Applied

**Request Body:**
```json
{
  "ncrNumber": "NCR-2024-001",
  "title": "Product specification deviation",
  "description": "Product dimensions outside tolerance range",
  "source": "Internal Audit",
  "category": "Product Quality",
  "status": "open",
  "severity": "major",
  "detectedDate": "2024-01-15T10:30:00Z",
  "reportedBy": 1,
  "assignedTo": 5
}
```

**Field Descriptions:**
- `ncrNumber` (string, required): Unique NCR identifier (max 100 chars)
- `title` (string, required): NCR title/summary (max 500 chars)
- `description` (string, required): Detailed description (max 2000 chars)
- `source` (string, required): Source of NCR (max 200 chars)
- `category` (string, required): Category of non-conformity (max 100 chars)
- `status` (enum, required): One of: open, in_progress, resolved, closed, rejected
- `severity` (enum, required): One of: minor, major, critical
- `detectedDate` (datetime, required): When non-conformity was detected
- `reportedBy` (integer, required): User ID who reported the NCR
- `assignedTo` (integer, optional): User ID assigned to resolve the NCR

**Success Response:**
```json
{
  "message": "NCR created successfully",
  "id": 42
}
```

**Status Codes:**
- `201 Created`: NCR created successfully
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 2. Get All NCRs
Retrieve a paginated list of NCRs with optional filtering.

**Endpoint:** `GET /api/ncrs`

**Required Roles:** All authenticated users

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number (min: 1)
- `limit` (integer, optional, default: 10): Items per page (min: 1, max: 100)
- `status` (string, optional): Filter by status (open, in_progress, resolved, closed, rejected)
- `severity` (string, optional): Filter by severity (minor, major, critical)

**Example Request:**
```
GET /api/ncrs?page=1&limit=20&status=open&severity=major
```

**Success Response:**
```json
{
  "data": [
    {
      "id": 1,
      "ncrNumber": "NCR-2024-001",
      "title": "Product specification deviation",
      "description": "Product dimensions outside tolerance range",
      "source": "Internal Audit",
      "category": "Product Quality",
      "status": "open",
      "severity": "major",
      "detectedDate": "2024-01-15T10:30:00Z",
      "reportedBy": 1,
      "assignedTo": 5,
      "rootCause": null,
      "containmentAction": null,
      "correctiveAction": null,
      "verifiedBy": null,
      "verifiedDate": null,
      "closedDate": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
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
- `200 OK`: Success
- `400 Bad Request`: Invalid pagination parameters
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### 3. Get NCR by ID
Retrieve a specific NCR by its ID.

**Endpoint:** `GET /api/ncrs/:id`

**Required Roles:** All authenticated users

**Path Parameters:**
- `id` (integer, required): NCR ID

**Success Response:**
```json
{
  "id": 1,
  "ncrNumber": "NCR-2024-001",
  "title": "Product specification deviation",
  "description": "Product dimensions outside tolerance range",
  "source": "Internal Audit",
  "category": "Product Quality",
  "status": "open",
  "severity": "major",
  "detectedDate": "2024-01-15T10:30:00Z",
  "reportedBy": 1,
  "assignedTo": 5,
  "rootCause": null,
  "containmentAction": null,
  "correctiveAction": null,
  "verifiedBy": null,
  "verifiedDate": null,
  "closedDate": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: NCR not found
- `500 Internal Server Error`: Server error

---

### 4. Update NCR
Update an existing NCR's details.

**Endpoint:** `PUT /api/ncrs/:id`

**Required Roles:** Admin, Manager, Auditor

**Path Parameters:**
- `id` (integer, required): NCR ID

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "assignedTo": 10,
  "rootCause": "Root cause analysis findings",
  "containmentAction": "Immediate actions taken",
  "correctiveAction": "Long-term corrective actions"
}
```

**Success Response:**
```json
{
  "message": "NCR updated successfully"
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: NCR not found
- `500 Internal Server Error`: Server error

---

### 5. Update NCR Status
Update only the status of an NCR with additional RBAC checks.

**Endpoint:** `PUT /api/ncrs/:id/status`

**Required Roles:** 
- Admin, Manager, Auditor (for all status changes)
- **Only Admin and Manager can set status to 'closed'**

**Path Parameters:**
- `id` (integer, required): NCR ID

**Request Body:**
```json
{
  "status": "closed"
}
```

**Status Values:**
- `open`: NCR is newly created
- `in_progress`: NCR is being investigated/resolved
- `resolved`: Resolution complete, awaiting verification
- `closed`: NCR verified and closed (requires Admin/Manager role)
- `rejected`: NCR rejected as invalid

**Success Response:**
```json
{
  "message": "NCR status updated successfully",
  "status": "closed"
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid status value
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (e.g., Auditor trying to close NCR)
- `404 Not Found`: NCR not found
- `500 Internal Server Error`: Server error

**Special Permission Check:**
When setting status to `closed`, the system performs an additional check:
- User must have `admin`, `manager`, or `superuser` role
- Auditors and other roles will receive a 403 Forbidden response

---

### 6. Assign NCR
Assign an NCR to a specific user.

**Endpoint:** `PUT /api/ncrs/:id/assign`

**Required Roles:** Admin, Manager, Auditor

**Path Parameters:**
- `id` (integer, required): NCR ID

**Request Body:**
```json
{
  "assignedTo": 15
}
```

**Field Descriptions:**
- `assignedTo` (integer, required): User ID to assign the NCR to (must be >= 1)

**Success Response:**
```json
{
  "message": "NCR assigned successfully",
  "assignedTo": 15
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid user ID
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: NCR not found
- `500 Internal Server Error`: Server error

---

### 7. Delete NCR
Delete an NCR from the system.

**Endpoint:** `DELETE /api/ncrs/:id`

**Required Roles:** Admin only

**Path Parameters:**
- `id` (integer, required): NCR ID

**Success Response:**
```json
{
  "message": "NCR deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (non-Admin)
- `404 Not Found`: NCR not found
- `500 Internal Server Error`: Server error

---

## RBAC Permission Matrix

| Endpoint | Admin | Manager | Auditor | User | Viewer |
|----------|-------|---------|---------|------|--------|
| POST /api/ncrs | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /api/ncrs | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/ncrs/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /api/ncrs/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT /api/ncrs/:id/status | ✅ | ✅ | ✅* | ❌ | ❌ |
| PUT /api/ncrs/:id/assign | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /api/ncrs/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

\* Auditors can change status but **cannot close NCRs** (set status to 'closed')

---

## Error Responses

### Validation Error (400)
```json
{
  "errors": [
    {
      "msg": "Invalid status. Must be one of: open, in_progress, resolved, closed, rejected",
      "param": "status",
      "location": "body"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Access token required"
}
```

or

```json
{
  "error": "User not authenticated"
}
```

### Forbidden (403)
```json
{
  "error": "Access denied: insufficient permissions"
}
```

or (specific to closing NCRs)

```json
{
  "error": "Only Admin and Manager can close NCRs"
}
```

### Not Found (404)
```json
{
  "error": "NCR not found"
}
```

### Server Error (500)
```json
{
  "error": "Failed to create NCR"
}
```

---

## Status Workflow

Typical NCR lifecycle:

```
open → in_progress → resolved → closed
  ↓
rejected
```

1. **open**: NCR is created and awaiting assignment/investigation
2. **in_progress**: NCR is being actively investigated and resolved
3. **resolved**: Resolution actions complete, awaiting verification
4. **closed**: NCR verified and officially closed (Admin/Manager only)
5. **rejected**: NCR determined to be invalid or duplicate

---

## Rate Limiting

The create endpoint (`POST /api/ncrs`) is rate-limited to prevent abuse. If you exceed the rate limit, you'll receive a 429 Too Many Requests response.

---

## Examples

### Example: Create an NCR
```bash
curl -X POST https://api.example.com/api/ncrs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ncrNumber": "NCR-2024-001",
    "title": "Product specification deviation",
    "description": "Product dimensions outside tolerance range",
    "source": "Internal Audit",
    "category": "Product Quality",
    "status": "open",
    "severity": "major",
    "detectedDate": "2024-01-15T10:30:00Z",
    "reportedBy": 1,
    "assignedTo": 5
  }'
```

### Example: Update NCR Status
```bash
curl -X PUT https://api.example.com/api/ncrs/42/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### Example: Assign NCR
```bash
curl -X PUT https://api.example.com/api/ncrs/42/assign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": 15
  }'
```

### Example: Get NCRs with Filters
```bash
curl -X GET "https://api.example.com/api/ncrs?page=1&limit=20&status=open&severity=major" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ISO 9001:2015 Compliance

This NCR API supports ISO 9001:2015 requirements for non-conformance management:

- **8.7 Control of nonconforming outputs**: Track and control non-conformances
- **10.2 Nonconformity and corrective action**: Document and manage corrective actions
- **Traceability**: Unique NCR numbers and full audit trail
- **Accountability**: Track who reported, assigned, verified, and closed NCRs
- **Analysis**: Root cause, containment, and corrective action fields

---

## Support

For API issues or questions, please contact the development team or create an issue in the repository.
