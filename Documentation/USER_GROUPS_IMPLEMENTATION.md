# User Groups for Document Access & Notifications

## Overview

This feature implements a comprehensive user group system for the E-QMS application, enabling:
- Organization of users into logical groups
- Document access control based on group membership
- Automatic notifications to group members when documents are created or updated

## Database Schema

### Tables Created

#### Groups
Main table for storing group information.

```sql
CREATE TABLE Groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    active BIT DEFAULT 1,
    createdBy INT NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Groups_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id)
);
```

#### UserGroups
Junction table for many-to-many relationship between Users and Groups.

```sql
CREATE TABLE UserGroups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    groupId INT NOT NULL,
    addedBy INT NOT NULL,
    addedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_UserGroups_User FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_UserGroups_Group FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE,
    CONSTRAINT FK_UserGroups_AddedBy FOREIGN KEY (addedBy) REFERENCES Users(id),
    CONSTRAINT UQ_UserGroups_UserGroup UNIQUE (userId, groupId)
);
```

#### DocumentGroups
Junction table for many-to-many relationship between Documents and Groups.

```sql
CREATE TABLE DocumentGroups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    documentId INT NOT NULL,
    groupId INT NOT NULL,
    assignedBy INT NOT NULL,
    assignedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_DocumentGroups_Document FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentGroups_Group FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE,
    CONSTRAINT FK_DocumentGroups_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(id),
    CONSTRAINT UQ_DocumentGroups_DocumentGroup UNIQUE (documentId, groupId)
);
```

### Migration Script

The database migration script is located at:
`backend/database/SetupScript/Patch/58_create_user_groups_tables.sql`

To apply the migration, run the patch script against your E-QMS database.

## Backend Implementation

### Models

#### GroupModel
- `create(group)` - Create a new group
- `findById(id)` - Get group by ID
- `findAll(options)` - Get all groups with optional counts
- `update(id, updates)` - Update group
- `delete(id)` - Soft delete group
- `getUsersByGroupId(groupId)` - Get all users in a group
- `getDocumentsByGroupId(groupId)` - Get all documents assigned to a group
- `existsByName(name, excludeId)` - Check if group name exists

#### UserGroupModel
- `create(userGroup)` - Add user to group
- `delete(userId, groupId)` - Remove user from group
- `findByUserId(userId)` - Get all groups for a user
- `findByGroupId(groupId)` - Get all users in a group
- `exists(userId, groupId)` - Check if user is in group
- `addUsersToGroup(userIds, groupId, addedBy)` - Bulk add users
- `removeUsersFromGroup(userIds, groupId)` - Bulk remove users

#### DocumentGroupModel
- `create(documentGroup)` - Assign group to document
- `delete(documentId, groupId)` - Remove group from document
- `findByDocumentId(documentId)` - Get all groups assigned to document
- `findByGroupId(groupId)` - Get all documents assigned to group
- `getUserIdsForDocument(documentId)` - Get all users with access to document
- `userHasAccess(userId, documentId)` - Check if user has access via groups
- `getDocumentsForUser(userId)` - Get all documents accessible to user

### Controllers

#### GroupController
Handles all group management operations:
- `createGroup` - POST /api/groups
- `getGroups` - GET /api/groups
- `getGroupById` - GET /api/groups/:id
- `updateGroup` - PUT /api/groups/:id
- `deleteGroup` - DELETE /api/groups/:id
- `getGroupUsers` - GET /api/groups/:id/users
- `addUsersToGroup` - POST /api/groups/:id/users
- `removeUsersFromGroup` - DELETE /api/groups/:id/users
- `getGroupDocuments` - GET /api/groups/:id/documents
- `getUserGroups` - GET /api/groups/user/:userId

#### DocumentController Extensions
Added functions for document-group management:
- `getDocumentGroups` - GET /api/documents/:id/groups
- `assignGroupsToDocument` - POST /api/documents/:id/groups
- `removeGroupsFromDocument` - DELETE /api/documents/:id/groups

### Services

#### NotificationService Extensions
Added group-based notification methods:
- `notifyDocumentGroupMembers(documentId, actorName, isUpdate)` - Send notifications to all group members
- `notifyDocumentCreated(documentId, actorName)` - Notify on document creation
- `notifyDocumentUpdated(documentId, actorName)` - Notify on document update

When a document is created or updated with assigned groups, all users in those groups automatically receive in-app notifications.

### API Endpoints

#### Group Management
- **POST** `/api/groups` - Create new group (Admin only)
- **GET** `/api/groups` - List all groups (Admin, Manager)
- **GET** `/api/groups/:id` - Get group details (Admin, Manager)
- **PUT** `/api/groups/:id` - Update group (Admin only)
- **DELETE** `/api/groups/:id` - Deactivate group (Admin only)
- **GET** `/api/groups/:id/users` - Get users in group (Admin, Manager)
- **POST** `/api/groups/:id/users` - Add users to group (Admin only)
- **DELETE** `/api/groups/:id/users` - Remove users from group (Admin only)
- **GET** `/api/groups/:id/documents` - Get documents assigned to group (Admin, Manager)
- **GET** `/api/groups/user/:userId` - Get groups for user (Authenticated)

#### Document-Group Association
- **GET** `/api/documents/:id/groups` - Get groups assigned to document
- **POST** `/api/documents/:id/groups` - Assign groups to document
- **DELETE** `/api/documents/:id/groups` - Remove groups from document

### Authorization

- **Group Management**: Admin only (except viewing which is Admin/Manager)
- **Document-Group Assignment**: Requires document EDIT permission
- **Viewing Groups**: Admin and Manager roles

## Frontend Implementation

### Pages

#### GroupManagement (`/groups`)
Main page for managing groups with features:
- List all groups with user and document counts
- Create new groups
- Edit existing groups
- Deactivate groups
- Navigate to detailed group management

**Location**: `frontend/src/pages/GroupManagement.tsx`

#### GroupDetail (`/groups/:id`)
Detailed group management page with:
- **Users Tab**: View group members, add/remove users
- **Documents Tab**: View documents assigned to the group
- Bulk user management operations

**Location**: `frontend/src/pages/GroupDetail.tsx`

#### Settings Integration
Groups management is integrated into the Settings page as a new tab (Admin/Superuser only).

**Access**: Settings → Groups tab

### Components

#### DocumentGroupsManager
Reusable component for managing document-group assignments:
- View currently assigned groups
- Assign/remove groups from documents
- Embedded in document editor or view pages

**Location**: `frontend/src/components/DocumentGroupsManager.tsx`

**Usage**:
```tsx
import DocumentGroupsManager from '../components/DocumentGroupsManager';

<DocumentGroupsManager documentId={documentId} canEdit={true} />
```

### Services

#### groupService
API service for all group-related operations:
- `getGroups(includeInactive, withCounts)` - Get all groups
- `getGroupById(id)` - Get specific group
- `createGroup(group)` - Create new group
- `updateGroup(id, updates)` - Update group
- `deleteGroup(id)` - Deactivate group
- `getGroupUsers(groupId)` - Get users in group
- `addUsersToGroup(groupId, userIds)` - Add users to group
- `removeUsersFromGroup(groupId, userIds)` - Remove users from group
- `getGroupDocuments(groupId)` - Get documents assigned to group
- `getUserGroups(userId)` - Get groups for user
- `getDocumentGroups(documentId)` - Get groups assigned to document
- `assignGroupsToDocument(documentId, groupIds)` - Assign groups to document
- `removeGroupsFromDocument(documentId, groupIds)` - Remove groups from document

**Location**: `frontend/src/services/groupService.ts`

## User Workflows

### Creating a Group
1. Admin navigates to Settings → Groups or /groups
2. Clicks "Create Group"
3. Enters group name and optional description
4. Clicks "Create"
5. Group is created and appears in the list

### Adding Users to a Group
1. Admin navigates to group detail page
2. Switches to "Users" tab
3. Clicks "Add Users"
4. Selects users from the list
5. Clicks "Add Selected"
6. Users are added to the group

### Assigning Groups to Documents
1. User with EDIT permission opens document
2. Uses DocumentGroupsManager component
3. Clicks "Manage Groups"
4. Selects groups to assign
5. Clicks "Save Changes"
6. All users in selected groups receive notifications

### Group-Based Notifications
When a document is created or updated with assigned groups:
1. System identifies all users in assigned groups
2. Creates in-app notifications for each user
3. Users see notifications in their notification center
4. Notification includes document title, version, and action (created/updated)

## Security Considerations

### Access Control
- Only Admins can create, edit, or delete groups
- Only Admins can modify group membership
- Managers can view groups and their members
- All authenticated users can view their own group memberships

### Data Validation
- Group names are validated for uniqueness
- User and group IDs are validated before operations
- All inputs are sanitized to prevent SQL injection

### Audit Trail
- All group operations are logged via the audit log system
- Creation, modification, and deletion of groups are tracked
- User additions/removals are logged with actor information

### Cascade Behavior
- Deleting a group removes all user-group and document-group associations
- Deleting a user removes all their group memberships
- Deleting a document removes all its group associations
- Groups are soft-deleted by default (active flag)

## Testing Recommendations

### Unit Tests
- Model operations (CRUD for all models)
- Service methods (especially notification logic)
- Controller endpoints (success and error cases)

### Integration Tests
1. **Group Creation Flow**
   - Create group → Add users → Verify membership

2. **Document Assignment Flow**
   - Create document → Assign groups → Verify notifications

3. **Access Control**
   - Verify users gain/lose document access with group membership changes

4. **Notification Flow**
   - Create document with groups → Verify all group members receive notifications
   - Update document → Verify update notifications

### Manual Testing
1. Create multiple groups with different users
2. Assign documents to groups
3. Verify group members can access assigned documents
4. Add/remove users from groups and verify access changes
5. Check notification delivery for document operations
6. Test with different user roles (Admin, Manager, User)

## Performance Considerations

### Indexes
All tables have appropriate indexes:
- Groups: name, active
- UserGroups: userId, groupId
- DocumentGroups: documentId, groupId

### Query Optimization
- User counts and document counts are optional and only fetched when needed
- Batch operations for adding/removing multiple users
- Efficient joins for access checking

### Scalability
- Junction tables support many-to-many relationships efficiently
- Cascade deletes prevent orphaned records
- Soft deletes allow for recovery and audit history

## Future Enhancements

1. **Nested Groups**: Support for group hierarchies
2. **Group Templates**: Pre-defined group types with default permissions
3. **Email Notifications**: Send email notifications in addition to in-app
4. **Group Permissions**: Fine-grained permissions per group
5. **Group Statistics**: Dashboard showing group usage and activity
6. **Bulk Import**: CSV import for mass user-group assignments
7. **Group Roles**: Different roles within a group (member, admin)

## Troubleshooting

### Issue: Users not receiving notifications
**Solution**: 
- Verify groups are assigned to document
- Check user is member of assigned groups
- Confirm notification service is running

### Issue: Access denied despite group membership
**Solution**:
- Verify group is active
- Check document-group assignment
- Confirm user-group membership is active

### Issue: Cannot create group with existing name
**Solution**:
- Group names must be unique
- Choose a different name or edit the existing group

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [User Management](./USER_MANAGEMENT_IMPLEMENTATION.md)
- [Document Management](./README.md#documents)
- [Notification System](./TOAST_NOTIFICATION_USAGE.md)

## Maintenance

### Database Maintenance
- Regularly clean up inactive groups
- Monitor junction table growth
- Review and archive old group assignments

### Code Maintenance
- Keep models, controllers, and services in sync
- Update API documentation when endpoints change
- Maintain consistent error handling

## Support

For issues or questions about the user groups feature:
1. Check this documentation
2. Review the code comments in the implementation files
3. Contact the development team
