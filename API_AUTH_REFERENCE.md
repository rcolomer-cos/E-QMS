# E-QMS Authentication & User Management API Reference

Quick reference guide for authentication and user management endpoints in the E-QMS system.

## Table of Contents
- [Authentication Flow](#authentication-flow)
- [Bootstrap Endpoints](#bootstrap-endpoints)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management Endpoints](#user-management-endpoints)
- [Role Management Endpoints](#role-management-endpoints)
- [Password Utilities](#password-utilities)
- [Authorization Levels](#authorization-levels)

---

## Authentication Flow

### First Time Setup
1. Check if superusers exist: `GET /api/auth/check-superusers`
2. If no superusers: `POST /api/auth/initial-superuser`
3. Login: `POST /api/auth/login`

### Regular Login
1. Login: `POST /api/auth/login`
2. Use JWT token in Authorization header for subsequent requests

---

## Bootstrap Endpoints

### Check for Superusers

Check if the system has any active superusers (for bootstrap UI).

```http
GET /api/auth/check-superusers
```

**Response:**
```json
{
  "hasSuperusers": false
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Create Initial Superuser

Create the first superuser in the system. Can only be called once.

```http
POST /api/auth/initial-superuser
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "firstName": "System",
  "lastName": "Administrator"
}
```

**Response:**
```json
{
  "message": "Initial superuser created successfully",
  "userId": 1
}
```

**Validations:**
- Email must be valid format
- Password minimum 8 characters, with uppercase, lowercase, and number
- firstName and lastName required (1-100 characters)

**Status Codes:**
- `201` - Superuser created
- `400` - Validation errors
- `403` - Superusers already exist
- `500` - Server error

---

## Authentication Endpoints

### Login

Authenticate with email and password.

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "UserPassword123!"
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
    "roles": [
      {
        "id": 2,
        "name": "admin",
        "displayName": "Administrator",
        "level": 90
      }
    ],
    "mustChangePassword": false
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `400` - Validation errors
- `500` - Server error

**Notes:**
- Email is case-insensitive
- Failed login attempts are tracked
- Account may be locked after multiple failures

---

### Get Profile

Get current user's profile information.

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Quality",
  "roles": [
    {
      "id": 2,
      "name": "admin",
      "displayName": "Administrator",
      "level": 90
    }
  ],
  "roleNames": ["admin"],
  "lastLogin": "2025-11-15T20:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

## User Management Endpoints

All user management endpoints require authentication and admin/superuser role.

### Get All Users

```http
GET /api/users
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Quality",
    "active": true,
    "roles": [...],
    "roleNames": ["admin", "auditor"],
    "lastLogin": "2025-11-15T20:30:00Z",
    "createdAt": "2025-11-01T10:00:00Z"
  }
]
```

**Authorization:** Admin or Superuser  
**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Insufficient permissions
- `500` - Server error

---

### Get User by ID

```http
GET /api/users/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Quality",
  "active": true,
  "roles": [...],
  "lastLogin": "2025-11-15T20:30:00Z"
}
```

**Authorization:** Admin or Superuser  
**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - User not found
- `500` - Server error

---

### Create User

Create a new user with assigned roles.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "TempPassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Engineering",
  "roleIds": [4, 5]
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": 5,
  "email": "newuser@example.com",
  "password": "TempPassword123!"
}
```

**Authorization:** Admin or Superuser  
**Restrictions:**
- Only superusers can assign the superuser role
- At least one role must be assigned

**Status Codes:**
- `201` - User created
- `400` - Validation errors
- `401` - Not authenticated
- `403` - Insufficient permissions (e.g., trying to create superuser as admin)
- `409` - Email already exists
- `500` - Server error

**Notes:**
- Password is returned only once in the response
- Admin should copy and share the password with the new user

---

### Update User

Update user information (not including roles).

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Smith-Updated",
  "department": "Quality Engineering"
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

**Authorization:** Admin or Superuser  
**Status Codes:**
- `200` - Success
- `400` - Validation errors
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - User not found
- `500` - Server error

---

### Delete User

Soft delete (deactivate) a user account.

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Authorization:** Admin or Superuser  
**Restrictions:**
- Cannot delete your own account
- Only superusers can delete other superusers

**Status Codes:**
- `200` - Success
- `400` - Trying to delete own account
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - User not found
- `500` - Server error

---

## Role Management Endpoints

### Get All Roles

Get list of all available roles in the system.

```http
GET /api/users/roles
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "superuser",
    "displayName": "Super User",
    "description": "Full system access including user management and system configuration. Can create other superusers.",
    "level": 100,
    "active": true
  },
  {
    "id": 2,
    "name": "admin",
    "displayName": "Administrator",
    "description": "Administrative access to manage users, quality processes, and system settings. Cannot create superusers.",
    "level": 90,
    "active": true
  }
]
```

**Authorization:** Admin or Superuser  
**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Insufficient permissions
- `500` - Server error

---

### Assign Role to User

Assign a role to an existing user.

```http
POST /api/users/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleId": 3,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "Role assigned successfully"
}
```

**Authorization:** Admin or Superuser  
**Restrictions:**
- Only superusers can assign the superuser role
- `expiresAt` is optional (for temporary role assignments)

**Status Codes:**
- `200` - Success
- `400` - Invalid role ID
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - User or role not found
- `500` - Server error

---

### Revoke Role from User

Remove a role from a user.

```http
DELETE /api/users/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleId": 3
}
```

**Response:**
```json
{
  "message": "Role revoked successfully"
}
```

**Authorization:** Admin or Superuser  
**Restrictions:**
- Only superusers can revoke the superuser role

**Status Codes:**
- `200` - Success
- `400` - Invalid role ID
- `401` - Not authenticated
- `403` - Insufficient permissions
- `404` - User or role not found
- `500` - Server error

---

## Password Utilities

### Generate Password Options

Generate multiple password options for creating new users.

```http
GET /api/users/generate-password
Authorization: Bearer <token>
```

**Response:**
```json
{
  "passwords": [
    "Alpha-Tiger-2024!",
    "xK7#mN9$pQ2@vL4",
    "Delta-Ocean-5891@"
  ]
}
```

**Authorization:** Admin or Superuser  
**Notes:**
- Returns 3 password options
- Mix of memorable and random passwords
- All meet security requirements

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Insufficient permissions
- `500` - Server error

---

### Generate Single Password

Generate a single memorable password.

```http
GET /api/users/generate-password-single
Authorization: Bearer <token>
```

**Response:**
```json
{
  "password": "November-Mountain-7234!"
}
```

**Authorization:** Admin or Superuser  
**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `403` - Insufficient permissions
- `500` - Server error

---

## Authorization Levels

### Role Hierarchy

| Role       | Level | Can Create Users | Can Assign Roles | Special Permissions          |
|------------|-------|------------------|------------------|------------------------------|
| superuser  | 100   | All roles        | All roles        | Create/delete superusers     |
| admin      | 90    | Up to admin      | Up to admin      | User management              |
| manager    | 70    | No               | No               | Approve documents            |
| auditor    | 60    | No               | No               | Conduct audits, create NCRs  |
| user       | 50    | No               | No               | Create/edit documents        |
| viewer     | 10    | No               | No               | Read-only access             |

### Permission Matrix

| Action                    | Superuser | Admin | Manager | Auditor | User | Viewer |
|---------------------------|-----------|-------|---------|---------|------|--------|
| Create superuser          | ✓         | ✗     | ✗       | ✗       | ✗    | ✗      |
| Create admin              | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |
| Create other users        | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |
| Assign superuser role     | ✓         | ✗     | ✗       | ✗       | ✗    | ✗      |
| Assign other roles        | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |
| Delete users              | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |
| View all users            | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |
| Generate passwords        | ✓         | ✓     | ✗       | ✗       | ✗    | ✗      |

---

## Common Use Cases

### Use Case 1: First System Setup

```javascript
// 1. Check if superusers exist
const checkResponse = await fetch('/api/auth/check-superusers');
const { hasSuperusers } = await checkResponse.json();

if (!hasSuperusers) {
  // 2. Show "Create Superuser" form
  const response = await fetch('/api/auth/initial-superuser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@company.com',
      password: 'SecurePass123!',
      firstName: 'Admin',
      lastName: 'User'
    })
  });
}

// 3. Redirect to login
```

### Use Case 2: Creating a New User

```javascript
// 1. Generate password options
const passwordResponse = await fetch('/api/users/generate-password', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { passwords } = await passwordResponse.json();

// 2. Show password options in UI, user selects one
const selectedPassword = passwords[0];

// 3. Create user
const createResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newuser@company.com',
    password: selectedPassword,
    firstName: 'John',
    lastName: 'Doe',
    department: 'Quality',
    roleIds: [4, 5] // auditor and user
  })
});

const { email, password } = await createResponse.json();

// 4. Show email and password to admin (ONLY SHOWN ONCE)
alert(`User created: ${email}\nPassword: ${password}\nPlease copy and share with user.`);
```

### Use Case 3: Assigning Additional Role

```javascript
// Get user ID and role ID from UI
const userId = 5;
const roleId = 3; // manager

// Assign role
const response = await fetch(`/api/users/${userId}/roles`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roleId: roleId,
    expiresAt: '2025-12-31T23:59:59Z' // optional
  })
});

if (response.ok) {
  alert('Role assigned successfully!');
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

For validation errors (400 status):

```json
{
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

---

## Notes for Frontend Developers

1. **Store JWT token securely** (localStorage or secure cookie)
2. **Include token in Authorization header** for all authenticated requests
3. **Handle token expiration** gracefully (redirect to login)
4. **Show password only once** when creating users
5. **Validate email format** on client-side before submission
6. **Check role permissions** before showing UI elements
7. **Bootstrap check** should run on app startup
8. **Handle account lockout** gracefully (show message and support contact)

---

## Testing with cURL

### Create Initial Superuser
```bash
curl -X POST http://localhost:3000/api/auth/initial-superuser \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "TempPass123!",
    "firstName": "John",
    "lastName": "Doe",
    "roleIds": [5]
  }'
```

---

For more information, see:
- [SETUP_DATABASE.md](./SETUP_DATABASE.md) - Database setup guide
- [backend/database/README.md](./backend/database/README.md) - SQL schema documentation
- [README.md](./README.md) - Main project documentation
