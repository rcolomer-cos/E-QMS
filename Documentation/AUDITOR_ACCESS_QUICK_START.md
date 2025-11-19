# Auditor Access Tokens - Quick Start Guide

## For QMS Administrators

### Generating a Token for an External Auditor

**Step 1: Generate the token via API**

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "auditorName": "Jane Smith",
    "auditorEmail": "jane.smith@audit-firm.com",
    "auditorOrganization": "External Audit Firm LLC",
    "expiresAt": "2024-12-31T23:59:59Z",
    "scopeType": "full_read_only",
    "purpose": "ISO 9001:2015 certification audit"
  }'
```

**Step 2: Save the token from the response**

```json
{
  "message": "Auditor access token generated successfully",
  "tokenId": 42,
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "warning": "Store this token securely. It will not be displayed again."
}
```

⚠️ **Important:** The raw token is shown only once! Save it securely.

**Step 3: Share the token with the auditor**

Send via secure channel (encrypted email, secure portal, etc.):

```
Your temporary access token for the QMS audit:

Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Expires: 2024-12-31 23:59:59 UTC
Access Type: Read-only access to all QMS data

Use this token in API requests:
Authorization: AuditorToken a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Revoking a Token

After the audit is complete, revoke the token:

```bash
curl -X PUT http://localhost:3000/api/auditor-access-tokens/42/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "reason": "External audit completed successfully"
  }'
```

### Viewing Active Tokens

```bash
curl -X GET "http://localhost:3000/api/auditor-access-tokens?activeOnly=true" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## For External Auditors

### Using Your Access Token

You've been provided with a temporary access token to review QMS data.

**Your token format:**
```
Authorization: AuditorToken YOUR_TOKEN_HERE
```

### Accessing Documents

**List all documents:**
```bash
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: AuditorToken YOUR_TOKEN"
```

**View specific document:**
```bash
curl -X GET http://localhost:3000/api/documents/123 \
  -H "Authorization: AuditorToken YOUR_TOKEN"
```

**Download document:**
```bash
curl -X GET http://localhost:3000/api/documents/123/download \
  -H "Authorization: AuditorToken YOUR_TOKEN" \
  --output document.pdf
```

### Accessing Audits

**List all audits:**
```bash
curl -X GET http://localhost:3000/api/audits \
  -H "Authorization: AuditorToken YOUR_TOKEN"
```

**View specific audit:**
```bash
curl -X GET http://localhost:3000/api/audits/456 \
  -H "Authorization: AuditorToken YOUR_TOKEN"
```

### Read-Only Access

Your token provides **read-only** access. You can:
- ✅ List records (GET requests)
- ✅ View specific records (GET requests)
- ✅ Download documents (GET requests)
- ❌ Create records (POST requests)
- ❌ Update records (PUT requests)
- ❌ Delete records (DELETE requests)

Attempting write operations will result in:
```json
{
  "error": "Read-only access: Only GET requests are allowed with auditor tokens"
}
```

### Token Expiration

Your token has an expiration date. After expiration, you'll receive:
```json
{
  "error": "Invalid or expired auditor access token"
}
```

Contact the QMS administrator if you need extended access.

## Scope Types

### Full Read-Only
Complete access to all QMS data (read-only).

**Example:**
```json
{
  "scopeType": "full_read_only"
}
```

### Specific Audit
Access limited to a specific audit and its findings.

**Example:**
```json
{
  "scopeType": "specific_audit",
  "scopeEntityId": 123
}
```

### Specific Document
Access limited to a specific document.

**Example:**
```json
{
  "scopeType": "specific_document",
  "scopeEntityId": 456
}
```

## Common Use Cases

### 1. ISO 9001 Certification Audit (7 days)

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "ISO Auditor",
    "auditorEmail": "auditor@certbody.com",
    "expiresAt": "2024-12-22T23:59:59Z",
    "scopeType": "full_read_only",
    "purpose": "ISO 9001:2015 certification audit"
  }'
```

### 2. Specific Audit Review (48 hours)

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "Internal Auditor",
    "auditorEmail": "auditor@company.com",
    "expiresAt": "2024-12-17T23:59:59Z",
    "scopeType": "specific_audit",
    "scopeEntityId": 789,
    "allowedResources": ["audit", "audit-finding"],
    "purpose": "Review internal audit findings",
    "maxUses": 50
  }'
```

### 3. Document Verification (24 hours)

```bash
curl -X POST http://localhost:3000/api/auditor-access-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "auditorName": "Document Reviewer",
    "auditorEmail": "reviewer@external.com",
    "expiresAt": "2024-12-16T23:59:59Z",
    "scopeType": "specific_document",
    "scopeEntityId": 321,
    "purpose": "Verify document compliance",
    "maxUses": 20
  }'
```

## Security Best Practices

### For Administrators
1. ✅ Set short expiration times (days, not weeks)
2. ✅ Use specific scopes when possible
3. ✅ Set usage limits for extra security
4. ✅ Share tokens via secure channels only
5. ✅ Revoke tokens immediately after audit completion
6. ✅ Review audit logs regularly
7. ✅ Run cleanup periodically

### For Auditors
1. ✅ Store tokens securely (password manager)
2. ✅ Use HTTPS for all API requests
3. ✅ Don't share tokens with unauthorized parties
4. ✅ Be aware of token expiration
5. ✅ Report suspicious activity immediately
6. ✅ Delete tokens after use

## Troubleshooting

### "Invalid or expired auditor access token"
- Check if token has expired
- Verify token is entered correctly
- Contact administrator if token was revoked

### "Read-only access: Only GET requests are allowed"
- Your token only allows viewing data
- Use GET requests instead of POST/PUT/DELETE

### "Access denied: [resource] is not in the allowed resources"
- Your token is scoped to specific resources
- Contact administrator to expand access if needed

### "Access denied: Token is scoped to [type] with ID [id]"
- Your token is limited to a specific entity
- Contact administrator if you need broader access

## Need Help?

- **API Documentation:** `AUDITOR_ACCESS_TOKENS_API_DOCUMENTATION.md`
- **Implementation Details:** `P3_3_2_IMPLEMENTATION_SUMMARY.md`
- **Contact:** Your QMS Administrator

## Audit Trail

All token usage is logged, including:
- Token generation
- Every resource access
- Token revocation
- Failed access attempts

This ensures complete traceability for compliance and security monitoring.
