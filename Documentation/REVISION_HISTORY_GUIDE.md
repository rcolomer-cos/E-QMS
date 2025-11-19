# Document Revision History Guide

This guide explains how to use the document revision tracking feature in E-QMS.

## Overview

The Document Revision History system provides detailed audit trail capabilities for document changes, supporting ISO 9001:2015 compliance requirements. It tracks:

- Version numbers at time of revision
- Sequential revision numbers
- Change descriptions and reasons
- Author information
- File references and integrity hashes
- Status transitions
- Complete timestamp audit trail

## Database Setup

### 1. Run the SQL Script

Execute the database script to create the DocumentRevisions table:

```bash
# Connect to your SQL Server and run:
cd backend/database
sqlcmd -S localhost -d eqms -i 09_create_document_revisions_table.sql
```

Or use SQL Server Management Studio to execute `09_create_document_revisions_table.sql`.

### 2. Verify Installation

```sql
-- Check that the table was created
SELECT * FROM DatabaseVersion WHERE version = '1.0.9';

-- Verify table structure
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DocumentRevisions'
ORDER BY ORDINAL_POSITION;
```

## API Usage

### Get Revision History for a Document

Retrieve the complete revision history for a document:

```bash
GET /api/documents/{documentId}/revisions
Authorization: Bearer <your-jwt-token>
```

**Example Response:**
```json
[
  {
    "id": 15,
    "documentId": 1,
    "version": "1.2",
    "revisionNumber": 5,
    "changeDescription": "Updated section 4.3 based on ISO audit feedback",
    "changeType": "update",
    "changeReason": "Compliance requirement from ISO audit",
    "authorId": 3,
    "authorName": "Jane Smith",
    "authorFirstName": "Jane",
    "authorLastName": "Smith",
    "authorEmail": "jane.smith@example.com",
    "statusBefore": "approved",
    "statusAfter": "approved",
    "revisionDate": "2024-03-15T09:30:00Z"
  }
]
```

### Create a Revision Entry

Manually create a revision history entry:

```bash
POST /api/documents/{documentId}/revisions
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "changeType": "update",
  "changeDescription": "Updated formatting and fixed typos in section 3",
  "changeReason": "Internal quality review feedback",
  "statusBefore": "approved",
  "statusAfter": "approved"
}
```

## Change Types

The system supports the following change types:

| Change Type | Description | Typical Use Case |
|-------------|-------------|------------------|
| `create` | Initial document creation | First version of document |
| `update` | Content or metadata changed | Document edits, corrections |
| `approve` | Document approved | Approval workflow completion |
| `obsolete` | Document marked obsolete | Document retirement |
| `review` | Submitted for review | Workflow transition |
| `version` | New version created | Major revisions |

## Permissions

Revision history access follows document permissions:

- **View Revisions**: Requires VIEW permission on the document
- **Create Revisions**: Requires EDIT permission on the document

## Programmatic Usage

### In Backend Code

```typescript
import { DocumentModel } from './models/DocumentModel';

// Create a revision when a document is updated
async function updateDocumentWithRevision(
  documentId: number,
  userId: number,
  updates: Partial<Document>
) {
  // Get current document state
  const document = await DocumentModel.findById(documentId);
  
  // Update the document
  await DocumentModel.update(documentId, updates);
  
  // Create revision entry
  await DocumentModel.createRevision(
    documentId,
    userId,
    'update',
    'Updated document content',
    'Quality improvement',
    document.status,
    updates.status || document.status
  );
}

// Retrieve revision history
const revisions = await DocumentModel.getRevisionHistory(documentId);
```

### In Frontend (React/TypeScript)

```typescript
import axios from 'axios';

// Get revision history
async function getDocumentRevisions(documentId: number) {
  const response = await axios.get(
    `/api/documents/${documentId}/revisions`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
}

// Create revision entry
async function createRevision(
  documentId: number,
  changeData: {
    changeType: string;
    changeDescription?: string;
    changeReason?: string;
    statusBefore?: string;
    statusAfter?: string;
  }
) {
  const response = await axios.post(
    `/api/documents/${documentId}/revisions`,
    changeData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
```

## SQL Queries

### Get Revision History with Author Details

```sql
SELECT 
    dr.revisionNumber,
    dr.version,
    dr.changeType,
    dr.changeDescription,
    dr.changeReason,
    dr.statusBefore + ' → ' + dr.statusAfter AS statusChange,
    u.firstName + ' ' + u.lastName AS author,
    u.email AS authorEmail,
    dr.revisionDate
FROM DocumentRevisions dr
LEFT JOIN Users u ON dr.authorId = u.id
WHERE dr.documentId = @documentId
ORDER BY dr.revisionDate DESC;
```

### Audit Trail for Date Range

```sql
SELECT 
    d.title AS documentTitle,
    dr.version,
    dr.changeType,
    dr.changeDescription,
    u.firstName + ' ' + u.lastName AS author,
    dr.revisionDate
FROM DocumentRevisions dr
INNER JOIN Documents d ON dr.documentId = d.id
LEFT JOIN Users u ON dr.authorId = u.id
WHERE dr.revisionDate BETWEEN @startDate AND @endDate
ORDER BY dr.revisionDate DESC;
```

### User Activity Report

```sql
SELECT 
    u.firstName + ' ' + u.lastName AS author,
    COUNT(*) AS revisionCount,
    STRING_AGG(DISTINCT d.title, ', ') AS documentsModified
FROM DocumentRevisions dr
INNER JOIN Users u ON dr.authorId = u.id
INNER JOIN Documents d ON dr.documentId = d.id
WHERE dr.revisionDate >= DATEADD(month, -1, GETDATE())
GROUP BY u.id, u.firstName, u.lastName
ORDER BY revisionCount DESC;
```

## Best Practices

### 1. Automatic Revision Creation

Create revision entries automatically for significant document changes:

```typescript
// When approving a document
await DocumentModel.createRevision(
  documentId,
  userId,
  'approve',
  'Document approved for use',
  undefined,
  'review',
  'approved'
);
```

### 2. Detailed Change Descriptions

Provide meaningful change descriptions:

```typescript
// Good
changeDescription: "Updated section 4.3 to align with ISO 9001:2015 clause 7.5"

// Less useful
changeDescription: "Updated document"
```

### 3. Link Related Changes

Use the `changeReason` field to provide context:

```typescript
changeReason: "Compliance with regulatory requirement XYZ-123"
changeReason: "Addresses finding from internal audit report #2024-Q1-05"
```

### 4. Regular Audits

Periodically review revision history for compliance:

```sql
-- Documents with no revisions in last 6 months
SELECT d.id, d.title, d.status, MAX(dr.revisionDate) AS lastRevision
FROM Documents d
LEFT JOIN DocumentRevisions dr ON d.id = dr.documentId
GROUP BY d.id, d.title, d.status
HAVING MAX(dr.revisionDate) < DATEADD(month, -6, GETDATE())
   OR MAX(dr.revisionDate) IS NULL;
```

## ISO 9001 Compliance

The revision history system supports the following ISO 9001:2015 requirements:

- **Clause 7.5.3.2 (Document Control)**: Complete audit trail of document changes
- **Traceability**: Linked revision history via `previousRevisionId`
- **Author Identification**: User information captured for all changes
- **Change Justification**: `changeDescription` and `changeReason` fields
- **Status Tracking**: Before/after status recording

## Troubleshooting

### Revision History Not Appearing

1. Verify the table was created:
   ```sql
   SELECT * FROM sys.tables WHERE name = 'DocumentRevisions';
   ```

2. Check permissions:
   ```sql
   -- User should have SELECT permission
   EXEC sp_helprotect 'DocumentRevisions';
   ```

### Performance Issues

If queries are slow with large revision counts:

1. Ensure indexes are created (automatically done by the schema script)
2. Consider archiving old revisions for obsolete documents
3. Use date range filters in queries

### Missing Author Information

If `authorFirstName` or `authorLastName` is NULL:

1. Check that the user still exists in the Users table
2. Verify the foreign key relationship is intact
3. The system caches author name at revision creation time

## Support

For questions or issues with the revision history system:

1. Check the API documentation: `/backend/API_DOCUMENTATION.md`
2. Review database schema: `/backend/database/README.md`
3. Contact the development team

## Future Enhancements

Planned features for future releases:

- Automatic revision creation on document update
- Diff view showing changes between revisions
- Export revision history to PDF/Excel
- Configurable retention policies
- Advanced search and filtering
