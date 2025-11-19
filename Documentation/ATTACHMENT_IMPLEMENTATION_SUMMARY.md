# File Attachments Implementation Summary

## Overview

This document summarizes the implementation of the file attachments handling system for the E-QMS application, addressing issue **P2:1:3 — File attachments handling**.

## Objective

Add backend support for uploading and linking file attachments (e.g., certificates, inspection reports) with secure storage paths and ensure files are tied to specific records in compliance with ISO 9001 requirements.

## Implementation Details

### 1. Database Layer

#### Attachments Table (`backend/database/schemas/08_Attachments.sql`)

Created a new table to store attachment metadata with the following key features:

- **Polymorphic Relationships**: Single table supports attachments for multiple entity types
- **Entity Types Supported**: 
  - equipment
  - document
  - calibration
  - inspection
  - service_maintenance
  - training
  - ncr (Non-Conformance Reports)
  - capa (Corrective and Preventive Actions)
  - audit

- **Key Fields**:
  - File metadata (name, stored name, path, size, MIME type, extension)
  - Entity association (type and ID)
  - Descriptive metadata (description, category, version)
  - Security (uploadedBy, isPublic flag)
  - Audit trail (createdAt, updatedAt, deletedAt, deletedBy)
  - Soft delete support (active flag)

- **Constraints**:
  - File size limit: 10MB maximum
  - Valid entity types enforced
  - Foreign key constraints to Users table

- **Indexes**: 11 indexes for optimal query performance on common access patterns

### 2. Backend Models

#### AttachmentModel (`backend/src/models/AttachmentModel.ts`)

Comprehensive model with full CRUD operations:

- **Methods**:
  - `create()` - Insert new attachment record
  - `findById()` - Get attachment by ID
  - `findAll()` - Get all attachments with filters
  - `findByEntity()` - Get attachments for specific entity
  - `update()` - Update attachment metadata
  - `softDelete()` - Mark attachment as inactive
  - `hardDelete()` - Permanently remove attachment
  - `countByEntity()` - Count attachments for entity

- **Features**:
  - Type-safe interfaces with TypeScript
  - Flexible filtering (entity type, entity ID, category, uploader, active status)
  - Proper SQL parameterization to prevent injection
  - Returns active attachments by default

### 3. Upload Middleware Enhancement

#### Enhanced Upload Middleware (`backend/src/middleware/upload.ts`)

Improved the existing upload middleware to support attachment management:

- **Entity-Specific Directories**: Files organized by entity type in separate folders
- **Unique Filenames**: Timestamp + random number prevents overwrites
- **Safe Filename Handling**: Sanitizes filenames to prevent path traversal
- **File Type Validation**: Allows only approved document and image types
- **Size Limits**: 10MB per file, 10 files maximum for multiple uploads
- **Backward Compatibility**: Maintains support for legacy document uploads

### 4. Controllers

#### AttachmentController (`backend/src/controllers/attachmentController.ts`)

Eight endpoint handlers with comprehensive error handling:

1. **uploadAttachment** - Single file upload
2. **uploadMultipleAttachments** - Batch upload (max 10 files)
3. **getAttachments** - List with pagination and filters
4. **getAttachmentById** - Get metadata by ID
5. **downloadAttachment** - Stream file download
6. **updateAttachment** - Update metadata only
7. **deleteAttachment** - Soft delete with authorization check
8. **getAttachmentsByEntity** - Get all attachments for an entity

**Key Features**:
- Input validation using express-validator
- Automatic file cleanup on errors
- Streaming for efficient file downloads
- Proper HTTP status codes
- Detailed error messages

### 5. Routes

#### Attachment Routes (`backend/src/routes/attachmentRoutes.ts`)

RESTful API endpoints with proper security:

```
POST   /api/attachments              - Upload single file
POST   /api/attachments/multiple     - Upload multiple files
GET    /api/attachments              - List attachments (filtered)
GET    /api/attachments/entity/:type/:id - Get by entity
GET    /api/attachments/:id          - Get metadata
GET    /api/attachments/:id/download - Download file
PUT    /api/attachments/:id          - Update metadata
DELETE /api/attachments/:id          - Delete (ADMIN/MANAGER only)
```

**Security**:
- All routes require JWT authentication
- Rate limiting on upload endpoints
- RBAC for delete operations (ADMIN/MANAGER roles only)
- Input validation on all endpoints

### 6. Validators

#### Attachment Validators (`backend/src/utils/validators.ts`)

Added two validator sets:

1. **validateAttachmentUpload**:
   - Entity type validation (must be valid type)
   - Entity ID validation (positive integer)
   - Description length check (max 500 chars)
   - Category length check (max 100 chars)
   - Version length check (max 50 chars)
   - isPublic boolean validation

2. **validateAttachmentUpdate**:
   - Optional field validation for metadata updates
   - Same constraints as upload for provided fields

### 7. Testing

#### Model Tests (`backend/src/__tests__/models/AttachmentModel.test.ts`)

14 unit tests covering:
- Create operation
- Find by ID (with and without results)
- Find all with various filters
- Find by entity
- Update metadata (success and failure cases)
- Soft delete
- Hard delete
- Count by entity

#### Controller Tests (`backend/src/__tests__/controllers/attachmentController.test.ts`)

11 unit tests covering:
- Upload single file (success, no auth, no file, validation errors)
- Get attachments with pagination
- Invalid pagination parameters
- Get by ID (found and not found)
- Get by entity (success and validation errors)

**Test Results**:
- ✅ 25/25 tests passing
- ✅ Zero TypeScript compilation errors
- ✅ Linting compliant
- ✅ No security vulnerabilities (CodeQL)

### 8. Documentation

#### API Documentation (`backend/ATTACHMENT_API_DOCUMENTATION.md`)

Comprehensive documentation including:
- Endpoint descriptions with examples
- Request/response formats
- Authentication requirements
- Error handling
- Security considerations
- ISO 9001 compliance notes

## File Storage Structure

```
uploads/
├── equipment/           # Equipment-related files
├── document/           # Document attachments
├── calibration/        # Calibration certificates, reports
├── inspection/         # Inspection reports, photos
├── service_maintenance/# Service records, invoices
├── training/           # Training materials, certificates
├── ncr/               # NCR supporting documents
├── capa/              # CAPA supporting documents
└── audit/             # Audit reports, evidence
```

Files are renamed with format: `{original-name}-{timestamp}-{random}.{ext}`

## Security Features

1. **Authentication**: JWT token required for all endpoints
2. **Authorization**: RBAC with role-based access (ADMIN/MANAGER for deletes)
3. **File Type Validation**: Only approved types (PDF, Office docs, images)
4. **Size Limits**: Maximum 10MB per file
5. **Filename Safety**: Sanitized to prevent path traversal attacks
6. **Soft Delete**: Preserves files and audit trail
7. **Input Validation**: Comprehensive validation on all inputs
8. **Rate Limiting**: Prevents abuse of upload endpoints
9. **SQL Injection Prevention**: Parameterized queries throughout

## ISO 9001 Compliance

The implementation supports ISO 9001 requirements through:

1. **Traceability**: 
   - Every attachment linked to specific entity
   - Full audit trail (who uploaded, when, any changes)
   - Soft delete preserves historical records

2. **Version Control**:
   - Version field supports document versioning
   - Multiple versions can be linked to same entity

3. **Access Control**:
   - Role-based permissions ensure proper authorization
   - Public/private flag for sensitive documents

4. **Document Retention**:
   - Soft delete ensures files retained for required periods
   - Physical files preserved even after database deletion

5. **Metadata Management**:
   - Rich categorization (description, category, version)
   - Searchable and filterable
   - Supports organizational requirements

## Integration Points

The attachment system integrates with existing modules:

- **Equipment Management**: Manuals, photos, maintenance records
- **Calibration Records**: Certificates, calibration reports
- **Inspection Records**: Inspection reports, photos
- **Service Maintenance**: Service reports, invoices, before/after photos
- **Training Management**: Training materials, certificates
- **Document Management**: Supporting documents
- **NCR/CAPA**: Evidence, corrective action documentation
- **Audits**: Audit reports, findings, evidence

## Migration Path

For existing systems with string-based attachment paths:

1. Current systems store file paths as comma-separated strings in entity tables
2. New system provides structured attachment management
3. Both can coexist during transition
4. Migration script can be created to:
   - Parse existing attachment strings
   - Create Attachment records
   - Link to existing entities
   - Preserve audit information

## Performance Considerations

1. **Database Indexes**: 11 indexes optimize common queries
2. **File Streaming**: Large files streamed rather than loaded in memory
3. **Pagination**: Prevents large result sets
4. **Efficient Filtering**: Index-backed filters for fast queries
5. **Async File Operations**: Non-blocking I/O for uploads/downloads

## Future Enhancements

Potential improvements not included in this implementation:

1. **Virus Scanning**: Integration with antivirus service
2. **Cloud Storage**: S3/Azure Blob Storage integration
3. **Thumbnails**: Automatic thumbnail generation for images
4. **OCR**: Text extraction from scanned documents
5. **Document Preview**: In-browser preview capabilities
6. **Bulk Operations**: Bulk delete, update, download
7. **Search**: Full-text search in file contents
8. **Compression**: Automatic compression for large files
9. **Watermarking**: Add watermarks to sensitive documents
10. **Expiration**: Auto-deletion after retention period

## Testing Summary

### Unit Tests
- **Model Tests**: 14 tests, 100% passing
- **Controller Tests**: 11 tests, 100% passing
- **Total**: 25 tests, 0 failures

### Build & Linting
- ✅ TypeScript compilation successful
- ✅ ESLint passing (only pre-existing issues in other files)
- ✅ No new warnings or errors

### Security
- ✅ CodeQL scan: 0 vulnerabilities found
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention verified
- ✅ File path traversal prevention verified

## Deployment Notes

### Prerequisites
- Node.js v18+
- MSSQL database
- Write permissions to uploads directory

### Database Setup
Run the schema script:
```sql
:r .\backend\database\schemas\08_Attachments.sql
```

### Environment Variables
No new environment variables required. Uses existing:
- Database connection settings
- JWT secret for authentication

### File System
Ensure the application has write permissions to:
```
/path/to/application/uploads/
```

### First Deployment
1. Run database migration script
2. Build backend: `npm run build`
3. Start server: `npm start`
4. Verify uploads directory created
5. Test upload endpoint with sample file

## Conclusion

The file attachments handling system has been successfully implemented with:

- ✅ Complete backend infrastructure
- ✅ Secure file storage and management
- ✅ Comprehensive testing (25/25 tests passing)
- ✅ Full API documentation
- ✅ ISO 9001 compliance support
- ✅ Zero security vulnerabilities
- ✅ Production-ready code

The implementation provides a robust, secure, and scalable foundation for file attachment management across all E-QMS modules, with full audit trail support and ISO 9001 compliance features.

## Files Changed

### New Files
1. `backend/database/schemas/08_Attachments.sql` - Database schema
2. `backend/src/models/AttachmentModel.ts` - Data model
3. `backend/src/controllers/attachmentController.ts` - Business logic
4. `backend/src/routes/attachmentRoutes.ts` - API routes
5. `backend/src/__tests__/models/AttachmentModel.test.ts` - Model tests
6. `backend/src/__tests__/controllers/attachmentController.test.ts` - Controller tests
7. `backend/ATTACHMENT_API_DOCUMENTATION.md` - API documentation
8. `ATTACHMENT_IMPLEMENTATION_SUMMARY.md` - This document

### Modified Files
1. `backend/src/index.ts` - Registered attachment routes
2. `backend/src/middleware/upload.ts` - Enhanced for entity-specific uploads
3. `backend/src/utils/validators.ts` - Added attachment validators

### Total Impact
- **Lines Added**: ~1,850
- **Lines Modified**: ~50
- **Files Created**: 8
- **Files Modified**: 3
- **Tests Added**: 25
