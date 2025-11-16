# QR Code Feature for Equipment Management

## Overview

This feature implements QR code generation for equipment items, allowing field workers to quickly access equipment information by scanning QR codes without requiring authentication.

## Features

### 1. QR Code Generation
- QR codes are automatically generated when new equipment is created
- Each QR code contains a URL pointing to a public read-only equipment detail page
- Format: `{FRONTEND_URL}/equipment/view/{equipmentNumber}`

### 2. Read-Only Equipment Page
- **Public Access**: No authentication required
- **Minimal Information**: Shows only essential, non-sensitive data
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Professional UI**: Gradient design with clear information hierarchy

#### Information Displayed:
- Equipment Number
- Name
- Description
- Manufacturer
- Model
- Serial Number
- Location
- Status (with visual indicators)
- Next Calibration Date
- Next Maintenance Date

#### Information NOT Displayed:
- Purchase Date
- Responsible Person
- Internal IDs
- Creation/Update timestamps
- Any financial information

### 3. QR Code Regeneration
- Available to Admin and Manager roles
- Located in equipment detail view
- Updates QR code with current equipment number
- Useful for:
  - Equipment that was created before this feature
  - Updating QR codes if frontend URL changes
  - Replacing damaged QR code labels

## Usage

### For Field Workers
1. Scan the QR code on equipment using a smartphone or tablet
2. View equipment details without login
3. Check maintenance/calibration schedules
4. Verify equipment specifications

### For Administrators/Managers

#### Creating New Equipment
1. Navigate to Equipment Management
2. Click "Add Equipment"
3. Fill in equipment details
4. QR code is automatically generated upon creation
5. Download or print the QR code for labeling

#### Regenerating QR Codes
1. Navigate to Equipment Management
2. View equipment details
3. Scroll to "QR Code" section
4. Click "Regenerate QR Code"
5. Confirm the action
6. New QR code is generated and displayed

## API Endpoints

### Public Endpoint (No Authentication)
```
GET /api/equipment/public/:equipmentNumber
```
Returns minimal equipment information for public access.

### Protected Endpoints (Authentication Required)
```
POST /api/equipment/:id/regenerate-qr
```
Regenerates QR code for specified equipment (Admin/Manager only).

## Configuration

The QR code URL is based on the `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=http://localhost:5173  # Development
FRONTEND_URL=https://eqms.yourcompany.com  # Production
```

**Important**: Update `FRONTEND_URL` to your production domain before deployment.

## Security Considerations

1. **Public Access**: Read-only page is intentionally public for field worker convenience
2. **Minimal Data**: Only non-sensitive information is exposed
3. **No Write Access**: Public endpoint is strictly read-only
4. **Rate Limiting**: API rate limiting protects against abuse
5. **RBAC**: QR regeneration requires appropriate roles

## Future Enhancements

Potential improvements for future versions:
- Batch QR code generation for multiple equipment
- QR code customization (size, format, logo)
- Equipment history access via QR code (with authentication)
- Print-ready QR code labels with equipment details
- QR code analytics (scan tracking)

## Technical Details

### Backend
- **Framework**: Node.js + Express + TypeScript
- **QR Library**: `qrcode` npm package
- **Database**: MSSQL

### Frontend
- **Framework**: React + TypeScript
- **Router**: react-router-dom
- **QR Display**: Native `<img>` tag with base64 data URL

### Testing
- Comprehensive unit tests for all endpoints
- Test coverage includes success and error scenarios
- Mock-based testing with Jest
