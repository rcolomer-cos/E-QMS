# Auditor Access Tokens API Documentation

## Overview

The Auditor Access Tokens API provides functionality to generate time-limited, read-only access links for external auditors. This feature enables secure temporary access to quality management system data without requiring full user accounts, with comprehensive audit logging of all access activities.

## Base URL

```
http://localhost:3000/api/auditor-access-tokens
```

## Authentication

All administrative endpoints require JWT authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

External auditors use their access tokens:

```
Authorization: AuditorToken <ACCESS_TOKEN>
```

## Authorization

Administrative operations (token generation, revocation) require:
- **Admin** role
- **Manager** role

Token viewing operations also allow:
- **Auditor** role

## Endpoints

### 1. Generate Auditor Access Token

Create a new time-limited access token for an external auditor.

**Endpoint:** `POST /api/auditor-access-tokens`

**Authorization:** Admin, Manager

**Request Body:**

```json
{
  "auditorName": "John Smith",
  "auditorEmail": "john.smith@external-audit.com",
  "auditorOrganization": "External Audit Firm LLC",
  "expiresAt": "2024-12-31T23:59:59Z",
  "maxUses": 100,
  "scopeType": "full_read_only",
  "scopeEntityId": null,
  "allowedResources": ["audit", "document", "ncr", "capa"],
  "purpose": "ISO 9001:2015 certification audit",
  "notes": "Annual certification audit - read-only access to all QMS records"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| auditorName | string | Yes | Full name of the external auditor (2-255 chars) |
| auditorEmail | string | Yes | Valid email address of the auditor |
| auditorOrganization | string | No | Name of the auditing organization (max 255 chars) |
| expiresAt | ISO 8601 date | Yes | Token expiration date/time (must be in future) |
| maxUses | integer | No | Maximum number of times token can be used (optional) |
| scopeType | string | Yes | Access scope: `full_read_only`, `specific_audit`, `specific_document`, `specific_ncr`, `specific_capa` |
| scopeEntityId | integer | Conditional | Required if scopeType is `specific_*` |
| allowedResources | string[] | No | Array of allowed resource types (optional for full_read_only) |
| purpose | string | Yes | Reason for generating token (5-500 chars) |
| notes | string | No | Additional notes (max 2000 chars) |

**Scope Types:**

- `full_read_only`: Complete read-only access to all QMS data
- `specific_audit`: Access to a specific audit and its findings
- `specific_document`: Access to a specific document and its versions
- `specific_ncr`: Access to a specific non-conformance report
- `specific_capa`: Access to a specific corrective/preventive action

**Response (201 Created):**

```json
{
  "message": "Auditor access token generated successfully",
  "tokenId": 42,
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "accessUrl": "http://localhost:3000/auditor-access?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "warning": "Store this token securely. It will not be displayed again."
}
```

**Important:** The raw token is only returned once during generation. Store it securely and share it with the auditor through a secure channel.

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "Jane Auditor",
    "auditorEmail": "jane@audit-firm.com",
    "auditorOrganization": "Quality Audit Co.",
    "expiresAt": "2024-12-15T23:59:59Z",
    "scopeType": "full_read_only",
    "purpose": "Q4 2024 internal audit",
    "notes": "7-day access for comprehensive QMS review"
  }'
```

### 2. Get All Auditor Access Tokens

Retrieve a list of all auditor access tokens with optional filtering.

**Endpoint:** `GET /api/auditor-access-tokens`

**Authorization:** Admin, Manager, Auditor

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| activeOnly | boolean | Filter to show only active, non-expired tokens |
| auditorEmail | string | Filter by auditor email address |
| scopeType | string | Filter by scope type |

**Response (200 OK):**

```json
{
  "tokens": [
    {
      "id": 42,
      "tokenPreview": "a1b2c3d4...y5z6",
      "auditorName": "Jane Auditor",
      "auditorEmail": "jane@audit-firm.com",
      "auditorOrganization": "Quality Audit Co.",
      "expiresAt": "2024-12-15T23:59:59.000Z",
      "maxUses": null,
      "currentUses": 15,
      "scopeType": "full_read_only",
      "scopeEntityId": null,
      "allowedResources": null,
      "active": true,
      "revokedAt": null,
      "revokedBy": null,
      "revocationReason": null,
      "purpose": "Q4 2024 internal audit",
      "notes": "7-day access for comprehensive QMS review",
      "createdAt": "2024-12-08T10:00:00.000Z",
      "createdBy": 1,
      "lastUsedAt": "2024-12-10T14:30:00.000Z",
      "lastUsedIp": "203.0.113.45"
    }
  ],
  "count": 1
}
```

**Example Request:**

```bash
# Get all tokens
curl -X GET http://localhost:3000/api/auditor-access-tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get only active tokens
curl -X GET "http://localhost:3000/api/auditor-access-tokens?activeOnly=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by auditor email
curl -X GET "http://localhost:3000/api/auditor-access-tokens?auditorEmail=jane@audit-firm.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Auditor Access Token by ID

Retrieve details of a specific auditor access token.

**Endpoint:** `GET /api/auditor-access-tokens/:id`

**Authorization:** Admin, Manager, Auditor

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Token ID |

**Response (200 OK):**

```json
{
  "id": 42,
  "tokenPreview": "a1b2c3d4...y5z6",
  "auditorName": "Jane Auditor",
  "auditorEmail": "jane@audit-firm.com",
  "auditorOrganization": "Quality Audit Co.",
  "expiresAt": "2024-12-15T23:59:59.000Z",
  "maxUses": null,
  "currentUses": 15,
  "scopeType": "full_read_only",
  "scopeEntityId": null,
  "allowedResources": null,
  "active": true,
  "revokedAt": null,
  "revokedBy": null,
  "revocationReason": null,
  "purpose": "Q4 2024 internal audit",
  "notes": "7-day access for comprehensive QMS review",
  "createdAt": "2024-12-08T10:00:00.000Z",
  "createdBy": 1,
  "lastUsedAt": "2024-12-10T14:30:00.000Z",
  "lastUsedIp": "203.0.113.45"
}
```

**Response (404 Not Found):**

```json
{
  "error": "Auditor access token not found"
}
```

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/auditor-access-tokens/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Revoke Auditor Access Token

Immediately revoke an active auditor access token.

**Endpoint:** `PUT /api/auditor-access-tokens/:id/revoke`

**Authorization:** Admin, Manager

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Token ID to revoke |

**Request Body:**

```json
{
  "reason": "Audit completed successfully"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Reason for revocation (5-500 chars) |

**Response (200 OK):**

```json
{
  "message": "Auditor access token revoked successfully",
  "tokenId": 42
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Token is already revoked"
}
```

**Example Request:**

```bash
curl -X PUT http://localhost:3000/api/auditor-access-tokens/42/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "Audit completed - access no longer required"
  }'
```

### 5. Get Token Generation Options

Retrieve available options for token generation (scope types, resource types, etc.).

**Endpoint:** `GET /api/auditor-access-tokens/options`

**Authorization:** Admin, Manager

**Response (200 OK):**

```json
{
  "scopeTypes": [
    {
      "value": "full_read_only",
      "label": "Full Read Only",
      "requiresEntityId": false
    },
    {
      "value": "specific_audit",
      "label": "Specific Audit",
      "requiresEntityId": true
    },
    {
      "value": "specific_document",
      "label": "Specific Document",
      "requiresEntityId": true
    },
    {
      "value": "specific_ncr",
      "label": "Specific Ncr",
      "requiresEntityId": true
    },
    {
      "value": "specific_capa",
      "label": "Specific Capa",
      "requiresEntityId": true
    }
  ],
  "resourceTypes": [
    "audit",
    "document",
    "ncr",
    "capa",
    "equipment",
    "training",
    "audit-finding"
  ],
  "defaultExpirationHours": [24, 48, 72, 168]
}
```

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/auditor-access-tokens/options \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Cleanup Expired Tokens

Mark expired tokens as inactive (administrative maintenance operation).

**Endpoint:** `POST /api/auditor-access-tokens/cleanup`

**Authorization:** Admin only

**Response (200 OK):**

```json
{
  "message": "Expired tokens cleaned up successfully",
  "count": 5
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Using Auditor Access Tokens

### Accessing Resources with Token

External auditors use their access token to authenticate read-only API requests:

```bash
# List all audits (if allowed)
curl -X GET http://localhost:3000/api/audits \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Get specific document (if allowed)
curl -X GET http://localhost:3000/api/documents/123 \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# View audit findings (if allowed)
curl -X GET http://localhost:3000/api/audit-findings?auditId=42 \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

### Read-Only Restrictions

Auditor tokens are strictly read-only. Any non-GET request will be rejected:

```bash
# This will fail with 403 Forbidden
curl -X POST http://localhost:3000/api/audits \
  -H "Authorization: AuditorToken YOUR_TOKEN" \
  -d '{"title": "New Audit"}'
```

**Response (403 Forbidden):**

```json
{
  "error": "Read-only access: Only GET requests are allowed with auditor tokens",
  "method": "POST",
  "path": "/api/audits"
}
```

### Scope Restrictions

Tokens with specific scopes can only access their allowed resources:

```bash
# Token scoped to audit #42 trying to access audit #99
curl -X GET http://localhost:3000/api/audits/99 \
  -H "Authorization: AuditorToken YOUR_TOKEN"
```

**Response (403 Forbidden):**

```json
{
  "error": "Access denied: Token is scoped to specific_audit with ID 42",
  "requestedId": 99,
  "allowedId": 42
}
```

## Supported Endpoints for Auditor Tokens

The following endpoints support auditor token authentication (read-only):

### Audits
- `GET /api/audits` - List all audits
- `GET /api/audits/:id` - Get specific audit

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/pending` - Get pending documents
- `GET /api/documents/:id` - Get specific document
- `GET /api/documents/:id/versions` - Get document version history
- `GET /api/documents/:id/revisions` - Get document revision history
- `GET /api/documents/:id/download` - Download document file

### Other Resources
Additional resources (NCRs, CAPAs, Equipment, Training, etc.) can be similarly configured by adding the flexible authentication middleware.

## Audit Logging

All auditor token usage is comprehensively logged in the audit trail:

1. **Token Generation:** Logged with creator, auditor details, scope, and expiration
2. **Token Usage:** Every API access is logged with:
   - Auditor name and email
   - Accessed resource and entity ID
   - Timestamp and IP address
   - Request path and outcome
3. **Token Revocation:** Logged with revoker and reason
4. **Failed Access Attempts:** Logged with error details

Example audit log entries:

```json
{
  "action": "create",
  "actionCategory": "system",
  "actionDescription": "Generated auditor access token for Jane Auditor (jane@audit-firm.com)",
  "entityType": "AuditorAccessToken",
  "entityId": 42,
  "userId": 1,
  "timestamp": "2024-12-08T10:00:00.000Z"
}

{
  "action": "view",
  "actionCategory": "system",
  "actionDescription": "Auditor Jane Auditor accessed audit",
  "entityType": "audit",
  "entityId": 123,
  "timestamp": "2024-12-10T14:30:00.000Z",
  "ipAddress": "203.0.113.45"
}
```

## Security Considerations

### Token Security
- Tokens are hashed (SHA-256) before storage
- Raw tokens are only displayed once during generation
- Token preview shows first 8 and last 4 characters for identification
- Tokens should be transmitted over HTTPS only

### Access Control
- Read-only enforcement at middleware level
- Scope validation for resource access
- Automatic expiration based on timestamp
- Optional usage limits (maxUses)
- Manual revocation capability

### Audit Trail
- All token generation logged with creator and purpose
- Every resource access logged with auditor identity
- Failed authentication attempts logged
- Token revocation logged with reason

### Best Practices
1. **Short Expiration:** Set tokens to expire shortly after audit completion
2. **Specific Scope:** Use specific scopes when possible (e.g., `specific_audit`)
3. **Usage Limits:** Set `maxUses` for extra security
4. **Secure Transmission:** Share tokens through secure channels (encrypted email, secure portal)
5. **Regular Cleanup:** Run cleanup endpoint periodically to mark expired tokens inactive
6. **Monitor Usage:** Review audit logs for unusual access patterns
7. **Revoke Early:** Revoke tokens immediately after audit completion

## Error Responses

### 400 Bad Request
```json
{
  "error": "Expiration date must be in the future"
}
```

### 401 Unauthorized
```json
{
  "error": "Auditor access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired auditor access token"
}
```

```json
{
  "error": "Read-only access: Only GET requests are allowed with auditor tokens"
}
```

```json
{
  "error": "Access denied: document is not in the allowed resources for this token",
  "allowedResources": ["audit", "ncr"]
}
```

### 404 Not Found
```json
{
  "error": "Auditor access token not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to generate auditor access token"
}
```

## Database Schema

The `AuditorAccessTokens` table stores token information:

```sql
CREATE TABLE AuditorAccessTokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    token NVARCHAR(255) UNIQUE NOT NULL,
    tokenPreview NVARCHAR(50) NOT NULL,
    auditorName NVARCHAR(255) NOT NULL,
    auditorEmail NVARCHAR(255) NOT NULL,
    auditorOrganization NVARCHAR(255),
    expiresAt DATETIME2 NOT NULL,
    maxUses INT,
    currentUses INT DEFAULT 0,
    scopeType NVARCHAR(50) NOT NULL,
    scopeEntityId INT,
    allowedResources NVARCHAR(MAX),
    active BIT DEFAULT 1,
    revokedAt DATETIME2,
    revokedBy INT,
    revocationReason NVARCHAR(500),
    purpose NVARCHAR(500),
    notes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
    createdBy INT NOT NULL,
    lastUsedAt DATETIME2,
    lastUsedIp NVARCHAR(45)
);
```

## Implementation Files

- **Database Schema:** `backend/database/33_create_auditor_access_tokens_table.sql`
- **Service:** `backend/src/services/auditorAccessTokenService.ts`
- **Controller:** `backend/src/controllers/auditorAccessTokenController.ts`
- **Routes:** `backend/src/routes/auditorAccessTokenRoutes.ts`
- **Middleware:** `backend/src/middleware/auditorAccessToken.ts`
- **Flexible Auth:** `backend/src/middleware/flexibleAuth.ts`
- **Tests:** `backend/src/__tests__/controllers/auditorAccessTokenController.test.ts`

## Future Enhancements

Potential improvements for future versions:

1. **Token Refresh:** Allow extending token expiration before it expires
2. **IP Whitelisting:** Restrict token usage to specific IP addresses
3. **Scheduled Expiration Notifications:** Alert admins when tokens are about to expire
4. **Token Usage Dashboard:** Visual analytics for token usage patterns
5. **Resource-Level Permissions:** More granular control over which fields are visible
6. **Multi-Factor Authentication:** Optional MFA for high-security audits
7. **Token Templates:** Pre-configured token settings for common audit types
8. **Batch Token Generation:** Create multiple tokens at once for audit teams
9. **Access Reports:** Automated reports of auditor activity
10. **Frontend UI:** User-friendly interface for token management
