# Attachment API Documentation

## Overview

The Attachment API provides endpoints for managing file attachments linked to various entities in the E-QMS system. Attachments can be associated with equipment, documents, calibration records, inspection records, training sessions, and other quality management entities.

## Authentication

All attachment endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
/api/attachments
```

## Entity Types

Attachments can be linked to the following entity types:

- `equipment` - Equipment records
- `document` - Documents
- `calibration` - Calibration records
- `inspection` - Inspection records
- `service_maintenance` - Service and maintenance records
- `training` - Training sessions
- `ncr` - Non-Conformance Reports
- `capa` - Corrective and Preventive Actions
- `audit` - Audit records

## File Restrictions

- **Maximum file size**: 10 MB
- **Allowed file types**:
  - Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), Text (.txt)
  - Images: JPEG, PNG, GIF, WebP, BMP
- **Maximum files per upload**: 10 (for multiple upload endpoint)

## Endpoints

### 1. Upload Single Attachment

Upload a single file attachment linked to an entity.

**Endpoint**: `POST /api/attachments`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (file, required): The file to upload
- `entityType` (string, required): Type of entity (see Entity Types above)
- `entityId` (number, required): ID of the entity
- `description` (string, optional): Description of the attachment (max 500 chars)
- `category` (string, optional): Category of the attachment (e.g., 'certificate', 'report', 'photo')
- `version` (string, optional): Version number if applicable (max 50 chars)
- `isPublic` (boolean, optional): Whether the file is publicly accessible (default: false)

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/attachments \
  -H "Authorization: Bearer <token>" \
  -F "file=@certificate.pdf" \
  -F "entityType=calibration" \
  -F "entityId=123" \
  -F "description=Annual calibration certificate" \
  -F "category=certificate" \
  -F "isPublic=false"
```

**Success Response** (201 Created):
```json
{
  "message": "Attachment uploaded successfully",
  "id": 1,
  "fileName": "certificate.pdf",
  "fileSize": 1024000
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input, missing required fields, or invalid file type
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error during upload

---

### 2. Upload Multiple Attachments

Upload multiple file attachments at once, all linked to the same entity.

**Endpoint**: `POST /api/attachments/multiple`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Request Body**:
- `files` (files, required): Array of files to upload (max 10)
- `entityType` (string, required): Type of entity
- `entityId` (number, required): ID of the entity
- `description` (string, optional): Description applied to all attachments
- `category` (string, optional): Category applied to all attachments
- `version` (string, optional): Version applied to all attachments
- `isPublic` (boolean, optional): Public flag applied to all attachments

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/attachments/multiple \
  -H "Authorization: Bearer <token>" \
  -F "files=@report1.pdf" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "entityType=inspection" \
  -F "entityId=456" \
  -F "category=report"
```

**Success Response** (201 Created):
```json
{
  "message": "3 attachment(s) uploaded successfully",
  "attachments": [
    {
      "id": 1,
      "fileName": "report1.pdf",
      "fileSize": 2048000
    },
    {
      "id": 2,
      "fileName": "photo1.jpg",
      "fileSize": 512000
    },
    {
      "id": 3,
      "fileName": "photo2.jpg",
      "fileSize": 487000
    }
  ]
}
```

---

### 3. Get All Attachments (with filters)

Retrieve a paginated list of attachments with optional filters.

**Endpoint**: `GET /api/attachments`

**Authentication**: Required

**Query Parameters**:
- `entityType` (string, optional): Filter by entity type
- `entityId` (number, optional): Filter by entity ID
- `category` (string, optional): Filter by category
- `uploadedBy` (number, optional): Filter by uploader user ID
- `page` (number, optional): Page number (default: 1, min: 1)
- `limit` (number, optional): Results per page (default: 50, min: 1, max: 100)

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/attachments?entityType=equipment&entityId=10&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "fileName": "manual.pdf",
      "storedFileName": "manual-1234567890.pdf",
      "filePath": "/uploads/equipment/manual-1234567890.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "fileExtension": ".pdf",
      "entityType": "equipment",
      "entityId": 10,
      "description": "Equipment manual",
      "category": "manual",
      "version": "1.0",
      "uploadedBy": 5,
      "isPublic": false,
      "active": true,
      "createdAt": "2024-11-16T10:00:00.000Z",
      "updatedAt": "2024-11-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

### 4. Get Attachments by Entity

Retrieve all attachments for a specific entity.

**Endpoint**: `GET /api/attachments/entity/:entityType/:entityId`

**Authentication**: Required

**Path Parameters**:
- `entityType` (string, required): Type of entity
- `entityId` (number, required): ID of the entity

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/attachments/entity/calibration/123" \
  -H "Authorization: Bearer <token>"
```

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "fileName": "certificate.pdf",
      "storedFileName": "certificate-1234567890.pdf",
      "fileSize": 512000,
      "mimeType": "application/pdf",
      "category": "certificate",
      "createdAt": "2024-11-16T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Get Attachment by ID

Retrieve metadata for a specific attachment.

**Endpoint**: `GET /api/attachments/:id`

**Authentication**: Required

**Path Parameters**:
- `id` (number, required): Attachment ID

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/attachments/1" \
  -H "Authorization: Bearer <token>"
```

**Success Response** (200 OK):
```json
{
  "id": 1,
  "fileName": "certificate.pdf",
  "storedFileName": "certificate-1234567890.pdf",
  "filePath": "/uploads/calibration/certificate-1234567890.pdf",
  "fileSize": 512000,
  "mimeType": "application/pdf",
  "fileExtension": ".pdf",
  "entityType": "calibration",
  "entityId": 123,
  "description": "Calibration certificate",
  "category": "certificate",
  "version": "1.0",
  "uploadedBy": 5,
  "isPublic": false,
  "active": true,
  "createdAt": "2024-11-16T10:00:00.000Z",
  "updatedAt": "2024-11-16T10:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Attachment does not exist

---

### 6. Download Attachment

Download the actual file of an attachment.

**Endpoint**: `GET /api/attachments/:id/download`

**Authentication**: Required

**Path Parameters**:
- `id` (number, required): Attachment ID

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/attachments/1/download" \
  -H "Authorization: Bearer <token>" \
  --output downloaded-file.pdf
```

**Success Response** (200 OK):
- Returns the file with appropriate headers:
  - `Content-Type`: File MIME type
  - `Content-Length`: File size
  - `Content-Disposition`: `attachment; filename="original-filename.pdf"`

**Error Responses**:
- `404 Not Found`: Attachment or file does not exist
- `500 Internal Server Error`: Error reading file

---

### 7. Update Attachment Metadata

Update metadata for an existing attachment (file itself cannot be changed).

**Endpoint**: `PUT /api/attachments/:id`

**Authentication**: Required

**Path Parameters**:
- `id` (number, required): Attachment ID

**Request Body** (JSON):
- `description` (string, optional): New description (max 500 chars)
- `category` (string, optional): New category (max 100 chars)
- `version` (string, optional): New version (max 50 chars)
- `isPublic` (boolean, optional): New public flag

**Example Request**:
```bash
curl -X PUT "http://localhost:3000/api/attachments/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated calibration certificate",
    "category": "certificate",
    "version": "2.0"
  }'
```

**Success Response** (200 OK):
```json
{
  "message": "Attachment updated successfully"
}
```

**Error Responses**:
- `404 Not Found`: Attachment does not exist
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Update failed

---

### 8. Delete Attachment

Soft delete an attachment (marks as inactive but retains file and metadata).

**Endpoint**: `DELETE /api/attachments/:id`

**Authentication**: Required

**Authorization**: ADMIN or MANAGER role required

**Path Parameters**:
- `id` (number, required): Attachment ID

**Example Request**:
```bash
curl -X DELETE "http://localhost:3000/api/attachments/1" \
  -H "Authorization: Bearer <token>"
```

**Success Response** (200 OK):
```json
{
  "message": "Attachment deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Attachment does not exist
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Delete failed

---

## Storage Structure

Files are stored in entity-specific directories under the `uploads/` folder:

```
uploads/
├── equipment/
├── document/
├── calibration/
├── inspection/
├── service_maintenance/
├── training/
├── ncr/
├── capa/
└── audit/
```

Files are renamed to include a timestamp and random number to ensure uniqueness and prevent overwrites.

## Security Considerations

1. **File Type Validation**: Only approved file types can be uploaded
2. **Size Limits**: Maximum 10 MB per file
3. **Access Control**: All endpoints require authentication via JWT
4. **Delete Permissions**: Only ADMIN and MANAGER roles can delete attachments
5. **Soft Delete**: Deleted attachments are marked inactive but files are retained for audit purposes
6. **Audit Trail**: All uploads, updates, and deletes are tracked with user ID and timestamp

## ISO 9001 Compliance

The attachment system supports ISO 9001 requirements by:

1. **Traceability**: All attachments are linked to specific records with full audit trail
2. **Version Control**: Supports version tracking for documents
3. **Access Control**: Role-based access ensures proper authorization
4. **Document Retention**: Soft delete preserves files for required retention periods
5. **Metadata**: Rich metadata supports categorization and search

## Error Handling

All endpoints return appropriate HTTP status codes and error messages in JSON format:

```json
{
  "error": "Error message description"
}
```

Or for validation errors:

```json
{
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

## Rate Limiting

Upload endpoints (`POST /api/attachments` and `POST /api/attachments/multiple`) have rate limiting applied to prevent abuse. Excessive requests may result in HTTP 429 (Too Many Requests) responses.
