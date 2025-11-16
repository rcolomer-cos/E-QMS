# E-QMS API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication using JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer <token>
```

---

## System Endpoints

### Check System Initialization Status
Check if the system needs initial setup (superuser creation).

**Endpoint:** `GET /api/system/init-status`  
**Access:** Public  
**Response:**
```json
{
  "needsSetup": true,
  "hasDatabase": true,
  "hasSuperUser": false
}
```

### Create First Superuser
Create the first superuser account when system is initialized.

**Endpoint:** `POST /api/system/init`  
**Access:** Public (only works if no superuser exists)  
**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response:**
```json
{
  "message": "First superuser created successfully",
  "userId": 1
}
```

### Get System Status
Get system health and statistics.

**Endpoint:** `GET /api/system/status`  
**Access:** Public  
**Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "version": "1.0.4"
  },
  "users": {
    "total": 5,
    "active": 5
  },
  "roles": {
    "total": 6
  }
}
```

---

## Authentication Endpoints

### Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`  
**Access:** Public  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Quality",
    "roles": ["admin", "manager"],
    "mustChangePassword": false
  }
}
```

### Get Profile
Get authenticated user's profile.

**Endpoint:** `GET /api/auth/profile`  
**Access:** Authenticated  
**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Quality",
  "roles": ["admin", "manager"],
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "mustChangePassword": false
}
```

---

## Department Management Endpoints

### Get All Departments
Retrieve all active departments in the system.

**Endpoint:** `GET /api/departments`  
**Access:** Authenticated users (all roles)  
**Response:**
```json
[
  {
    "id": 1,
    "name": "Quality Assurance",
    "code": "QA",
    "description": "Quality assurance and testing department",
    "managerId": 5,
    "managerName": "John Doe",
    "active": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "createdBy": 1
  },
  {
    "id": 2,
    "name": "Information Technology",
    "code": "IT",
    "description": "IT infrastructure and development",
    "managerId": null,
    "managerName": null,
    "active": true,
    "createdAt": "2024-01-16T09:00:00Z",
    "updatedAt": "2024-01-16T09:00:00Z",
    "createdBy": 1
  }
]
```

### Get Department by ID
Retrieve a specific department by its ID.

**Endpoint:** `GET /api/departments/:id`  
**Access:** Authenticated users (all roles)  
**Response:**
```json
{
  "id": 1,
  "name": "Quality Assurance",
  "code": "QA",
  "description": "Quality assurance and testing department",
  "managerId": 5,
  "managerName": "John Doe",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "createdBy": 1
}
```

### Get Department by Code
Retrieve a specific department by its code.

**Endpoint:** `GET /api/departments/code/:code`  
**Access:** Authenticated users (all roles)  
**Example:** `GET /api/departments/code/QA`  
**Response:**
```json
{
  "id": 1,
  "name": "Quality Assurance",
  "code": "QA",
  "description": "Quality assurance and testing department",
  "managerId": 5,
  "managerName": "John Doe",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "createdBy": 1
}
```

### Create Department
Create a new department.

**Endpoint:** `POST /api/departments`  
**Access:** Admin, SuperUser  
**Request Body:**
```json
{
  "name": "Quality Assurance",
  "code": "QA",
  "description": "Quality assurance and testing department",
  "managerId": 5
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `code`: Required, 1-20 characters, uppercase letters, numbers, hyphens, underscores only
- `description`: Optional, max 500 characters
- `managerId`: Optional, must be a valid user ID

**Response:**
```json
{
  "message": "Department created successfully",
  "departmentId": 1
}
```

**Error Responses:**
- `409 Conflict` - Department code or name already exists
- `400 Bad Request` - Validation errors

### Update Department
Update an existing department.

**Endpoint:** `PUT /api/departments/:id`  
**Access:** Admin, SuperUser  
**Request Body:** (all fields optional)
```json
{
  "name": "Quality Assurance & Control",
  "code": "QA",
  "description": "Updated description",
  "managerId": 6
}
```

**Response:**
```json
{
  "message": "Department updated successfully"
}
```

**Error Responses:**
- `404 Not Found` - Department not found
- `409 Conflict` - Updated code or name conflicts with existing department

### Delete Department
Soft delete a department (sets active flag to false).

**Endpoint:** `DELETE /api/departments/:id`  
**Access:** Admin, SuperUser  
**Response:**
```json
{
  "message": "Department deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Department not found

---

## User Management Endpoints

### Get All Users
Retrieve all users in the system.

**Endpoint:** `GET /api/users`  
**Access:** Admin, SuperUser  
**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "department": "Quality",
      "active": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T09:00:00Z",
      "roles": ["admin", "manager"]
    }
  ]
}
```

### Get User by ID
Retrieve a specific user by ID.

**Endpoint:** `GET /api/users/:id`  
**Access:** Admin, SuperUser  
**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Quality",
    "active": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T09:00:00Z",
    "roles": [
      {
        "id": 2,
        "name": "admin",
        "displayName": "Administrator"
      }
    ]
  }
}
```

### Create User
Create a new user and optionally assign roles.

**Endpoint:** `POST /api/users`  
**Access:** Admin, SuperUser  
**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Quality",
  "roleIds": [3, 4],
  "generatePassword": true
}
```
**Note:** 
- Set `generatePassword: true` to auto-generate a strong password
- Provide `password` field if you want to set a specific password
- Only superusers can assign the superuser role

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 5,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "department": "Quality",
    "roles": ["manager", "auditor"]
  },
  "credentials": {
    "email": "newuser@example.com",
    "password": "BrightTiger42!"
  }
}
```

### Update User
Update user information.

**Endpoint:** `PUT /api/users/:id`  
**Access:** Admin, SuperUser  
**Request Body:**
```json
{
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "department": "Operations",
  "active": true
}
```
**Response:**
```json
{
  "message": "User updated successfully"
}
```

### Assign Role to User
Assign a role to a user.

**Endpoint:** `POST /api/users/:id/roles`  
**Access:** Admin, SuperUser (only SuperUser can assign superuser role)  
**Request Body:**
```json
{
  "roleId": 3
}
```
**Response:**
```json
{
  "message": "Role assigned successfully"
}
```

### Remove Role from User
Remove a role from a user.

**Endpoint:** `DELETE /api/users/:id/roles`  
**Access:** Admin, SuperUser (only SuperUser can remove superuser role)  
**Request Body:**
```json
{
  "roleId": 3
}
```
**Response:**
```json
{
  "message": "Role removed successfully"
}
```

### Generate Password
Generate a strong but memorable password.

**Endpoint:** `GET /api/users/generate-password`  
**Access:** Admin, SuperUser  
**Response:**
```json
{
  "password": "BrightTiger42!"
}
```

---

## Role Endpoints

### Get All Roles
Retrieve all available roles in the system.

**Endpoint:** `GET /api/roles`  
**Access:** Authenticated  
**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "superuser",
      "displayName": "Super User",
      "description": "Full system access including user elevation to superuser",
      "isSuperUser": true
    },
    {
      "id": 2,
      "name": "admin",
      "displayName": "Administrator",
      "description": "Full administrative access except superuser elevation",
      "isSuperUser": false
    }
  ]
}
```

### Get Role by ID
Retrieve a specific role by ID with permissions.

**Endpoint:** `GET /api/roles/:id`  
**Access:** Authenticated  
**Response:**
```json
{
  "role": {
    "id": 2,
    "name": "admin",
    "displayName": "Administrator",
    "description": "Full administrative access except superuser elevation",
    "isSuperUser": false,
    "permissions": [
      "user.manage",
      "role.assign",
      "document.approve",
      "audit.manage"
    ]
  }
}
```

---

## Document Management Endpoints

### Document Permission Model

The E-QMS system implements role-based access control (RBAC) for document management. Permissions are checked based on:
1. User roles (Superuser, Admin, Manager, User, Viewer)
2. Document ownership (ownerId and createdBy fields)
3. Document status (draft, review, approved, obsolete)

#### Permission Rules

**VIEW Permission:**
- **Approved documents**: All authenticated users can view
- **Draft/Review documents**: Only owner, creator, managers, admins, and superusers
- **Obsolete documents**: Only managers, admins, and superusers

**EDIT Permission:**
- **Draft/Review documents**: Owner, creator, managers, admins, and superusers
- **Approved documents**: Only admins and superusers
- **Obsolete documents**: Only admins and superusers

**APPROVE Permission:**
- Only managers, admins, and superusers can approve documents
- Document must be in "review" status to be approved

**DELETE Permission:**
- Only admins and superusers can delete documents

#### Permission Enforcement

All document-specific endpoints (GET, PUT, DELETE, approve, upload, download, versions) enforce these permissions automatically via middleware. Attempting unauthorized actions will result in:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User authenticated but lacks required permissions
- `404 Not Found`: Document doesn't exist or user lacks VIEW permission

### Create Document
Create a new document in the system.

**Endpoint:** `POST /api/documents`  
**Access:** Admin, Manager, User  
**Rate Limiting:** 10 requests per 15 minutes  
**Request Body:**
```json
{
  "title": "Quality Management Procedure",
  "description": "Detailed procedure for quality management processes",
  "documentType": "Procedure",
  "category": "Quality",
  "version": "1.0",
  "status": "draft",
  "ownerId": 5,
  "effectiveDate": "2024-02-01T00:00:00Z",
  "reviewDate": "2024-08-01T00:00:00Z",
  "expiryDate": "2025-02-01T00:00:00Z"
}
```
**Validation Rules:**
- `title`: Required, 1-500 characters
- `description`: Optional, max 2000 characters
- `documentType`: Required, max 100 characters
- `category`: Required, max 100 characters
- `version`: Optional, max 50 characters (defaults to "1.0")
- `status`: Optional, one of: "draft", "review", "approved", "obsolete" (defaults to "draft")
- `ownerId`: Optional, valid user ID
- `effectiveDate`, `reviewDate`, `expiryDate`: Optional, ISO 8601 date format

**Response:**
```json
{
  "message": "Document created successfully",
  "documentId": 123
}
```

### Get All Documents
Retrieve all documents with optional filtering.

**Endpoint:** `GET /api/documents`  
**Access:** All authenticated users  
**Query Parameters:**
- `status` (optional): Filter by status ("draft", "review", "approved", "obsolete")
- `category` (optional): Filter by category
- `documentType` (optional): Filter by document type

**Example:**
```bash
GET /api/documents?status=approved&category=Quality
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Quality Management Procedure",
    "description": "Detailed procedure for quality management processes",
    "documentType": "Procedure",
    "category": "Quality",
    "version": "1.0",
    "parentDocumentId": null,
    "status": "approved",
    "ownerId": 5,
    "filePath": "/uploads/documents/qm-proc-1234567890.pdf",
    "fileName": "qm-procedure.pdf",
    "fileSize": 245678,
    "createdBy": 1,
    "approvedBy": 2,
    "approvedAt": "2024-01-20T14:30:00Z",
    "effectiveDate": "2024-02-01T00:00:00Z",
    "reviewDate": "2024-08-01T00:00:00Z",
    "expiryDate": "2025-02-01T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T14:30:00Z"
  }
]
```

### Get Document by ID
Retrieve a specific document by its ID.

**Endpoint:** `GET /api/documents/:id`  
**Access:** Role-based (see permissions below)  
**Permissions:**
- Approved documents: All authenticated users can view
- Draft/Review documents: Only document owner, creator, managers, admins, and superusers can view
- Obsolete documents: Only managers, admins, and superusers can view

**Response:**
```json
{
  "id": 1,
  "title": "Quality Management Procedure",
  "description": "Detailed procedure for quality management processes",
  "documentType": "Procedure",
  "category": "Quality",
  "version": "1.0",
  "parentDocumentId": null,
  "status": "approved",
  "ownerId": 5,
  "filePath": "/uploads/documents/qm-proc-1234567890.pdf",
  "fileName": "qm-procedure.pdf",
  "fileSize": 245678,
  "createdBy": 1,
  "approvedBy": 2,
  "approvedAt": "2024-01-20T14:30:00Z",
  "effectiveDate": "2024-02-01T00:00:00Z",
  "reviewDate": "2024-08-01T00:00:00Z",
  "expiryDate": "2025-02-01T00:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

### Update Document
Update document metadata (does not update file - use upload endpoint for files).

**Endpoint:** `PUT /api/documents/:id`  
**Access:** Role-based (see permissions below)  
**Permissions:**
- Draft/Review documents: Document owner, creator, managers, admins, and superusers can edit
- Approved/Obsolete documents: Only admins and superusers can edit

**Request Body (all fields optional):**
```json
{
  "title": "Updated Quality Management Procedure",
  "description": "Updated description",
  "documentType": "Updated Procedure",
  "category": "Updated Quality",
  "version": "1.1",
  "status": "review",
  "ownerId": 6,
  "filePath": "/new/path/document.pdf",
  "fileName": "updated-document.pdf",
  "fileSize": 300000,
  "effectiveDate": "2024-03-01T00:00:00Z",
  "reviewDate": "2024-09-01T00:00:00Z",
  "expiryDate": "2025-03-01T00:00:00Z",
  "approvedBy": 3,
  "approvedAt": "2024-02-15T10:00:00Z"
}
```

**Validation Rules:**
- `title`: 1-500 characters if provided
- `description`: max 2000 characters if provided
- `documentType`: max 100 characters if provided
- `category`: max 100 characters if provided
- `version`: max 50 characters if provided
- `status`: one of "draft", "review", "approved", "obsolete" if provided
- `ownerId`, `approvedBy`: valid user ID if provided
- `filePath`: max 1000 characters if provided
- `fileName`: max 500 characters if provided
- `fileSize`: non-negative integer if provided
- `effectiveDate`, `reviewDate`, `expiryDate`, `approvedAt`: ISO 8601 date format if provided

**Response:**
```json
{
  "message": "Document updated successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

**Error Response (400 - Validation):**
```json
{
  "errors": [
    {
      "msg": "Title must be between 1 and 500 characters",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### Approve Document
Approve a document that is in review status.

**Endpoint:** `POST /api/documents/:id/approve`  
**Access:** Manager, Admin, Superuser  
**Permissions:**
- Only managers, admins, and superusers can approve documents
- Document must be in "review" status to be approved

**Response:**
```json
{
  "message": "Document approved successfully"
}
```

**Error Response (403):**
```json
{
  "error": "Access denied: insufficient permissions to approve this document"
}
```

**Notes:**
- Automatically sets document status to "approved"
- Records approver ID and approval timestamp
- Document must be in "review" status before it can be approved

### Delete Document
Delete a document from the system.

**Endpoint:** `DELETE /api/documents/:id`  
**Access:** Admin and Superuser only  
**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

**Error Response (403):**
```json
{
  "error": "Access denied"
}
```

### Create Document Version
Create a new version of an existing document.

**Endpoint:** `POST /api/documents/:id/version`  
**Access:** Role-based (requires VIEW permission on source document)  
**Rate Limiting:** 10 requests per 15 minutes  
**Permissions:**
- User must have VIEW permission on the source document

**Response:**
```json
{
  "message": "Document version created successfully",
  "documentId": 124
}
```

**Behavior:**
- Creates a new document record with incremented version number
- Links to parent document via `parentDocumentId`
- Resets status to "draft"
- Clears approval information
- Copies all other metadata from parent

### Upload Document File
Upload or replace the file for a document.

**Endpoint:** `POST /api/documents/:id/upload`  
**Access:** Role-based (requires EDIT permission)  
**Rate Limiting:** 10 requests per 15 minutes  
**Permissions:**
- User must have EDIT permission on the document (see Update Document permissions)

**Content-Type:** `multipart/form-data`  
**Form Data:**
- `file`: The document file to upload

**Allowed File Types:**
- PDF (`application/pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- PowerPoint (`.ppt`, `.pptx`)
- Text files (`.txt`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)

**File Size Limit:** 10 MB

**Response:**
```json
{
  "message": "Document file uploaded successfully",
  "file": {
    "fileName": "qm-procedure.pdf",
    "fileSize": 245678,
    "filePath": "/uploads/documents/qm-procedure-1234567890-987654321.pdf"
  }
}
```

**Error Response (400 - No File):**
```json
{
  "error": "No file uploaded"
}
```

**Error Response (400 - Invalid File Type):**
```json
{
  "error": "Invalid file type. Only PDF, Word, Excel, PowerPoint, text, and image files are allowed."
}
```

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/documents/123/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

### Download Document File
Download the file associated with a document.

**Endpoint:** `GET /api/documents/:id/download`  
**Access:** Role-based (requires VIEW permission)  
**Permissions:**
- User must have VIEW permission on the document (see Get Document by ID permissions)

**Response:**
- Returns the file with appropriate Content-Type and Content-Disposition headers
- File is downloaded with its original filename

**Error Response (404 - Document Not Found):**
```json
{
  "error": "Document not found"
}
```

**Error Response (404 - No File):**
```json
{
  "error": "Document file not found"
}
```

**Example using cURL:**
```bash
curl -X GET http://localhost:3000/api/documents/123/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -O
```

### Get Document Version History
Get the version history for a document, showing all versions in the document's version chain.

**Endpoint:** `GET /api/documents/:id/versions`  
**Access:** Role-based (requires VIEW permission)  
**Permissions:**
- User must have VIEW permission on the document (see Get Document by ID permissions)

**Response:**
```json
[
  {
    "id": 123,
    "title": "Quality Management Procedure",
    "version": "2.0",
    "status": "approved",
    "createdBy": 1,
    "createdAt": "2024-02-15T10:00:00Z",
    "approvedBy": 2,
    "approvedAt": "2024-02-20T14:30:00Z",
    "parentDocumentId": 100
  },
  {
    "id": 100,
    "title": "Quality Management Procedure",
    "version": "1.0",
    "status": "obsolete",
    "createdBy": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "approvedBy": 2,
    "approvedAt": "2024-01-20T14:30:00Z",
    "parentDocumentId": null
  }
]
```

**Error Response (404):**
```json
{
  "error": "Document not found"
}
```

---

## Role Hierarchy

The system has the following predefined roles:

| Role | Name | Superuser | Description |
|------|------|-----------|-------------|
| SuperUser | `superuser` | Yes | Full system access, can create other superusers |
| Administrator | `admin` | No | Full administrative access except superuser elevation |
| Manager | `manager` | No | Quality management and approval authority |
| Auditor | `auditor` | No | Conduct audits and create NCRs |
| User | `user` | No | Create and edit documents, view reports |
| Viewer | `viewer` | No | Read-only access to system |

### Permission Rules

1. Only **SuperUser** and **Admin** can create/invite users
2. Only **SuperUser** can assign/remove the superuser role
3. Only **SuperUser** can elevate users to superuser
4. Users can have multiple roles simultaneously
5. Role changes are tracked with assignedBy and assignedAt timestamps

---

## Password Requirements

When creating users or changing passwords:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%&*)

### Password Generator

The system includes a password generator that creates strong but memorable passwords:
- Format: `AdjectiveNounNumberSpecialChar`
- Example: `BrightTiger42!`
- Minimum length: 12 characters

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
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
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Database Schema

### Users Table
- `id` - Auto-increment primary key
- `email` - Unique, used as login username
- `password` - Hashed with bcrypt
- `firstName` - Required
- `lastName` - Required
- `department` - Optional
- `active` - Boolean, soft delete flag
- `lastLoginAt` - Timestamp of last login
- `passwordChangedAt` - Timestamp of last password change
- `mustChangePassword` - Boolean flag
- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp
- `createdBy` - User ID who created this user

### Roles Table
- `id` - Auto-increment primary key
- `name` - Unique role identifier
- `displayName` - User-friendly name
- `description` - Role description
- `isSuperUser` - Boolean flag
- `permissions` - JSON array of permission strings
- `active` - Boolean flag
- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp

### UserRoles Table (Junction)
- `id` - Auto-increment primary key
- `userId` - Foreign key to Users
- `roleId` - Foreign key to Roles
- `assignedAt` - When role was assigned
- `assignedBy` - User ID who assigned the role
- Unique constraint on (userId, roleId)

### DatabaseVersion Table
- `id` - Auto-increment primary key
- `version` - Semantic version number
- `description` - What changed
- `scriptName` - SQL file executed
- `appliedAt` - When migration was applied
- `appliedBy` - SQL user who applied migration
- `checksum` - Optional file checksum
- `executionTimeMs` - Migration execution time

---

## Setup Workflow

### Initial System Setup

1. **Run Database Scripts**
   - Execute SQL scripts in `/backend/database/schemas/` in order
   - Or run `00_RunAll.sql` in SSMS

2. **Check Initialization Status**
   ```bash
   GET /api/system/init-status
   ```

3. **Create First Superuser** (if needed)
   ```bash
   POST /api/system/init
   {
     "email": "admin@company.com",
     "password": "SecurePassword123!",
     "firstName": "Admin",
     "lastName": "User"
   }
   ```

4. **Login as Superuser**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@company.com",
     "password": "SecurePassword123!"
   }
   ```

5. **Create Additional Users**
   ```bash
   POST /api/users
   {
     "email": "manager@company.com",
     "firstName": "Manager",
     "lastName": "User",
     "roleIds": [3],
     "generatePassword": true
   }
   ```

### User Management Workflow

1. Admin/SuperUser logs in
2. Navigate to user management panel
3. Click "Add User" button
4. Fill in user details
5. Select roles to assign
6. Click "Generate Password" for strong password
7. Save user
8. Copy generated email and password to send to new user
9. New user receives credentials and logs in
10. Optional: Require password change on first login

---

## Notes

- Email addresses are case-insensitive and used as login usernames
- Users can have multiple roles simultaneously
- Role permissions are cumulative (users get all permissions from all assigned roles)
- Soft deletion is used (active flag) to maintain referential integrity
- All sensitive operations are logged with user ID and timestamp
- Password generation creates memorable but strong passwords
- System prevents deletion/modification of last superuser
