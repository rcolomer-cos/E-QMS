# P3:1 Training & Competence - Quick Start Guide

## 🎯 Overview

This guide provides quick access to all Training & Competence features implemented in issue P3:1.

---

## 📱 User Interface Access

### For All Users

#### 1. Dashboard (`/`)
- View "My Training Compliance" section
- See missing or expiring competencies
- Quick access to personal training status

#### 2. Training Management (`/training`)
**Features:**
- View all scheduled and completed trainings
- Filter by status (Scheduled, Completed, Cancelled, Expired)
- Filter by category (Safety, Quality, Technical, Compliance, Management)
- View expiring certificates
- View expiring training records

**Actions:**
- View training details
- See upcoming training sessions

#### 3. Training Matrix (`/training-matrix`)
**Features:**
- Visual matrix of users vs competencies
- Color-coded status indicators
- Filter by competency category
- Mandatory (M) and Regulatory (R) badges

### For Admins & Managers Only

#### 4. Schedule Training (`/training` → "Schedule Training" button)
**Form Fields:**
- Training Number (unique ID)
- Title
- Description
- Category
- Status
- Scheduled Date & Time
- Duration (minutes)
- Instructor
- Certificate Validity (months)

#### 5. Role Training Requirements (`/role-training-requirements`)
**Features:**
- Requirements Tab: Manage role-competency mappings
- Compliance Gaps Tab: View users with missing competencies
- Filter by role, competency, status, priority

---

## 🔧 API Endpoints Quick Reference

### Training Management

```bash
# Get all trainings
GET /api/training?page=1&limit=10&status=scheduled&category=Safety

# Get training by ID
GET /api/training/:id

# Create training (Admin/Manager)
POST /api/training
{
  "trainingNumber": "TRN-2024-001",
  "title": "ISO 9001 Auditor Training",
  "category": "Quality",
  "status": "scheduled",
  "scheduledDate": "2024-12-01T09:00:00Z",
  "duration": 480,
  "instructor": "John Doe",
  "expiryMonths": 36,
  "createdBy": 1
}

# Update training (Admin/Manager)
PUT /api/training/:id
{
  "status": "completed",
  "completedDate": "2024-12-01T17:00:00Z"
}

# Get training attendees
GET /api/training/:id/attendees
```

### Certificate Management

```bash
# Get expiring certificates
GET /api/training/certificates/expiring?daysThreshold=90&includeExpired=true

# Get expiring training records
GET /api/training/attendees/expiring?daysThreshold=90&includeExpired=true

# Get my expiring certificates
GET /api/training/my-certificates/expiring?daysThreshold=30
```

### Competency Management

```bash
# Create competency (Admin/Manager)
POST /api/competencies
{
  "competencyCode": "QUAL-001",
  "name": "ISO 9001 Internal Auditor",
  "category": "Quality",
  "status": "active",
  "hasExpiry": true,
  "defaultValidityMonths": 36
}

# List competencies
GET /api/competencies?status=active&category=Quality

# Assign competency to user (Admin/Manager)
POST /api/competencies/assignments
{
  "userId": 10,
  "competencyId": 1,
  "acquiredDate": "2024-01-15",
  "effectiveDate": "2024-01-15",
  "status": "active"
}

# Get user competencies
GET /api/competencies/users/:userId

# Get expiring competencies for user
GET /api/competencies/users/:userId/expiring?daysThreshold=30
```

### Role Training Requirements

```bash
# Create requirement (Admin/Manager)
POST /api/role-training-requirements
{
  "roleId": 2,
  "competencyId": 1,
  "isMandatory": true,
  "isRegulatory": true,
  "priority": "critical",
  "gracePeriodDays": 30
}

# List requirements
GET /api/role-training-requirements?roleId=2&status=active

# Get missing competencies for user
GET /api/role-training-requirements/users/:userId/missing?daysThreshold=30

# Get compliance gap report (Admin/Manager)
GET /api/role-training-requirements/compliance/gaps?roleId=2
```

---

## 💡 Common Workflows

### Workflow 1: Schedule a New Training

1. Navigate to `/training`
2. Click "Schedule Training" button
3. Fill out the form:
   - Training Number: `TRN-2024-005`
   - Title: `First Aid Training`
   - Category: `Safety`
   - Scheduled Date: Select date/time
   - Duration: `240` (4 hours)
   - Instructor: `Jane Smith`
   - Certificate Validity: `24` months
4. Click "Schedule Training"
5. Training appears in the list

### Workflow 2: Check Your Training Compliance

1. Navigate to Dashboard (`/`)
2. View "My Training Compliance" section
3. See any missing or expiring competencies
4. Note any critical (red) or expiring soon (orange) items
5. Contact training coordinator to schedule required training

### Workflow 3: View Training Matrix

1. Navigate to `/training-matrix`
2. See all users and their competency status
3. Use category filter to focus on specific area
4. Hover over cells for detailed information
5. Identify users needing training (red/orange cells)

### Workflow 4: Monitor Expiring Certificates

1. Navigate to `/training`
2. View "Expiring Certificates" section (shown by default)
3. Adjust threshold (30/60/90/120/180 days) as needed
4. Toggle "Include Expired" to show/hide expired certificates
5. Note certificates requiring renewal
6. Plan renewal training sessions

### Workflow 5: Compliance Gap Analysis (Admin/Manager)

1. Navigate to `/role-training-requirements`
2. Click "Compliance Gaps" tab
3. Filter by role or competency
4. View users with missing required competencies
5. Note priority levels and deadlines
6. Schedule training to close gaps

---

## 🎨 UI Color Coding

### Training Status Badges
- **Blue** - Scheduled
- **Green** - Completed
- **Red** - Cancelled
- **Yellow** - Expired

### Certificate/Competency Urgency
- **Red** - Expired (immediate action required)
- **Orange/Yellow** - Critical (≤30 days)
- **Light Orange** - High (31-60 days)
- **Blue** - Medium (61+ days)
- **Green** - Active/Current

### Priority Levels
- **Red** - Critical (regulatory/safety)
- **Orange** - High
- **Blue** - Normal
- **Gray** - Low

---

## 📊 Data Models

### Training
```typescript
{
  id: number;
  trainingNumber: string;
  title: string;
  description?: string;
  category: string;
  duration?: number; // minutes
  instructor?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'expired';
  scheduledDate: Date;
  completedDate?: Date;
  expiryMonths?: number;
  createdBy: number;
}
```

### Certificate
```typescript
{
  id: number;
  certificateNumber: string;
  certificateName: string;
  userId: number;
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  certificateType: string;
  competencyArea?: string;
}
```

### Competency
```typescript
{
  id: number;
  competencyCode: string;
  name: string;
  category: string;
  proficiencyLevel?: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'active' | 'deprecated' | 'draft' | 'obsolete';
  hasExpiry: boolean;
  defaultValidityMonths?: number;
  isMandatory: boolean;
  isRegulatory: boolean;
}
```

### User Competency Assignment
```typescript
{
  id: number;
  userId: number;
  competencyId: number;
  acquiredDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  proficiencyLevel?: string;
  verified: boolean;
}
```

---

## 🔐 Permission Requirements

### All Authenticated Users Can:
- View trainings
- View training matrix
- View their own certificates
- View their own competencies
- Check their training compliance

### Admin & Manager Can Also:
- Create/update trainings
- Assign competencies to users
- Create/update role requirements
- View compliance gap reports
- Issue certificates

### Admin Only Can:
- Delete trainings (soft delete)
- Delete role requirements
- Manage user roles
- Access audit logs

---

## 🐛 Troubleshooting

### Issue: Can't see trainings
**Solution:**
1. Check you're logged in
2. Verify backend is running on port 3000
3. Check browser console for errors
4. Try refreshing the page

### Issue: Can't create training
**Solution:**
1. Verify you have Admin or Manager role
2. Ensure all required fields are filled
3. Check training number is unique
4. Verify date format is correct

### Issue: Missing competencies not showing
**Solution:**
1. Check role requirements are defined for your role
2. Verify competencies are marked as mandatory
3. Check threshold setting (increase days if needed)

### Issue: Training Matrix shows all red
**Solution:**
1. This means users haven't been assigned competencies
2. Navigate to competency assignment
3. Assign appropriate competencies to users

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review comprehensive documentation:
   - `P3_1_TRAINING_COMPETENCE_COMPLETION.md`
   - `TRAINING_MATRIX_IMPLEMENTATION.md`
   - `COMPETENCY_IMPLEMENTATION_SUMMARY.md`
3. Check API documentation:
   - `COMPETENCY_API_DOCUMENTATION.md`
   - `ROLE_TRAINING_REQUIREMENTS_API.md`
4. Contact system administrator

---

## 🚀 Quick Links

- **Main Documentation:** `P3_1_TRAINING_COMPETENCE_COMPLETION.md`
- **Security Info:** `P3_1_SECURITY_SUMMARY.md`
- **System README:** `README.md`
- **API Reference:** Backend API_DOCUMENTATION.md files

---

**Last Updated:** November 17, 2024  
**Version:** 1.0.0  
**Status:** Production Ready
