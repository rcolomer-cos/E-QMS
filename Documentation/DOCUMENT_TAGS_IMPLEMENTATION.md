# Document Tags Implementation Summary

## Overview
This document describes the implementation of the document tagging system for E-QMS, allowing users to create, assign, and search documents by tags.

## Features Implemented

### 1. Tag Management (Admin Only)
- Create tags with custom names, descriptions, and colors
- Edit existing tags (name, description, colors)
- Delete tags
- View tag usage statistics (number of documents per tag)
- Color customization:
  - Background color (hex format)
  - Font color (hex format)
  - Live preview of tag appearance

### 2. Tag Assignment
- Assign multiple tags to documents
- Remove tags from documents
- View all tags assigned to a document
- Search and filter available tags when assigning

### 3. Document Filtering
- Filter document list by one or multiple tags
- Tag filter integrates with existing filters (status, category, type, process)
- Visual tag badges with custom colors

### 4. Security & Access Control
- Admin-only access for tag management (create, edit, delete)
- All authenticated users can view tags and filter by them
- Users with document edit permissions can assign/remove tags
- RBAC enforcement at route level

## Database Schema

### Tags Table
```sql
CREATE TABLE Tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    backgroundColor NVARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    fontColor NVARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    createdBy INT NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedBy INT NULL,
    updatedAt DATETIME2 NULL,
    CONSTRAINT FK_Tags_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id),
    CONSTRAINT FK_Tags_UpdatedBy FOREIGN KEY (updatedBy) REFERENCES Users(id)
);
```

### DocumentTags Junction Table
```sql
CREATE TABLE DocumentTags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    documentId INT NOT NULL,
    tagId INT NOT NULL,
    assignedBy INT NOT NULL,
    assignedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_DocumentTags_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentTags_Tag FOREIGN KEY (tagId) REFERENCES Tags(id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentTags_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
    CONSTRAINT UQ_DocumentTags_DocumentId_TagId UNIQUE (documentId, tagId)
);
```

## API Endpoints

### Tag Management Endpoints

#### GET /api/tags
- **Description**: Get all tags
- **Access**: All authenticated users (flexibleAuth)
- **Response**: Array of Tag objects

#### GET /api/tags/:id
- **Description**: Get tag by ID
- **Access**: All authenticated users (flexibleAuth)
- **Response**: Tag object

#### GET /api/tags/usage
- **Description**: Get tag usage statistics
- **Access**: All authenticated users (flexibleAuth)
- **Response**: Array of { tagId, tagName, documentCount }

#### POST /api/tags
- **Description**: Create a new tag
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "name": "string (required, 1-100 chars)",
    "description": "string (optional, max 500 chars)",
    "backgroundColor": "#RRGGBB (optional, default #3B82F6)",
    "fontColor": "#RRGGBB (optional, default #FFFFFF)"
  }
  ```
- **Response**: { tagId: number }
- **Validation**: Prevents duplicate tag names (case-insensitive)

#### PUT /api/tags/:id
- **Description**: Update tag
- **Access**: Admin only
- **Request Body**: Same as POST (all fields optional)
- **Validation**: Prevents duplicate names when updating

#### DELETE /api/tags/:id
- **Description**: Delete tag
- **Access**: Admin only
- **Note**: Cascades to remove all document-tag assignments

### Document-Tag Endpoints

#### GET /api/documents/:id/tags
- **Description**: Get tags assigned to a document
- **Access**: Users with document VIEW permission
- **Response**: Array of Tag objects

#### POST /api/documents/:id/tags
- **Description**: Assign tags to a document
- **Access**: Users with document EDIT permission
- **Request Body**:
  ```json
  {
    "tagIds": [1, 2, 3]
  }
  ```

#### DELETE /api/documents/:id/tags
- **Description**: Remove tags from a document
- **Access**: Users with document EDIT permission
- **Request Body**:
  ```json
  {
    "tagIds": [1, 2, 3]
  }
  ```

### Document List Filtering

#### GET /api/documents?tagIds=1,2,3
- **Description**: Filter documents by tags
- **Query Parameters**:
  - `tagIds`: Comma-separated list of tag IDs
  - Works with existing filters (status, category, documentType, processId)

## Frontend Components

### TagManager Component
- **Location**: `frontend/src/components/TagManager.tsx`
- **Purpose**: Admin interface for managing tags
- **Features**:
  - List all tags with usage counts
  - Create/Edit/Delete tags
  - Color picker for background and font colors
  - Live tag preview
  - Confirmation dialog for deletions

### TagSelector Component
- **Location**: `frontend/src/components/TagSelector.tsx`
- **Purpose**: Manage tags on a specific document
- **Features**:
  - Display assigned tags with colors
  - Modal for selecting/deselecting tags
  - Search functionality to filter available tags
  - Save/Cancel actions

### TagFilter Component
- **Location**: `frontend/src/components/TagFilter.tsx`
- **Purpose**: Filter document list by tags
- **Features**:
  - Display all available tags
  - Click to select/deselect tags
  - Visual indication of selected tags
  - "Clear All" button
  - Expand/collapse for many tags

## Pages

### Tags Page
- **Route**: `/tags`
- **Access**: Admin only
- **Component**: Renders TagManager component
- **Purpose**: Central location for tag management

### Updated Pages
- **Documents Page**: Added TagFilter component
- **DocumentView Page**: Added TagSelector component for viewing/editing document tags

## Backend Models

### TagModel
- **Location**: `backend/src/models/TagModel.ts`
- **Key Methods**:
  - `create(tag)`: Create new tag
  - `findById(id)`: Get tag by ID
  - `findByName(name)`: Find tag by name (case-insensitive)
  - `findAll()`: Get all tags
  - `update(id, updates)`: Update tag
  - `delete(id)`: Delete tag
  - `findByDocumentId(documentId)`: Get tags for a document
  - `assignToDocument(documentId, tagId, assignedBy)`: Assign tag
  - `assignMultipleToDocument(documentId, tagIds, assignedBy)`: Assign multiple tags
  - `removeFromDocument(documentId, tagId)`: Remove tag
  - `removeAllFromDocument(documentId)`: Remove all tags
  - `findDocumentsByTags(tagIds)`: Find documents by tag IDs
  - `getTagUsageCount()`: Get usage statistics

## Security Measures

### Input Validation
- Tag names: 1-100 characters, required
- Descriptions: Max 500 characters
- Colors: Hex format validation (#RRGGBB)
- Duplicate name prevention (case-insensitive)

### SQL Injection Prevention
- All queries use parameterized inputs
- No string concatenation in SQL queries

### Access Control
- Tag management: Admin role only
- Tag viewing: All authenticated users
- Tag assignment: Document edit permission required

### Audit Trail
- All tag operations logged via auditLogService
- Tracks: create, update, delete actions
- Records: user, timestamp, old/new values

## Usage Examples

### Creating a Tag (Admin)
1. Navigate to `/tags` page
2. Click "Create Tag" button
3. Enter tag name and optional description
4. Choose background and font colors
5. Preview tag appearance
6. Click "Create"

### Assigning Tags to Document
1. Open document view page
2. Find "Tags" section
3. Click "Manage Tags" button
4. Select tags from the list
5. Use search to find specific tags
6. Click "Save Changes"

### Filtering Documents by Tags
1. Navigate to Documents page
2. Find "Filter by Tags" section
3. Click on tags to select/deselect
4. Document list updates automatically
5. Use with other filters for refined search

## Integration Points

### Existing Systems
- **Document Model**: Extended with tagIds filter parameter
- **Document Controller**: Added tag management endpoints
- **Audit Log Service**: Logs all tag operations
- **Document Permissions**: Respects existing RBAC
- **Notification Service**: No changes required (tags are metadata)

### Database
- Migration script: `59_create_document_tags_tables.sql`
- Located in: `backend/database/SetupScript/Patch/`
- Run this script to add tables to existing database

## Testing Recommendations

### Backend Tests
- Test tag CRUD operations
- Test duplicate name prevention
- Test RBAC enforcement
- Test tag assignment to documents
- Test document filtering by tags
- Test cascade deletion

### Frontend Tests
- Test TagManager component functionality
- Test TagSelector component
- Test TagFilter component
- Test admin-only access to tag management
- Test tag color rendering

### Integration Tests
- Test full workflow: create tag → assign to document → filter documents
- Test tag deletion impact on documents
- Test concurrent tag assignments

## Performance Considerations

### Database Indexes
- `IX_Tags_Name`: Fast tag lookups by name
- `IX_DocumentTags_DocumentId`: Fast tag retrieval for documents
- `IX_DocumentTags_TagId`: Fast document retrieval by tag
- Unique constraint: `UQ_DocumentTags_DocumentId_TagId` prevents duplicates

### Query Optimization
- Document filtering uses parameterized IN clauses
- DISTINCT used to prevent duplicate results
- Indexes support JOIN operations

## Future Enhancements

Possible improvements for future iterations:
1. Tag categories/hierarchies
2. Tag popularity/usage analytics
3. Bulk tag operations
4. Tag import/export
5. Tag templates/presets
6. Tag-based permissions
7. Smart tag suggestions based on document content
8. Tag merging functionality
9. Tag rename history
10. Public/private tags

## Maintenance

### Common Tasks

**Add New Default Tags**:
```sql
INSERT INTO Tags (name, description, backgroundColor, fontColor, createdBy)
VALUES ('Important', 'High priority documents', '#EF4444', '#FFFFFF', 1);
```

**Check Tag Usage**:
```sql
SELECT t.name, COUNT(dt.documentId) as docCount
FROM Tags t
LEFT JOIN DocumentTags dt ON t.id = dt.tagId
GROUP BY t.id, t.name
ORDER BY docCount DESC;
```

**Remove Unused Tags**:
```sql
DELETE FROM Tags 
WHERE id NOT IN (SELECT DISTINCT tagId FROM DocumentTags);
```

## Troubleshooting

### Issue: Duplicate Tag Name Error
**Solution**: Tag names are unique (case-insensitive). Choose a different name or update the existing tag.

### Issue: Tag Not Visible in Filter
**Solution**: Ensure the tag is assigned to at least one document and the user has permission to view those documents.

### Issue: Cannot Delete Tag
**Solution**: Check if user is admin. Confirm deletion when prompted (may be assigned to multiple documents).

### Issue: Colors Not Showing
**Solution**: Verify color values are in hex format (#RRGGBB). Check browser CSS support for color values.

## Conclusion

The document tagging system is fully implemented and integrated with the E-QMS. It provides a flexible way to categorize and filter documents while maintaining security and data integrity. The system is designed to scale with growing tag usage and can be extended with additional features as needed.
