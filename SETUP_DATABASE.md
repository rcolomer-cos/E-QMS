# E-QMS Database Setup Guide

This guide explains how to set up the E-QMS database with the new multi-role user authentication system.

## Overview

The E-QMS system now uses a role-based access control (RBAC) model where:
- **Users authenticate with their email address** (no separate username)
- **Users can have multiple roles** simultaneously
- **A superuser bootstrap process** ensures the first user can be created securely

## Prerequisites

Before you begin, ensure you have:

1. **Microsoft SQL Server** (2016 or higher)
   - SQL Server Management Studio (SSMS) or Azure Data Studio
   - Appropriate permissions to create databases and tables

2. **Node.js** (v18 or higher)
   - npm (v9 or higher)

3. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Configure database connection settings

## Setup Methods

You can set up the database using either of these methods:

### Method 1: Using SQL Server Management Studio (SSMS) - Recommended

This method is ideal for initial setup and provides full control.

#### Step 1: Create Database

Open SSMS and connect to your SQL Server instance, then execute:

```sql
CREATE DATABASE eqms;
GO
```

#### Step 2: Execute Master Schema Script

1. Open the file: `backend/database/00_master_schema.sql`
2. Ensure you're connected to the `eqms` database
3. Execute the entire script (F5 or Execute button)

This script will:
- Create the `DatabaseVersion` table for version tracking
- Create the `Roles` table with 6 default roles
- Create the `Users` table with email-based authentication
- Create the `UserRoles` junction table for many-to-many relationships
- Insert default roles
- Display a summary of what was created

#### Step 3: Verify Installation

Run this query to verify all tables were created:

```sql
USE eqms;
GO

-- Check tables
SELECT name FROM sys.tables 
WHERE name IN ('DatabaseVersion', 'Roles', 'Users', 'UserRoles')
ORDER BY name;

-- Check roles
SELECT * FROM Roles ORDER BY level DESC;

-- Check version history
SELECT * FROM DatabaseVersion ORDER BY appliedDate;
```

You should see:
- 4 core tables created
- 6 roles inserted (superuser, admin, manager, auditor, user, viewer)
- Version records in DatabaseVersion

### Method 2: Using Node.js Initialization Script

This method runs the same SQL scripts programmatically.

#### Step 1: Install Dependencies

```bash
cd backend
npm install
```

#### Step 2: Configure Environment

Edit `backend/.env` with your database connection:

```env
DB_SERVER=localhost
DB_NAME=eqms
DB_USER=sa
DB_PASSWORD=YourStrongPassword123
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=your-secret-key-change-in-production
```

#### Step 3: Build and Run Initialization

```bash
cd backend
npm run build
node dist/scripts/initDatabase.js
```

This will:
- Connect to your database
- Execute all schema files in order
- Create all necessary tables
- Display success/error messages

## Application First Run - Superuser Bootstrap

When you start the E-QMS application for the first time, it will check if any superusers exist in the system.

### Bootstrap Process

1. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Check for Superusers**
   
   The application will call:
   ```
   GET http://localhost:3000/api/auth/check-superusers
   ```
   
   Response:
   ```json
   {
     "hasSuperusers": false
   }
   ```

3. **Create Initial Superuser**
   
   If no superusers exist, the frontend should display a "Create Superuser" form.
   
   Make a POST request to:
   ```
   POST http://localhost:3000/api/auth/initial-superuser
   ```
   
   Body:
   ```json
   {
     "email": "admin@example.com",
     "password": "SecurePassword123!",
     "firstName": "System",
     "lastName": "Administrator"
   }
   ```
   
   Response:
   ```json
   {
     "message": "Initial superuser created successfully",
     "userId": 1
   }
   ```

4. **Login**
   
   After creating the superuser, redirect to the login page:
   ```
   POST http://localhost:3000/api/auth/login
   ```
   
   Body:
   ```json
   {
     "email": "admin@example.com",
     "password": "SecurePassword123!"
   }
   ```

## User Management

Once logged in as a superuser or admin, you can manage users through the admin panel.

### Creating New Users

#### Generate Password Options

```
GET http://localhost:3000/api/users/generate-password
Authorization: Bearer <token>
```

Response:
```json
{
  "passwords": [
    "Alpha-Tiger-2024!",
    "xK7#mN9$pQ2@vL",
    "Delta-Ocean-5891@"
  ]
}
```

#### Create User

```
POST http://localhost:3000/api/users
Authorization: Bearer <token>
```

Body:
```json
{
  "email": "john.doe@example.com",
  "password": "Alpha-Tiger-2024!",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Quality",
  "roleIds": [2, 4]  // admin and auditor
}
```

Response (password is shown only once):
```json
{
  "message": "User created successfully",
  "userId": 2,
  "email": "john.doe@example.com",
  "password": "Alpha-Tiger-2024!"
}
```

### Assigning Roles

```
POST http://localhost:3000/api/users/:id/roles
Authorization: Bearer <token>
```

Body:
```json
{
  "roleId": 3,  // manager role
  "expiresAt": "2025-12-31T23:59:59Z"  // optional
}
```

### Viewing All Roles

```
GET http://localhost:3000/api/users/roles
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "name": "superuser",
    "displayName": "Super User",
    "description": "Full system access...",
    "level": 100
  },
  {
    "id": 2,
    "name": "admin",
    "displayName": "Administrator",
    "description": "Administrative access...",
    "level": 90
  }
  // ... more roles
]
```

## Database Schema Details

### Users Table

| Column                | Type          | Description                              |
|-----------------------|---------------|------------------------------------------|
| id                    | INT           | Primary key                              |
| email                 | NVARCHAR(255) | Login username (unique)                  |
| password              | NVARCHAR(255) | Hashed password (bcrypt)                 |
| firstName             | NVARCHAR(100) | User's first name                        |
| lastName              | NVARCHAR(100) | User's last name                         |
| department            | NVARCHAR(100) | User's department                        |
| active                | BIT           | Is account active?                       |
| lastLogin             | DATETIME2     | Last login timestamp                     |
| failedLoginAttempts   | INT           | Failed login counter                     |
| lockedUntil           | DATETIME2     | Account lock expiration                  |
| passwordChangedAt     | DATETIME2     | Last password change                     |
| mustChangePassword    | BIT           | Force password change on login           |
| createdAt             | DATETIME2     | Account creation date                    |
| updatedAt             | DATETIME2     | Last update date                         |
| createdBy             | INT           | User ID who created this account         |

### Roles Table

| Column       | Type          | Description                          |
|--------------|---------------|--------------------------------------|
| id           | INT           | Primary key                          |
| name         | NVARCHAR(50)  | Role name (unique)                   |
| displayName  | NVARCHAR(100) | Human-readable name                  |
| description  | NVARCHAR(500) | Role description                     |
| level        | INT           | Permission level (higher = more)     |
| active       | BIT           | Is role active?                      |
| createdAt    | DATETIME2     | Creation date                        |
| updatedAt    | DATETIME2     | Last update date                     |

**Default Roles:**

| Name       | Level | Description                                    |
|------------|-------|------------------------------------------------|
| superuser  | 100   | Full system access, can create superusers      |
| admin      | 90    | Administrative access, cannot create superusers|
| manager    | 70    | Manage quality processes, approve documents    |
| auditor    | 60    | Conduct audits, create NCRs                    |
| user       | 50    | Create and edit documents                      |
| viewer     | 10    | Read-only access                               |

### UserRoles Table (Junction Table)

| Column      | Type          | Description                          |
|-------------|---------------|--------------------------------------|
| id          | INT           | Primary key                          |
| userId      | INT           | Foreign key to Users                 |
| roleId      | INT           | Foreign key to Roles                 |
| assignedAt  | DATETIME2     | When role was assigned               |
| assignedBy  | INT           | User ID who assigned the role        |
| expiresAt   | DATETIME2     | Optional expiration date             |
| active      | BIT           | Is assignment active?                |
| notes       | NVARCHAR(500) | Optional notes                       |

### DatabaseVersion Table

| Column          | Type          | Description                          |
|-----------------|---------------|--------------------------------------|
| id              | INT           | Primary key                          |
| version         | NVARCHAR(20)  | Version number (e.g., "1.0.3")       |
| description     | NVARCHAR(500) | What changed                         |
| scriptName      | NVARCHAR(255) | SQL script filename                  |
| appliedDate     | DATETIME2     | When script was applied              |
| appliedBy       | NVARCHAR(100) | System user who applied it           |
| checksum        | NVARCHAR(64)  | Optional checksum for verification   |
| executionTimeMs | INT           | How long script took to run          |
| status          | NVARCHAR(20)  | SUCCESS or FAILED                    |
| notes           | NVARCHAR(MAX) | Additional information               |

## Security Considerations

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Access Control Rules

1. **Only Superusers can:**
   - Create other superusers
   - Delete superusers
   - Assign/revoke superuser role

2. **Admins can:**
   - Create users with roles up to admin level
   - Manage all users except superusers
   - Assign/revoke roles except superuser

3. **Users cannot:**
   - Delete their own account
   - View passwords (except when creating new user, shown once)
   - Modify their own roles

### Email Validation

- Email must be valid format (contains @ and domain)
- Email is unique across all users
- Email is case-insensitive for login

## Troubleshooting

### Database Connection Issues

**Error: "Login failed for user"**
- Check DB_USER and DB_PASSWORD in .env
- Verify SQL Server allows the specified authentication mode
- Ensure SQL Server is running and accepting connections

**Error: "Cannot open database 'eqms'"**
- Database doesn't exist - create it first
- User doesn't have permissions - grant appropriate rights

### Schema Creation Issues

**Error: "Table already exists"**
- The scripts are idempotent (safe to run multiple times)
- Drop tables manually if you want a fresh start:
  ```sql
  DROP TABLE IF EXISTS TrainingAttendees;
  DROP TABLE IF EXISTS Trainings;
  DROP TABLE IF EXISTS Equipment;
  DROP TABLE IF EXISTS CAPAs;
  DROP TABLE IF EXISTS NCRs;
  DROP TABLE IF EXISTS Audits;
  DROP TABLE IF EXISTS Documents;
  DROP TABLE IF EXISTS UserRoles;
  DROP TABLE IF EXISTS Users;
  DROP TABLE IF EXISTS Roles;
  DROP TABLE IF EXISTS DatabaseVersion;
  ```

### Bootstrap Issues

**Error: "Superusers already exist in the system"**
- The bootstrap endpoint can only be used once
- Use the login page instead
- To reset, delete all users and roles from database

**Error: "Superuser role not found in database"**
- Run the schema scripts again
- Check that Roles table has a row with name='superuser'

## Migration from Old Schema

If you have an existing Users table with a single `role` field, you'll need to migrate:

1. Backup your database
2. Run a migration script to:
   - Copy role values to UserRoles table
   - Map old role names to new role IDs
3. Test thoroughly before removing old columns

Migration script example:
```sql
-- Backup users
SELECT * INTO Users_Backup FROM Users;

-- Insert corresponding roles into UserRoles
INSERT INTO UserRoles (userId, roleId, assignedAt, assignedBy, active)
SELECT 
    u.id,
    r.id,
    GETDATE(),
    NULL,  -- system migration
    1
FROM Users_Backup u
INNER JOIN Roles r ON r.name = u.role;
```

## Support

For additional help:
1. Review `/backend/database/README.md` for detailed SQL documentation
2. Check application logs for error messages
3. Verify database connectivity with a simple query tool
4. Ensure all environment variables are correctly set

## Next Steps

After successfully setting up the database:

1. ✅ Create initial superuser
2. ✅ Login to the system
3. ✅ Create additional admin/manager users
4. ✅ Configure user departments and roles
5. ✅ Begin using the quality management features

For information on using the QMS features, refer to the main README.md file.
