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
9. **DocumentRevisions** - Detailed revision history and audit trail for documents
10. **Notifications** - In-app notifications for users
11. **Equipment** - Equipment metadata, calibration, and maintenance tracking
12. **CalibrationRecords** - Calibration records for equipment with results and compliance tracking
13. **InspectionRecords** - Inspection records for equipment with findings and compliance tracking
14. **ServiceMaintenanceRecords** - Service and maintenance records for equipment with cost and downtime tracking
15. **NCRs** - Non-conformity reports with tracking for category, severity, root cause, and resolution
16. **CAPAs** - Corrective and preventive actions with root causes, actions, deadlines, and verification data
17. **AuditLog** - Comprehensive audit trail capturing all user actions, timestamps, affected entities, and old/new values
18. **Trainings** - Training events and sessions with scheduling, instructor, and certification requirements
19. **TrainingAttendees** - Training attendance records linking users to training sessions with completion status and certificates
20. **TrainingCertificates** - Detailed certificate metadata for both internal and external certifications with renewal tracking
21. **Attachments** - File attachment storage with polymorphic relationships to various entities including training certificates
22. **Competencies** - Competency definitions and requirements for ISO 9001 competence management
23. **UserCompetencies** - User competency assessments and certifications with expiry tracking
24. **RoleTrainingRequirements** - Required training associations for specific roles
25. **Audits** - Planned audits including scope, dates, auditors, related processes, and audit criteria for ISO 9001 audit planning
26. **Risks** - Risk register items with assessment, mitigation actions, ownership, and review tracking for ISO 9001 risk management
27. **Suppliers** - Supplier details with contact info, categories, approval status, quality metrics, evaluation tracking, and audit scheduling for ISO 9001 supplier management

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
   09_create_document_revisions_table.sql
   10_create_notifications_table.sql
   11_create_equipment_table.sql
   14_create_calibration_records_table.sql
   15_create_inspection_records_table.sql
   16_create_service_maintenance_records_table.sql
   17_create_ncr_table.sql
   18_create_capa_table.sql
   19_create_audit_log_table.sql
   20_create_attachments_table.sql
   21_create_trainings_table.sql
   22_create_training_attendees_table.sql
   23_create_training_certificates_table.sql
   24_create_competencies_table.sql
   25_create_user_competencies_table.sql
   26_create_role_training_requirements_table.sql
   27_create_audits_table.sql
   28_create_checklist_templates_table.sql
   29_create_checklist_questions_table.sql
   30_create_checklist_responses_table.sql
   31_create_audit_findings_table.sql
   32_add_audit_approval_workflow.sql
   33_create_auditor_access_tokens_table.sql
   34_create_risks_table.sql
   35_create_suppliers_table.sql
   ```

3. **Create Initial Admin User** (required for first-time setup):
   
   After creating all tables, create an initial admin user to access the system:
   
   ```
   13_insert_admin_user.sql
   ```
   
   **Default Credentials:**
   - Email: `admin@eqms.local`
   - Password: `Admin@123`
   
   **Important Security Notes:**
   - ⚠️ Change the default password immediately after first login
   - The system enforces a password change on first login
   - Only use this script for initial setup or development
   - Delete or secure this script file after use in production
   - Safe to run multiple times (checks if admin user exists before inserting)

4. **Optional: Load Sample Data** (for development/testing):
   
   After creating all tables and users, you can optionally load sample data:
   
   ```
   12_seed_example_data.sql
   ```
   
   **Important Notes:**
   - This script populates all tables **except Users** with example data
   - Requires users to be created first (assumes user IDs 1-5 exist)
   - Includes 8 departments, 15 processes, 12 documents, 10 equipment items, and more
   - All sample data follows ISO 9001 QMS structure and best practices
   - Safe to run multiple times (checks for existing data before inserting)
   - Ideal for development, testing, and demonstration purposes
   - **Do not use in production** without reviewing and customizing the data

5. **Verify Installation**:
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

### Equipment Table

- **Identification**: Stores unique equipment number, name, manufacturer, model, and serial number
- **Location Tracking**: Physical location, department, and responsible person assignment
- **Status Management**: Tracks operational status (operational, maintenance, out_of_service, calibration_due)
- **Calibration Tracking**: Manages last calibration date, next due date, and calibration intervals
- **Maintenance Tracking**: Manages last maintenance date, next due date, and maintenance intervals
- **QR Code Support**: Optional QR code field for mobile device scanning and quick access
- **Ownership**: Links to responsible user via `responsiblePerson` foreign key
- **Audit Trail**: Complete tracking of creation and update timestamps
- **Performance Indexes**: Optimized for queries by status, location, department, responsible person, and maintenance/calibration dates
- **ISO 9001 Compliance**: Supports equipment management and calibration control requirements

### CalibrationRecords Table

- **Equipment Reference**: Links to Equipment table with foreign key relationship
- **Scheduling**: Tracks calibration date, due date, and next due date for compliance
- **Personnel Tracking**: Records who performed and approved the calibration
- **Calibration Details**: Stores calibration type, standards used, and certificate numbers
- **Results and Measurements**: Captures result status (passed/failed), measured values, and tolerances
- **External Services**: Tracks external calibration service providers and costs
- **Findings and Actions**: Documents observations, findings, and corrective actions taken
- **Attachments**: Supports file paths to calibration certificates and reports
- **Status Tracking**: Monitors record status (scheduled, in_progress, completed, overdue, cancelled)
- **Audit Trail**: Complete tracking of creation, updates, and responsible personnel
- **Performance Indexes**: Optimized for queries by equipment, dates, status, results, and personnel
- **ISO 9001 Compliance**: Supports calibration control and measurement traceability requirements

### InspectionRecords Table

- **Equipment Reference**: Links to Equipment table with foreign key relationship
- **Scheduling**: Tracks inspection date, due date, and next due date for compliance
- **Personnel Tracking**: Records who inspected and reviewed the inspection
- **Inspection Details**: Stores inspection type, checklist reference, and parameters evaluated
- **Results and Findings**: Captures overall result, detailed findings, and defects identified
- **Compliance Tracking**: Monitors safety compliance and operational compliance separately
- **Measurements**: Documents measurements taken and parameters evaluated during inspection
- **Actions and Follow-up**: Records corrective actions, recommendations, and follow-up requirements
- **Severity Assessment**: Classifies findings by severity (none, minor, moderate, major, critical)
- **Attachments**: Supports file paths to inspection reports and photos
- **Status Tracking**: Monitors record status (scheduled, in_progress, completed, overdue, cancelled)
- **Audit Trail**: Complete tracking of creation, updates, and responsible personnel
- **Performance Indexes**: Optimized for queries by equipment, dates, status, severity, and compliance flags
- **ISO 9001 Compliance**: Supports inspection and monitoring requirements with full traceability

### ServiceMaintenanceRecords Table

- **Equipment Reference**: Links to Equipment table with foreign key relationship
- **Scheduling**: Tracks service date, due date, and next due date for preventive maintenance
- **Personnel Tracking**: Records who performed and approved the service/maintenance
- **Service Details**: Stores service type (preventive, corrective, emergency, etc.), work order number, and priority
- **Work Documentation**: Captures description, work performed, and hours spent
- **Parts and Materials**: Tracks parts used, parts replaced, and associated costs
- **Cost Management**: Records labor costs, materials costs, and total costs
- **External Services**: Tracks external service providers, contacts, and invoice numbers
- **Outcomes and Results**: Documents service outcome, equipment condition, and issues resolved
- **Problem Analysis**: Records problems identified, root cause analysis, and preventive actions
- **Follow-up and Recommendations**: Manages follow-up requirements and recommendations
- **Testing and Verification**: Tracks functional testing performed and test results
- **Downtime Tracking**: Monitors equipment downtime start, end, and total hours
- **Attachments**: Supports file paths to service reports, invoices, and photos
- **Status Tracking**: Monitors record status (scheduled, in_progress, completed, overdue, cancelled, on_hold)
- **Audit Trail**: Complete tracking of creation, updates, and responsible personnel
- **Performance Indexes**: Optimized for queries by equipment, dates, status, service type, priority, and costs
- **ISO 9001 Compliance**: Supports maintenance management and equipment reliability requirements

### NCRs Table

- **NCR Identification**: Stores unique NCR number, title, and detailed description of non-conformity
- **Classification**: Tracks source of NCR (internal audit, customer complaint, inspection, etc.), category (process, product, documentation, etc.), and severity (minor, major, critical)
- **Status Management**: Monitors NCR status (open, in_progress, resolved, closed, rejected) throughout its lifecycle
- **Timeline Tracking**: Records detected date, closed date, and verification date
- **Personnel Tracking**: Links to users who reported, are assigned to, and verified the NCR
- **Analysis and Resolution**: Documents root cause analysis findings, containment actions, and corrective actions
- **Status Lifecycle**: Tracks NCR from detection through resolution and closure
- **Severity Levels**: Classifies non-conformities by severity (minor, major, critical) for prioritization
- **Audit Trail**: Complete tracking of creation and update timestamps
- **Performance Indexes**: Optimized for queries by NCR number, status, severity, dates, personnel, source, and category
- **ISO 9001 Compliance**: Supports non-conformance management and corrective action requirements with full traceability

### CAPAs Table

- **CAPA Identification**: Stores unique CAPA number, title, and detailed description of corrective/preventive action
- **Classification**: Tracks type (corrective/preventive), source, and priority level (low, medium, high, urgent)
- **Related Records**: Optional links to related NCRs and audits for traceability
- **Analysis and Actions**: Documents root cause analysis findings and proposed actions
- **Personnel and Timeline**: Assigns action owners and tracks target/completion dates
- **Status and Verification**: Monitors CAPA status (open, in_progress, completed, verified, closed)
- **Effectiveness Verification**: Captures effectiveness verification notes and verification personnel
- **Audit Trail**: Complete tracking of creation, updates, and responsible personnel
- **Performance Indexes**: Optimized for queries by CAPA number, status, priority, dates, personnel, and related records
- **ISO 9001 Compliance**: Supports CAPA management with relations to NCRs, full audit trail, and effectiveness verification

### Audits Table

- **Audit Identification**: Stores unique audit number, title, and detailed audit description
- **Audit Classification**: Tracks audit type (Internal, External, Process, Compliance, Product, System, Supplier, Certification, Management Review)
- **Scope and Criteria**: Documents audit scope definition and audit criteria/standards being applied (e.g., ISO 9001:2015 clauses)
- **Process Tracking**: Links audits to related processes being audited for traceability
- **Status Management**: Monitors audit status (planned, in_progress, completed, closed) throughout audit lifecycle
- **Timeline Tracking**: Records scheduled dates and actual completion dates
- **Personnel Assignment**: Links to lead auditor and tracks audit creator
- **Department Association**: Associates audits with specific departments or areas being audited
- **Findings and Conclusions**: Captures audit findings, observations, and conclusions
- **Audit Trail**: Complete tracking of creation and update timestamps
- **Performance Indexes**: Optimized for queries by audit number, status, dates, audit type, lead auditor, department, and related processes
- **ISO 9001 Compliance**: Supports audit planning and execution requirements with comprehensive tracking of scope, criteria, and findings

### Risks Table

- **Risk Identification**: Stores unique risk number, title, and detailed risk description
- **Risk Classification**: Tracks risk category (operational, financial, compliance, strategic, etc.) and source of identification
- **Risk Assessment**: Captures likelihood and impact scores (1-5 scale) with calculated risk score (likelihood × impact)
- **Risk Level**: Automatic or manual classification of risk level (low, medium, high, critical) based on risk score
- **Mitigation Planning**: Documents mitigation strategy, specific actions, and contingency plans
- **Ownership**: Assigns risk owner with department and process associations for accountability
- **Status Management**: Monitors risk status (identified, assessed, mitigating, monitoring, closed, accepted) throughout lifecycle
- **Review Tracking**: Manages review dates, next review dates, and review frequency for ongoing monitoring
- **Residual Risk**: Captures post-mitigation likelihood and impact with calculated residual risk score
- **Stakeholder Impact**: Documents affected stakeholders and regulatory implications
- **Related Risks**: Supports linking to related risks for comprehensive risk management
- **Audit Trail**: Complete tracking of creation, updates, and review history with responsible personnel
- **Performance Indexes**: Optimized for queries by risk number, status, risk level, risk scores, dates, personnel, and classification
- **ISO 9001 Compliance**: Supports risk-based thinking and risk management requirements with comprehensive assessment and mitigation tracking

### Suppliers Table

- **Supplier Identification**: Stores unique supplier number, company name, and detailed description
- **Contact Information**: Captures contact person, email, phone numbers, fax, and website
- **Address Information**: Complete address details including street, city, state/province, postal code, and country
- **Supplier Classification**: Tracks category (Raw Materials, Components, Services, Equipment), type (Manufacturer, Distributor, Service Provider), and industry sector
- **Products and Services**: Documents the products and services provided by the supplier
- **Approval Management**: Manages approval status (pending, under_review, approved, conditional_approval, rejected, suspended, deactivated) with approval dates and responsible personnel
- **Suspension Tracking**: Records suspension dates and reasons when suppliers are temporarily suspended
- **Quality Metrics**: Captures rating (1-5 scale), performance score (0-100), quality grade (A-F), and compliance status
- **Certifications**: Documents supplier certifications (ISO 9001, ISO 14001, etc.) with expiry tracking
- **Evaluation Tracking**: Manages last evaluation date, next evaluation date, and evaluation frequency for supplier assessments
- **Audit Scheduling**: Tracks last audit date, next audit date, and audit frequency for supplier audits
- **Risk Assessment**: Classifies suppliers by risk level (Low, Medium, High, Critical) and flags critical suppliers
- **Backup Suppliers**: Supports linking to backup suppliers for business continuity planning
- **Business Information**: Stores registration numbers, DUNS number, establishment year, employee count, and annual revenue
- **Payment Terms**: Documents payment terms, credit limits, and banking information
- **Relationship Management**: Assigns supplier manager, tracks relationship start date, and contract expiry dates
- **Preferred Suppliers**: Flags preferred suppliers for prioritization
- **Performance Metrics**: Tracks on-time delivery rate, quality reject rate, responsiveness rating, and total purchase value
- **ISO 9001 Certification**: Dedicated fields for ISO 9001 certification tracking with certificate numbers and expiry dates
- **Soft Delete**: Active flag supports soft deletion with deactivation tracking
- **Audit Trail**: Complete tracking of creation, updates, deactivation timestamps, and responsible users
- **Performance Indexes**: Extensively indexed for queries by supplier number, name, status, category, quality metrics, evaluation dates, audit dates, and personnel
- **ISO 9001 Compliance**: Supports supplier quality management requirements with comprehensive evaluation, audit scheduling, certification tracking, and performance monitoring

### AuditLog Table

- **User Tracking**: Records user ID, name, and email for comprehensive user action tracking (supports system actions)
- **Action Details**: Captures action type, category, and human-readable description
- **Entity Tracking**: Links actions to affected entities (type, ID, and identifier) for complete traceability
- **Change Tracking**: Stores old and new values in JSON format with list of changed fields
- **Request Metadata**: Captures IP address, user agent, HTTP method, and request URL for security monitoring
- **Result Tracking**: Records success status, error messages, and status codes
- **Timestamp**: High-precision timestamp for chronological audit trail
- **Session Context**: Groups related actions by session ID with additional contextual data
- **Cached User Data**: Maintains user information even if user accounts are deleted
- **Performance Indexes**: Extensively indexed for high read volume including timestamp, user, action, entity, and security monitoring queries
- **ISO 9001 Compliance**: Provides comprehensive audit trail for all system activities with full traceability and change tracking

### Trainings Table

- **Training Identification**: Stores unique training number, title, and detailed description
- **Classification**: Tracks training category (Safety, Quality, Technical, Compliance) and type (Internal, External, Online, On-the-job)
- **Training Details**: Captures duration, instructor information, instructor organization, and location
- **Scheduling**: Manages scheduled date and actual completion date
- **Status Management**: Tracks training status (scheduled, completed, cancelled, expired) throughout lifecycle
- **Certification Requirements**: Indicates whether certification is required and certificate validity period in months
- **Capacity and Prerequisites**: Optional maximum attendees and prerequisite training requirements
- **Content Management**: Stores learning objectives and training materials references
- **Audit Trail**: Complete tracking of creation and update timestamps with creator information
- **Performance Indexes**: Optimized for queries by training number, category, type, status, dates, and instructor
- **ISO 9001 Compliance**: Supports competence management and training requirements with full traceability

### TrainingAttendees Table

- **Junction Table**: Links users to training events with many-to-many relationship
- **Attendance Tracking**: Records attendance status and actual attendance date
- **Performance Assessment**: Captures score/grade (0-100 scale), pass/fail status, and assessment notes
- **Certificate Management**: Tracks certificate issuance, certificate number, issue date, and expiry date
- **Certificate Files**: Links to certificate files via Attachments table or direct certificateFileId reference
- **Status Tracking**: Monitors attendee status (registered, attended, completed, failed, expired, cancelled)
- **Timeline Management**: Tracks registration date and completion date
- **Verification**: Records who verified attendance/completion and when
- **Unique Constraint**: Ensures a user can only be registered once per training event
- **Audit Trail**: Complete tracking of registration and updates
- **Performance Indexes**: Optimized for queries by training, user, status, attendance, certificate tracking, and expiry dates
- **ISO 9001 Compliance**: Supports training records and competence verification with full traceability

### TrainingCertificates Table

- **Certificate Identification**: Stores unique certificate number and certificate name
- **Ownership and Association**: Links to user and optionally to training attendee record and training event
- **Issuing Authority**: Captures issuer name, contact information, and accreditation body
- **Certificate Classification**: Tracks certificate type (Internal, External, Professional, Regulatory, Safety, Technical, Compliance)
- **Competency Tracking**: Documents competency area covered and proficiency level
- **Date Management**: Manages issue date, effective date, and expiry date
- **Renewal Management**: Tracks renewal requirements, intervals, last renewal date, and next renewal due date
- **Status Lifecycle**: Monitors certificate status (active, expired, suspended, revoked, renewed) with revocation tracking
- **Certificate Files**: Links to certificate files via Attachments table
- **Verification**: Records verification status, method, responsible person, and verification notes
- **Compliance Requirements**: Indicates regulatory requirements and roles for which certificate is mandatory
- **External Certificates**: Supports both internally issued and externally obtained certifications
- **Audit Trail**: Complete tracking of creation, updates, and responsible personnel
- **Performance Indexes**: Optimized for queries by certificate number, user, status, type, dates, verification, and compliance flags
- **ISO 9001 Compliance**: Supports comprehensive certificate lifecycle management and competence tracking with renewal and verification

### Attachments Table

- **File Information**: Stores original filename, stored filename, file path, file size, MIME type, and file extension
- **Polymorphic Relationships**: Links attachments to various entity types (equipment, document, calibration, inspection, training, training_certificate, ncr, capa, audit)
- **Entity Association**: Uses entityType and entityId for flexible attachment of files to any record type
- **Attachment Metadata**: Captures description, category (certificate, report, photo, invoice), and version information
- **Security and Access Control**: Tracks uploaded by user and public/private access flag
- **Soft Delete**: Supports soft deletion with active flag and deletion tracking
- **Audit Trail**: Complete tracking of creation, updates, deletion timestamps, and responsible users
- **File Size Limit**: Enforces maximum file size of 10MB at database level
- **Performance Indexes**: Optimized for queries by entity type/ID, user tracking, file lookups, category, and status
- **ISO 9001 Compliance**: Supports secure document and certificate file storage with full traceability and audit trail

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

## Sample Data (Development & Testing)

### Overview

The `12_seed_example_data.sql` script provides comprehensive sample data for development and testing purposes. This script populates all tables (except Users) with realistic ISO 9001-compliant data.

### What's Included

| Table | Sample Data Count | Description |
|-------|-------------------|-------------|
| Departments | 8 | QA, Production, R&D, IT, HR, Engineering, Maintenance, Supply Chain |
| Processes | 15 | Management (3), Core (4), and Support (8) processes |
| ProcessOwners | 15 | Process ownership assignments |
| Documents | 12 | Policies, procedures, work instructions, and forms |
| DocumentRevisions | 13 | Complete revision history with audit trails |
| Notifications | 4 | Sample document approval/rejection notifications |
| Equipment | 10 | Measuring and testing equipment with calibration schedules |
| UserRoles | 7 | Role assignments across different access levels |

### Prerequisites

Before running the seed data script:

1. All database tables must be created (run scripts 01-11)
2. At least 5 users must exist in the Users table (IDs 1-5)
3. Database name should be `EQMS` (or modify the `USE EQMS;` statement)

### Features

- **Idempotent**: Safe to run multiple times without creating duplicates
- **Foreign Key Compliance**: Respects all table dependencies and relationships
- **ISO 9001 Aligned**: Data follows quality management system best practices
- **Realistic Data**: Includes equipment with calibration due dates, documents in various approval states, complete audit trails
- **Well Documented**: Extensive comments explaining data structure and dependencies

### Usage Example

```sql
-- Ensure you're using the correct database
USE EQMS;
GO

-- Run the seed data script
-- Execute 12_seed_example_data.sql in SSMS or Azure Data Studio

-- Verify sample data was inserted
SELECT 'Departments' AS TableName, COUNT(*) AS RecordCount FROM Departments
UNION ALL
SELECT 'Processes', COUNT(*) FROM Processes
UNION ALL
SELECT 'Documents', COUNT(*) FROM Documents
UNION ALL
SELECT 'Equipment', COUNT(*) FROM Equipment;
```

### Customization

To adapt the sample data for your environment:

1. **User IDs**: Modify the user ID references (currently assumes IDs 1-5)
2. **Department Codes**: Adjust department codes to match your organization
3. **Process Categories**: Customize process names and categories as needed
4. **Document Types**: Add or modify document types and categories
5. **Equipment**: Update equipment list to reflect your actual equipment

### Important Notes

- ⚠️ **Development Use Only**: This data is for development and testing purposes
- ⚠️ **User Dependencies**: Many tables reference user IDs - ensure users exist first
- ⚠️ **Database Name**: Script assumes database name is `EQMS`
- ✅ **Safe Execution**: Checks for existing data before inserting
- ✅ **Complete Structure**: Maintains referential integrity across all tables

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

### View Document Revision History

```sql
-- Get complete revision history for a document
SELECT 
    dr.id,
    dr.version,
    dr.revisionNumber,
    dr.changeType,
    dr.changeDescription,
    dr.changeReason,
    dr.statusBefore,
    dr.statusAfter,
    dr.revisionDate,
    u.firstName + ' ' + u.lastName AS authorName,
    u.email AS authorEmail
FROM DocumentRevisions dr
LEFT JOIN Users u ON dr.authorId = u.id
WHERE dr.documentId = 1 -- Replace with actual document ID
ORDER BY dr.revisionDate DESC, dr.revisionNumber DESC;
```

### View Recent Changes by User

```sql
-- View all changes made by a specific user
SELECT 
    dr.documentId,
    d.title,
    dr.version,
    dr.changeType,
    dr.changeDescription,
    dr.revisionDate
FROM DocumentRevisions dr
INNER JOIN Documents d ON dr.documentId = d.id
WHERE dr.authorId = 1 -- Replace with actual user ID
ORDER BY dr.revisionDate DESC;
```

### Audit Trail - Changes in Date Range

```sql
-- View all document changes within a date range
SELECT 
    d.title,
    dr.version,
    dr.changeType,
    dr.changeDescription,
    dr.statusBefore + ' → ' + dr.statusAfter AS statusChange,
    u.firstName + ' ' + u.lastName AS author,
    dr.revisionDate
FROM DocumentRevisions dr
INNER JOIN Documents d ON dr.documentId = d.id
LEFT JOIN Users u ON dr.authorId = u.id
WHERE dr.revisionDate BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY dr.revisionDate DESC;
```

### List Equipment by Status

```sql
-- View all equipment grouped by operational status
SELECT 
    e.status,
    COUNT(*) AS equipmentCount,
    STRING_AGG(e.name, ', ') AS equipmentList
FROM Equipment e
GROUP BY e.status
ORDER BY e.status;
```

### Find Equipment Due for Calibration

```sql
-- Equipment requiring calibration within the next 30 days
SELECT 
    e.id,
    e.equipmentNumber,
    e.name,
    e.location,
    e.department,
    e.nextCalibrationDate,
    u.firstName + ' ' + u.lastName AS responsiblePerson
FROM Equipment e
LEFT JOIN Users u ON e.responsiblePerson = u.id
WHERE e.nextCalibrationDate IS NOT NULL 
    AND e.nextCalibrationDate <= DATEADD(day, 30, GETDATE())
    AND e.status != 'out_of_service'
ORDER BY e.nextCalibrationDate ASC;
```

### Find Equipment Due for Maintenance

```sql
-- Equipment requiring maintenance within the next 30 days
SELECT 
    e.id,
    e.equipmentNumber,
    e.name,
    e.location,
    e.department,
    e.nextMaintenanceDate,
    u.firstName + ' ' + u.lastName AS responsiblePerson
FROM Equipment e
LEFT JOIN Users u ON e.responsiblePerson = u.id
WHERE e.nextMaintenanceDate IS NOT NULL 
    AND e.nextMaintenanceDate <= DATEADD(day, 30, GETDATE())
    AND e.status != 'out_of_service'
ORDER BY e.nextMaintenanceDate ASC;
```

### List Equipment by Department

```sql
-- View all operational equipment by department
SELECT 
    e.department,
    COUNT(*) AS equipmentCount,
    STRING_AGG(e.name + ' (' + e.equipmentNumber + ')', ', ') AS equipment
FROM Equipment e
WHERE e.status = 'operational'
    AND e.department IS NOT NULL
GROUP BY e.department
ORDER BY e.department;
```

### Find Equipment by Responsible Person

```sql
-- View all equipment assigned to a specific person
SELECT 
    e.equipmentNumber,
    e.name,
    e.status,
    e.location,
    e.nextCalibrationDate,
    e.nextMaintenanceDate
FROM Equipment e
WHERE e.responsiblePerson = 1 -- Replace with actual user ID
ORDER BY e.status, e.name;
```

### View Calibration History for Equipment

```sql
-- Get complete calibration history for a specific equipment
SELECT 
    cr.id,
    cr.calibrationDate,
    cr.result,
    cr.passed,
    cr.calibrationType,
    cr.certificateNumber,
    cr.resultValue,
    u1.firstName + ' ' + u1.lastName AS performedBy,
    u2.firstName + ' ' + u2.lastName AS approvedBy,
    cr.findings
FROM CalibrationRecords cr
LEFT JOIN Users u1 ON cr.performedBy = u1.id
LEFT JOIN Users u2 ON cr.approvedBy = u2.id
WHERE cr.equipmentId = 1 -- Replace with actual equipment ID
ORDER BY cr.calibrationDate DESC;
```

### View Failed Calibrations

```sql
-- Find all failed calibrations requiring attention
SELECT 
    e.equipmentNumber,
    e.name,
    cr.calibrationDate,
    cr.result,
    cr.resultValue,
    cr.findings,
    cr.correctiveAction,
    u.firstName + ' ' + u.lastName AS performedBy
FROM CalibrationRecords cr
INNER JOIN Equipment e ON cr.equipmentId = e.id
LEFT JOIN Users u ON cr.performedBy = u.id
WHERE cr.passed = 0
ORDER BY cr.calibrationDate DESC;
```

### View Inspection History for Equipment

```sql
-- Get complete inspection history for a specific equipment
SELECT 
    ir.id,
    ir.inspectionDate,
    ir.inspectionType,
    ir.result,
    ir.passed,
    ir.severity,
    ir.findings,
    ir.defectsFound,
    u1.firstName + ' ' + u1.lastName AS inspectedBy,
    u2.firstName + ' ' + u2.lastName AS reviewedBy
FROM InspectionRecords ir
LEFT JOIN Users u1 ON ir.inspectedBy = u1.id
LEFT JOIN Users u2 ON ir.reviewedBy = u2.id
WHERE ir.equipmentId = 1 -- Replace with actual equipment ID
ORDER BY ir.inspectionDate DESC;
```

### View Inspections Requiring Follow-up

```sql
-- Find all inspections that require follow-up
SELECT 
    e.equipmentNumber,
    e.name,
    ir.inspectionDate,
    ir.inspectionType,
    ir.result,
    ir.severity,
    ir.followUpDate,
    ir.recommendedAction,
    u.firstName + ' ' + u.lastName AS inspectedBy
FROM InspectionRecords ir
INNER JOIN Equipment e ON ir.equipmentId = e.id
LEFT JOIN Users u ON ir.inspectedBy = u.id
WHERE ir.followUpRequired = 1
    AND (ir.followUpDate IS NULL OR ir.followUpDate >= GETDATE())
ORDER BY ir.severity DESC, ir.followUpDate ASC;
```

### View Service/Maintenance History for Equipment

```sql
-- Get complete service and maintenance history for a specific equipment
SELECT 
    smr.id,
    smr.serviceDate,
    smr.serviceType,
    smr.workOrderNumber,
    smr.priority,
    smr.outcome,
    smr.description,
    smr.workPerformed,
    smr.totalCost,
    smr.downtimeHours,
    u1.firstName + ' ' + u1.lastName AS performedBy,
    u2.firstName + ' ' + u2.lastName AS approvedBy
FROM ServiceMaintenanceRecords smr
LEFT JOIN Users u1 ON smr.performedBy = u1.id
LEFT JOIN Users u2 ON smr.approvedBy = u2.id
WHERE smr.equipmentId = 1 -- Replace with actual equipment ID
ORDER BY smr.serviceDate DESC;
```

### View Maintenance Costs by Equipment

```sql
-- Calculate total maintenance costs per equipment
SELECT 
    e.equipmentNumber,
    e.name,
    e.department,
    COUNT(smr.id) AS maintenanceCount,
    SUM(smr.totalCost) AS totalCost,
    AVG(smr.totalCost) AS avgCostPerMaintenance,
    SUM(smr.downtimeHours) AS totalDowntimeHours
FROM Equipment e
LEFT JOIN ServiceMaintenanceRecords smr ON e.id = smr.equipmentId
WHERE smr.status = 'completed'
    AND smr.serviceDate >= DATEADD(year, -1, GETDATE()) -- Last year
GROUP BY e.id, e.equipmentNumber, e.name, e.department
ORDER BY totalCost DESC;
```

### View Preventive vs Corrective Maintenance

```sql
-- Compare preventive and corrective maintenance by service type
SELECT 
    smr.serviceType,
    COUNT(*) AS recordCount,
    SUM(smr.totalCost) AS totalCost,
    AVG(smr.totalCost) AS avgCost,
    AVG(smr.downtimeHours) AS avgDowntime
FROM ServiceMaintenanceRecords smr
WHERE smr.status = 'completed'
    AND smr.serviceDate >= DATEADD(year, -1, GETDATE())
GROUP BY smr.serviceType
ORDER BY recordCount DESC;
```

### View Unresolved Issues from Service Records

```sql
-- Find service records with unresolved issues
SELECT 
    e.equipmentNumber,
    e.name,
    smr.serviceDate,
    smr.serviceType,
    smr.workOrderNumber,
    smr.problemsIdentified,
    smr.followUpDate,
    smr.recommendations,
    u.firstName + ' ' + u.lastName AS performedBy
FROM ServiceMaintenanceRecords smr
INNER JOIN Equipment e ON smr.equipmentId = e.id
LEFT JOIN Users u ON smr.performedBy = u.id
WHERE smr.issuesResolved = 0
    OR smr.followUpRequired = 1
ORDER BY smr.followUpDate ASC, smr.serviceDate DESC;
```

### View Equipment Compliance Dashboard

```sql
-- Comprehensive compliance status for all equipment
SELECT 
    e.equipmentNumber,
    e.name,
    e.department,
    e.status,
    e.nextCalibrationDate,
    e.nextMaintenanceDate,
    -- Latest calibration
    (SELECT TOP 1 result 
     FROM CalibrationRecords 
     WHERE equipmentId = e.id 
     ORDER BY calibrationDate DESC) AS lastCalibrationResult,
    -- Latest inspection
    (SELECT TOP 1 result 
     FROM InspectionRecords 
     WHERE equipmentId = e.id 
     ORDER BY inspectionDate DESC) AS lastInspectionResult,
    -- Pending follow-ups
    (SELECT COUNT(*) 
     FROM InspectionRecords 
     WHERE equipmentId = e.id 
     AND followUpRequired = 1) AS pendingInspectionFollowups,
    (SELECT COUNT(*) 
     FROM ServiceMaintenanceRecords 
     WHERE equipmentId = e.id 
     AND issuesResolved = 0) AS pendingMaintenanceIssues
FROM Equipment e
WHERE e.status != 'out_of_service'
ORDER BY e.department, e.name;
```

### View Audit Trail for Specific Entity

```sql
-- Get complete audit history for a specific entity (e.g., Document ID 5)
SELECT 
    al.id,
    al.timestamp,
    al.userName,
    al.userEmail,
    al.action,
    al.actionDescription,
    al.changedFields,
    al.oldValues,
    al.newValues,
    al.success,
    al.ipAddress
FROM AuditLog al
WHERE al.entityType = 'Document' 
    AND al.entityId = 5
ORDER BY al.timestamp DESC;
```

### View Recent User Activity

```sql
-- View all actions performed by a specific user in the last 30 days
SELECT 
    al.timestamp,
    al.action,
    al.actionCategory,
    al.actionDescription,
    al.entityType,
    al.entityIdentifier,
    al.success,
    al.ipAddress
FROM AuditLog al
WHERE al.userId = 1 -- Replace with actual user ID
    AND al.timestamp >= DATEADD(day, -30, GETDATE())
ORDER BY al.timestamp DESC;
```

### View Failed Actions for Security Monitoring

```sql
-- Find all failed actions for security analysis
SELECT 
    al.timestamp,
    al.userName,
    al.userEmail,
    al.action,
    al.actionCategory,
    al.entityType,
    al.errorMessage,
    al.ipAddress,
    al.requestUrl
FROM AuditLog al
WHERE al.success = 0
    AND al.timestamp >= DATEADD(day, -7, GETDATE())
ORDER BY al.timestamp DESC;
```

### View Login Activity

```sql
-- Track user login activity and patterns
SELECT 
    al.timestamp,
    al.userName,
    al.userEmail,
    al.success,
    al.ipAddress,
    al.userAgent,
    al.errorMessage
FROM AuditLog al
WHERE al.action IN ('login', 'logout', 'login_failed')
    AND al.timestamp >= DATEADD(day, -30, GETDATE())
ORDER BY al.timestamp DESC;
```

### View Changes to Specific Fields

```sql
-- Find all instances where specific fields were changed
SELECT 
    al.timestamp,
    al.userName,
    al.entityType,
    al.entityIdentifier,
    al.changedFields,
    al.oldValues,
    al.newValues
FROM AuditLog al
WHERE al.changedFields LIKE '%status%' -- Find status changes
    AND al.timestamp >= DATEADD(day, -90, GETDATE())
ORDER BY al.timestamp DESC;
```

### View Audit Activity by Action Category

```sql
-- Summarize audit activity by action category
SELECT 
    al.actionCategory,
    COUNT(*) AS totalActions,
    SUM(CASE WHEN al.success = 1 THEN 1 ELSE 0 END) AS successfulActions,
    SUM(CASE WHEN al.success = 0 THEN 1 ELSE 0 END) AS failedActions,
    COUNT(DISTINCT al.userId) AS uniqueUsers,
    MIN(al.timestamp) AS firstAction,
    MAX(al.timestamp) AS lastAction
FROM AuditLog al
WHERE al.timestamp >= DATEADD(day, -30, GETDATE())
GROUP BY al.actionCategory
ORDER BY totalActions DESC;
```

### View User Session Activity

```sql
-- View all actions in a specific user session
SELECT 
    al.timestamp,
    al.action,
    al.actionDescription,
    al.entityType,
    al.entityIdentifier,
    al.success,
    al.requestUrl
FROM AuditLog al
WHERE al.sessionId = 'session-xyz-123' -- Replace with actual session ID
ORDER BY al.timestamp ASC;
```

### View Entity Change History with User Details

```sql
-- Get detailed change history for entities with user information
SELECT 
    al.timestamp,
    al.userName + ' (' + al.userEmail + ')' AS user,
    al.action,
    al.entityType,
    al.entityIdentifier,
    al.changedFields,
    al.actionDescription
FROM AuditLog al
WHERE al.entityType IN ('Document', 'NCR', 'CAPA', 'Equipment')
    AND al.action IN ('create', 'update', 'delete')
    AND al.timestamp >= DATEADD(day, -7, GETDATE())
ORDER BY al.timestamp DESC;
```

### List All Training Events

```sql
-- View all training events with filtering options
SELECT 
    t.id,
    t.trainingNumber,
    t.title,
    t.category,
    t.trainingType,
    t.status,
    t.scheduledDate,
    t.completedDate,
    t.duration,
    t.instructor,
    t.requiresCertification,
    t.expiryMonths,
    u.firstName + ' ' + u.lastName AS createdByName
FROM Trainings t
LEFT JOIN Users u ON t.createdBy = u.id
WHERE t.status IN ('scheduled', 'completed')
ORDER BY t.scheduledDate DESC;
```

### Find Upcoming Training Events

```sql
-- Training events scheduled in the next 30 days
SELECT 
    t.trainingNumber,
    t.title,
    t.category,
    t.scheduledDate,
    t.duration,
    t.instructor,
    t.location,
    COUNT(ta.id) AS registeredAttendees,
    t.maxAttendees
FROM Trainings t
LEFT JOIN TrainingAttendees ta ON t.id = ta.trainingId AND ta.status IN ('registered', 'attended')
WHERE t.status = 'scheduled'
    AND t.scheduledDate BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
GROUP BY t.id, t.trainingNumber, t.title, t.category, t.scheduledDate, 
         t.duration, t.instructor, t.location, t.maxAttendees
ORDER BY t.scheduledDate ASC;
```

### View Training Attendance for a Specific Training

```sql
-- Get all attendees for a training event
SELECT 
    u.firstName + ' ' + u.lastName AS attendeeName,
    u.email,
    ta.status,
    ta.attended,
    ta.attendanceDate,
    ta.score,
    ta.passed,
    ta.certificateIssued,
    ta.certificateNumber,
    ta.certificateDate,
    ta.expiryDate,
    verifier.firstName + ' ' + verifier.lastName AS verifiedBy
FROM TrainingAttendees ta
INNER JOIN Users u ON ta.userId = u.id
LEFT JOIN Users verifier ON ta.verifiedBy = verifier.id
WHERE ta.trainingId = 1 -- Replace with actual training ID
ORDER BY u.lastName, u.firstName;
```

### Find Users with Expiring Certificates

```sql
-- Certificates expiring in the next 60 days
SELECT 
    u.firstName + ' ' + u.lastName AS userName,
    u.email,
    u.department,
    t.title AS trainingTitle,
    ta.certificateNumber,
    ta.certificateDate,
    ta.expiryDate,
    DATEDIFF(day, GETDATE(), ta.expiryDate) AS daysUntilExpiry
FROM TrainingAttendees ta
INNER JOIN Users u ON ta.userId = u.id
INNER JOIN Trainings t ON ta.trainingId = t.id
WHERE ta.certificateIssued = 1
    AND ta.expiryDate IS NOT NULL
    AND ta.expiryDate BETWEEN GETDATE() AND DATEADD(day, 60, GETDATE())
    AND ta.status != 'expired'
ORDER BY ta.expiryDate ASC;
```

### View Training History for a User

```sql
-- Get complete training history for a specific user
SELECT 
    t.trainingNumber,
    t.title,
    t.category,
    t.scheduledDate,
    ta.attendanceDate,
    ta.status,
    ta.attended,
    ta.score,
    ta.passed,
    ta.certificateIssued,
    ta.certificateNumber,
    ta.expiryDate,
    CASE 
        WHEN ta.expiryDate IS NULL THEN 'No Expiry'
        WHEN ta.expiryDate < GETDATE() THEN 'Expired'
        WHEN ta.expiryDate < DATEADD(day, 30, GETDATE()) THEN 'Expiring Soon'
        ELSE 'Valid'
    END AS certificateStatus
FROM TrainingAttendees ta
INNER JOIN Trainings t ON ta.trainingId = t.id
WHERE ta.userId = 1 -- Replace with actual user ID
ORDER BY t.scheduledDate DESC;
```

### View User Competencies Dashboard

```sql
-- Comprehensive view of user's training and certificates
SELECT 
    u.id AS userId,
    u.firstName + ' ' + u.lastName AS userName,
    u.email,
    u.department,
    COUNT(DISTINCT ta.trainingId) AS totalTrainings,
    COUNT(DISTINCT CASE WHEN ta.attended = 1 THEN ta.trainingId END) AS attendedTrainings,
    COUNT(DISTINCT CASE WHEN ta.certificateIssued = 1 THEN ta.id END) AS certificatesIssued,
    COUNT(DISTINCT CASE WHEN ta.certificateIssued = 1 AND ta.expiryDate < GETDATE() THEN ta.id END) AS expiredCertificates,
    COUNT(DISTINCT CASE WHEN ta.certificateIssued = 1 AND ta.expiryDate BETWEEN GETDATE() AND DATEADD(day, 60, GETDATE()) THEN ta.id END) AS expiringCertificates
FROM Users u
LEFT JOIN TrainingAttendees ta ON u.id = ta.userId
WHERE u.active = 1
GROUP BY u.id, u.firstName, u.lastName, u.email, u.department
ORDER BY u.lastName, u.firstName;
```

### View Training Certificates by User

```sql
-- Get all training certificates for a specific user
SELECT 
    tc.certificateNumber,
    tc.certificateName,
    tc.certificateType,
    tc.competencyArea,
    tc.level,
    tc.issuerName,
    tc.issueDate,
    tc.expiryDate,
    tc.status,
    tc.requiresRenewal,
    tc.nextRenewalDate,
    tc.verified,
    tc.regulatoryRequirement,
    t.title AS trainingTitle
FROM TrainingCertificates tc
LEFT JOIN Trainings t ON tc.trainingId = t.id
WHERE tc.userId = 1 -- Replace with actual user ID
ORDER BY tc.issueDate DESC;
```

### Find Certificates Requiring Renewal

```sql
-- Certificates requiring renewal in the next 90 days
SELECT 
    u.firstName + ' ' + u.lastName AS userName,
    u.email,
    tc.certificateNumber,
    tc.certificateName,
    tc.competencyArea,
    tc.nextRenewalDate,
    DATEDIFF(day, GETDATE(), tc.nextRenewalDate) AS daysUntilRenewal,
    tc.issuerName,
    tc.regulatoryRequirement
FROM TrainingCertificates tc
INNER JOIN Users u ON tc.userId = u.id
WHERE tc.requiresRenewal = 1
    AND tc.status = 'active'
    AND tc.nextRenewalDate IS NOT NULL
    AND tc.nextRenewalDate <= DATEADD(day, 90, GETDATE())
ORDER BY tc.nextRenewalDate ASC;
```

### View Training Completion Statistics by Category

```sql
-- Training completion statistics grouped by category
SELECT 
    t.category,
    COUNT(DISTINCT t.id) AS totalTrainings,
    COUNT(DISTINCT ta.userId) AS totalAttendees,
    COUNT(DISTINCT CASE WHEN ta.attended = 1 THEN ta.id END) AS attendedCount,
    COUNT(DISTINCT CASE WHEN ta.certificateIssued = 1 THEN ta.id END) AS certificatesIssued,
    AVG(CASE WHEN ta.score IS NOT NULL THEN ta.score END) AS averageScore,
    COUNT(DISTINCT CASE WHEN ta.passed = 1 THEN ta.id END) AS passedCount,
    COUNT(DISTINCT CASE WHEN ta.passed = 0 THEN ta.id END) AS failedCount
FROM Trainings t
LEFT JOIN TrainingAttendees ta ON t.id = ta.trainingId
WHERE t.status = 'completed'
    AND t.completedDate >= DATEADD(year, -1, GETDATE())
GROUP BY t.category
ORDER BY totalTrainings DESC;
```

### Find Users Missing Required Training

```sql
-- Example: Find users in a department who haven't completed required training
-- Modify the training categories and department as needed
SELECT 
    u.id,
    u.firstName + ' ' + u.lastName AS userName,
    u.email,
    u.department,
    t.title AS missingTraining,
    t.category
FROM Users u
CROSS JOIN Trainings t
LEFT JOIN TrainingAttendees ta ON u.id = ta.userId AND t.id = ta.trainingId AND ta.attended = 1
WHERE u.active = 1
    AND u.department = 'Quality Assurance' -- Replace with target department
    AND t.category IN ('Safety', 'Quality', 'Compliance') -- Required categories
    AND t.status = 'completed'
    AND ta.id IS NULL -- User has not attended this training
ORDER BY u.lastName, u.firstName, t.category;
```

### View External Certificates by Type

```sql
-- View all external certifications by type
SELECT 
    tc.certificateType,
    tc.competencyArea,
    COUNT(*) AS totalCertificates,
    COUNT(DISTINCT tc.userId) AS uniqueUsers,
    COUNT(CASE WHEN tc.status = 'active' THEN 1 END) AS activeCertificates,
    COUNT(CASE WHEN tc.status = 'expired' THEN 1 END) AS expiredCertificates,
    AVG(DATEDIFF(month, tc.issueDate, tc.expiryDate)) AS avgValidityMonths
FROM TrainingCertificates tc
WHERE tc.certificateType IN ('External', 'Professional', 'Regulatory')
GROUP BY tc.certificateType, tc.competencyArea
ORDER BY tc.certificateType, totalCertificates DESC;
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
