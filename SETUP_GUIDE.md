# E-QMS Setup Guide

This guide provides step-by-step instructions for setting up the E-QMS application with the new user and roles management system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Application Configuration](#application-configuration)
4. [Initial System Setup](#initial-system-setup)
5. [User Management](#user-management)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Microsoft SQL Server** 2016 or higher
  - Express edition is sufficient for development
  - Standard or Enterprise for production
- **SQL Server Management Studio (SSMS)** or Azure Data Studio
- **Node.js** v18 or higher
- **npm** v9 or higher

### Verify Installations

```bash
# Check Node.js version
node --version  # Should be v18.x or higher

# Check npm version
npm --version   # Should be v9.x or higher

# Check SQL Server (in SSMS or Azure Data Studio)
SELECT @@VERSION;
```

---

## Database Setup

### Option 1: Using SQL Server Management Studio (SSMS)

#### Step 1: Create Database

1. Open SSMS and connect to your SQL Server instance
2. Right-click on "Databases" → "New Database"
3. Name it `eqms`
4. Click "OK"

Or run this SQL command:
```sql
CREATE DATABASE eqms;
GO
```

#### Step 2: Run Schema Scripts

**Using the Master Script:**

1. Open SSMS
2. File → Open → File
3. Navigate to `backend/database/schemas/00_RunAll.sql`
4. Make sure you're in the correct directory (or adjust paths in the script)
5. Query → SQLCMD Mode (enable this!)
6. Press F5 to execute

**Using Individual Scripts:**

Alternatively, run each script manually in order:

1. `01_DatabaseVersion.sql` - Creates version tracking table
2. `02_Roles.sql` - Creates roles with defaults
3. `03_Users.sql` - Creates users table
4. `04_UserRoles.sql` - Creates user-role junction table

#### Step 3: Verify Installation

Run this verification query:

```sql
USE eqms;
GO

-- Check all tables exist
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

-- Check database version
SELECT TOP 1 version, description, appliedAt 
FROM DatabaseVersion 
ORDER BY appliedAt DESC;
GO

-- Check roles
SELECT name, displayName, isSuperUser 
FROM Roles 
WHERE active = 1;
GO
```

Expected results:
- 4 tables created (DatabaseVersion, Roles, Users, UserRoles)
- DatabaseVersion shows version 1.0.3 or higher
- 6 roles present: superuser, admin, manager, auditor, user, viewer

### Option 2: Using Node.js Script

If you prefer to use the Node.js initialization script:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Run database initialization
node dist/scripts/initDatabase.js
```

This will create all necessary tables including the new Users, Roles, and UserRoles tables.

---

## Application Configuration

### Step 1: Set up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure database connection:
   ```env
   # Database Configuration
   DB_SERVER=localhost
   DB_NAME=eqms
   DB_USER=sa
   DB_PASSWORD=YourStrongPassword123
   DB_PORT=1433
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true

   # JWT Configuration
   JWT_SECRET=your-secret-key-change-in-production-minimum-32-characters
   JWT_EXPIRES_IN=24h

   # Application Configuration
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Important:** Change `JWT_SECRET` to a secure random string in production

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install
```

This will install dependencies for both backend and frontend.

### Step 3: Build the Application

```bash
# Build backend
cd backend
npm run build

# Build frontend (in separate terminal)
cd ../frontend
npm run build
```

---

## Initial System Setup

### Step 1: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server is running on port 3000
Environment: development
```

### Step 2: Check System Status

Open a browser or use curl:

```bash
curl http://localhost:3000/api/system/init-status
```

Expected response:
```json
{
  "needsSetup": true,
  "hasDatabase": true,
  "hasSuperUser": false
}
```

If `needsSetup` is `true`, you need to create the first superuser.

### Step 3: Create First Superuser

You can do this via the frontend (when it's updated) or via API:

```bash
curl -X POST http://localhost:3000/api/system/init \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "firstName": "System",
    "lastName": "Administrator"
  }'
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%&*)

Expected response:
```json
{
  "message": "First superuser created successfully",
  "userId": 1
}
```

### Step 4: Login as Superuser

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@yourcompany.com",
    "firstName": "System",
    "lastName": "Administrator",
    "roles": ["superuser"],
    "mustChangePassword": false
  }
}
```

**Important:** Save the `token` value - you'll need it for authenticated requests.

### Step 5: Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Access the application at: http://localhost:5173

---

## User Management

### Creating Users via API

With your authentication token from login:

```bash
# Set your token as a variable
TOKEN="your-jwt-token-here"

# Create a new user with auto-generated password
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "manager@yourcompany.com",
    "firstName": "John",
    "lastName": "Manager",
    "department": "Quality",
    "roleIds": [3],
    "generatePassword": true
  }'
```

Response will include the generated password:
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "email": "manager@yourcompany.com",
    "firstName": "John",
    "lastName": "Manager",
    "department": "Quality",
    "roles": ["manager"]
  },
  "credentials": {
    "email": "manager@yourcompany.com",
    "password": "BrightTiger42!"
  }
}
```

### Role IDs Reference

Use these role IDs when creating users:

| ID | Role Name | Display Name | Description |
|----|-----------|--------------|-------------|
| 1 | superuser | Super User | Full system access |
| 2 | admin | Administrator | Full admin access |
| 3 | manager | Manager | Quality management |
| 4 | auditor | Auditor | Conduct audits |
| 5 | user | User | Create/edit documents |
| 6 | viewer | Viewer | Read-only access |

### Assigning Multiple Roles

Users can have multiple roles:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "lead@yourcompany.com",
    "firstName": "Jane",
    "lastName": "Lead",
    "department": "Quality",
    "roleIds": [3, 4],
    "generatePassword": true
  }'
```

This user will have both Manager and Auditor roles.

### Getting All Users

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Assigning Roles to Existing Users

```bash
# Assign role ID 4 (auditor) to user ID 2
curl -X POST http://localhost:3000/api/users/2/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roleId": 4}'
```

### Removing Roles

```bash
# Remove role ID 4 from user ID 2
curl -X DELETE http://localhost:3000/api/users/2/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roleId": 4}'
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to SQL Server

**Solutions:**
1. Verify SQL Server is running:
   ```bash
   # On Windows
   services.msc  # Look for SQL Server service
   ```

2. Check firewall settings (port 1433)

3. Enable TCP/IP in SQL Server Configuration Manager

4. Verify connection string in `.env`:
   ```env
   DB_SERVER=localhost
   DB_PORT=1433
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

### Authentication Issues

**Problem:** Cannot authenticate / login fails

**Solutions:**
1. Check SQL Server authentication mode (should be Mixed Mode)

2. Verify user credentials in `.env`

3. For SQL Server authentication:
   ```sql
   ALTER LOGIN sa ENABLE;
   ALTER LOGIN sa WITH PASSWORD = 'YourNewPassword';
   ```

### Table Creation Fails

**Problem:** SQL scripts fail to create tables

**Solutions:**
1. Ensure you're using the correct database:
   ```sql
   USE eqms;
   GO
   ```

2. Check user permissions:
   ```sql
   -- Grant permissions to your SQL user
   USE eqms;
   GO
   GRANT CREATE TABLE TO [your_user];
   GRANT ALTER TO [your_user];
   GO
   ```

3. Run scripts one at a time to identify which one fails

### SQLCMD Mode Issues

**Problem:** `:r` commands don't work in SSMS

**Solution:**
Enable SQLCMD Mode in SSMS:
- Query → SQLCMD Mode ✓

Or run scripts individually without using `00_RunAll.sql`

### First Superuser Creation Fails

**Problem:** "Superuser already exists" error

**Solution:**
Check if a superuser already exists:
```sql
SELECT u.*, r.name as roleName
FROM Users u
INNER JOIN UserRoles ur ON u.id = ur.userId
INNER JOIN Roles r ON ur.roleId = r.id
WHERE r.name = 'superuser';
```

If you need to reset:
```sql
-- WARNING: This deletes all users!
DELETE FROM UserRoles;
DELETE FROM Users;
```

### Port Already in Use

**Problem:** Backend won't start - port 3000 in use

**Solution:**
1. Find and kill the process:
   ```bash
   # On Linux/Mac
   lsof -ti:3000 | xargs kill -9

   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change the port in `.env`:
   ```env
   PORT=3001
   ```

### JWT Token Issues

**Problem:** Token validation fails

**Solutions:**
1. Ensure `JWT_SECRET` is set and at least 32 characters

2. Check token expiration:
   ```env
   JWT_EXPIRES_IN=24h
   ```

3. Token must be sent in Authorization header:
   ```
   Authorization: Bearer <your-token>
   ```

### Migration Script Errors

**Problem:** initDatabase.js fails

**Solution:**
Run database scripts manually via SSMS first, then try again.

---

## Production Deployment Checklist

- [ ] Change `JWT_SECRET` to a secure random value
- [ ] Use strong database password
- [ ] Enable SSL/TLS for database connections:
  ```env
  DB_ENCRYPT=true
  DB_TRUST_SERVER_CERTIFICATE=false
  ```
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Enable database transaction logs
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use HTTPS for all connections
- [ ] Review and restrict database user permissions
- [ ] Document the first superuser credentials securely

---

## Next Steps

After completing the setup:

1. **Configure additional users** - Create users for your team with appropriate roles

2. **Test the system** - Verify all modules work correctly

3. **Configure quality processes** - Set up document templates, audit schedules, etc.

4. **Training** - Train users on the system

5. **Go Live** - Start using E-QMS for quality management

---

## Support

For additional help:
- Check `API_DOCUMENTATION.md` for API details
- Check `backend/database/README.md` for database schema details
- Review application logs in the backend console
- Check SQL Server logs for database issues

---

## Migration from Old Schema

If you're migrating from the old single-role system:

1. **Backup your database first!**
   ```sql
   BACKUP DATABASE eqms TO DISK = 'C:\Backup\eqms_backup.bak';
   ```

2. The old `Users.role` column is replaced by the `UserRoles` junction table

3. Migration steps are needed to:
   - Create new tables (Roles, UserRoles)
   - Migrate existing user roles to UserRoles table
   - Update Users table structure
   - Update application code references

**Note:** A migration script will be provided separately if you have existing data.
