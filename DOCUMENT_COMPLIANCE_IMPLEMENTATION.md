# Document Compliance Acknowledgement Implementation

## Overview

This document describes the implementation of the Document Compliance Acknowledgement feature in the E-QMS system, which supports ISO 9001 requirements for user read & understand confirmations.

## Database Schema

### Documents Table Update

Added `complianceRequired` field:
- Type: `BIT` (boolean)
- Default: `0` (false)
- Indexed for efficient queries

### DocumentComplianceAcknowledgements Table

New table to track user acknowledgements:

```sql
CREATE TABLE DocumentComplianceAcknowledgements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    documentId INT NOT NULL,
    userId INT NOT NULL,
    documentVersion NVARCHAR(50) NOT NULL,
    acknowledgedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ipAddress NVARCHAR(50),
    userAgent NVARCHAR(500),
    createdAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT UQ_DocumentComplianceAck_User_Document_Version 
        UNIQUE (userId, documentId, documentVersion)
)
```

**Key Features:**
- Unique constraint ensures one acknowledgement per user per document version
- Cascade delete on document and user deletion
- Tracks IP address and user agent for audit trail
- Comprehensive indexing for performance

## Backend API

### Endpoints

#### User Endpoints

1. **POST `/api/documents/compliance/:documentId/acknowledge`**
   - Record user's acknowledgement
   - Requires authentication
   - Validates user has access through groups
   - Records IP and user agent

2. **GET `/api/documents/compliance/:documentId/status`**
   - Get compliance status for current user and specific document
   - Returns: isCompliant, currentVersion, acknowledgedVersion, acknowledgedAt

3. **GET `/api/documents/compliance/pending`**
   - List all pending compliance documents for current user
   - Filters by approved documents not yet acknowledged

4. **GET `/api/documents/compliance/all`**
   - List all compliance documents for current user with status
   - Shows both acknowledged and pending

#### Admin Endpoints

5. **GET `/api/documents/compliance/:documentId/report`**
   - Detailed compliance report for a document
   - Shows all users who should acknowledge
   - Separates acknowledged vs pending users
   - Requires ADMIN or MANAGER role

6. **PUT `/api/documents/compliance/:documentId/toggle`**
   - Toggle compliance requirement for a document
   - Triggers notifications when enabled
   - Requires ADMIN or MANAGER role

## Frontend Components

### ComplianceAcknowledgementModal

Modal component that:
- Shows when viewing a compliance-required document
- Displays document title and version
- Requires checkbox confirmation
- Cannot be dismissed without acknowledging (when onClose is undefined)
- Shows loading state during submission
- Displays errors if submission fails

### ComplianceStatusBadge

Visual indicator component:
- Shows "Compliant" badge (green) when acknowledged
- Shows "Pending" badge (orange) when not acknowledged
- Shows nothing when compliance not required
- Includes tooltip with acknowledgement date

### DocumentComplianceReport Page

Admin dashboard that shows:
- Overall compliance percentage
- Progress bar visualization
- Tabbed interface:
  - Pending users list
  - Acknowledged users list with timestamps
- Accessible only to admins/managers

## User Flow

### For End Users

1. User navigates to a compliance-required document
2. System checks if user has acknowledged current version
3. If not acknowledged:
   - Modal appears automatically
   - User must read and check the confirmation box
   - User clicks "Acknowledge" button
   - System records acknowledgement with timestamp
   - Modal closes and document is accessible
4. If acknowledged:
   - Badge shows "Compliant" status
   - User can view document normally

### For Admins

1. Admin can toggle compliance requirement for any document
2. When enabled:
   - System sends notifications to all users in assigned groups
   - Document appears in pending list for those users
3. Admin can view compliance reports:
   - See who has/hasn't acknowledged
   - Track compliance percentage
   - Export data for audit purposes

## Version Management

### Key Behavior

- Acknowledgements are tied to specific document versions
- When a new version is created:
  - Previous acknowledgements remain in history
  - Users must re-acknowledge the new version
- Version tracking prevents compliance bypass
- Audit trail maintained for all versions

## Security Features

### Access Control

- RBAC enforced on all endpoints
- Users can only acknowledge documents they have access to (via groups)
- Only admins/managers can toggle compliance requirements
- Only admins/managers can view compliance reports

### Audit Trail

- All acknowledgements record:
  - User ID
  - Document ID and version
  - Timestamp
  - IP address
  - User agent
- Immutable records (no delete/update after creation)
- Full traceability for compliance audits

### Input Validation

- Parameter validation using express-validator
- Type checking enforced
- SQL injection prevention via parameterized queries
- XSS prevention through React's built-in escaping

## Integration with Existing Features

### Document Groups

- Compliance documents leverage existing group assignments
- Users in assigned groups must acknowledge
- Group changes automatically update compliance requirements
- Reports show all users from all assigned groups

### Notifications

- New compliance documents trigger notifications
- Updated compliance documents trigger re-acknowledgement notifications
- Notification types:
  - `compliance_required` - New document added
  - `compliance_document_updated` - Document version updated

### Document Approval Workflow

- Compliance notification sent when document approved
- Only approved documents require acknowledgement
- Draft documents do not show compliance prompts

## Testing Considerations

### Unit Tests

- Model methods for CRUD operations
- Compliance status calculations
- Report generation logic

### Integration Tests

- End-to-end acknowledgement flow
- Version-based acknowledgement reset
- Group membership impact
- RBAC enforcement

### Manual Testing

- User acknowledgement workflow
- Admin compliance reporting
- Notification delivery
- Modal behavior (cannot bypass)

## Future Enhancements

Potential improvements:
- Email reminders for pending acknowledgements
- Bulk acknowledgement status export
- Compliance deadline tracking
- Automatic escalation for overdue acknowledgements
- Document reading time tracking
- Quiz/assessment before acknowledgement
- Mobile app support for acknowledgements

## API Reference

See the auto-generated API documentation for detailed request/response schemas:
- Swagger/OpenAPI documentation (if configured)
- Postman collection (if available)

## Database Migration

Migration file: `backend/database/migrations/002_add_document_compliance.sql`

To apply:
```bash
# Run migration script against database
sqlcmd -S <server> -d <database> -i backend/database/migrations/002_add_document_compliance.sql
```

## Compliance Standards

This implementation supports:
- ISO 9001:2015 - Quality Management Systems
- FDA 21 CFR Part 11 - Electronic Records
- GxP regulations - Good Practice guidelines
- SOC 2 - Service Organization Control

## Support and Maintenance

For issues or questions:
- Check logs in `backend/logs/`
- Review audit trail in DocumentComplianceAcknowledgements table
- Contact development team for support
