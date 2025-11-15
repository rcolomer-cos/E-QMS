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
