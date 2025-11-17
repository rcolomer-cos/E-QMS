# P3:1:5 — Expiry Reminder Logic Implementation Summary

## Overview
This implementation adds backend logic to detect upcoming or expired training certificates and creates a frontend UI component to display and manage expiring certificates and training records.

## Backend Implementation

### Service Layer: `trainingCertificateService.ts`

Created a comprehensive service to query and manage expiring training certificates and attendee records.

#### Key Features:
- **Query expiring certificates** from `TrainingCertificates` table
- **Query expiring attendee records** from `TrainingAttendees` table
- **Configurable threshold** (days ahead to check for expiration)
- **Include/exclude expired items** filtering
- **User-specific queries** for personalized views

#### Methods:

1. **`getExpiringCertificates(daysThreshold, includeExpired)`**
   - Returns all expiring training certificates
   - Checks both `expiryDate` and `nextRenewalDate` fields
   - Calculates days until expiry
   - Sorts by earliest expiry date
   - Includes user information (name, email)

2. **`getExpiringAttendeeRecords(daysThreshold, includeExpired)`**
   - Returns expiring training attendee records
   - Checks `expiryDate` field on attendee records
   - Includes training details (title, number)
   - Includes user information

3. **`getExpiringCertificatesForUser(userId, daysThreshold)`**
   - Returns expiring certificates for a specific user
   - Used for personalized notifications

### API Endpoints

Added three new endpoints to `trainingController.ts` and `trainingRoutes.ts`:

#### 1. GET `/api/training/certificates/expiring`
**Purpose**: Get all expiring training certificates

**Query Parameters**:
- `daysThreshold` (optional, default: 90): Number of days to look ahead
- `includeExpired` (optional, default: true): Include expired certificates

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "certificateNumber": "CERT-001",
      "certificateName": "Safety Training",
      "userId": 10,
      "userFirstName": "John",
      "userLastName": "Doe",
      "userEmail": "john.doe@example.com",
      "expiryDate": "2025-01-15T00:00:00.000Z",
      "issueDate": "2024-01-15T00:00:00.000Z",
      "status": "active",
      "certificateType": "Safety",
      "competencyArea": "Workplace Safety",
      "daysUntilExpiry": 30,
      "isExpired": false,
      "requiresRenewal": false,
      "nextRenewalDate": null
    }
  ],
  "count": 1,
  "threshold": 90,
  "includeExpired": true
}
```

**Access Control**: All authenticated users

#### 2. GET `/api/training/attendees/expiring`
**Purpose**: Get all expiring training attendee records

**Query Parameters**:
- `daysThreshold` (optional, default: 90): Number of days to look ahead
- `includeExpired` (optional, default: true): Include expired records

**Response**:
```json
{
  "data": [
    {
      "id": 100,
      "trainingId": 5,
      "trainingTitle": "First Aid Training",
      "trainingNumber": "TRN-005",
      "userId": 10,
      "userFirstName": "John",
      "userLastName": "Doe",
      "userEmail": "john.doe@example.com",
      "expiryDate": "2025-01-20T00:00:00.000Z",
      "certificateDate": "2024-01-20T00:00:00.000Z",
      "daysUntilExpiry": 35,
      "isExpired": false
    }
  ],
  "count": 1,
  "threshold": 90,
  "includeExpired": true
}
```

**Access Control**: All authenticated users

#### 3. GET `/api/training/my-certificates/expiring`
**Purpose**: Get expiring certificates for the authenticated user

**Query Parameters**:
- `daysThreshold` (optional, default: 90): Number of days to look ahead

**Response**:
```json
{
  "data": [...],
  "count": 1,
  "threshold": 90
}
```

**Access Control**: Authenticated users (returns only their certificates)

### Testing

Created comprehensive unit tests in `trainingCertificateService.test.ts`:

- ✅ Tests for `getExpiringCertificates` with default parameters
- ✅ Tests for certificates with renewal dates
- ✅ Tests for expired certificates
- ✅ Tests for custom threshold parameters
- ✅ Tests for `getExpiringAttendeeRecords`
- ✅ Tests for empty result sets
- ✅ Tests for user-specific certificate queries

All tests pass successfully.

## Frontend Implementation

### Service: `trainingService.ts`

Created a TypeScript service to interface with the backend API.

**Key Functions**:
- `getExpiringCertificates(daysThreshold, includeExpired)`
- `getExpiringAttendeeRecords(daysThreshold, includeExpired)`
- `getMyExpiringCertificates(daysThreshold)`

**TypeScript Interfaces**:
- `ExpiringCertificate`: Full certificate data structure
- `ExpiringAttendeeRecord`: Training attendee record structure
- Response wrappers for API responses

### Component: `ExpiringCertificates.tsx`

Created a reusable React component to display expiring certificates and training records.

#### Features:

1. **Dual Display Modes**:
   - Certificates view (default)
   - Training records view (toggle)

2. **Interactive Filters**:
   - Threshold selector: 30, 60, 90, 120, 180 days
   - Include/exclude expired toggle

3. **Visual Indicators**:
   - **Expired** (Red): Certificate/record has expired
   - **Critical** (Orange/Yellow): 30 days or less
   - **High** (Light Orange): 31-60 days
   - **Medium** (Blue): 61+ days

4. **Data Display**:
   - User information (name, email)
   - Certificate details (number, name, type)
   - Dates (issue, expiry, renewal)
   - Status badges with color coding
   - Competency area information

5. **Responsive Design**:
   - Mobile-friendly table layout
   - Adjusts for smaller screens

### Styling: `ExpiringCertificates.css`

Professional styling with:
- Clean table design
- Color-coded urgency badges
- Hover effects
- Responsive breakpoints
- Consistent spacing and typography

### Integration: `Training.tsx`

Integrated the component into the Training Management page:

- **Toggle Buttons**: Show/hide expiring certificates and records
- **Dual Panels**: Can display both types simultaneously
- **Default View**: Expiring certificates shown by default

## Database Queries

### Key SQL Logic

The implementation leverages existing database tables:

1. **TrainingCertificates Table**:
   - Queries `expiryDate` for certificate expiration
   - Queries `nextRenewalDate` for renewal-based certificates
   - Filters by `status = 'active'`
   - Uses DATEDIFF to calculate days until expiry
   - Joins with Users table for user information

2. **TrainingAttendees Table**:
   - Queries `expiryDate` for training record expiration
   - Filters by `attended = 1`
   - Joins with Users and Trainings tables

### Performance Considerations

- Uses indexed columns: `expiryDate`, `nextRenewalDate`, `status`, `userId`
- Composite indexes for common query patterns
- Efficient date filtering with DATEADD

## Security

### Security Review

✅ **CodeQL Analysis**: No vulnerabilities detected

### Security Features

1. **Authentication Required**: All endpoints require JWT token
2. **RBAC**: Appropriate role-based access control
3. **Parameterized Queries**: All SQL queries use parameters (no SQL injection)
4. **Input Validation**: Threshold parameter validated (1-365 days)
5. **User Isolation**: `/my-certificates/expiring` returns only user's own data
6. **No Sensitive Data Exposure**: API responses structured appropriately

## Usage Examples

### Backend API Calls

```bash
# Get certificates expiring in next 60 days
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/training/certificates/expiring?daysThreshold=60&includeExpired=false"

# Get my expiring certificates
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/training/my-certificates/expiring?daysThreshold=30"

# Get expiring training records
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/training/attendees/expiring?daysThreshold=90"
```

### Frontend Usage

```tsx
import ExpiringCertificates from '../components/ExpiringCertificates';

// In your component
<ExpiringCertificates daysThreshold={90} />

// For training records view
<ExpiringCertificates daysThreshold={90} showAttendeeRecords={true} />
```

## Future Enhancements

Potential improvements for future iterations:

1. **Email Notifications**: Automated reminders for expiring certificates
2. **Dashboard Widgets**: Summary cards for quick overview
3. **Export Functionality**: Export lists to CSV/PDF
4. **Sorting and Advanced Filtering**: Sort by user, type, urgency
5. **Renewal Workflow**: Direct links to renewal process
6. **Calendar Integration**: Add expiry dates to calendar
7. **Batch Operations**: Bulk renewal reminders
8. **Analytics**: Trends and reports on certificate compliance

## Testing Checklist

- [x] Backend service methods work correctly
- [x] API endpoints return expected data
- [x] Unit tests pass
- [x] Frontend component renders correctly
- [x] Date calculations are accurate
- [x] Color coding works as expected
- [x] Filters function properly
- [x] Responsive design works on mobile
- [x] No TypeScript compilation errors
- [x] No security vulnerabilities detected
- [x] Build process completes successfully

## Conclusion

This implementation provides a complete solution for tracking and managing expiring training certificates and records. The system is:

- **Functional**: All requirements met
- **Tested**: Comprehensive unit tests
- **Secure**: No vulnerabilities detected
- **User-Friendly**: Clean, intuitive UI
- **Performant**: Efficient database queries
- **Maintainable**: Clean code structure
- **Extensible**: Easy to add future enhancements

The feature is ready for production use and can be extended with notification systems, reporting, and additional workflow features as needed.
