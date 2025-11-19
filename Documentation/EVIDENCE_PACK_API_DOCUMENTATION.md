# Evidence Pack API Documentation

## Overview

The Evidence Pack API provides functionality to generate comprehensive PDF reports containing quality management system evidence for external auditors. The evidence pack compiles documents, NCRs, CAPAs, training records, audit records, and attachment summaries into a single structured PDF document.

## Endpoints

### 1. Generate Evidence Pack

**Endpoint:** `POST /api/evidence-pack/generate`

**Description:** Generates and downloads a comprehensive PDF evidence pack for external audit purposes.

**Authentication:** Required (JWT Token)

**Authorization:** Admin, Manager, or Auditor roles only

**Request Body:**

```json
{
  "startDate": "2024-01-01T00:00:00Z",  // Optional: ISO 8601 format
  "endDate": "2024-12-31T23:59:59Z",    // Optional: ISO 8601 format
  "includeDocuments": true,              // Optional: default true
  "includeNCRs": true,                   // Optional: default true
  "includeCAPAs": true,                  // Optional: default true
  "includeTraining": true,               // Optional: default true
  "includeAudits": true,                 // Optional: default true
  "includeAttachments": true             // Optional: default true
}
```

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startDate | string (ISO 8601) | No | System inception | Start date for filtering records |
| endDate | string (ISO 8601) | No | Current date | End date for filtering records |
| includeDocuments | boolean | No | true | Include document listings and status |
| includeNCRs | boolean | No | true | Include Non-Conformance Reports |
| includeCAPAs | boolean | No | true | Include Corrective & Preventive Actions |
| includeTraining | boolean | No | true | Include training records and matrices |
| includeAudits | boolean | No | true | Include audit records |
| includeAttachments | boolean | No | true | Include attachment summaries |

**Response:**

- **Success (200):** PDF file download with headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="QMS_Evidence_Pack_YYYY-MM-DD.pdf"`
  - Binary PDF data

- **Error (500):** 
  ```json
  {
    "error": "Failed to generate evidence pack",
    "message": "Detailed error message"
  }
  ```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/evidence-pack/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "includeDocuments": true,
    "includeNCRs": true,
    "includeCAPAs": true
  }' \
  --output evidence_pack.pdf
```

**Example Response Headers:**

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="QMS_Evidence_Pack_2024-11-17.pdf"
Content-Length: 524288
```

### 2. Get Evidence Pack Options

**Endpoint:** `GET /api/evidence-pack/options`

**Description:** Retrieves available options and filters for evidence pack generation.

**Authentication:** Required (JWT Token)

**Authorization:** Admin, Manager, or Auditor roles only

**Response:**

```json
{
  "options": {
    "includeDocuments": {
      "type": "boolean",
      "default": true,
      "description": "Include document listings and status"
    },
    "includeNCRs": {
      "type": "boolean",
      "default": true,
      "description": "Include Non-Conformance Reports"
    },
    "includeCAPAs": {
      "type": "boolean",
      "default": true,
      "description": "Include Corrective & Preventive Actions"
    },
    "includeTraining": {
      "type": "boolean",
      "default": true,
      "description": "Include training records and matrices"
    },
    "includeAudits": {
      "type": "boolean",
      "default": true,
      "description": "Include audit records"
    },
    "includeAttachments": {
      "type": "boolean",
      "default": true,
      "description": "Include attachment summaries"
    },
    "startDate": {
      "type": "date",
      "required": false,
      "description": "Start date for filtering records (ISO 8601 format)"
    },
    "endDate": {
      "type": "date",
      "required": false,
      "description": "End date for filtering records (ISO 8601 format)"
    }
  }
}
```

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/evidence-pack/options \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## PDF Structure

The generated evidence pack PDF contains the following sections:

### 1. Cover Page
- Report title
- Report period (date range)
- Generation timestamp
- Confidentiality notice

### 2. Table of Contents
- Lists all included sections

### 3. Documents Section
- Total documents count
- Documents grouped by status (Draft, Review, Approved, Obsolete)
- For each document:
  - Title and version
  - Document type and category
  - Creation and approval dates

### 4. Non-Conformance Reports (NCRs)
- Total NCRs count
- NCRs grouped by severity (Critical, High, Medium, Low)
- For each NCR:
  - NCR number and title
  - Status, category, and source
  - Detection and closure dates

### 5. Corrective & Preventive Actions (CAPAs)
- Total CAPAs count
- CAPAs grouped by priority (Urgent, High, Medium, Low)
- For each CAPA:
  - CAPA number and title
  - Status, type, and source
  - Target and completion dates

### 6. Training Records
- Total training sessions count
- For each training:
  - Training title and number
  - Category and status
  - Scheduled date
  - Attendance statistics (attendees, attended, certified)

### 7. Audit Records
- Total audits count
- Audits grouped by type (Internal, External, etc.)
- For each audit:
  - Audit number and title
  - Status and scope
  - Scheduled and completion dates
  - Department

### 8. Attachments & Evidence
- Attachment statistics by entity type
- Total file count and size
- Breakdown by entity type (NCR, CAPA, Training, etc.)

### 9. Summary Statistics
- Document status summary
- NCR status and severity breakdown
- CAPA status summary
- Training status summary

## Audit Logging

All evidence pack generation requests are logged in the audit trail with the following information:

- **Action:** `generate`
- **Action Category:** `system`
- **Action Description:** "Generated evidence pack PDF for external audit"
- **Entity Type:** `system`
- **Additional Data:**
  - Applied filters (date range, included sections)
  - Generation timestamp
  - User who requested the generation

Failed generation attempts are also logged with error details.

## Security Considerations

1. **Authentication:** All endpoints require valid JWT authentication
2. **Authorization:** Only users with Admin, Manager, or Auditor roles can access these endpoints
3. **Data Privacy:** The generated PDF contains sensitive quality management data and should be handled according to organizational data protection policies
4. **Audit Trail:** All generation requests (successful and failed) are logged in the audit trail
5. **No File Storage:** PDFs are generated on-demand and streamed directly to the client without server-side storage

## Rate Limiting

Evidence pack generation is subject to the standard API rate limiting:
- Rate limit: Defined by application configuration
- Recommended: Limited usage due to resource-intensive PDF generation

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **401 Unauthorized:** Missing or invalid authentication token
- **403 Forbidden:** User lacks required role (not Admin, Manager, or Auditor)
- **500 Internal Server Error:** PDF generation failed (check error message for details)

Common error scenarios:
- Database connection issues
- Invalid date format in request
- Memory limitations for very large datasets
- PDF generation library errors

## Performance Considerations

- PDF generation can be resource-intensive for large datasets
- Consider filtering by date range for better performance
- Typical generation time: 2-10 seconds depending on data volume
- Large evidence packs (>1000 records) may take longer

## Best Practices

1. **Use Date Filters:** For regular audits, specify a date range to limit the scope
2. **Selective Sections:** Disable sections not needed for specific audit types
3. **Schedule Generation:** For large evidence packs, consider generating during off-peak hours
4. **Review Before Sharing:** Always review the generated PDF before sharing with external auditors
5. **Version Control:** Include generation date in filenames for tracking

## Dependencies

- **pdfkit:** ^0.15.0 - PDF generation library
- **mssql:** Database connectivity for data retrieval
- Requires existing authentication and RBAC middleware

## Future Enhancements

Potential improvements for future versions:

1. Asynchronous generation with email notification for large datasets
2. Custom PDF templates and branding options
3. Additional filtering options (by department, process, etc.)
4. PDF encryption and password protection
5. Scheduled/automated evidence pack generation
6. Evidence pack history and tracking
7. Digital signatures for generated PDFs
