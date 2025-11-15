# E-QMS API Documentation

## Authentication Endpoints

### Overview
The E-QMS API uses JWT (JSON Web Tokens) for authentication. All authenticated endpoints require a valid JWT token to be included in the `Authorization` header as a Bearer token.

### Base URL
```
http://localhost:3000/api/auth
```

---

## Endpoints

### 1. Register User
Register a new user account in the system.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Rate Limiting:** Applied

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 6 characters)",
  "role": "string (required, one of: admin, manager, auditor, user, viewer)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "department": "string (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Username already exists
- `500 Internal Server Error`: Server error

---

### 2. Login
Authenticate a user and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Rate Limiting:** Applied

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Quality Assurance"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

**Notes:**
- The token expires based on the `JWT_EXPIRES_IN` configuration (default: 24 hours)
- The user role is included in the response for frontend authorization
- Store the token securely on the client (e.g., in memory or secure storage)

---

### 3. Logout
Logout the current user session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Token missing or user not authenticated
- `403 Forbidden`: Invalid or expired token
- `500 Internal Server Error`: Server error

**Notes:**
- This is a stateless JWT implementation
- The client should remove the token from storage after receiving this response
- The endpoint validates that the token is still valid before confirming logout

---

### 4. Refresh Token
Refresh an existing JWT token to extend the session.

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Quality Assurance"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Token missing or user not authenticated
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: User no longer exists or is inactive
- `500 Internal Server Error`: Server error

**Notes:**
- Validates that the user still exists and is active in the database
- Issues a new token with a fresh expiry time
- The old token becomes invalid after the new token is issued
- Returns updated user data including role for authorization

---

### 5. Get Profile
Retrieve the current user's profile information.

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Quality Assurance"
}
```

**Error Responses:**
- `401 Unauthorized`: Token missing or user not authenticated
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

## Authentication Flow

### Initial Authentication
1. User sends credentials to `/api/auth/login`
2. Server validates credentials against MSSQL database
3. Server generates JWT token with user information
4. Client stores token securely
5. Client includes token in `Authorization` header for subsequent requests

### Token Refresh Flow
1. Before token expires, client sends refresh request to `/api/auth/refresh`
2. Server validates existing token
3. Server checks if user still exists and is active
4. Server issues new token with fresh expiry
5. Client replaces old token with new token

### Logout Flow
1. Client sends logout request to `/api/auth/logout`
2. Server validates token
3. Client removes token from storage
4. User is logged out

---

## Security Considerations

- All passwords are hashed using bcrypt before storage
- JWT tokens are signed with a secret key configured in environment variables
- Rate limiting is applied to authentication endpoints to prevent brute force attacks
- HTTPS should be used in production to encrypt token transmission
- Tokens contain user ID, username, email, and role for authorization
- Database queries use parameterized statements to prevent SQL injection

---

## User Roles

The system supports five user roles with different permission levels:

- **admin**: Full system access, user management
- **manager**: Manage quality processes, approve documents
- **auditor**: Conduct audits, create NCRs
- **user**: Create and edit documents, view reports
- **viewer**: Read-only access to system

Role-based authorization is enforced at the API level using middleware.

---

## Example Usage

### Login Example (curl)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword123"
  }'
```

### Refresh Token Example (curl)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Logout Example (curl)
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/TypeScript Example
```typescript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword123',
  }),
});
const { token, user } = await loginResponse.json();

// Store token securely
localStorage.setItem('authToken', token);

// Use token for authenticated requests
const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Refresh token
const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { token: newToken } = await refreshResponse.json();
localStorage.setItem('authToken', newToken);

// Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
localStorage.removeItem('authToken');
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Error message description"
}
```

For validation errors:
```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "email",
      "location": "body"
    }
  ]
}
```
