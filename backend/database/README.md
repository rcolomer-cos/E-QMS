# E-QMS Database Schema Scripts

This directory contains SQL scripts for creating and managing the E-QMS database schema.

## Database Structure

The E-QMS system uses a role-based access control (RBAC) model with support for multiple roles per user.

### Tables

1. **DatabaseVersion** - Tracks schema versions and updates
2. **Roles** - System roles for access control
3. **Users** - User accounts (email-based authentication)
4. **UserRoles** - Many-to-many relationship between Users and Roles
5. **Departments** - Organization departments
6. **Processes** - Business processes (ISO 9001)
7. **ProcessOwners** - Process ownership assignments
8. **Documents** - Document management with metadata and version control

## Initial Setup

### Prerequisites

- Microsoft SQL Server 2016 or higher
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Database created (default name: `eqms`)

### Installation Steps

1. **Create Database** (if not already created):
   ```sql
   CREATE DATABASE eqms;
   GO
   USE eqms;
   GO
   ```

2. **Run Scripts in Order**:
   
   Execute the SQL scripts in numerical order using SSMS:
   
   ```
   01_create_versioning_table.sql
   02_create_roles_table.sql
   03_create_users_table.sql
   04_create_user_roles_table.sql
   05_create_departments_table.sql
   06_create_processes_table.sql
   07_create_process_owners_table.sql
   08_create_documents_table.sql
   ```

3. **Verify Installation**:
   ```sql
   -- Check database version
   SELECT * FROM DatabaseVersion ORDER BY appliedDate DESC;
   
   -- View available roles
   SELECT * FROM Roles WHERE active = 1 ORDER BY level DESC;
   
   -- Check if tables exist
   SELECT name FROM sys.tables WHERE name IN ('DatabaseVersion', 'Roles', 'Users', 'UserRoles');
   ```

## Database Schema Details

### Users Table

- **Email as Username**: The `email` field is unique and serves as the login username
- **Name Fields**: Stores `firstName` and `lastName` separately
- **Security Features**: 
  - Password hashing (bcrypt in application layer)
  - Failed login attempt tracking
  - Account locking mechanism
  - Password change enforcement
- **Audit Trail**: `createdAt`, `updatedAt`, `createdBy` fields

### Roles Table

Default system roles (ordered by permission level):

| Role       | Level | Description                                           |
|------------|-------|-------------------------------------------------------|
| superuser  | 100   | Full system access, can create other superusers       |
| admin      | 90    | Administrative access, cannot create superusers       |
| manager    | 70    | Manage quality processes, approve documents           |
| auditor    | 60    | Conduct audits, create NCRs                           |
| user       | 50    | Create and edit documents, participate in processes   |
| viewer     | 10    | Read-only access                                      |

### UserRoles Table

- **Many-to-Many**: Users can have multiple roles
- **Temporal Roles**: Optional `expiresAt` field for temporary role assignments
- **Audit Trail**: Tracks who assigned roles and when
- **Soft Delete**: `active` flag for role assignment deactivation

### Documents Table

- **Metadata**: Stores title, description, documentType, and category for organization
- **Versioning**: Supports version history with `version` field and `parentDocumentId` linking to previous versions
- **Status Lifecycle**: Tracks document status (draft, review, approved, obsolete)
- **Ownership**: Links to document owner (`ownerId`), creator (`createdBy`), and approver (`approvedBy`)
- **File Management**: Stores file path, name, and size for physical document files
- **Date Tracking**: Manages effective dates, review schedules, and expiration dates
- **Audit Trail**: Complete tracking of creation, updates, and approval timestamps
- **Performance Indexes**: Optimized for queries by status, type, category, owner, and version
- **ISO 9001 Compliance**: Supports document control requirements with traceability and version history

## Role-Based Access Control (RBAC)

### Permission Hierarchy

- Higher `level` values indicate more permissions
- Users inherit all permissions from their assigned roles
- Multiple roles combine permissions (union, not intersection)

### Superuser Bootstrap

When the application starts, it checks for existing superusers:
- If **no superusers exist**, the application displays a "Create Superuser" interface
- Only **superusers** can create other superusers
- **Admins** can create users with roles up to admin level

## Schema Version Control

The `DatabaseVersion` table tracks all schema changes:

```sql
-- View schema history
SELECT 
    version,
    description,
    scriptName,
    appliedDate,
    status
FROM DatabaseVersion
ORDER BY appliedDate;
```

### Adding New Schema Updates

When creating new schema update scripts:

1. Use sequential numbering: `05_description.sql`, `06_description.sql`, etc.
2. Include version tracking at the end:
   ```sql
   INSERT INTO DatabaseVersion (version, description, scriptName, status, notes)
   VALUES ('1.0.X', 'Description', 'XX_script_name.sql', 'SUCCESS', 'Notes');
   ```
3. Use idempotent scripts (check if changes already exist)
4. Document breaking changes in the `notes` field

## Security Considerations

### Password Management

- Passwords are **never stored in plain text**
- The application layer handles password hashing using bcrypt
- Minimum password requirements enforced in application
- Strong password generation available in admin panel

### User Creation

- **Superusers and Admins only** can create users
- **Only Superusers** can elevate users to superuser role
- New user passwords generated and displayed once
- Users should change password on first login

### Email Validation

- Email format validated at database level (CHECK constraint)
- Email must be unique across all users
- Case-insensitive email lookup in application layer

## Maintenance Queries

### Check User Roles

```sql
-- View all users with their roles
SELECT 
    u.id,
    u.email,
    u.firstName + ' ' + u.lastName AS fullName,
    STRING_AGG(r.displayName, ', ') AS roles,
    u.active
FROM Users u
LEFT JOIN UserRoles ur ON u.id = ur.userId AND ur.active = 1
LEFT JOIN Roles r ON ur.roleId = r.id
WHERE u.active = 1
GROUP BY u.id, u.email, u.firstName, u.lastName, u.active
ORDER BY u.email;
```

### Find Superusers

```sql
-- Check for existing superusers
SELECT 
    u.id,
    u.email,
    u.firstName + ' ' + u.lastName AS fullName,
    u.lastLogin
FROM Users u
INNER JOIN UserRoles ur ON u.id = ur.userId
INNER JOIN Roles r ON ur.roleId = r.id
WHERE u.active = 1 
    AND ur.active = 1 
    AND r.name = 'superuser';
```

### Assign Role to User

```sql
-- Example: Assign 'manager' role to user
DECLARE @UserId INT = 1; -- Replace with actual user ID
DECLARE @RoleId INT = (SELECT id FROM Roles WHERE name = 'manager');
DECLARE @AssignedBy INT = 1; -- Replace with ID of user making the assignment

INSERT INTO UserRoles (userId, roleId, assignedBy, active)
VALUES (@UserId, @RoleId, @AssignedBy, 1);
```

### Revoke Role from User

```sql
-- Soft delete: Deactivate role assignment
UPDATE UserRoles 
SET active = 0, updatedAt = GETDATE()
WHERE userId = @UserId AND roleId = @RoleId;
```

### View Document Version History

```sql
-- Get all versions of a document using recursive CTE
WITH DocumentVersions AS (
  -- Start with a specific document
  SELECT * FROM Documents WHERE id = 123
  UNION ALL
  -- Recursively get parent versions
  SELECT d.* FROM Documents d
  INNER JOIN DocumentVersions dv ON d.id = dv.parentDocumentId
)
SELECT 
    id,
    title,
    version,
    status,
    createdAt,
    createdBy
FROM DocumentVersions
ORDER BY version DESC, createdAt DESC;
```

### Find Documents Due for Review

```sql
-- Documents approaching or past their review date
SELECT 
    d.id,
    d.title,
    d.documentType,
    d.category,
    d.version,
    d.reviewDate,
    u.firstName + ' ' + u.lastName AS owner
FROM Documents d
LEFT JOIN Users u ON d.ownerId = u.id
WHERE d.status = 'approved'
    AND d.reviewDate <= DATEADD(day, 30, GETDATE())
ORDER BY d.reviewDate ASC;
```

### List Approved Documents by Category

```sql
-- Active approved documents grouped by category
SELECT 
    d.category,
    COUNT(*) AS documentCount,
    STRING_AGG(d.title, ', ') AS documents
FROM Documents d
WHERE d.status = 'approved'
GROUP BY d.category
ORDER BY d.category;
```

## Migration from Old Schema

If you have an existing Users table with a single `role` field:

1. Backup your database
2. Run migration script to:
   - Create new tables (Roles, UserRoles)
   - Migrate existing user roles to UserRoles table
   - Drop old `role` column from Users table
3. Test thoroughly before production deployment

Migration script example available in `migrations/` directory (when needed).

## Troubleshooting

### Script Execution Errors

- Ensure scripts are run in the correct order
- Check database connection and permissions
- Verify SQL Server version compatibility
- Review DatabaseVersion table for failed executions

### Foreign Key Violations

- Ensure parent records exist before creating child records
- Check cascading delete behavior on UserRoles

### Performance Issues

- All necessary indexes are created by the schema scripts
- Monitor query performance on large datasets
- Consider archiving inactive users periodically

## Support

For issues or questions regarding the database schema, please refer to the main project documentation or contact the development team.
