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
**Access:** All authenticated users  
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
**Access:** Admin, Manager, User  
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

### Delete Document
Delete a document from the system (soft delete recommended in production).

**Endpoint:** `DELETE /api/documents/:id`  
**Access:** Admin only  
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
**Access:** Admin, Manager, User  
**Rate Limiting:** 10 requests per 15 minutes  
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
**Access:** Admin, Manager, User  
**Rate Limiting:** 10 requests per 15 minutes  
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
