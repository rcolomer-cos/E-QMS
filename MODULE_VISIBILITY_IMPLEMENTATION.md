# Module Visibility Configuration Implementation

## Overview

This feature allows administrators to control which application modules are visible to end-users. Module visibility settings determine which modules appear in the UI navigation menu and which routes are accessible.

## Key Features

✅ **Administrator Control**: Admins can enable/disable modules through a user-friendly interface  
✅ **Role-Based Bypass**: Administrators and superusers always have access to all modules regardless of visibility settings  
✅ **Real-Time Updates**: Changes take effect immediately without requiring users to re-login  
✅ **Route Protection**: Disabled modules cannot be accessed via direct URLs by non-admin users  
✅ **Audit Trail**: All visibility changes are logged for compliance tracking  
✅ **Persistent Settings**: Module visibility preferences are stored in the database  

## Supported Modules

The following modules can be enabled/disabled:

1. **Documents** - Document management and control
2. **Processes** - Business process management
3. **Audits** - Internal and external audit management
4. **NCR** - Non-Conformance Reports
5. **CAPA** - Corrective and Preventive Actions
6. **Training** - Training management and competency tracking
7. **Risks** - Risk assessment and management
8. **Equipment** - Equipment and asset management
9. **Inspection** - Mobile inspections and quality checks
10. **Improvement Ideas** - Continuous improvement tracking

## Database Setup

### Running the Migration

The module visibility table is created via a database migration script. To set up:

```sql
-- Execute the migration script
-- File: backend/database/migrations/003_add_module_visibility.sql
```

This creates:
- `module_visibility` table with module settings
- Default entries for all 10 modules (all enabled by default)
- Indexes for optimal query performance

### Database Schema

```sql
CREATE TABLE module_visibility (
    id INT PRIMARY KEY IDENTITY(1,1),
    module_key NVARCHAR(50) NOT NULL UNIQUE,
    module_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    is_enabled BIT DEFAULT 1,
    icon NVARCHAR(50),
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

## Backend Implementation

### API Endpoints

All module visibility endpoints are protected and require admin/superuser authentication.

**Base URL**: `/api/modules`

#### Get All Modules
```http
GET /api/modules
Authorization: Bearer {token}
Role Required: Admin, Superuser
```

Response:
```json
[
  {
    "id": 1,
    "moduleKey": "documents",
    "moduleName": "Documents",
    "description": "Document management and control",
    "isEnabled": true,
    "icon": "file-text",
    "displayOrder": 1
  }
]
```

#### Get Enabled Modules
```http
GET /api/modules/enabled
Authorization: Bearer {token}
```

Returns all modules for admin users, only enabled modules for regular users.

#### Update Module Visibility
```http
PUT /api/modules/{moduleKey}
Authorization: Bearer {token}
Role Required: Admin, Superuser

Body:
{
  "isEnabled": false
}
```

#### Batch Update Modules
```http
POST /api/modules/batch
Authorization: Bearer {token}
Role Required: Admin, Superuser

Body:
{
  "modules": [
    { "key": "documents", "isEnabled": true },
    { "key": "processes", "isEnabled": false }
  ]
}
```

### Models

**ModuleVisibilityModel** (`backend/src/models/ModuleVisibilityModel.ts`)
- `findAll()` - Get all modules
- `findEnabled()` - Get only enabled modules
- `findByKey(key)` - Get specific module
- `isModuleEnabled(key)` - Check if module is enabled
- `updateVisibility(key, isEnabled)` - Update single module
- `batchUpdate(updates)` - Update multiple modules

### Middleware

**checkModuleAccess** (`backend/src/middleware/moduleAccess.ts`)

Middleware function that checks if a user has access to a specific module:
- Admin/superuser roles always bypass the check
- Regular users are blocked if the module is disabled
- Returns 403 error for unauthorized access

## Frontend Implementation

### Components

#### ModuleVisibilitySettings
Location: `frontend/src/components/ModuleVisibilitySettings.tsx`

Admin-only component that displays toggle switches for each module:
- Shows module name, description, and current status
- Toggle switches to enable/disable modules
- Real-time updates with success/error notifications
- Information box explaining the feature

#### ProtectedModuleRoute
Location: `frontend/src/components/ProtectedModuleRoute.tsx`

Higher-order component that wraps routes to enforce module visibility:
- Checks if module is enabled for current user
- Admin/superuser bypass visibility checks
- Redirects non-admin users to home page if module is disabled

### Context

**ModuleVisibilityContext** (`frontend/src/contexts/ModuleVisibilityContext.tsx`)

Provides global state management for module visibility:
- Loads enabled modules on app initialization
- `isModuleEnabled(moduleKey)` - Check if module is accessible
- `refreshModules()` - Reload module visibility settings
- Admin users always see all modules

### Usage in Navigation

The Layout component uses module visibility to conditionally render navigation items:

```tsx
{isModuleEnabled('documents') && (
  <li><Link to="/documents">Documents</Link></li>
)}
```

### Usage in Routes

Routes are protected using the ProtectedModuleRoute component:

```tsx
<Route 
  path="documents" 
  element={
    <ProtectedModuleRoute moduleKey="documents">
      <Documents />
    </ProtectedModuleRoute>
  } 
/>
```

## User Guide

### Accessing Module Visibility Settings

1. Log in as an Administrator or Superuser
2. Navigate to **Settings** page
3. Click on the **Module Visibility** tab
4. You'll see a list of all available modules with toggle switches

### Enabling/Disabling Modules

1. Locate the module you want to configure
2. Click the toggle switch next to the module
3. The module status will update immediately
4. A success notification will confirm the change

### Effects of Disabling a Module

When a module is disabled:
- ✅ It disappears from the navigation menu for regular users
- ✅ Direct URL access is blocked (users are redirected to home)
- ✅ Admin/superuser can still access it
- ✅ No data is deleted or modified

### Important Notes

- **Admins Always Have Access**: Administrators and superusers can always access all modules regardless of visibility settings
- **Immediate Effect**: Changes take effect immediately for all users
- **No Re-login Required**: Users don't need to log out and back in
- **No Data Loss**: Disabling a module only hides it; all data remains intact
- **Audit Trail**: All visibility changes are logged in the audit log

## Testing Scenarios

### Test 1: Toggle Module Visibility
1. Log in as admin
2. Go to Settings > Module Visibility
3. Disable the "Documents" module
4. Verify "Documents" disappears from navigation menu (when viewing as regular user)
5. Enable the module again
6. Verify "Documents" reappears in navigation

### Test 2: Route Protection
1. Disable the "CAPA" module
2. Log in as a regular user (non-admin)
3. Try to access `/capa` directly via URL
4. Verify redirect to home page
5. Log in as admin
6. Verify admin can still access `/capa`

### Test 3: Admin Bypass
1. Disable all modules
2. Log in as superuser
3. Verify all modules still appear in navigation
4. Verify all module routes are accessible

### Test 4: Real-Time Updates
1. Open browser with user A (regular user)
2. Open browser with user B (admin)
3. Admin disables a module
4. Regular user navigates to different page
5. Verify disabled module is hidden from navigation

### Test 5: Persistence
1. Disable some modules
2. Log out
3. Log back in
4. Verify modules remain disabled

## Security Considerations

### ✅ Implemented Security Measures

1. **Role-Based Access Control**: Only admins/superusers can modify module visibility
2. **Backend Enforcement**: Middleware validates module access on every request
3. **Audit Logging**: All visibility changes are tracked with user, timestamp, and old/new values
4. **No Client-Side Bypass**: Frontend checks are backed by backend validation
5. **Admin Override**: Admins always have access for emergency situations

### 🔒 Security Best Practices

- **Regular Audits**: Review module visibility changes in audit logs
- **Principle of Least Privilege**: Only enable modules that users actually need
- **Admin Account Protection**: Ensure admin accounts have strong passwords
- **Monitor Direct Access**: Review audit logs for attempts to access disabled modules

## Troubleshooting

### Module Not Appearing After Enabling

**Cause**: Browser cache or context not refreshed  
**Solution**: 
- Navigate to a different page and back
- Hard refresh the browser (Ctrl+Shift+R)
- Check console for any errors

### Cannot Save Module Visibility Changes

**Cause**: User doesn't have admin/superuser role  
**Solution**: Verify user has the correct role assigned

### Module Shows in Navigation but Route is Blocked

**Cause**: Mismatch between navigation check and route protection  
**Solution**: Check that `moduleKey` matches in both Layout.tsx and App.tsx

### Database Migration Failed

**Cause**: Table already exists or syntax error  
**Solution**: 
- Check if table already exists: `SELECT * FROM module_visibility`
- Review migration script for errors
- Manually create table if needed

## Future Enhancements

Potential improvements for future releases:

1. **Module Dependencies**: Automatically enable/disable dependent modules
2. **User Group Visibility**: Different visibility settings per user group
3. **Custom Modules**: Allow admins to add custom modules
4. **Visibility Schedule**: Time-based module visibility (e.g., disable during maintenance)
5. **Module Permissions**: Fine-grained permissions within modules
6. **Export/Import Settings**: Backup and restore visibility configurations

## Support

For questions or issues with module visibility:
1. Check this documentation
2. Review audit logs for changes
3. Verify user roles and permissions
4. Contact system administrator

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ Module visibility configuration UI
- ✅ Database migration script
- ✅ API endpoints for CRUD operations
- ✅ Frontend context for state management
- ✅ Route protection for disabled modules
- ✅ Navigation menu integration
- ✅ Admin bypass functionality
- ✅ Audit logging for all changes
- ✅ 10 default modules supported
