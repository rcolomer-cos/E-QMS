# Landing Page Testing Guide

## Overview
This document describes how to test the new landing page feature that displays a user greeting and recent document changes.

## Features Implemented
1. Personalized user greeting with first name
2. Recent document changes list (last 10 documents)
3. Document metadata display (title, type, version, category, status, author, date)
4. Permission-based filtering (only shows documents user has access to)
5. Empty state message when no documents exist
6. Quick actions section for navigation
7. Responsive design for mobile/tablet/desktop

## Backend Testing

### API Endpoint: GET /api/documents/recent

**Authentication:** Required (JWT token)

**Query Parameters:**
- `limit` (optional): Number of documents to return (default: 10, max: 50)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Quality Manual",
    "description": "Main quality management manual",
    "documentType": "Manual",
    "category": "Quality",
    "version": "2.0",
    "status": "approved",
    "createdBy": 1,
    "creatorFirstName": "John",
    "creatorLastName": "Doe",
    "creatorEmail": "john.doe@example.com",
    "lastModified": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Testing Steps:

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test with curl:**
   ```bash
   # Login first to get token
   TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}' \
     | jq -r '.token')

   # Get recent documents
   curl -X GET http://localhost:3000/api/documents/recent \
     -H "Authorization: Bearer $TOKEN"

   # Get with custom limit
   curl -X GET "http://localhost:3000/api/documents/recent?limit=5" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Test permission filtering:**
   - Create documents assigned to different groups
   - Login as users with different group memberships
   - Verify each user only sees documents they have access to

4. **Test without authentication:**
   ```bash
   curl -X GET http://localhost:3000/api/documents/recent
   # Should return 401 Unauthorized
   ```

## Frontend Testing

### Manual Testing:

1. **Start the frontend server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the application:**
   - Navigate to http://localhost:5173
   - Login with valid credentials
   - You should be redirected to the landing page (default route)

3. **Test landing page display:**
   - Verify personalized greeting shows your first name
   - Check that recent documents are displayed
   - Verify each document card shows:
     - Document icon
     - Title
     - Status badge
     - Document type, version, and category
     - Description (if available)
     - Author name
     - Relative date (e.g., "Today", "2 days ago")

4. **Test interactions:**
   - Click on a document card - should navigate to `/documents/:id`
   - Click "View All" button - should navigate to `/documents`
   - Click quick action buttons - should navigate to respective pages
   - Test on different screen sizes (responsive design)

5. **Test empty state:**
   - Use a fresh database with no documents
   - Verify empty state message displays
   - Verify "Browse All Documents" button works

6. **Test navigation:**
   - Access `/dashboard` route - should show the dashboard page
   - Access `/` route - should show the landing page
   - Verify navigation links work correctly

### Permission Testing:

1. Create test users with different roles and group memberships
2. Create documents assigned to specific groups
3. Login as each user and verify they only see permitted documents

### Browser Testing:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Automated Testing (Future)

Consider adding:
1. Backend unit tests for `getRecentDocuments` controller
2. Frontend unit tests for `LandingPage` component
3. Integration tests for permission filtering
4. E2E tests for user workflows

## Known Issues

- Pre-existing TypeScript errors in other files (unrelated to this feature)
- Database must be properly configured for the backend to work

## Troubleshooting

### Issue: 401 Unauthorized when accessing /api/documents/recent
**Solution:** Ensure you're sending a valid JWT token in the Authorization header

### Issue: Empty list despite having documents
**Solution:** Check that documents have status 'approved' or 'review' (drafts and obsolete are excluded)

### Issue: Can't see certain documents
**Solution:** Verify user is a member of the groups assigned to those documents

### Issue: Date shows as "Invalid Date"
**Solution:** Check that document dates are in valid ISO 8601 format
