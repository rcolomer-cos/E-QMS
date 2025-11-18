# NCR Metrics Implementation

## Overview
This document describes the implementation of NCR (Non-Conformance Report) metrics endpoints and dashboard widgets completed as part of issue P5:1:1.

## Backend Implementation

### API Endpoint
**GET /api/ncrs/metrics**

Returns comprehensive metrics and statistics for NCRs.

**Authentication:** Required (any authenticated user)

**Response:**
```json
{
  "totalOpen": 5,
  "totalInProgress": 3,
  "totalResolved": 2,
  "totalClosed": 10,
  "totalRejected": 1,
  "bySeverity": [
    { "severity": "critical", "count": 2 },
    { "severity": "major", "count": 5 },
    { "severity": "minor", "count": 3 }
  ],
  "byCategory": [
    { "category": "Product Quality", "count": 4 },
    { "category": "Process", "count": 3 }
  ],
  "bySource": [
    { "source": "Internal Audit", "count": 6 },
    { "source": "Customer Complaint", "count": 4 }
  ],
  "monthlyTrend": [
    { "month": "2024-01", "count": 5 },
    { "month": "2024-02", "count": 7 }
  ],
  "averageClosureTime": 15
}
```

### Metrics Provided

1. **Status Counts**
   - Open NCRs
   - In Progress NCRs
   - Resolved NCRs
   - Closed NCRs
   - Rejected NCRs

2. **Severity Distribution**
   - Breakdown by Critical, Major, Minor severity levels
   - Excludes closed and rejected NCRs for active monitoring

3. **Category Breakdown**
   - Top categories by NCR count
   - Excludes closed and rejected NCRs
   - Ordered by count (descending)

4. **Source Breakdown**
   - NCRs grouped by source (Internal Audit, Customer Complaint, Inspection, etc.)
   - Excludes closed and rejected NCRs
   - Ordered by count (descending)

5. **Monthly Trend**
   - NCR creation count for the last 12 months
   - Format: YYYY-MM
   - Helps identify patterns and trends over time

6. **Average Closure Time**
   - Average number of days from detection to closure
   - Calculated only for closed NCRs
   - Rounded to whole days

## Frontend Implementation

### NCR Dashboard Component
**Route:** `/ncr/dashboard`

The NCR Dashboard provides a comprehensive view of NCR metrics with the following features:

#### Summary Statistics Cards
- 6 metric cards showing status counts and average closure time
- Color-coded by status type
- Hover effects for better UX

#### Breakdown Sections
Three breakdown cards showing:
- **By Severity:** Distribution of NCRs by severity level with color-coded badges
- **By Category:** Top 5 categories with NCR counts
- **By Source:** Top 5 sources with NCR counts

#### Monthly Trend Chart
- Visual bar chart showing NCR creation over the last 12 months
- Interactive hover tooltips
- Scaled bars for easy comparison

#### Filters
- Filter by Status (Open, In Progress, Resolved, Closed, Rejected)
- Filter by Severity (Critical, Major, Minor)
- Clear Filters button

#### NCR Table
- Paginated table showing filtered NCRs
- Columns: NCR Number, Title, Severity, Category, Status, Detected Date, Actions
- Color-coded badges for severity and status
- View button to navigate to NCR details

### Navigation
The dashboard can be accessed:
- From the main NCR page via a "Dashboard" button
- Directly via the route `/ncr/dashboard`
- Navigation back to the main NCR list is available via a button in the header

## Database Queries

### Status Counts
```sql
SELECT 
  SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as totalOpen,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as totalInProgress,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as totalResolved,
  SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as totalRejected
FROM NCRs
```

### Average Closure Time
```sql
SELECT AVG(DATEDIFF(DAY, detectedDate, closedDate)) as avgClosureTime
FROM NCRs
WHERE closedDate IS NOT NULL
```

### Monthly Trend (Last 12 Months)
```sql
SELECT 
  FORMAT(detectedDate, 'yyyy-MM') as month,
  COUNT(*) as count
FROM NCRs
WHERE detectedDate >= DATEADD(MONTH, -12, GETDATE())
GROUP BY FORMAT(detectedDate, 'yyyy-MM')
ORDER BY FORMAT(detectedDate, 'yyyy-MM')
```

## Testing

### Backend Tests
- Added comprehensive tests for the `getNCRMetrics` controller method
- Tests cover successful metric retrieval and error handling
- All 32 tests in ncrController.test.ts pass

### Test Coverage
- ✅ Successfully returns metrics with all required fields
- ✅ Handles database errors gracefully
- ✅ Returns 500 status on failure

## Usage Example

### Fetching Metrics in Frontend
```typescript
import { getNCRMetrics, NCRMetrics } from '../services/ncrService';

const loadMetrics = async () => {
  try {
    const metrics: NCRMetrics = await getNCRMetrics();
    console.log(`Total Open NCRs: ${metrics.totalOpen}`);
    console.log(`Average Closure Time: ${metrics.averageClosureTime} days`);
  } catch (error) {
    console.error('Failed to load metrics:', error);
  }
};
```

## Files Modified/Created

### Backend
- `backend/src/models/NCRModel.ts` - Added `getMetrics()` method
- `backend/src/controllers/ncrController.ts` - Added `getNCRMetrics()` controller
- `backend/src/routes/ncrRoutes.ts` - Added `/metrics` route
- `backend/src/__tests__/controllers/ncrController.test.ts` - Added tests

### Frontend
- `frontend/src/services/ncrService.ts` - Added `getNCRMetrics()` and `NCRMetrics` interface
- `frontend/src/pages/NCRDashboard.tsx` - New dashboard component
- `frontend/src/styles/NCRDashboard.css` - Dashboard styling
- `frontend/src/App.tsx` - Added dashboard route

## Performance Considerations

1. **Database Indexes**: The NCRs table already has appropriate indexes on:
   - `status` - for status filtering
   - `severity` - for severity filtering
   - `detectedDate` - for monthly trend queries
   - `closedDate` - for closure time calculations
   - `category` and `source` - for breakdown queries

2. **Query Optimization**: Multiple separate queries are used instead of a single complex query to:
   - Improve readability
   - Allow database query caching
   - Make debugging easier

3. **Frontend Caching**: The dashboard loads data once on mount and doesn't auto-refresh. Users must manually refresh to see updated data.

## Future Enhancements

Potential improvements for future iterations:

1. **Date Range Filters**: Allow users to specify custom date ranges for metrics
2. **Export Functionality**: Export metrics to PDF or Excel
3. **Auto-refresh**: Periodic auto-refresh of dashboard data
4. **Drill-down**: Click on metrics to see filtered NCR lists
5. **Comparison View**: Compare metrics between different time periods
6. **Charts**: Add more visual representations (pie charts, line charts)
7. **Real-time Updates**: WebSocket support for live metric updates
8. **Custom Metrics**: Allow users to configure custom metric widgets

## Related Documentation

- [NCR API Documentation](./backend/NCR_API_DOCUMENTATION.md)
- [NCR Module Completion Summary](./NCR_MODULE_COMPLETION_SUMMARY.md)
- [CAPA Dashboard Implementation](./CAPA_DASHBOARD_IMPLEMENTATION.md)
