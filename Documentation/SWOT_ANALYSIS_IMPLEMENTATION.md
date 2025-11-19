# SWOT Analysis Implementation Guide

## Overview

The SWOT Analysis module provides a dedicated interface for documenting and managing organizational Strengths, Weaknesses, Opportunities, and Threats. This feature supports strategic planning and management reviews within the ISO 9001 framework.

## Features

### Core Functionality
- **2×2 Matrix Layout**: Visual representation of SWOT analysis with four quadrants
- **CRUD Operations**: Create, read, update, and delete SWOT entries
- **Filtering**: Filter by category, status, and priority
- **Search**: Find entries by title or description
- **Statistics**: Dashboard showing total entries and breakdown by category
- **Role-Based Access Control**: Admin/Manager can modify, all users can view

### Entry Properties
- **Title**: Brief description of the SWOT item (required)
- **Description**: Detailed explanation (optional)
- **Category**: Strength, Weakness, Opportunity, or Threat (required)
- **Owner**: Assigned user responsible for the item
- **Priority**: Low, Medium, High, or Critical
- **Review Date**: Last review date
- **Next Review Date**: Scheduled review date
- **Status**: Active, Archived, or Addressed

## Database Schema

### Table: SwotEntries

```sql
CREATE TABLE SwotEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(2000),
    category NVARCHAR(50) NOT NULL, -- Strength, Weakness, Opportunity, Threat
    owner INT,
    priority NVARCHAR(50), -- low, medium, high, critical
    reviewDate DATETIME2,
    nextReviewDate DATETIME2,
    status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, archived, addressed
    createdBy INT NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);
```

### Indexes
- Category lookups (most common query pattern)
- Status tracking
- Priority-based filtering
- Owner assignment
- Date-based queries for review scheduling

## API Endpoints

### Base URL: `/api/swot`

All endpoints require authentication. Admin and Manager roles can modify entries.

#### GET `/api/swot/statistics`
Get SWOT statistics including total entries and breakdown by category, status, and priority.

**Response:**
```json
{
  "totalEntries": 42,
  "byCategory": {
    "Strength": 12,
    "Weakness": 8,
    "Opportunity": 15,
    "Threat": 7
  },
  "byStatus": {
    "active": 35,
    "archived": 5,
    "addressed": 2
  },
  "byPriority": {
    "critical": 3,
    "high": 8,
    "medium": 20,
    "low": 11
  }
}
```

#### POST `/api/swot`
Create a new SWOT entry. Requires Admin or Manager role.

**Request Body:**
```json
{
  "title": "Strong brand reputation",
  "description": "Well-established brand with high customer trust",
  "category": "Strength",
  "owner": 5,
  "priority": "high",
  "reviewDate": "2025-01-15",
  "nextReviewDate": "2025-04-15",
  "status": "active"
}
```

**Response:**
```json
{
  "message": "SWOT entry created successfully",
  "id": 123
}
```

#### GET `/api/swot`
Get all SWOT entries with optional filtering.

**Query Parameters:**
- `category`: Filter by category (Strength, Weakness, Opportunity, Threat)
- `status`: Filter by status (active, archived, addressed)
- `priority`: Filter by priority (low, medium, high, critical)
- `owner`: Filter by owner user ID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Strong brand reputation",
      "description": "Well-established brand with high customer trust",
      "category": "Strength",
      "owner": 5,
      "priority": "high",
      "reviewDate": "2025-01-15T00:00:00.000Z",
      "nextReviewDate": "2025-04-15T00:00:00.000Z",
      "status": "active",
      "createdBy": 1,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET `/api/swot/:id`
Get a single SWOT entry by ID.

**Response:** Single SWOT entry object

#### PUT `/api/swot/:id`
Update a SWOT entry. Requires Admin or Manager role.

**Request Body:** Partial SWOT entry with fields to update

#### DELETE `/api/swot/:id`
Delete a SWOT entry. Requires Admin role only.

## Frontend Usage

### Accessing the SWOT Analysis Page

Navigate to `/swot-analysis` in the application.

### User Interface

#### Main View
- **Statistics Bar**: Shows total entries and count per category
- **Filters**: Search, status, and priority filters above the matrix
- **2×2 Matrix**: Four quadrants displaying categorized entries
  - Top-left: Strengths (Green)
  - Top-right: Weaknesses (Red)
  - Bottom-left: Opportunities (Blue)
  - Bottom-right: Threats (Orange)

#### Creating an Entry
1. Click "Add SWOT Entry" button (Admin/Manager only)
2. Or click the "+" button in any quadrant header to pre-select that category
3. Fill in the form fields
4. Click "Create"

#### Editing an Entry
1. Click "Edit" button on any entry card (Admin/Manager only)
2. Modify the desired fields
3. Click "Update"

#### Deleting an Entry
1. Click "Delete" button on any entry card (Admin only)
2. Confirm the deletion

### Color Coding

**Categories:**
- Strength: Green (#388e3c)
- Weakness: Red (#d32f2f)
- Opportunity: Blue (#1976d2)
- Threat: Orange (#f57c00)

**Priorities:**
- Critical: Red (#d32f2f)
- High: Orange (#f57c00)
- Medium: Yellow (#fbc02d)
- Low: Green (#388e3c)

## Role-Based Access Control

| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ |
| User | ✅ | ❌ | ❌ | ❌ |
| Auditor | ✅ | ❌ | ❌ | ❌ |

## Audit Trail

All SWOT entry operations (create, update, delete) are logged in the audit trail with:
- Action category: STRATEGIC_PLANNING
- Entity type: SwotEntry
- User who performed the action
- Timestamp
- Old and new values (for updates)

## Best Practices

### Strategic Planning
1. **Regular Reviews**: Schedule periodic reviews for all SWOT entries
2. **Priority Management**: Mark critical items for immediate attention
3. **Owner Assignment**: Assign owners to ensure accountability
4. **Status Updates**: Keep status current (active, archived, addressed)

### Maintenance
1. **Archive Old Entries**: Move outdated items to archived status
2. **Address Weaknesses/Threats**: Convert to improvement actions or risks
3. **Leverage Strengths/Opportunities**: Link to strategic initiatives
4. **Quarterly Review**: Review and update the SWOT matrix quarterly

### Integration with Other Modules
- **Risks**: Convert threats to risk entries for mitigation tracking
- **Improvement Ideas**: Convert opportunities to improvement initiatives
- **CAPA**: Address weaknesses through corrective actions
- **Audits**: Use SWOT analysis during management review audits

## Technical Implementation

### Backend Components
- **Model**: `backend/src/models/SwotModel.ts`
- **Controller**: `backend/src/controllers/swotController.ts`
- **Routes**: `backend/src/routes/swotRoutes.ts`
- **Validators**: `backend/src/utils/validators.ts` (validateSwotEntry, validateSwotEntryUpdate)
- **Database Schema**: `backend/database/schemas/swot.sql`

### Frontend Components
- **Page**: `frontend/src/pages/SwotAnalysis.tsx`
- **Service**: `frontend/src/services/swotService.ts`
- **Styles**: `frontend/src/styles/SwotAnalysis.css`

### Security
- JWT authentication required for all endpoints
- Role-based authorization enforced
- Input validation on all requests
- SQL injection prevention through parameterized queries
- Audit logging for compliance

## Troubleshooting

### Common Issues

**Issue**: SWOT entries not displaying
- **Solution**: Check that the database table exists and user has proper authentication

**Issue**: Cannot create/edit entries
- **Solution**: Verify user has Admin or Manager role

**Issue**: Statistics not updating
- **Solution**: Refresh the page or check console for API errors

### Database Setup

To set up the SWOT table, run the schema script:
```bash
sqlcmd -S <server> -d <database> -i backend/database/schemas/swot.sql
```

Or use the application's database setup tool if available.

## Future Enhancements

Potential improvements for future versions:
- Export SWOT matrix to PDF
- Email notifications for review dates
- SWOT trend analysis over time
- Integration with strategic planning documents
- SWOT matrix comparison between time periods
- Collaborative comments on entries
- File attachments for supporting evidence

## Support

For issues or questions:
1. Check the application logs
2. Review the audit trail for user actions
3. Verify database connectivity and schema
4. Contact system administrator

---

**Last Updated**: 2025-11-19  
**Version**: 1.0.0  
**Implemented by**: GitHub Copilot Agent
