# Organization Structure Module Implementation

## Overview

This document describes the implementation of the Organization Structure Module for E-QMS, which enables comprehensive management of departments, processes, and process owners.

## Features Implemented

### 1. Department Management

#### Backend
- **Database Table**: `Departments` (already exists)
  - Fields: id, name, code, description, managerId, active, createdAt, updatedAt, createdBy
  - Unique constraints on name and code
  - Foreign key to Users for manager assignment

- **Model**: `DepartmentModel` (src/models/DepartmentModel.ts)
  - CRUD operations for departments
  - Manager relationship with Users table
  - Soft delete functionality

- **Controller**: `departmentController.ts` (src/controllers/departmentController.ts)
  - `getAllDepartments()` - Get all active departments
  - `getDepartmentById(id)` - Get single department
  - `getDepartmentByCode(code)` - Get department by code
  - `createDepartment()` - Create new department (admin only)
  - `updateDepartment(id)` - Update department (admin only)
  - `deleteDepartment(id)` - Soft delete department (admin only)

- **API Routes**: `/api/departments`
  - GET `/` - List all departments
  - GET `/:id` - Get department by ID
  - GET `/code/:code` - Get department by code
  - POST `/` - Create department (admin/superuser only)
  - PUT `/:id` - Update department (admin/superuser only)
  - DELETE `/:id` - Delete department (admin/superuser only)

#### Frontend
- **Page**: `Departments.tsx` (src/pages/Departments.tsx)
  - List view with table displaying all departments
  - Create/Edit modal for department management
  - Manager assignment dropdown
  - Delete confirmation
  - Responsive design

- **Service**: `departmentService.ts` (src/services/departmentService.ts)
  - All CRUD operations mapped to API endpoints

- **Navigation**: Accessible via `/departments` (admin only)

### 2. Process Management

#### Backend
- **Database Table**: `Processes` (already exists)
  - Fields: id, name, code, description, departmentId, processCategory, objective, scope, active, createdAt, updatedAt, createdBy
  - Unique constraints on name and code
  - Foreign key to Departments

- **Model**: `ProcessModel` (src/models/ProcessModel.ts)
  - CRUD operations for processes
  - Department relationship
  - Soft delete functionality

- **Controller**: `processController.ts` (src/controllers/processController.ts)
  - `getAllProcesses()` - Get all active processes
  - `getProcessById(id)` - Get single process
  - `getProcessByCode(code)` - Get process by code
  - `createProcess()` - Create new process (admin only)
  - `updateProcess(id)` - Update process (admin only)
  - `deleteProcess(id)` - Soft delete process (admin only)
  - `getProcessOwners(id)` - Get all owners for a process
  - `assignProcessOwner(id)` - Assign owner to process (admin only)
  - `removeProcessOwner(id, ownerId)` - Remove owner from process (admin only)

- **API Routes**: `/api/processes`
  - GET `/` - List all processes
  - GET `/:id` - Get process by ID
  - GET `/code/:code` - Get process by code
  - POST `/` - Create process (admin/superuser only)
  - PUT `/:id` - Update process (admin/superuser only)
  - DELETE `/:id` - Delete process (admin/superuser only)
  - GET `/:id/owners` - Get process owners
  - POST `/:id/owners` - Assign process owner (admin/superuser only)
  - DELETE `/:id/owners/:ownerId` - Remove process owner (admin/superuser only)

#### Frontend
- **Page**: `Processes.tsx` (src/pages/Processes.tsx)
  - List view with table displaying all processes
  - Create/Edit modal for process management
  - Department assignment dropdown
  - Process category, objective, and scope fields
  - **"Owners" button** for managing process owners
  - Delete confirmation
  - Responsive design

- **Service**: `processService.ts` (src/services/processService.ts)
  - All CRUD operations for processes
  - Process owner management functions:
    - `getProcessOwners(processId)`
    - `assignProcessOwner(processId, data)`
    - `removeProcessOwner(processId, ownerId)`

- **Navigation**: Accessible via `/processes` (admin only)

### 3. Process Owner Management

#### Backend
- **Database Table**: `ProcessOwners` (already exists)
  - Fields: id, processId, ownerId, assignedAt, assignedBy, isPrimaryOwner, active, notes
  - Junction table linking Processes to Users
  - Primary/secondary owner designation
  - Audit trail with assignedBy field

- **Model**: `ProcessOwnerModel` (src/models/ProcessOwnerModel.ts)
  - `create()` - Assign owner to process
  - `findByProcessId()` - Get all owners for a process
  - `findByOwnerId()` - Get all processes owned by a user
  - `ownershipExists()` - Check if assignment exists
  - `delete()` - Remove owner assignment (soft delete)
  - `updatePrimaryStatus()` - Update primary owner flag

#### Frontend
- **Process Owners Modal** (in Processes.tsx)
  - Displays list of assigned owners with:
    - Owner name and email
    - Primary/secondary designation (badges)
    - Assignment date
    - Notes
    - Remove button
  - **Assign New Owner** form with:
    - User dropdown selection
    - Primary owner checkbox
    - Notes text area
  - Real-time updates after assign/remove operations

- **Types**: Added `ProcessOwner` interface to `types/index.ts`
  - Matches backend ProcessOwner structure

- **Styling**: Enhanced CSS in `Processes.css`
  - Owners modal with larger width (900px)
  - Owners table styling
  - Primary/secondary badges
  - Form styling for owner assignment

## Data Flow

### Creating a Process with Owners

1. Admin navigates to `/processes`
2. Clicks "Add Process" button
3. Fills in process details and submits
4. Process is created via POST `/api/processes`
5. Admin clicks "Owners" button on the new process
6. Owners modal opens and loads current owners (empty initially)
7. Admin selects a user, checks "Primary Owner", and submits
8. Owner is assigned via POST `/api/processes/:id/owners`
9. Owners list refreshes to show the new assignment

### Viewing Organization Structure

1. Admin navigates to `/departments` to see all departments
2. Each department shows its manager
3. Admin navigates to `/processes` to see all processes
4. Each process shows its associated department
5. Clicking "Owners" on any process shows who is responsible for it

## Security

- All department and process management endpoints require authentication
- Create, update, and delete operations require admin or superuser role
- Process owner assignments require admin or superuser role
- Viewing operations are available to all authenticated users
- JWT tokens are validated on every request

## Database Relationships

```
Users (1) ─── manages ──> (0..1) Departments
Departments (1) ──< (0..n) Processes
Processes (1) ──< (0..n) ProcessOwners >── (1) Users
Users (1) ──< (0..n) ProcessOwners (as assignedBy)
```

## API Response Examples

### Get All Processes
```json
GET /api/processes

Response: [
  {
    "id": 1,
    "name": "Document Review Process",
    "code": "PROC-001",
    "description": "Review and approval of quality documents",
    "departmentId": 2,
    "departmentName": "Quality Assurance",
    "processCategory": "Core",
    "objective": "Ensure document quality",
    "scope": "All quality documents",
    "active": true,
    "createdAt": "2025-11-16T07:00:00.000Z"
  }
]
```

### Get Process Owners
```json
GET /api/processes/1/owners

Response: [
  {
    "id": 1,
    "processId": 1,
    "ownerId": 5,
    "ownerName": "John Smith",
    "ownerEmail": "john.smith@company.com",
    "assignedAt": "2025-11-16T08:00:00.000Z",
    "assignedBy": 1,
    "assignedByName": "Admin User",
    "isPrimaryOwner": true,
    "active": true,
    "notes": "Primary contact for this process"
  }
]
```

### Assign Process Owner
```json
POST /api/processes/1/owners

Request:
{
  "ownerId": 6,
  "isPrimaryOwner": false,
  "notes": "Backup owner"
}

Response:
{
  "message": "Process owner assigned successfully",
  "ownershipId": 2
}
```

## Testing

### Backend Tests
- Located in `backend/src/__tests__/controllers/`
- Tests cover:
  - Department CRUD operations
  - Process CRUD operations
  - Process owner assignments
  - Error handling
  - Authorization checks

Run tests:
```bash
cd backend
npm test
```

### Manual Testing Checklist
- [x] Backend builds successfully
- [x] Frontend builds successfully
- [x] All tests pass
- [ ] Create a department via UI
- [ ] Update a department via UI
- [ ] Delete a department via UI
- [ ] Create a process via UI
- [ ] Update a process via UI
- [ ] Assign an owner to a process via UI
- [ ] Remove an owner from a process via UI
- [ ] Delete a process via UI

## File Changes Summary

### Frontend Files Modified
1. `frontend/src/types/index.ts` - Added ProcessOwner interface
2. `frontend/src/services/processService.ts` - Added owner management functions
3. `frontend/src/pages/Processes.tsx` - Added owners modal and management UI
4. `frontend/src/styles/Processes.css` - Added styling for owners modal

### Backend Files (Already Existed)
- Database schemas in `backend/database/`
- Models in `backend/src/models/`
- Controllers in `backend/src/controllers/`
- Routes in `backend/src/routes/`
- Validators in `backend/src/utils/validators.ts`
- Tests in `backend/src/__tests__/`

## Future Enhancements

Potential improvements for future iterations:

1. **Process Hierarchy**: Allow processes to have parent-child relationships
2. **Process Documentation**: Link processes to related documents
3. **Process Metrics**: Track KPIs for each process
4. **Department Hierarchy**: Support nested departments
5. **Bulk Operations**: Import/export departments and processes via CSV
6. **Process Workflow**: Define workflow steps within a process
7. **Owner Notifications**: Email notifications when assigned as process owner
8. **Activity History**: Track all changes to processes and departments

## Conclusion

The Organization Structure Module is now fully functional with:
- ✅ Department management (already implemented)
- ✅ Process management (already implemented)
- ✅ Process owner assignment (newly added to UI)
- ✅ Complete CRUD operations for all entities
- ✅ Role-based access control
- ✅ Comprehensive backend tests
- ✅ User-friendly admin interface

The module provides a solid foundation for managing organizational structure in accordance with ISO 9001:2015 requirements for process management and responsibilities.
