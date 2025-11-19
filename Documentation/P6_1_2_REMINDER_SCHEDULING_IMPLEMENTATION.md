# P6:1:2 — Reminder Scheduling Implementation Summary

## Overview
This implementation adds automated reminder scheduling for the E-QMS system, enabling scheduled checks for expiring training, overdue equipment maintenance/calibration, and CAPA deadlines. The system logs all executions and provides APIs for monitoring and manual triggering.

## Implementation Details

### Database Schema

**Table: ReminderLogs** (Migration: `44_create_reminder_logs_table.sql`)

The table stores execution logs for all reminder tasks with comprehensive tracking:

**Schema:**
```sql
CREATE TABLE ReminderLogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reminderType NVARCHAR(50) NOT NULL,
    executionTime DATETIME NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(20) NOT NULL,
    itemsProcessed INT DEFAULT 0,
    itemsNotified INT DEFAULT 0,
    errorMessage NVARCHAR(MAX),
    executionDurationMs INT,
    configuration NVARCHAR(MAX),
    details NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE()
);
```

**Reminder Types:**
- `training_expiry` - Training certificate expiry reminders
- `equipment_calibration` - Equipment calibration due reminders
- `equipment_maintenance` - Equipment maintenance due reminders
- `capa_deadline` - CAPA deadline reminders
- `all_reminders` - Combined execution of all reminder types

**Status Values:**
- `success` - Execution completed successfully
- `failed` - Execution failed with error
- `partial` - Some reminder types succeeded, others failed

**Indexes:**
- `IX_ReminderLogs_Type` - Query by reminder type
- `IX_ReminderLogs_ExecutionTime` - Query by execution time
- `IX_ReminderLogs_Status` - Query by status

### Backend Implementation

#### 1. ReminderLogModel
**Location:** `backend/src/models/ReminderLogModel.ts`

**Methods:**
- `create(log)` - Create new reminder log entry
- `findById(id)` - Retrieve log by ID
- `findAll(filters?, page?, limit?)` - List logs with pagination and filtering
- `getLatestByType(reminderType)` - Get most recent log for a type
- `getStatistics(days)` - Get execution statistics for a period
- `deleteOlderThan(days)` - Cleanup old logs

**Features:**
- Pagination support
- Flexible filtering (type, status, date range)
- Statistical aggregation
- Automatic cleanup capabilities

#### 2. ReminderService
**Location:** `backend/src/services/reminderService.ts`

**Core Logic Methods:**

1. **`processTrainingExpiryReminders(config?)`**
   - Checks expiring training certificates
   - Checks expiring attendee records
   - Uses `TrainingCertificateService.getExpiringCertificates()` and `getExpiringAttendeeRecords()`
   - Default threshold: 30 days
   - Logs execution results

2. **`processEquipmentCalibrationReminders(config?)`**
   - Checks upcoming calibration due
   - Checks overdue calibration
   - Uses `EquipmentModel.findCalibrationDue()` and `getOverdueCalibration()`
   - Default threshold: 30 days
   - Logs execution results

3. **`processEquipmentMaintenanceReminders(config?)`**
   - Checks upcoming maintenance due
   - Checks overdue maintenance
   - Uses `EquipmentModel.getUpcomingDue()` and `getOverdueMaintenance()`
   - Default threshold: 30 days
   - Logs execution results

4. **`processCAPADeadlineReminders(config?)`**
   - Checks overdue CAPAs
   - Checks CAPAs due soon
   - Uses `CAPAModel.findOverdue()` and `findAll()`
   - Default threshold: 7 days
   - Logs execution results

5. **`processAllReminders(config?)`**
   - Executes all reminder types sequentially
   - Aggregates results
   - Creates combined execution log
   - Returns consolidated results

**Configuration Interface:**
```typescript
interface ReminderConfig {
  trainingExpiryDays?: number;
  equipmentCalibrationDays?: number;
  equipmentMaintenanceDays?: number;
  capaDeadlineDays?: number;
}
```

**Return Interface:**
```typescript
interface ReminderResult {
  success: boolean;
  itemsProcessed: number;
  itemsNotified: number;
  error?: string;
  details?: any;
}
```

#### 3. SchedulerService
**Location:** `backend/src/services/schedulerService.ts`

**Responsibilities:**
- Initialize and manage cron jobs
- Schedule automated reminder execution
- Provide manual trigger capability
- Track scheduler status
- Support dynamic reconfiguration

**Key Methods:**

1. **`initialize(config?)`**
   - Initialize scheduler on server startup
   - Validate cron expression
   - Schedule reminder tasks
   - Load configuration from environment variables

2. **`scheduleReminders(config)`**
   - Create cron job using node-cron
   - Execute `ReminderService.processAllReminders()` at scheduled times
   - Log execution results to console

3. **`runNow(reminderConfig?)`**
   - Manually trigger reminder execution
   - Useful for testing or ad-hoc runs
   - Runs asynchronously

4. **`stopAll()`**
   - Stop all scheduled tasks
   - Clear task registry
   - Reset initialization flag

5. **`getStatus()`**
   - Return scheduler configuration
   - List active tasks
   - Show initialization state

6. **`restart(config?)`**
   - Stop existing tasks
   - Reinitialize with new configuration

**Configuration:**
```typescript
interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string;
  reminderConfig?: ReminderConfig;
}
```

**Environment Variables:**
- `SCHEDULER_ENABLED` - Enable/disable scheduler (default: true)
- `SCHEDULER_CRON` - Cron expression (default: '0 8 * * *' = daily at 8 AM)
- `SCHEDULER_TIMEZONE` - Timezone for cron execution (default: UTC)
- `REMINDER_TRAINING_DAYS` - Training expiry threshold (default: 30)
- `REMINDER_CALIBRATION_DAYS` - Calibration due threshold (default: 30)
- `REMINDER_MAINTENANCE_DAYS` - Maintenance due threshold (default: 30)
- `REMINDER_CAPA_DAYS` - CAPA deadline threshold (default: 7)

### API Endpoints

#### Controller: reminderLogController
**Location:** `backend/src/controllers/reminderLogController.ts`

#### Routes
**Location:** `backend/src/routes/reminderLogRoutes.ts`

**1. GET /api/reminder-logs**
- **Description:** List all reminder logs with pagination
- **Access:** Admin, Manager
- **Query Parameters:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 50)
  - `reminderType` (optional)
  - `status` (optional)
  - `startDate` (optional, ISO format)
  - `endDate` (optional, ISO format)
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reminderType": "training_expiry",
      "executionTime": "2025-01-18T08:00:00.000Z",
      "status": "success",
      "itemsProcessed": 15,
      "itemsNotified": 15,
      "executionDurationMs": 1250,
      "configuration": "{\"daysThreshold\":30}",
      "details": "{\"expiringCertificates\":10,\"expiringAttendees\":5}"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

**2. GET /api/reminder-logs/:id**
- **Description:** Get specific reminder log by ID
- **Access:** Admin, Manager
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reminderType": "training_expiry",
    "executionTime": "2025-01-18T08:00:00.000Z",
    "status": "success",
    "itemsProcessed": 15,
    "itemsNotified": 15
  }
}
```

**3. GET /api/reminder-logs/latest/:type**
- **Description:** Get the most recent log for a specific reminder type
- **Access:** Admin, Manager
- **URL Parameters:**
  - `type` - Reminder type (training_expiry, equipment_calibration, etc.)
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "reminderType": "training_expiry",
    "executionTime": "2025-01-18T08:00:00.000Z",
    "status": "success",
    "itemsProcessed": 15,
    "itemsNotified": 15
  }
}
```

**4. GET /api/reminder-logs/statistics**
- **Description:** Get reminder execution statistics
- **Access:** Admin, Manager
- **Query Parameters:**
  - `days` (optional, default: 30)
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalExecutions": 90,
    "successfulExecutions": 85,
    "failedExecutions": 3,
    "partialExecutions": 2,
    "totalItemsProcessed": 1250,
    "totalItemsNotified": 1200,
    "averageDurationMs": 1500,
    "byType": [
      {
        "reminderType": "training_expiry",
        "count": 30,
        "successRate": 95
      },
      {
        "reminderType": "equipment_calibration",
        "count": 30,
        "successRate": 90
      }
    ]
  },
  "period": "Last 30 days"
}
```

**5. GET /api/reminder-logs/scheduler/status**
- **Description:** Get current scheduler status and configuration
- **Access:** Admin only
- **Response:**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "activeTasks": ["reminders"],
    "configuration": {
      "enabled": true,
      "cronExpression": "0 8 * * *",
      "timezone": "UTC"
    }
  }
}
```

**6. POST /api/reminder-logs/trigger**
- **Description:** Manually trigger reminder tasks
- **Access:** Admin only
- **Request Body (optional):**
```json
{
  "config": {
    "trainingExpiryDays": 30,
    "equipmentCalibrationDays": 30,
    "equipmentMaintenanceDays": 30,
    "capaDeadlineDays": 7
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Reminder tasks triggered successfully",
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

**7. DELETE /api/reminder-logs/cleanup**
- **Description:** Delete old reminder logs
- **Access:** Admin only
- **Query Parameters:**
  - `days` (optional, default: 90) - Delete logs older than this many days
- **Response:**
```json
{
  "success": true,
  "message": "Deleted 150 old reminder logs",
  "deletedCount": 150,
  "olderThanDays": 90
}
```

### Application Integration

**Location:** `backend/src/index.ts`

**Initialization:**
```typescript
import { SchedulerService } from './services/schedulerService';

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize scheduler after server starts
  try {
    SchedulerService.initialize();
    console.log('Reminder scheduler initialized');
  } catch (error) {
    console.error('Failed to initialize scheduler:', error);
  }
});
```

The scheduler automatically:
1. Loads configuration from environment variables
2. Validates cron expression
3. Schedules reminder tasks
4. Logs initialization status

### Testing

#### Unit Tests
**Location:** `backend/src/__tests__/models/ReminderLogModel.test.ts`

**Test Coverage (8 tests, all passing):**
- ✅ Create reminder log
- ✅ Find reminder log by ID
- ✅ Find reminder log by ID (not found case)
- ✅ Return paginated reminder logs
- ✅ Filter by reminder type
- ✅ Return latest log for reminder type
- ✅ Return reminder execution statistics
- ✅ Delete old reminder logs

**Test Results:**
```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

### Configuration Guide

#### Environment Variables (.env)

```bash
# Reminder Scheduler Configuration
SCHEDULER_ENABLED=true              # Enable/disable scheduler
SCHEDULER_CRON=0 8 * * *           # Daily at 8 AM UTC
SCHEDULER_TIMEZONE=UTC              # Timezone for execution
REMINDER_TRAINING_DAYS=30           # Training expiry threshold
REMINDER_CALIBRATION_DAYS=30        # Calibration due threshold
REMINDER_MAINTENANCE_DAYS=30        # Maintenance due threshold
REMINDER_CAPA_DAYS=7               # CAPA deadline threshold
```

#### Cron Expression Examples

```bash
# Every day at 8 AM
SCHEDULER_CRON=0 8 * * *

# Every Monday at 9 AM
SCHEDULER_CRON=0 9 * * 1

# Every hour
SCHEDULER_CRON=0 * * * *

# Every 6 hours
SCHEDULER_CRON=0 */6 * * *

# Every weekday at 7 AM
SCHEDULER_CRON=0 7 * * 1-5
```

### Usage Examples

#### 1. View Recent Reminder Executions
```bash
GET /api/reminder-logs?page=1&limit=10
```

#### 2. Check Training Expiry Reminders
```bash
GET /api/reminder-logs?reminderType=training_expiry&status=success
```

#### 3. View Statistics for Last 7 Days
```bash
GET /api/reminder-logs/statistics?days=7
```

#### 4. Manually Trigger Reminders
```bash
POST /api/reminder-logs/trigger
Content-Type: application/json

{
  "config": {
    "trainingExpiryDays": 15,
    "capaDeadlineDays": 3
  }
}
```

#### 5. Check Scheduler Status
```bash
GET /api/reminder-logs/scheduler/status
```

#### 6. Cleanup Old Logs
```bash
DELETE /api/reminder-logs/cleanup?days=180
```

### Monitoring and Troubleshooting

#### Check Scheduler Status
The scheduler status endpoint provides real-time information:
```bash
GET /api/reminder-logs/scheduler/status
```

#### Review Execution Logs
Check the latest execution for each reminder type:
```bash
GET /api/reminder-logs/latest/training_expiry
GET /api/reminder-logs/latest/equipment_calibration
GET /api/reminder-logs/latest/equipment_maintenance
GET /api/reminder-logs/latest/capa_deadline
```

#### View Execution Statistics
Monitor success rates and performance:
```bash
GET /api/reminder-logs/statistics?days=30
```

#### Console Logs
The scheduler logs execution to console:
```
[2025-01-18T08:00:00.000Z] Running scheduled reminder tasks...
[2025-01-18T08:00:01.500Z] Reminder tasks completed: {
  success: true,
  training: 15,
  calibration: 8,
  maintenance: 12,
  capa: 5
}
```

#### Failed Executions
Failed executions are logged with error details:
```json
{
  "status": "failed",
  "errorMessage": "Connection timeout",
  "itemsProcessed": 0,
  "itemsNotified": 0
}
```

### Future Enhancements

#### 1. Email Integration
Currently, the reminder service identifies items requiring notification but doesn't send emails. Future implementation could:
- Integrate with SMTP service
- Use email templates from P6:1:1
- Send personalized reminder emails
- Track email delivery status

#### 2. Notification Integration
Integrate with the existing notification system:
- Create in-app notifications
- Track notification read status
- Allow users to snooze reminders

#### 3. Escalation Rules
- Send reminders to managers if items remain overdue
- Increase reminder frequency as deadlines approach
- Automatic escalation based on item priority

#### 4. Customizable Schedules
- Different schedules for different reminder types
- User-specific reminder preferences
- Department-specific configurations

#### 5. Advanced Filtering
- Filter by department, user, or equipment type
- Custom threshold per user or department
- Risk-based prioritization

#### 6. Dashboard Integration
- Real-time reminder dashboard
- Charts showing reminder trends
- Alerts for high failure rates

### Security Considerations

**Access Control:**
- All endpoints require authentication
- Admin role required for trigger, status, and cleanup
- Manager and Admin can view logs and statistics
- Audit trail maintained in ReminderLogs table

**Data Protection:**
- Configuration stored as JSON strings
- No sensitive data in logs
- Old logs can be automatically cleaned up
- Error messages sanitized

**Rate Limiting:**
- API endpoints protected by rate limiter
- Manual trigger limited to admin users
- Prevents abuse of manual trigger endpoint

### Performance Considerations

**Database Optimization:**
- Indexes on frequently queried fields
- Pagination for large result sets
- Statistics use aggregation queries
- Cleanup functionality for old data

**Execution Efficiency:**
- Reminder checks use optimized queries
- Database connection pooling
- Async/await for non-blocking execution
- Error handling prevents cascade failures

**Scalability:**
- Stateless service design
- Can run in clustered environment
- Configuration via environment variables
- Logs stored in database, not memory

### Compliance Notes

This implementation supports ISO 9001:2015 requirements for:

**7.1.6 Organizational Knowledge:**
- Systematic tracking of training requirements
- Evidence of competency maintenance

**7.2 Competence:**
- Automated monitoring of training expiry
- Proactive identification of training needs

**7.3 Awareness:**
- Timely reminders ensure personnel awareness
- Prevents lapses in required competencies

**8.5.1 Control of Production and Service Provision:**
- Equipment calibration and maintenance tracking
- Ensures measurement equipment validity

**10.2 Nonconformity and Corrective Action:**
- CAPA deadline monitoring
- Ensures timely resolution of issues

### Files Created/Modified

**New Files:**
- `backend/database/44_create_reminder_logs_table.sql` (61 lines)
- `backend/src/models/ReminderLogModel.ts` (245 lines)
- `backend/src/services/reminderService.ts` (380 lines)
- `backend/src/services/schedulerService.ts` (175 lines)
- `backend/src/controllers/reminderLogController.ts` (215 lines)
- `backend/src/routes/reminderLogRoutes.ts` (70 lines)
- `backend/src/__tests__/models/ReminderLogModel.test.ts` (165 lines)

**Modified Files:**
- `backend/src/index.ts` (+10 lines)
- `.env.example` (+7 lines)
- `backend/package.json` (+2 dependencies)

**Total:** 1,328 lines added/modified across 10 files

### Dependencies Added

```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11"
  }
}
```

## Conclusion

The reminder scheduling feature has been successfully implemented with:
- ✅ Complete database schema with comprehensive logging
- ✅ Automated cron-based scheduling
- ✅ Manual trigger capability
- ✅ Full CRUD API with access control
- ✅ Configurable thresholds and schedules
- ✅ Comprehensive unit tests (8/8 passing)
- ✅ Build verification
- ✅ Documentation

The implementation provides a robust foundation for automated reminder notifications across the E-QMS system, with logging, monitoring, and administrative controls.

### Next Steps

1. **Testing with Real Data:** Test with actual database data
2. **Email Integration:** Connect with email service (future phase)
3. **Notification Integration:** Create in-app notifications
4. **Dashboard:** Add reminder dashboard to frontend
5. **Monitoring:** Set up alerting for failed executions
