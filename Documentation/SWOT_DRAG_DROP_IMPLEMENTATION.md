# SWOT Analysis Drag-and-Drop Implementation

**Issue**: #243  
**Feature**: Enhanced SWOT Analysis with Drag-and-Drop Reordering  
**Date**: November 20, 2025  
**Version**: 1.1.0

## Overview

This implementation adds drag-and-drop functionality to the SWOT Analysis module, allowing users to:
- Reorder entries within each quadrant (Strengths, Weaknesses, Opportunities, Threats)
- Move entries between different quadrants
- Delete entries by dragging them to a delete zone
- Visual feedback during drag operations

## Changes Summary

### Database Changes

#### New Patch Script: `65_swot_display_order.sql`

**Location**: `backend/database/SetupScript/Patch/65_swot_display_order.sql`

**Changes**:
- Added `displayOrder` column (INT, NOT NULL) to `SwotEntries` table
- Initialized `displayOrder` for existing entries based on creation date
- Added index `IX_SwotEntries_Category_DisplayOrder` for performance optimization

**Migration**:
```sql
-- Run this patch script to update the database
sqlcmd -S <server> -d <database> -i backend/database/SetupScript/Patch/65_swot_display_order.sql
```

Or execute via the application's database patch tool.

### Backend Changes

#### 1. SwotModel.ts

**File**: `backend/src/models/SwotModel.ts`

**Interface Updates**:
```typescript
export interface SwotEntry {
  // ... existing fields
  displayOrder?: number;  // NEW
  // ... other fields
}
```

**Method Updates**:
- `create()`: Auto-assigns next `displayOrder` for the category if not provided
- `findAll()`: Orders results by `category, displayOrder, createdAt DESC`
- `reorder()`: NEW - Batch updates displayOrder for multiple entries using transactions

#### 2. swotController.ts

**File**: `backend/src/controllers/swotController.ts`

**New Function**: `reorderSwotEntries`
- Accepts array of `{id, displayOrder}` objects
- Validates input data
- Calls `SwotModel.reorder()` with transaction support
- Logs audit trail entry for reordering action

#### 3. swotRoutes.ts

**File**: `backend/src/routes/swotRoutes.ts`

**New Endpoint**:
```
POST /api/swot/reorder
```

**Authorization**: Admin or Manager role required

**Request Body**:
```json
{
  "orders": [
    { "id": 1, "displayOrder": 1 },
    { "id": 2, "displayOrder": 2 },
    { "id": 3, "displayOrder": 3 }
  ]
}
```

**Response**:
```json
{
  "message": "SWOT entries reordered successfully"
}
```

### Frontend Changes

#### 1. swotService.ts

**File**: `frontend/src/services/swotService.ts`

**Interface Updates**:
```typescript
export interface SwotEntry {
  // ... existing fields
  displayOrder?: number;  // NEW
}

export interface UpdateSwotEntryData {
  // ... existing fields
  displayOrder?: number;  // NEW
}
```

**New Function**: `reorderSwotEntries`
```typescript
export const reorderSwotEntries = async (
  orders: Array<{ id: number; displayOrder: number }>
): Promise<void>
```

#### 2. SwotAnalysis.tsx

**File**: `frontend/src/pages/SwotAnalysis.tsx`

**New State Variables**:
```typescript
const [draggedEntry, setDraggedEntry] = useState<SwotEntry | null>(null);
const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
const [isDraggingOutside, setIsDraggingOutside] = useState(false);
```

**New Handler Functions**:
- `handleDragStart`: Initiates drag operation, stores dragged entry
- `handleDragEnd`: Cleans up drag state
- `handleDragOver`: Provides visual feedback for valid drop zones
- `handleDragEnter`: Highlights target quadrant
- `handleDragLeave`: Removes highlight when leaving quadrant
- `handleDrop`: Executes reordering or category change
- `handleDeleteZoneDragOver`: Shows delete zone when dragging outside
- `handleDeleteZoneDrop`: Confirms and deletes entry

**Component Updates**:
- Added `draggable={canModify()}` to all SWOT entry elements
- Added `data-entry-id` attribute for drop target identification
- Added drag event handlers to all quadrants
- Added delete zone overlay that appears during drag operations

#### 3. SwotAnalysis.css

**File**: `frontend/src/styles/SwotAnalysis.css`

**New Styles**:

**Drag States**:
```css
.swot-entry[draggable="true"] - Cursor changes to move/grab
.swot-entry.dragging - Semi-transparent while being dragged
.swot-quadrant.drag-over - Highlighted with dashed border
```

**Delete Zone**:
```css
.delete-zone - Fixed overlay in center of screen
.delete-zone.active - Enlarged and more prominent when hovering
.delete-icon - Animated trash icon with shake effect
```

**Visual Indicators**:
- Grip dots indicator on hover (⋮⋮)
- Drop zone highlighting (blue dashed border)
- Smooth transitions and animations
- Responsive sizing for mobile devices

## Usage Guide

### For End Users

#### Reordering Entries Within a Quadrant

1. Hover over a SWOT entry to see the grip indicator (⋮⋮)
2. Click and hold on the entry
3. Drag it to the desired position within the same quadrant
4. Release to drop in the new position
5. The order is automatically saved

#### Moving Entries Between Quadrants

1. Click and hold on a SWOT entry
2. Drag it to a different quadrant (e.g., from Strengths to Opportunities)
3. The target quadrant will highlight with a blue dashed border
4. Release to drop in the new quadrant
5. The entry's category is automatically updated

#### Deleting Entries via Drag

1. Click and hold on a SWOT entry
2. Drag it away from all quadrants
3. A red delete zone will appear in the center of the screen
4. Drag the entry over the delete zone (it will enlarge and highlight)
5. Release to drop on the delete zone
6. Confirm the deletion in the popup dialog

**Note**: Only users with Admin role can delete entries via drag-and-drop.

### For Developers

#### Testing the Implementation

1. **Database Setup**:
   ```bash
   # Run the patch script
   sqlcmd -S localhost -d EQMS -i backend/database/SetupScript/Patch/65_swot_display_order.sql
   ```

2. **Backend Testing**:
   ```bash
   cd backend
   npm test
   ```

3. **Frontend Testing**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Manual Testing Checklist**:
   - [ ] Can drag entries within the same quadrant
   - [ ] Can move entries between different quadrants
   - [ ] Can delete entries by dragging to delete zone
   - [ ] Delete zone only appears for Admin users
   - [ ] Visual feedback works correctly
   - [ ] Changes persist after page reload
   - [ ] Works on mobile/tablet devices

#### API Endpoint Testing

**Reorder Endpoint**:
```bash
curl -X POST http://localhost:3000/api/swot/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "orders": [
      {"id": 1, "displayOrder": 1},
      {"id": 2, "displayOrder": 2}
    ]
  }'
```

## Security Considerations

### Role-Based Access Control

- **View**: All authenticated users can view SWOT entries
- **Drag/Reorder**: Admin and Manager roles only
- **Delete**: Admin role only (via drag or button)

### Audit Trail

All reordering and deletion operations are logged to the audit trail:
- **Action Category**: STRATEGIC_PLANNING
- **Entity Type**: SwotEntry
- **Operations Logged**: Reorder, Update, Delete

### Validation

Backend validates:
- User authentication and authorization
- Valid entry IDs
- Numeric displayOrder values
- Category constraints

## Performance Optimizations

1. **Database Indexing**:
   - Composite index on `(category, displayOrder)` for fast retrieval
   - Transaction-based batch updates for reordering

2. **Frontend Optimization**:
   - Minimal re-renders during drag operations
   - Debounced state updates
   - Efficient DOM queries using `data-entry-id` attributes

3. **Network Efficiency**:
   - Single API call for batch reordering
   - Optimistic UI updates with rollback on error

## Browser Compatibility

The implementation uses HTML5 Drag and Drop API, which is supported in:
- Chrome 4+
- Firefox 3.5+
- Safari 3.1+
- Edge (all versions)
- Opera 12+

**Mobile Support**: Touch-based dragging works on modern mobile browsers with touch event polyfills.

## Known Limitations

1. **Touch Devices**: Some older mobile browsers may have limited drag-and-drop support
2. **Large Lists**: Performance may degrade with 100+ entries in a single quadrant
3. **Concurrent Editing**: No real-time conflict resolution if multiple users edit simultaneously

## Future Enhancements

Potential improvements for future versions:
- [ ] Undo/Redo functionality for drag operations
- [ ] Multi-select drag for moving multiple entries at once
- [ ] Real-time updates via WebSocket for collaborative editing
- [ ] Keyboard shortcuts for reordering (Alt+Up/Down)
- [ ] Custom drag preview with entry details
- [ ] Drag between SWOT matrices (if multiple matrices feature is added)

## Troubleshooting

### Issue: Entries not draggable

**Solution**: Verify user has Admin or Manager role. Check browser console for errors.

### Issue: Order not persisting

**Solution**: 
1. Check network tab for failed API calls
2. Verify backend database connection
3. Check audit logs for error messages

### Issue: Delete zone not appearing

**Solution**: Verify user has Admin role. Delete zone only shows for admins during drag.

### Issue: Visual glitches during drag

**Solution**: 
1. Clear browser cache
2. Ensure latest CSS is loaded
3. Check for conflicting CSS from other modules

## API Reference

### POST /api/swot/reorder

**Description**: Batch update displayOrder for multiple SWOT entries

**Authorization**: Bearer token (Admin or Manager role)

**Request Body**:
```json
{
  "orders": [
    { "id": 1, "displayOrder": 1 },
    { "id": 2, "displayOrder": 2 }
  ]
}
```

**Success Response**:
```json
{
  "message": "SWOT entries reordered successfully"
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Orders must be an array"
}

// 401 Unauthorized
{
  "error": "User not authenticated"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}

// 500 Internal Server Error
{
  "error": "Failed to reorder SWOT entries"
}
```

## Rollback Instructions

If issues occur and rollback is needed:

1. **Revert Database Changes**:
   ```sql
   ALTER TABLE SwotEntries DROP COLUMN displayOrder;
   DROP INDEX IX_SwotEntries_Category_DisplayOrder ON SwotEntries;
   DELETE FROM DatabaseVersion WHERE version = '1.0.65';
   ```

2. **Revert Backend Code**:
   ```bash
   git revert <commit-hash>
   ```

3. **Clear Frontend Cache**:
   ```bash
   cd frontend
   npm run build
   ```

## Support

For issues or questions:
1. Check the application logs for error details
2. Review the audit trail for operation history
3. Verify database schema is up to date
4. Contact the development team

---

**Implementation Status**: ✅ Complete  
**Testing Status**: ⏳ Pending  
**Documentation Status**: ✅ Complete  
**Deployed**: ⏳ Pending deployment to production

