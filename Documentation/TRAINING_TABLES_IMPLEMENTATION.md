# Training Tables Implementation Summary

## Overview

This document summarizes the implementation of training management tables for the E-QMS (Electronic Quality Management System). The implementation supports ISO 9001:2015 competence management requirements including training events, attendance tracking, and certificate lifecycle management.

## Created Database Tables

### 1. Attachments Table (Script 20)
**File:** `backend/database/20_create_attachments_table.sql`

Polymorphic file attachment storage supporting multiple entity types including training certificates.

**Key Features:**
- Stores file metadata (name, size, MIME type, path)
- Links to any entity via entityType/entityId pattern
- Supports 'training' and 'training_certificate' entity types
- 10MB file size limit enforced at database level
- Soft delete capability with audit trail
- Security controls via isPublic flag

**Entity Types Supported:**
- equipment, document, calibration, inspection
- service_maintenance, training, training_certificate
- ncr, capa, audit

### 2. Trainings Table (Script 21)
**File:** `backend/database/21_create_trainings_table.sql`

Stores training events and sessions metadata.

**Key Features:**
- Unique training number identification
- Category and type classification
- Scheduling with status tracking
- Instructor and location details
- Certificate requirement flags
- Expiry period configuration (in months)
- Maximum attendee capacity
- Prerequisite training support (self-referential)
- Learning objectives and materials references

**Status Values:**
- scheduled, completed, cancelled, expired

### 3. TrainingAttendees Table (Script 22)
**File:** `backend/database/22_create_training_attendees_table.sql`

Junction table linking users to training events with attendance and certificate tracking.

**Key Features:**
- Links users to training events
- Attendance tracking with dates
- Performance assessment (score 0-100, pass/fail)
- Certificate issuance tracking
- Certificate number and expiry dates
- Optional link to certificate files in Attachments
- Verification workflow with responsible person
- Unique constraint (one registration per user per training)

**Status Values:**
- registered, attended, completed, failed, expired, cancelled

### 4. TrainingCertificates Table (Script 23)
**File:** `backend/database/23_create_training_certificates_table.sql`

Comprehensive certificate lifecycle management for both internal and external certifications.

**Key Features:**
- Detailed certificate identification and metadata
- Links to user and optionally to training events
- Issuer and accreditation body tracking
- Certificate type classification
- Competency area and level tracking
- Issue, effective, and expiry dates
- Renewal management with intervals
- Status lifecycle tracking
- Verification workflow
- Regulatory requirement flags
- Role-based mandatory assignment

**Certificate Types:**
- Internal, External, Professional, Regulatory
- Safety, Technical, Compliance

**Status Values:**
- active, expired, suspended, revoked, renewed

## Table Relationships

```
Users ──┬─ creates ──> Trainings
        │
        ├─ attends ──> TrainingAttendees ──> links to ──> Trainings
        │                     │
        │                     └──> optional ref ──> Attachments
        │
        └─ holds ───> TrainingCertificates ──> optional ref ──> Trainings
                              │                       │
                              └──> optional ref ──> TrainingAttendees
                              │
                              └──> optional ref ──> Attachments

Trainings ──> can reference ──> Trainings (prerequisite)
```

## Database Indexes

Each table includes comprehensive indexing for optimal performance:

### Attachments (18+ indexes)
- Entity type and ID lookups
- User tracking (uploaded/deleted by)
- File name and category searches
- Status and date filtering
- Composite indexes for common queries

### Trainings (22+ indexes)
- Training number (unique)
- Category and type filtering
- Status tracking
- Date-based queries
- Instructor and location searches
- Prerequisite relationships

### TrainingAttendees (30+ indexes)
- Training and user lookups
- Status and attendance tracking
- Certificate tracking and expiry
- Verification workflow
- Composite indexes for user/training queries

### TrainingCertificates (38+ indexes)
- Certificate number (unique)
- User and relationship lookups
- Status and type filtering
- Date-based queries (issue, expiry, renewal)
- Verification tracking
- Issuer and competency searches
- Compliance and regulatory tracking

## Deployment Instructions

### Prerequisites
- Microsoft SQL Server 2016 or higher
- Database 'eqms' already created
- Tables 01-19 already created (see backend/database/README.md)

### Installation Steps

1. Execute scripts in numerical order:
   ```sql
   USE eqms;
   GO
   
   -- Script 20: Attachments table (required first)
   :r backend\database\20_create_attachments_table.sql
   GO
   
   -- Script 21: Trainings table
   :r backend\database\21_create_trainings_table.sql
   GO
   
   -- Script 22: TrainingAttendees table
   :r backend\database\22_create_training_attendees_table.sql
   GO
   
   -- Script 23: TrainingCertificates table
   :r backend\database\23_create_training_certificates_table.sql
   GO
   ```

2. Verify installation:
   ```sql
   -- Check tables were created
   SELECT name FROM sys.tables 
   WHERE name IN ('Attachments', 'Trainings', 'TrainingAttendees', 'TrainingCertificates');
   
   -- Check version tracking
   SELECT * FROM DatabaseVersion 
   WHERE version IN ('1.0.20', '1.0.21', '1.0.22', '1.0.23')
   ORDER BY version;
   ```

### Script Features

All scripts are designed to be:
- **Idempotent**: Safe to run multiple times
- **Self-documenting**: Comprehensive inline comments
- **Version-tracked**: Updates DatabaseVersion table
- **Error-resistant**: Checks for existing tables before creation

## ISO 9001:2015 Compliance

The training tables support the following ISO 9001:2015 requirements:

### Clause 7.2 - Competence
- Training event tracking and scheduling
- Attendance records with verification
- Certificate issuance and management
- Competency area documentation

### Clause 7.3 - Awareness
- Training category and type classification
- Learning objectives documentation
- Training materials tracking

### Clause 9.1 - Monitoring and Measurement
- Performance assessment (scores, pass/fail)
- Certificate expiry tracking
- Renewal management
- Compliance monitoring

### General Requirements
- **Traceability**: Unique identifiers throughout
- **Audit Trail**: Complete creation/update tracking
- **Verification**: Approval workflows with responsible persons
- **Records**: Comprehensive data retention
- **Version Control**: DatabaseVersion tracking

## Use Cases

### 1. Internal Training Management
- Schedule training sessions
- Register attendees
- Track attendance and completion
- Issue certificates with expiry dates
- Monitor upcoming renewals

### 2. External Certification Tracking
- Record externally obtained certificates
- Track regulatory certifications
- Monitor expiry and renewal dates
- Verify certificate authenticity
- Link to uploaded certificate files

### 3. Competency Management
- Track competencies by area
- Monitor proficiency levels
- Identify training gaps
- Ensure role-based certification compliance
- Generate competency matrices

### 4. Compliance Reporting
- List users by certification status
- Find expiring certificates
- Track regulatory requirements
- Generate training completion reports
- Audit training records

## Database Queries

The implementation includes 11 maintenance queries in the README:

1. List All Training Events
2. Find Upcoming Training Events
3. View Training Attendance
4. Find Users with Expiring Certificates
5. View Training History for a User
6. View User Competencies Dashboard
7. View Training Certificates by User
8. Find Certificates Requiring Renewal
9. View Training Completion Statistics
10. Find Users Missing Required Training
11. View External Certificates by Type

See `backend/database/README.md` for complete query implementations.

## Integration Notes

### Existing Application Code

The following files already exist in the application:
- `backend/src/models/TrainingModel.ts` - Basic model implementation
- `backend/src/controllers/trainingController.ts` - API endpoints
- `backend/src/routes/trainingRoutes.ts` - Route definitions
- `backend/src/types/index.ts` - TypeScript interfaces and enums

These files may need updates to fully utilize the new schema features, particularly:
- TrainingCertificates support
- Attachment linking
- Verification workflows
- Extended metadata fields

### Future Enhancements

Potential areas for enhancement:
1. Training calendar and scheduling interface
2. Certificate upload and management UI
3. Email notifications for expiring certificates
4. Training matrix reports
5. Competency gap analysis
6. Integration with HR systems
7. Mobile app for certificate viewing
8. QR code generation for certificates

## Security Considerations

### Data Protection
- User foreign keys ensure data ownership
- Soft delete prevents accidental data loss
- Audit trail tracks all changes
- File access controlled via isPublic flag

### Input Validation
- Check constraints validate status values
- Score ranges enforced (0-100)
- File size limits (10MB)
- Required field constraints

### Access Control
- RBAC integration via Users table
- CreatedBy/UploadedBy tracking
- VerifiedBy approval workflow
- Role-based certificate requirements

## Performance Optimization

### Indexing Strategy
- Comprehensive indexes on all tables
- Composite indexes for common query patterns
- Filtered indexes for active records
- Unique indexes on business keys

### Query Optimization
- Foreign key indexes for join performance
- Date-based indexes for temporal queries
- Status indexes for filtering
- Composite indexes for complex searches

## Maintenance

### Regular Tasks
1. Monitor certificate expiry dates
2. Archive old training records
3. Update DatabaseVersion after changes
4. Backup Attachments file storage
5. Review and optimize indexes

### Monitoring Queries
```sql
-- Check storage usage
SELECT 
    t.name AS TableName,
    SUM(p.rows) AS RowCount,
    SUM(a.total_pages) * 8 AS TotalSpaceKB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.name IN ('Trainings', 'TrainingAttendees', 'TrainingCertificates', 'Attachments')
GROUP BY t.name;

-- Check index usage
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) IN ('Trainings', 'TrainingAttendees', 'TrainingCertificates', 'Attachments')
ORDER BY TableName, IndexName;
```

## Testing Recommendations

### Unit Tests
1. Test table creation scripts individually
2. Verify foreign key constraints
3. Test check constraints with invalid data
4. Validate default values
5. Test unique constraints

### Integration Tests
1. Create training with prerequisites
2. Register attendees and track attendance
3. Issue certificates with expiry
4. Upload certificate files
5. Test renewal workflows

### Performance Tests
1. Load test with large datasets
2. Query performance benchmarks
3. Index effectiveness analysis
4. Concurrent update handling

## Support and Documentation

- **Database README**: `backend/database/README.md`
- **API Documentation**: Update needed for new endpoints
- **User Guide**: Create training management guide
- **Admin Guide**: Certificate lifecycle management

## Version History

- **v1.0.20** - Attachments table created
- **v1.0.21** - Trainings table created
- **v1.0.22** - TrainingAttendees table created
- **v1.0.23** - TrainingCertificates table created

All changes tracked in DatabaseVersion table.

## Contact

For questions or issues regarding this implementation, please refer to the project repository issue tracker.
