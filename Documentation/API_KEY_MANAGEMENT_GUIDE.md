# API Key Management Guide

This guide explains how to use the API key management feature in E-QMS for secure integration endpoints.

## Overview

API keys provide a secure way for external systems to authenticate with the E-QMS API without using JWT tokens. This is ideal for:
- Server-to-server integrations
- Automated scripts and tools
- Third-party applications
- Continuous integration/deployment pipelines

## Features

### Security
- **Bcrypt Hashing**: API keys are hashed using bcrypt before storage (never stored in plain text)
- **Show Once**: Raw API key is displayed only once during generation
- **IP Whitelisting**: Optional restriction to specific IP addresses
- **Scope-based Access**: Control which endpoints the key can access
- **Expiration Dates**: Optional automatic expiration
- **Audit Logging**: All API key operations are logged

### Management
- **Generate**: Create new API keys with custom settings
- **Revoke**: Immediately deactivate a key (with optional reason)
- **Delete**: Permanently remove a key
- **Monitor**: Track usage count, last used date, and IP address

## Using the API Key Management UI

### Accessing the Page

1. Log in as an admin or superuser
2. Navigate to **API Keys** from the admin menu
3. The API Keys page shows all existing keys

### Generating a New API Key

1. Click **+ Generate API Key**
2. Fill in the form:
   - **Name** (required): Descriptive name (e.g., "Production Integration Key")
   - **Description** (optional): Purpose of the key
   - **Expiration Date** (optional): When the key should expire
   - **Scopes** (optional): Currently not implemented, for future use
   - **Allowed IPs** (optional): Currently not implemented, for future use
3. Click **Generate API Key**
4. **IMPORTANT**: Copy the displayed API key immediately - it will never be shown again!
5. Store the API key in a secure location (e.g., environment variable, secrets manager)

### Revoking an API Key

1. Locate the key in the list
2. Click **Revoke**
3. Optionally enter a reason for revocation
4. The key is immediately deactivated and can no longer be used

### Deleting an API Key

1. Locate the key in the list
2. Click **Delete**
3. Confirm the deletion
4. The key is permanently removed from the database

## Using API Keys

### Authentication Header

Include the API key in the `X-API-Key` header of your HTTP requests:

```bash
curl -H "X-API-Key: YOUR_API_KEY_HERE" \
  https://your-domain.com/api/endpoint
```

### Example Requests

#### Using curl

```bash
# Get all users
curl -H "X-API-Key: abc123..." \
  https://eqms.example.com/api/users

# Create a document
curl -X POST \
  -H "X-API-Key: abc123..." \
  -H "Content-Type: application/json" \
  -d '{"title":"New Document","content":"..."}' \
  https://eqms.example.com/api/documents
```

#### Using JavaScript (Node.js)

```javascript
const axios = require('axios');

const apiKey = process.env.EQMS_API_KEY;
const apiUrl = 'https://eqms.example.com/api';

// Get users
axios.get(`${apiUrl}/users`, {
  headers: {
    'X-API-Key': apiKey
  }
})
.then(response => {
  console.log('Users:', response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data);
});
```

#### Using Python

```python
import requests
import os

api_key = os.environ.get('EQMS_API_KEY')
api_url = 'https://eqms.example.com/api'

# Get users
response = requests.get(
    f'{api_url}/users',
    headers={'X-API-Key': api_key}
)

if response.status_code == 200:
    users = response.json()
    print('Users:', users)
else:
    print('Error:', response.json())
```

## API Endpoints

### API Key Management

All API key management endpoints require authentication with JWT (admin/superuser role).

#### Generate API Key

```http
POST /api/api-keys
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Production Integration Key",
  "description": "Key for production server integration",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "API key created successfully",
  "apiKey": {
    "id": 1,
    "name": "Production Integration Key",
    "keyPreview": "abcd1234...xyz9",
    "description": "Key for production server integration",
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2025-11-18T12:00:00Z"
  },
  "rawKey": "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz567890"
}
```

#### List All API Keys

```http
GET /api/api-keys
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Production Integration Key",
    "keyPreview": "abcd1234...xyz9",
    "active": true,
    "lastUsedAt": "2025-11-18T11:30:00Z",
    "usageCount": 150,
    "createdAt": "2025-11-18T10:00:00Z",
    "creatorEmail": "admin@example.com",
    "creatorName": "John Doe"
  }
]
```

#### Revoke API Key

```http
POST /api/api-keys/:id/revoke
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "reason": "Key compromised"
}
```

#### Delete API Key

```http
DELETE /api/api-keys/:id
Authorization: Bearer <JWT_TOKEN>
```

## Security Best Practices

### For API Key Holders

1. **Store Securely**: Never commit API keys to source control
2. **Use Environment Variables**: Store keys in environment variables or secrets managers
3. **Rotate Regularly**: Generate new keys periodically and revoke old ones
4. **Minimum Privilege**: Request only the scopes your application needs
5. **Monitor Usage**: Regularly check usage statistics for anomalies
6. **Immediate Revocation**: Revoke keys immediately if compromised

### For Administrators

1. **Set Expiration Dates**: Use expiration dates for temporary integrations
2. **Enable IP Whitelisting**: Restrict keys to known IP addresses when possible
3. **Limit Scopes**: Assign minimal required scopes to each key
4. **Regular Audits**: Review active keys and revoke unused ones
5. **Monitor Logs**: Check audit logs for suspicious activity
6. **Document Purpose**: Always document what each key is used for

## Troubleshooting

### "API key required"
- Make sure you're including the `X-API-Key` header in your request
- Check that the header name is exactly `X-API-Key` (case-sensitive)

### "Invalid or expired API key"
- Verify the API key is correct (copy/paste carefully)
- Check if the key has been revoked
- Check if the key has expired

### "API key has been revoked"
- The key has been manually revoked by an administrator
- Generate a new key and update your application

### "API key has expired"
- The key has passed its expiration date
- Generate a new key with a future expiration date

### "Access denied: IP address not allowed"
- Your IP address is not in the allowed list
- Contact the administrator to add your IP or use a different key

## Database Schema

The API keys are stored in the `ApiKeys` table:

```sql
CREATE TABLE ApiKeys (
    id INT IDENTITY(1,1) PRIMARY KEY,
    keyHash NVARCHAR(255) UNIQUE NOT NULL,
    keyPreview NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    expiresAt DATETIME2,
    scopes NVARCHAR(MAX),
    allowedIPs NVARCHAR(MAX),
    active BIT DEFAULT 1 NOT NULL,
    revokedAt DATETIME2,
    revokedBy INT,
    revocationReason NVARCHAR(500),
    lastUsedAt DATETIME2,
    lastUsedIp NVARCHAR(45),
    usageCount INT DEFAULT 0 NOT NULL,
    description NVARCHAR(1000),
    createdAt DATETIME2 DEFAULT GETDATE() NOT NULL,
    createdBy INT NOT NULL,
    updatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Users(id),
    FOREIGN KEY (revokedBy) REFERENCES Users(id)
);
```

## Implementation Details

### Key Generation
- Keys are generated using 32 bytes of cryptographically secure random data
- Encoded as base64url (URL-safe base64 without padding)
- Results in 43-character keys

### Key Hashing
- Uses bcrypt with 10 rounds for hashing
- Provides protection against rainbow table attacks
- Makes brute-force attacks computationally expensive

### Key Verification
- Constant-time comparison using bcrypt.compare()
- Prevents timing attacks
- Checks expiration and active status

## Future Enhancements

Planned features for future releases:

1. **Scope-based Permissions**: Fine-grained control over API access
2. **Rate Limiting**: Per-key rate limits
3. **Usage Analytics**: Detailed analytics dashboard
4. **Key Rotation**: Automated key rotation policies
5. **Webhooks**: Notifications for key events
6. **CIDR IP Ranges**: Support for IP range whitelisting
7. **Multiple Environments**: Separate keys for dev/staging/production

## Support

For issues or questions about API key management:
1. Check the audit logs for error details
2. Review this guide for common solutions
3. Contact your system administrator
4. Refer to the main E-QMS documentation

---

**Security Note**: API keys are equivalent to passwords. Treat them with the same level of security. Never share API keys, commit them to version control, or expose them in client-side code.
