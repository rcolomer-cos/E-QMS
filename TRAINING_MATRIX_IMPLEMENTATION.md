# Training Matrix Implementation

## Overview
This document describes the implementation of the Training Matrix feature for E-QMS, which provides a visual representation of user competencies and training status.

## Feature Description
The Training Matrix displays:
- Users on the Y-axis (rows)
- Competencies on the X-axis (columns)
- Status indicators with color coding for each user-competency combination

## Status Indicators
- **Green (Active)**: User has completed and current training
- **Red (Expired)**: Training has expired
- **Orange (Missing)**: Training is required but not completed
- **Yellow (Expiring Soon)**: Training expires within 30 days

## Technical Implementation

### Backend
- **Endpoint**: `GET /api/competencies/training-matrix`
- **Query Parameters**:
  - `roleId`: Filter by user role
  - `departmentId`: Filter by department
  - `competencyCategory`: Filter by competency category
- **Response**: Array of user-competency combinations with status

### Frontend
- **Page**: `/training-matrix`
- **Component**: `TrainingMatrix.tsx`
- **Service**: `trainingMatrixService.ts`
- **Styling**: `TrainingMatrix.css`

### Key Features
1. **Interactive Matrix**: Hover over cells to see detailed information
2. **Badges**: Shows mandatory (M) and regulatory (R) requirements
3. **Filtering**: Filter by competency category
4. **Responsive Design**: Sticky headers and scrollable table
5. **Legend**: Clear explanation of status colors

## Database Query
The backend performs a CROSS JOIN between Users and Competencies tables, then LEFT JOINs with UserCompetencies to show status. This ensures all user-competency combinations are displayed, even if the user hasn't completed the training.

## Security Considerations
- Endpoint requires authentication
- All users can view the training matrix (follows existing pattern)
- RBAC can be added in the future if needed
- SQL injection prevented through parameterized queries

## Testing
- 3 backend tests cover:
  - Successful data retrieval
  - Filtered queries
  - Error handling
- All tests pass successfully

## Future Enhancements
- Export to Excel/PDF
- Drill-down to user details
- Bulk actions (e.g., assign training to multiple users)
- Email notifications for expiring training
- Dashboard widget showing overall compliance percentage
