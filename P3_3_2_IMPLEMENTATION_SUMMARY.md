# P3:3:2 — Auditor Temporary Access Links - Implementation Summary

## Overview

This document summarizes the implementation of time-limited, read-only access links for external auditors in the E-QMS system. This feature enables secure temporary access to quality management system data without requiring full user accounts, with comprehensive audit logging of all access activities.

## Problem Statement

**Requirement:** Create functionality to generate time-limited, read-only access links for auditors. Apply strict permission controls and audit logging for all accessed items.

## Solution

A complete backend solution has been implemented with the following components:

### 1. Database Schema

**File:** `backend/database/33_create_auditor_access_tokens_table.sql`

Created the `AuditorAccessTokens` table with:

**Key Fields:**
- `token`: SHA-256 hashed token (unique)
- `tokenPreview`: First 8 and last 4 characters for display
- `auditorName`, `auditorEmail`, `auditorOrganization`: Auditor identification
- `expiresAt`: Token expiration timestamp
- `maxUses`, `currentUses`: Optional usage limits and tracking
- `scopeType`: Access scope (full_read_only, specific_audit, specific_document, specific_ncr, specific_capa)
- `scopeEntityId`: Entity ID for specific scopes
- `allowedResources`: JSON array of allowed resource types
- `active`: Token active status
- `revokedAt`, `revokedBy`, `revocationReason`: Revocation tracking
- `purpose`, `notes`: Documentation fields
- `createdAt`, `createdBy`: Creation audit trail
- `lastUsedAt`, `lastUsedIp`: Usage tracking

**Indexes:**
- Unique index on token for fast lookup
- Composite indexes for filtering and performance
- Indexes on expiration, creator, and auditor tracking

### 2. Token Management Service

**File:** `backend/src/services/auditorAccessTokenService.ts`

**Key Features:**
- **Token Generation:** Secure random token generation (32 bytes hex)
- **Token Hashing:** SHA-256 hashing before storage
- **Token Validation:** Validates expiration, usage limits, and active status
- **Usage Tracking:** Automatically tracks usage count, timestamp, and IP address
- **Token Listing:** Retrieve tokens with flexible filtering
- **Token Revocation:** Manual revocation with reason tracking
- **Cleanup:** Automated cleanup of expired tokens

**Public Methods:**
```typescript
class AuditorAccessTokenService {
  static async createToken(data: CreateAuditorAccessToken): Promise<{ id: number; token: string }>
  static async validateToken(token: string, ipAddress?: string): Promise<AuditorAccessToken | null>
  static async getTokens(filters?: {...}): Promise<Omit<AuditorAccessToken, 'token'>[]>
  static async getTokenById(id: number): Promise<Omit<AuditorAccessToken, 'token'> | null>
  static async revokeToken(id: number, revokedBy: number, reason: string): Promise<void>
  static async cleanupExpiredTokens(): Promise<number>
}
```

**Scope Types:**
- `FULL_READ_ONLY`: Complete read access to all QMS data
- `SPECIFIC_AUDIT`: Access to a specific audit
- `SPECIFIC_DOCUMENT`: Access to a specific document
- `SPECIFIC_NCR`: Access to a specific NCR
- `SPECIFIC_CAPA`: Access to a specific CAPA

### 3. Authentication Middleware

**File:** `backend/src/middleware/auditorAccessToken.ts`

**Key Middleware Functions:**

1. **`authenticateAuditorToken`**
   - Validates auditor access tokens from Authorization header
   - Format: `Authorization: AuditorToken <token>`
   - Checks token validity, expiration, and usage limits
   - Tracks usage statistics and IP addresses
   - Logs successful and failed authentication attempts

2. **`enforceReadOnly`**
   - Ensures only GET requests are allowed
   - Rejects POST, PUT, DELETE, PATCH requests
   - Returns 403 Forbidden with descriptive error

3. **`checkResourceScope`**
   - Validates access to specific resource types
   - Checks if resource is in allowedResources
   - Validates entity ID for specific scopes
   - Returns 403 Forbidden if access denied

4. **`logAuditorAccess`**
   - Logs every resource access to audit trail
   - Captures auditor identity, resource, and timestamp
   - Stores comprehensive access metadata

5. **`auditorTokenAuth`**
   - Combined middleware array: [authenticateAuditorToken, enforceReadOnly]
   - Convenient for route protection

### 4. Flexible Authentication Middleware

**File:** `backend/src/middleware/flexibleAuth.ts`

**Purpose:** Allows endpoints to accept both regular JWT tokens and auditor tokens

**Logic:**
```typescript
if (authHeader.startsWith('AuditorToken ')) {
  // Use auditor token authentication
} else if (authHeader.startsWith('Bearer ')) {
  // Use regular JWT authentication
}
```

This enables existing endpoints to support external auditor access without breaking regular user access.

### 5. Token Management Controller

**File:** `backend/src/controllers/auditorAccessTokenController.ts`

**Endpoints:**

1. **`generateToken`** - POST /api/auditor-access-tokens
   - Creates new auditor access token
   - Validates input and scope requirements
   - Returns raw token only once
   - Logs token generation to audit trail

2. **`getTokens`** - GET /api/auditor-access-tokens
   - Lists all tokens with optional filtering
   - Filters: activeOnly, auditorEmail, scopeType
   - Returns token metadata (not raw tokens)

3. **`getTokenById`** - GET /api/auditor-access-tokens/:id
   - Retrieves specific token details
   - Returns 404 if not found

4. **`revokeToken`** - PUT /api/auditor-access-tokens/:id/revoke
   - Revokes active token
   - Requires revocation reason
   - Prevents revoking already revoked tokens
   - Logs revocation to audit trail

5. **`getOptions`** - GET /api/auditor-access-tokens/options
   - Returns available scope types
   - Returns resource types
   - Returns default expiration options
   - Useful for UI forms

6. **`cleanupExpiredTokens`** - POST /api/auditor-access-tokens/cleanup
   - Administrative maintenance operation
   - Marks expired tokens as inactive
   - Returns count of cleaned tokens

**Input Validation:**
- Email format validation
- Date/time validation (ISO 8601)
- Scope type validation
- Purpose and notes length validation
- Entity ID validation for specific scopes

**Error Handling:**
- Comprehensive error messages
- Appropriate HTTP status codes
- Audit logging for failures

### 6. Routes Configuration

**File:** `backend/src/routes/auditorAccessTokenRoutes.ts`

**Security:**
- All routes require authentication
- Admin/Manager roles required for token management
- Auditor role can view tokens
- Input validation with express-validator
- Rate limiting on creation endpoints

**Route Definitions:**
```typescript
POST   /api/auditor-access-tokens              (Admin, Manager)
GET    /api/auditor-access-tokens              (Admin, Manager, Auditor)
GET    /api/auditor-access-tokens/options      (Admin, Manager)
GET    /api/auditor-access-tokens/:id          (Admin, Manager, Auditor)
PUT    /api/auditor-access-tokens/:id/revoke   (Admin, Manager)
POST   /api/auditor-access-tokens/cleanup      (Admin)
```

### 7. Integration with Existing Routes

**Modified Files:**
- `backend/src/index.ts` - Added auditor access token routes
- `backend/src/routes/auditRoutes.ts` - Added auditor token support for read operations
- `backend/src/routes/documentRoutes.ts` - Added auditor token support for read operations

**Integration Pattern:**
```typescript
// Write operations - require regular JWT
router.post('/', authenticateToken, authorizeRoles(...), controller);

// Read operations - accept both JWT and auditor tokens
router.get('/', flexibleAuth, enforceReadOnly, checkResourceScope('resource'), 
           logAuditorAccess('resource'), controller);
```

**Supported Resources:**
- ✅ Audits (list, view)
- ✅ Documents (list, view, version history, download)
- 🔧 Extendable to: NCRs, CAPAs, Equipment, Training, etc.

## Security Features

### Token Security
1. **Secure Generation:** 32-byte cryptographically random tokens
2. **Hashing:** SHA-256 hashing before database storage
3. **One-Time Display:** Raw token shown only during generation
4. **Token Preview:** Only first 8 and last 4 characters stored/displayed

### Access Control
1. **Time Limits:** Mandatory expiration timestamp
2. **Usage Limits:** Optional maximum usage count
3. **Read-Only Enforcement:** Middleware blocks all non-GET requests
4. **Scope Control:** Fine-grained access to specific resources
5. **Manual Revocation:** Immediate token deactivation capability
6. **Automatic Expiration:** Tokens automatically invalid after expiration

### Audit Trail
1. **Token Generation:** Logged with creator, auditor, scope, purpose
2. **Token Usage:** Every API access logged with:
   - Auditor name and email
   - Resource type and entity ID
   - Timestamp and IP address
   - Request path and method
   - Success/failure status
3. **Failed Access:** Invalid tokens and denied access logged
4. **Token Revocation:** Logged with revoker and reason

### IP Tracking
- Records IP address on each token use
- Supports both IPv4 and IPv6
- Useful for detecting unusual access patterns

## Testing

**File:** `backend/src/__tests__/controllers/auditorAccessTokenController.test.ts`

**Test Coverage:**

1. ✅ **Token Generation**
   - Successful generation with valid data
   - Rejection of past expiration dates
   - Rejection of invalid scope types
   - Scope-entity ID validation

2. ✅ **Token Retrieval**
   - List all tokens
   - Filter by activeOnly
   - Get specific token by ID
   - Handle not found cases

3. ✅ **Token Revocation**
   - Successful revocation
   - Prevent double revocation
   - Require revocation reason

4. ✅ **Options Endpoint**
   - Return available scope types
   - Return resource types
   - Return expiration options

5. ✅ **Cleanup Operation**
   - Mark expired tokens inactive
   - Return cleanup count

**Test Results:**
```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        2.644s
```

**Mocking:**
- AuditorAccessTokenService methods
- Audit logging service
- Express request/response objects

## Build and Quality Checks

### Build Status
```bash
$ npm run build
✅ TypeScript compilation successful
✅ No build errors
✅ All type definitions correct
```

### Security Analysis
```bash
$ CodeQL Analysis
✅ 0 vulnerabilities found
✅ No SQL injection risks
✅ No authentication bypass issues
✅ No sensitive data exposure
```

### Code Quality
- ✅ Follows existing code patterns
- ✅ Consistent naming conventions
- ✅ Comprehensive error handling
- ✅ Proper TypeScript typing
- ✅ No ESLint errors

## API Documentation

**File:** `AUDITOR_ACCESS_TOKENS_API_DOCUMENTATION.md`

Comprehensive documentation including:
- All endpoint specifications
- Request/response examples
- Authentication and authorization details
- Security considerations
- Usage examples with curl
- Error responses
- Best practices
- Database schema

## Usage Examples

### 1. Generate Token for ISO 9001 Audit

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "Jane Smith",
    "auditorEmail": "jane.smith@certbody.com",
    "auditorOrganization": "ISO Certification Body",
    "expiresAt": "2024-12-31T23:59:59Z",
    "scopeType": "full_read_only",
    "purpose": "ISO 9001:2015 certification audit"
  }'
```

**Response:**
```json
{
  "message": "Auditor access token generated successfully",
  "tokenId": 42,
  "token": "a1b2c3d4e5f6g7h8i9j0...",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "accessUrl": "http://localhost:3000/auditor-access?token=a1b2c3d4...",
  "warning": "Store this token securely. It will not be displayed again."
}
```

### 2. Generate Token for Specific Audit Review

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "John Auditor",
    "auditorEmail": "john@external-audit.com",
    "expiresAt": "2024-12-20T23:59:59Z",
    "scopeType": "specific_audit",
    "scopeEntityId": 123,
    "allowedResources": ["audit", "audit-finding"],
    "purpose": "Review audit findings for external audit #123",
    "maxUses": 50
  }'
```

### 3. Auditor Accessing Documents

```bash
# List all documents
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8..."

# View specific document
curl -X GET http://localhost:3000/api/documents/456 \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8..."

# Download document
curl -X GET http://localhost:3000/api/documents/456/download \
  -H "Authorization: AuditorToken a1b2c3d4e5f6g7h8..." \
  --output document.pdf
```

### 4. Revoke Token After Audit Completion

```bash
curl -X PUT http://localhost:3000/api/auditor-access-tokens/42/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "External audit completed successfully"
  }'
```

### 5. List Active Tokens

```bash
curl -X GET "http://localhost:3000/api/auditor-access-tokens?activeOnly=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Audit Trail Examples

### Token Generation Log
```json
{
  "action": "create",
  "actionCategory": "system",
  "actionDescription": "Generated auditor access token for Jane Smith (jane.smith@certbody.com)",
  "entityType": "AuditorAccessToken",
  "entityId": 42,
  "entityIdentifier": "jane.smith@certbody.com",
  "userId": 1,
  "userName": "Admin User",
  "timestamp": "2024-12-08T10:00:00.000Z",
  "success": true,
  "newValues": "{\"auditorName\":\"Jane Smith\",\"scopeType\":\"full_read_only\",\"expiresAt\":\"2024-12-31T23:59:59.000Z\"}"
}
```

### Document Access Log
```json
{
  "action": "view",
  "actionCategory": "system",
  "actionDescription": "Auditor Jane Smith accessed document",
  "entityType": "document",
  "entityId": 456,
  "entityIdentifier": "jane.smith@certbody.com",
  "timestamp": "2024-12-10T14:30:00.000Z",
  "ipAddress": "203.0.113.45",
  "success": true,
  "additionalData": "{\"auditorName\":\"Jane Smith\",\"scopeType\":\"full_read_only\",\"path\":\"/api/documents/456\"}"
}
```

### Token Revocation Log
```json
{
  "action": "delete",
  "actionCategory": "system",
  "actionDescription": "Revoked auditor access token for Jane Smith (jane.smith@certbody.com)",
  "entityType": "AuditorAccessToken",
  "entityId": 42,
  "entityIdentifier": "jane.smith@certbody.com",
  "userId": 1,
  "timestamp": "2024-12-15T09:00:00.000Z",
  "success": true,
  "oldValues": "{\"active\":true}",
  "newValues": "{\"active\":false,\"revokedBy\":1,\"revocationReason\":\"Audit completed\"}"
}
```

## Compliance and ISO 9001:2015 Support

This feature supports ISO 9001:2015 compliance by:

1. **Controlled Access:** Provides secure, time-limited access to external auditors
2. **Audit Trail:** Complete traceability of all auditor activities
3. **Read-Only Access:** Ensures auditors cannot modify QMS data
4. **Documentation:** Comprehensive purpose and notes for each token
5. **Accountability:** Tracks who generated tokens and why
6. **Security:** Prevents unauthorized access to sensitive QMS data
7. **Revocation:** Immediate termination of access when no longer needed

## Best Practices

### For QMS Administrators

1. **Short Durations:** Set tokens to expire shortly after expected audit completion
2. **Specific Scopes:** Use specific scopes when auditor only needs certain data
3. **Usage Limits:** Set `maxUses` for extra security (e.g., 100 requests)
4. **Secure Sharing:** Share tokens via secure channels (encrypted email, secure portal)
5. **Document Purpose:** Always provide clear purpose and notes
6. **Prompt Revocation:** Revoke tokens immediately after audit completion
7. **Regular Review:** Periodically review active tokens
8. **Cleanup Routine:** Run cleanup endpoint weekly/monthly

### For External Auditors

1. **Secure Storage:** Store tokens securely (password manager)
2. **HTTPS Only:** Always use HTTPS for API requests
3. **Read-Only:** Understand that only viewing is allowed
4. **Report Issues:** Report any access problems immediately
5. **Token Expiration:** Be aware of token expiration date
6. **No Sharing:** Do not share tokens with unauthorized parties

## Performance Considerations

### Database Performance
- Strategic indexes on frequently queried fields
- Token lookup is O(1) with unique index on hashed token
- Pagination support for token listing
- Efficient cleanup of expired tokens

### API Performance
- Token validation cached during request lifecycle
- Minimal database queries per request
- Async audit logging (non-blocking)
- Efficient scope validation

### Scalability
- Designed for high read volume
- Token validation is fast (single query)
- Usage tracking is asynchronous
- No file system dependencies

## Extensibility

### Adding Support for New Resources

To add auditor token support to a new resource (e.g., NCRs):

1. **Import middleware:**
```typescript
import { flexibleAuth } from '../middleware/flexibleAuth';
import { enforceReadOnly, checkResourceScope, logAuditorAccess } from '../middleware/auditorAccessToken';
```

2. **Update routes:**
```typescript
// Read operations support auditor tokens
router.get('/', flexibleAuth, enforceReadOnly, checkResourceScope('ncr'), 
           logAuditorAccess('ncr'), getNCRs);

router.get('/:id', flexibleAuth, validateId, enforceReadOnly, 
           checkResourceScope('ncr'), logAuditorAccess('ncr'), getNCRById);

// Write operations remain JWT-only
router.post('/', authenticateToken, authorizeRoles(...), createNCR);
```

3. **Update resource types in controller:**
```typescript
// In getOptions function
resourceTypes: [..., 'ncr']
```

## Deployment Considerations

### Production Checklist
- ✅ Database schema deployed
- ✅ TypeScript compiled
- ✅ Tests passing
- ✅ No security vulnerabilities
- ✅ API documentation complete
- ✅ Audit logging configured
- ✅ RBAC properly configured
- ✅ HTTPS enabled (required)

### Environment Variables
No new environment variables required. Uses existing:
- Database configuration
- JWT secret (for admin authentication)

### Database Migration
Run the schema creation script:
```sql
-- Execute: backend/database/33_create_auditor_access_tokens_table.sql
```

### Monitoring
Monitor for:
- High token usage from single IP
- Frequent failed authentication attempts
- Tokens nearing expiration with high usage
- Unusual access patterns in audit logs

## Future Enhancement Opportunities

1. **Token Refresh:** Extend token expiration before it expires
2. **IP Whitelisting:** Restrict tokens to specific IP ranges
3. **Email Notifications:** Alert when tokens are created/expire
4. **Token Templates:** Pre-configured settings for common audit types
5. **Batch Generation:** Create multiple tokens for audit teams
6. **Frontend UI:** User-friendly token management interface
7. **Access Reports:** Automated reports of auditor activity
8. **Resource Filtering:** More granular field-level permissions
9. **Multi-Factor Authentication:** Optional MFA for high-security audits
10. **Token Analytics:** Dashboard showing usage patterns

## Files Changed

### New Files
1. `backend/database/33_create_auditor_access_tokens_table.sql` - Database schema
2. `backend/src/services/auditorAccessTokenService.ts` - Token management service
3. `backend/src/controllers/auditorAccessTokenController.ts` - API controller
4. `backend/src/routes/auditorAccessTokenRoutes.ts` - Route definitions
5. `backend/src/middleware/auditorAccessToken.ts` - Authentication middleware
6. `backend/src/middleware/flexibleAuth.ts` - Flexible auth middleware
7. `backend/src/__tests__/controllers/auditorAccessTokenController.test.ts` - Unit tests
8. `AUDITOR_ACCESS_TOKENS_API_DOCUMENTATION.md` - API documentation
9. `P3_3_2_IMPLEMENTATION_SUMMARY.md` - This summary document

### Modified Files
1. `backend/src/index.ts` - Added auditor access token routes
2. `backend/src/routes/auditRoutes.ts` - Added auditor token support
3. `backend/src/routes/documentRoutes.ts` - Added auditor token support

## Conclusion

The auditor temporary access links feature has been successfully implemented with:

- ✅ Complete backend functionality
- ✅ Secure token generation and validation
- ✅ Read-only access enforcement
- ✅ Flexible scope control
- ✅ Comprehensive audit logging
- ✅ Comprehensive testing (12 tests passing)
- ✅ Full API documentation
- ✅ No security vulnerabilities (CodeQL verified)
- ✅ Integration with existing authentication system
- ✅ Support for audits and documents (extensible)

The implementation is production-ready and provides a secure, auditable way for external auditors to access QMS data with time-limited, read-only permissions.

## Support and Maintenance

For questions or issues:
- Review API documentation: `AUDITOR_ACCESS_TOKENS_API_DOCUMENTATION.md`
- Check test suite: `backend/src/__tests__/controllers/auditorAccessTokenController.test.ts`
- Refer to service implementation: `backend/src/services/auditorAccessTokenService.ts`
- Review audit logs in database: `AuditLog` table filtered by `entityType = 'AuditorAccessToken'`
