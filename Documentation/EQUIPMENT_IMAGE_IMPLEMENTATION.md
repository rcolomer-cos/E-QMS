# Equipment Image Upload Implementation

## Overview
Implemented equipment image upload feature with circular display and two-column form layout as part of Issue #249.

## Database Changes

### Patch 69: Add Equipment Image Support
**File:** `backend/database/SetupScript/Patch/69_add_equipment_image.sql`

- Added `imagePath NVARCHAR(500) NULL` column to `Equipment` table
- Updated DatabaseVersion to 69

**To Apply:**
```powershell
cd backend
$env:DB_SERVER='DESKTOP-VGQ077U\SQLEXPRESS'
$env:DB_DATABASE='E_QMS'
$env:DB_USER='sa'
$env:DB_PASSWORD='YOUR_PASSWORD'
sqlcmd -S $env:DB_SERVER -d $env:DB_DATABASE -U $env:DB_USER -P $env:DB_PASSWORD -i database/SetupScript/Patch/69_add_equipment_image.sql
```

## Backend Changes

### 1. Equipment Model (`backend/src/models/EquipmentModel.ts`)
- Added `imagePath?: string` to `Equipment` interface
- Updated `create()` method to include imagePath in INSERT statement
- Updated `update()` method automatically handles imagePath (dynamic field updates)

### 2. Upload Middleware (`backend/src/middleware/upload.ts`)
Added new equipment image upload configuration:
- **Storage location:** `uploads/equipment/`
- **Filename pattern:** `equipment-{timestamp}-{random}.{ext}`
- **Allowed types:** JPEG, JPG, PNG, GIF, WebP
- **Max file size:** 5MB
- **Export:** `equipmentImageUpload`

### 3. Equipment Controller (`backend/src/controllers/equipmentController.ts`)
Updated both create and update handlers:
- **Create:** Sets `equipment.imagePath` from `req.file` if present
- **Update:** Sets `updates.imagePath` from `req.file` if present
- Path format: `uploads/equipment/{filename}`

### 4. Equipment Routes (`backend/src/routes/equipmentRoutes.ts`)
Added image upload middleware to routes:
```typescript
router.post('/', ..., equipmentImageUpload.single('image'), ..., createEquipment);
router.put('/:id', ..., equipmentImageUpload.single('image'), ..., updateEquipment);
```

## Frontend Changes

### 1. New Component: AddEditEquipment
**File:** `frontend/src/pages/AddEditEquipment.tsx`

**Features:**
- Single component handles both add and edit modes (based on URL parameter)
- Two-column layout for better UX
- Image upload with compression using `browser-image-compression`
- Circular image preview (200x200px)
- Image optional but recommended
- Comprehensive form validation

**Layout Structure:**
1. **Top Section:** Equipment image upload with circular preview
2. **Left Column:** Basic Information
   - Equipment Number, Name, Description
   - Status, Location, Department
   - Responsible Person
3. **Right Column:** Technical Details
   - Manufacturer, Model, Serial Number
   - Purchase Date
   - Calibration & Maintenance Intervals

**Image Handling:**
- Client-side compression (max 1MB, 800px max dimension)
- Real-time preview after selection
- Remove image capability
- Circular display (border-radius: 50%)

### 2. Updated Equipment Service
**File:** `frontend/src/services/equipmentService.ts`
- Added `imagePath?: string` to `Equipment` interface

### 3. Updated Equipment List Page
**File:** `frontend/src/pages/Equipment.tsx`
- Removed modal-based add/edit
- Added `useNavigate` import
- Updated `handleAdd()` to navigate to `/equipment/add`
- Updated `handleEdit(id)` to navigate to `/equipment/edit/${id}`

### 4. New Stylesheet
**File:** `frontend/src/styles/AddEditEquipment.css`

**Key Styles:**
- `.form-columns`: Two-column grid layout (1fr 1fr)
- `.circular-image`: 200x200px circular image (border-radius: 50%)
- `.image-placeholder`: Gray placeholder when no image
- `.btn-remove-image`: Red X button overlay on image
- Responsive: Single column on tablets/mobile

### 5. Updated Routes
**File:** `frontend/src/App.tsx`

Added routes:
```typescript
<Route path="equipment/add" element={<AddEditEquipment />} />
<Route path="equipment/edit/:id" element={<AddEditEquipment />} />
```

## Features Implemented

### ✅ Image Upload
- Client-side compression using `browser-image-compression`
- Automatic resize to 800px max dimension
- Automatic compression to 1MB max
- Server-side validation (5MB limit)
- Only image formats accepted

### ✅ Circular Image Display
- 200x200px circular preview
- CSS border-radius: 50%
- Placeholder when no image
- Remove button overlay

### ✅ Two-Column Layout
- Left column: Basic information
- Right column: Technical details
- Responsive design (stacks on mobile)
- Better UX for data entry

### ✅ Form Features
- Pre-populated in edit mode
- All existing equipment fields supported
- Validation maintained
- Success/error toasts
- Cancel navigation

## Testing Checklist

### Backend
- [ ] Apply Patch 69 database migration
- [ ] Verify `imagePath` column exists in Equipment table
- [ ] Test POST /api/equipment with image upload
- [ ] Test PUT /api/equipment/:id with image upload
- [ ] Verify images stored in `uploads/equipment/` directory
- [ ] Test file type validation (reject non-images)
- [ ] Test file size limits (5MB max)

### Frontend
- [ ] Navigate to /equipment/add
- [ ] Upload an equipment image
- [ ] Verify circular preview displays
- [ ] Submit form and verify equipment created
- [ ] Edit existing equipment
- [ ] Change equipment image
- [ ] Remove equipment image
- [ ] Verify form validation works
- [ ] Test on mobile (responsive layout)

## File Changes Summary

### Created
1. `frontend/src/pages/AddEditEquipment.tsx` (470 lines)
2. `frontend/src/styles/AddEditEquipment.css` (240 lines)
3. `backend/database/SetupScript/Patch/69_add_equipment_image.sql`

### Modified
1. `frontend/src/pages/Equipment.tsx` - Navigation to dedicated pages
2. `frontend/src/services/equipmentService.ts` - Added imagePath to interface
3. `frontend/src/App.tsx` - Added routes for add/edit pages
4. `backend/src/models/EquipmentModel.ts` - Added imagePath field
5. `backend/src/controllers/equipmentController.ts` - Image upload handling
6. `backend/src/routes/equipmentRoutes.ts` - Added upload middleware
7. `backend/src/middleware/upload.ts` - Equipment image configuration

## Dependencies Used
- **browser-image-compression** (already installed): v2.0.2
- **multer** (already installed): v2.0.2

## Configuration
No environment variables needed. Images stored in `uploads/equipment/` automatically created by middleware.

## Next Steps
1. Apply database migration (Patch 69)
2. Restart backend server
3. Test equipment creation with image
4. Test equipment editing with image
5. Consider adding image to equipment list view (optional)
6. Consider adding image to equipment detail view (optional)

## Notes
- Image upload is optional but recommended
- Images are automatically compressed client-side before upload
- Server stores original compressed images (no further processing)
- Existing equipment without images will show placeholder
- Two-column layout improves data entry UX significantly
- Modal-based add/edit completely replaced with dedicated pages
