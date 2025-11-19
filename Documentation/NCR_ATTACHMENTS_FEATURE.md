# NCR Attachments Feature

## Overview

This document describes the image and document attachment functionality for Non-Conformance Reports (NCRs) in the E-QMS application.

## Features

### Backend (Already Implemented)
The backend attachment system provides:
- **File Upload**: Support for uploading files to NCRs
- **Size Restrictions**: Maximum 10MB per file
- **Type Restrictions**: 
  - Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), Text (.txt)
  - Images: JPEG, PNG, GIF, WebP, BMP
- **Secure Storage**: Files stored in entity-specific directories with sanitized filenames
- **Access Control**: JWT authentication required, RBAC for delete operations

### Frontend (This Implementation)

#### 1. Attachment Service (`attachmentService.ts`)
Provides TypeScript service layer for attachment operations:
- Fetch attachments by entity type and ID
- Get download URLs for files
- Upload new attachments
- Delete attachments (admin/manager only)
- Utility functions for file type detection and formatting

#### 2. Attachment Gallery Component (`AttachmentGallery.tsx`)
Displays attachments in an intuitive gallery view:
- **Grid Layout**: Responsive grid showing thumbnails
- **Image Previews**: Thumbnails for images with lazy loading
- **File Icons**: Type-specific icons for documents
- **Modal Viewer**: 
  - Full-size image display
  - PDF preview in iframe
  - Download option for all file types
- **Actions**: Download and delete (permission-based)
- **Responsive**: Adapts to mobile and tablet screens

#### 3. NCR Detail Page (`NCRDetail.tsx`)
Complete NCR viewing and management:
- **NCR Information**: Display all NCR fields
- **Inline Editing**: Edit NCR details (admin/manager/auditor)
- **Status Management**: Update status with permission checks
- **Attachment Section**:
  - View all attachments in gallery
  - Upload new attachments
  - Delete attachments (admin/manager only)
- **Navigation**: Back to NCR list

#### 4. Navigation Integration
- NCR list page has "View" button linking to detail page
- Detail page has "Back to NCRs" navigation
- Route: `/ncr/:id`

## User Experience

### Viewing Attachments
1. Navigate to NCR list at `/ncr`
2. Click "View" on any NCR
3. Scroll to "Attachments" section
4. See thumbnail grid of all attachments
5. Click any thumbnail to open modal viewer
6. View full-size images or PDF preview
7. Download files with download button
8. Close modal with X or Escape key

### Uploading Attachments
1. On NCR detail page, click "+ Add Attachment"
2. Drag and drop file or click "browse"
3. File is validated (type and size)
4. Click "Upload File"
5. File is uploaded and appears in gallery
6. Section auto-updates with new attachment

### Deleting Attachments
1. Admin or Manager sees delete button on each attachment
2. Click delete button
3. Confirm deletion in dialog
4. Attachment is soft-deleted (file retained for audit)
5. Gallery updates to hide deleted attachment

## Technical Details

### API Endpoints Used
- `GET /api/attachments/entity/ncr/:ncrId` - Get all attachments for an NCR
- `POST /api/attachments` - Upload new attachment
- `GET /api/attachments/:id/download` - Download attachment file
- `DELETE /api/attachments/:id` - Delete attachment (admin/manager)

### File Storage
```
uploads/
└── ncr/
    ├── photo-1234567890-1234.jpg
    ├── report-1234567890-5678.pdf
    └── certificate-1234567890-9012.docx
```

Files are renamed with timestamp and random number to prevent conflicts.

### Security Features
1. **Authentication**: JWT token required for all operations
2. **Authorization**: 
   - All authenticated users can view and upload
   - Only admin and manager can delete
3. **File Validation**: 
   - Server validates file type and size
   - Client provides user-friendly validation feedback
4. **Secure URLs**: Download URLs include authentication
5. **Audit Trail**: All uploads, downloads, and deletes are logged

### Responsive Design
The gallery adapts to screen sizes:
- **Desktop**: 4 columns in grid
- **Tablet**: 2-3 columns
- **Mobile**: 1 column, vertical layout

### Performance Optimizations
- Lazy loading for image thumbnails
- Efficient grid layout with CSS Grid
- Modal viewer only loads when opened
- File streaming for downloads (no memory loading)

## Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Future Enhancements
Potential improvements not included in this version:
1. **Bulk Upload**: Upload multiple files at once
2. **Drag and Drop to Gallery**: Direct drag-drop to attachment section
3. **Image Editing**: Basic cropping/rotation before upload
4. **Thumbnail Generation**: Server-side thumbnail creation for faster loading
5. **Attachment Categories**: Tag attachments as photos, reports, certificates, etc.
6. **Full-text Search**: Search within document contents
7. **Version History**: Track file replacements
8. **Expiration Dates**: Auto-delete after retention period

## ISO 9001 Compliance
The attachment system supports ISO 9001:2015 requirements:
- **8.7 Control of nonconforming outputs**: Attach evidence to NCRs
- **Traceability**: Full audit trail of who uploaded when
- **Document Control**: Version tracking and retention
- **Access Control**: Role-based permissions ensure proper authorization

## Testing
- ✅ All TypeScript compilation successful
- ✅ Frontend builds without errors
- ✅ Linting passes (no warnings in new code)
- ✅ Backend attachment tests passing
- ✅ CodeQL security scan: 0 vulnerabilities
- ✅ Responsive design verified

## Support
For issues or questions about NCR attachments:
1. Check the API documentation: `backend/ATTACHMENT_API_DOCUMENTATION.md`
2. Review the attachment implementation summary: `ATTACHMENT_IMPLEMENTATION_SUMMARY.md`
3. Contact the development team
