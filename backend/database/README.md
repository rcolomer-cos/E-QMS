# E-QMS Database Scripts

This directory contains SQL scripts for creating and managing the E-QMS database schema.

## Directory Structure

```
database/
├── schemas/           # Table creation scripts (run once)
│   ├── 00_RunAll.sql # Master script - runs all schema scripts
│   ├── 01_DatabaseVersion.sql
│   ├── 02_Roles.sql
│   ├── 03_Users.sql
│   └── 04_UserRoles.sql
└── migrations/        # Schema update scripts (versioned)
```

## Initial Database Setup

### Prerequisites

1. Microsoft SQL Server 2016 or higher installed
2. SQL Server Management Studio (SSMS) or Azure Data Studio
3. Appropriate database permissions (CREATE DATABASE, CREATE TABLE)

### Step 1: Create Database

Open SSMS and connect to your SQL Server instance, then run:

```sql
CREATE DATABASE eqms;
GO
```

### Step 2: Run Schema Scripts

**Option A: Run Master Script (Recommended)**

1. Open SSMS
2. Connect to your SQL Server
3. Open the file `schemas/00_RunAll.sql`
4. Ensure you're in the correct directory for the `:r` commands to work
5. Execute the script (F5)

**Option B: Run Individual Scripts**

Run each script in order manually:

1. `01_DatabaseVersion.sql` - Creates version tracking table
2. `02_Roles.sql` - Creates roles with default system roles
3. `03_Users.sql` - Creates users table (email as login)
4. `04_UserRoles.sql` - Creates user-role junction table

### Step 3: Verify Installation

Run this query to verify all tables were created:

```sql
USE eqms;
GO

SELECT 
    t.name AS TableName,
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    p.rows AS RowCount
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
  AND t.name IN ('DatabaseVersion', 'Roles', 'Users', 'UserRoles')
ORDER BY t.name;
GO
```

Expected output should show 4 tables with the following approximate row counts:
- `DatabaseVersion`: 3+ rows
- `Roles`: 6 rows
- `Users`: 0 rows (initially)
- `UserRoles`: 0 rows (initially)

## Database Schema Overview

### DatabaseVersion Table

Tracks all schema changes and migrations applied to the database.

**Columns:**
- `version` - Semantic version (e.g., 1.0.0)
- `description` - What changed
- `scriptName` - SQL file that was executed
- `appliedAt` - Timestamp
- `appliedBy` - SQL Server user who ran the script

### Roles Table

Defines system roles with hierarchical permissions.

**Default Roles:**
- `superuser` - Full system access, can create/elevate other superusers
- `admin` - Administrative access, cannot elevate to superuser
- `manager` - Quality management and approval authority
- `auditor` - Conduct audits and create NCRs
- `user` - Create and edit documents
- `viewer` - Read-only access

### Users Table

Stores user authentication information.

**Key Features:**
- Email is used as the login username (unique)
- Password is hashed with bcrypt
- Supports soft deletion (active flag)
- Tracks last login and password change timestamps

### UserRoles Table

Junction table enabling many-to-many relationship between Users and Roles.

**Features:**
- Users can have multiple roles
- Tracks who assigned the role and when
- Cascade deletion when user is deleted

## Security Considerations

### Superuser Access

- Only superusers can create new superuser accounts
- The application checks for existing superusers on startup
- If no superuser exists, the application prompts to create one

### Password Requirements

- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and special characters
- Hashed using bcrypt with cost factor 10
- Application includes password generator for strong, memorable passwords

### Role Assignment Rules

1. Only `superuser` and `admin` roles can assign roles to users
2. Only `superuser` can assign the `superuser` role
3. Role changes are audited in the database

## Migrations

As the schema evolves, migration scripts will be added to the `migrations/` directory.

### Migration Naming Convention

```
YYYYMMDD_HHMM_DescriptiveNameOfChange.sql
```

Example: `20240115_1430_AddUserPreferencesTable.sql`

### Running Migrations

1. Migrations should be run in chronological order
2. Each migration updates the `DatabaseVersion` table
3. Check current version before running migrations:

```sql
SELECT TOP 1 version, description, appliedAt 
FROM DatabaseVersion 
ORDER BY appliedAt DESC;
```

## Rollback Procedures

For each migration script, maintain a corresponding rollback script:

```
migrations/
├── 20240115_1430_AddUserPreferencesTable.sql
└── 20240115_1430_AddUserPreferencesTable_ROLLBACK.sql
```

## Connection String

Configure your application's `.env` file:

```env
DB_SERVER=localhost
DB_NAME=eqms
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

## Troubleshooting

### Script Execution Errors

If `:r` commands fail in SSMS:
1. Use SQLCMD mode: Query → SQLCMD Mode
2. Or run each script individually in the correct order

### Permission Errors

Ensure your SQL Server user has:
- CREATE TABLE permission
- INSERT/UPDATE/DELETE permissions
- ALTER TABLE permission for migrations

### Version Conflicts

If you see duplicate version errors:
```sql
-- Check existing versions
SELECT * FROM DatabaseVersion ORDER BY appliedAt DESC;

-- If needed, remove duplicate (use with caution)
DELETE FROM DatabaseVersion WHERE id = <specific_id>;
```

## Support

For database-related issues:
1. Check the application logs
2. Verify database connectivity
3. Ensure all scripts ran successfully
4. Review DatabaseVersion table for migration history
