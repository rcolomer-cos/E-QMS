# Process Management API Documentation

This document describes the REST API endpoints for managing processes and process owners in the E-QMS system.

## Base URL

All endpoints are prefixed with `/api/processes`

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Process Endpoints

### 1. Get All Processes

**Endpoint:** `GET /api/processes`

**Authorization:** All authenticated users

**Description:** Retrieves all active processes in the system.

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "name": "Quality Review Process",
    "code": "PROC-001",
    "description": "Process for reviewing quality standards",
    "departmentId": 2,
    "departmentName": "Quality Assurance",
    "processCategory": "Core",
    "objective": "Ensure products meet quality standards",
    "scope": "All manufactured products",
    "active": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "createdBy": 1
  }
]
```

### 2. Get Process by ID

**Endpoint:** `GET /api/processes/:id`

**Authorization:** All authenticated users

**Parameters:**
- `id` (path parameter): Process ID

**Response:** 200 OK
```json
{
  "id": 1,
  "name": "Quality Review Process",
  "code": "PROC-001",
  "description": "Process for reviewing quality standards",
  "departmentId": 2,
  "departmentName": "Quality Assurance",
  "processCategory": "Core",
  "objective": "Ensure products meet quality standards",
  "scope": "All manufactured products",
  "active": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "createdBy": 1
}
```

**Error Responses:**
- 404 Not Found: Process not found

### 3. Get Process by Code

**Endpoint:** `GET /api/processes/code/:code`

**Authorization:** All authenticated users

**Parameters:**
- `code` (path parameter): Process code (e.g., "PROC-001")

**Response:** 200 OK (same as Get Process by ID)

**Error Responses:**
- 404 Not Found: Process not found

### 4. Create Process

**Endpoint:** `POST /api/processes`

**Authorization:** Admin or Superuser only

**Request Body:**
```json
{
  "name": "Document Control Process",
  "code": "PROC-002",
  "description": "Process for managing document lifecycle",
  "departmentId": 3,
  "processCategory": "Support",
  "objective": "Maintain document integrity and compliance",
  "scope": "All quality documents"
}
```

**Required Fields:**
- `name`: String (1-200 characters)
- `code`: String (1-50 characters, uppercase letters, numbers, hyphens, and underscores only)

**Optional Fields:**
- `description`: String (max 1000 characters)
- `departmentId`: Integer (valid department ID)
- `processCategory`: String (max 100 characters, e.g., "Management", "Core", "Support")
- `objective`: String (max 500 characters)
- `scope`: String (max 500 characters)

**Response:** 201 Created
```json
{
  "message": "Process created successfully",
  "processId": 2
}
```

**Error Responses:**
- 400 Bad Request: Validation errors
- 401 Unauthorized: User not authenticated
- 409 Conflict: Process with this code or name already exists

### 5. Update Process

**Endpoint:** `PUT /api/processes/:id`

**Authorization:** Admin or Superuser only

**Parameters:**
- `id` (path parameter): Process ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Process Name",
  "code": "PROC-002-UPD",
  "description": "Updated description",
  "departmentId": 3,
  "processCategory": "Core",
  "objective": "Updated objective",
  "scope": "Updated scope"
}
```

**Response:** 200 OK
```json
{
  "message": "Process updated successfully"
}
```

**Error Responses:**
- 400 Bad Request: Validation errors
- 404 Not Found: Process not found
- 409 Conflict: Process with this code or name already exists

### 6. Delete Process

**Endpoint:** `DELETE /api/processes/:id`

**Authorization:** Admin or Superuser only

**Parameters:**
- `id` (path parameter): Process ID

**Description:** Soft deletes the process (sets active = 0)

**Response:** 200 OK
```json
{
  "message": "Process deleted successfully"
}
```

**Error Responses:**
- 401 Unauthorized: User not authenticated
- 404 Not Found: Process not found

## Process Owner Endpoints

### 7. Get Process Owners

**Endpoint:** `GET /api/processes/:id/owners`

**Authorization:** All authenticated users

**Parameters:**
- `id` (path parameter): Process ID

**Description:** Retrieves all owners assigned to a specific process.

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "processId": 1,
    "ownerId": 5,
    "ownerName": "John Doe",
    "ownerEmail": "john.doe@example.com",
    "assignedAt": "2025-01-15T10:30:00Z",
    "assignedBy": 1,
    "assignedByName": "Admin User",
    "isPrimaryOwner": true,
    "active": true,
    "notes": "Primary process owner"
  },
  {
    "id": 2,
    "processId": 1,
    "ownerId": 8,
    "ownerName": "Jane Smith",
    "ownerEmail": "jane.smith@example.com",
    "assignedAt": "2025-01-16T14:20:00Z",
    "assignedBy": 1,
    "assignedByName": "Admin User",
    "isPrimaryOwner": false,
    "active": true,
    "notes": "Secondary process owner"
  }
]
```

**Error Responses:**
- 404 Not Found: Process not found

### 8. Assign Process Owner

**Endpoint:** `POST /api/processes/:id/owners`

**Authorization:** Admin or Superuser only

**Parameters:**
- `id` (path parameter): Process ID

**Request Body:**
```json
{
  "ownerId": 5,
  "isPrimaryOwner": true,
  "notes": "Primary process owner responsible for oversight"
}
```

**Required Fields:**
- `ownerId`: Integer (valid user ID)

**Optional Fields:**
- `isPrimaryOwner`: Boolean (default: false)
- `notes`: String (max 500 characters)

**Response:** 201 Created
```json
{
  "message": "Process owner assigned successfully",
  "ownershipId": 1
}
```

**Error Responses:**
- 400 Bad Request: Validation errors
- 401 Unauthorized: User not authenticated
- 404 Not Found: Process not found
- 409 Conflict: User is already assigned as an owner to this process

### 9. Remove Process Owner

**Endpoint:** `DELETE /api/processes/:id/owners/:ownerId`

**Authorization:** Admin or Superuser only

**Parameters:**
- `id` (path parameter): Process ID
- `ownerId` (path parameter): User ID of the owner to remove

**Description:** Soft deletes the ownership assignment (sets active = 0)

**Response:** 200 OK
```json
{
  "message": "Process owner removed successfully"
}
```

**Error Responses:**
- 401 Unauthorized: User not authenticated
- 404 Not Found: Process not found or ownership assignment not found

## Error Response Format

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

Or for validation errors:
```json
{
  "errors": [
    {
      "msg": "Process name is required and must not exceed 200 characters",
      "param": "name",
      "location": "body"
    }
  ]
}
```

## Status Codes

- 200 OK: Successful GET, PUT, or DELETE operation
- 201 Created: Successful POST operation
- 400 Bad Request: Validation error
- 401 Unauthorized: Authentication required or user not authenticated
- 403 Forbidden: User lacks required role/permissions
- 404 Not Found: Resource not found
- 409 Conflict: Duplicate resource or constraint violation
- 500 Internal Server Error: Server error

## Notes

- All date/time fields are in ISO 8601 format
- Process codes are automatically converted to uppercase
- Deleted processes and ownership assignments are soft-deleted (active flag set to 0)
- Process owners are ordered by primary owner status first, then by assignment date
