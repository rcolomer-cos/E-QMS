# Toast Notification System - Developer Guide

## Overview

The E-QMS application includes a comprehensive toast notification system for providing user feedback on CRUD operations, errors, and other important events. The system is designed to be accessible, consistent, and easy to use throughout the application.

## Features

- ✅ **Accessible**: WCAG AA compliant colors, proper ARIA attributes
- ✅ **Consistent**: Standardized messages with configurable overrides
- ✅ **Visual Feedback**: Smooth animations, hover effects, auto-dismiss
- ✅ **Developer-Friendly**: Helper methods for common operations
- ✅ **Global**: Works from both React components and non-React modules

## Toast Types

The system supports four toast types:

- **Success** (green): Successful operations
- **Error** (red): Failed operations or errors
- **Warning** (orange): Warnings or cautionary messages
- **Info** (blue): Informational messages

## Usage in React Components

### Basic Usage

```tsx
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully');
    } catch (error) {
      toast.error('Failed to save data');
    }
  };
}
```

### Using Convenience Methods

The toast context provides convenience methods for common CRUD operations:

```tsx
const toast = useToast();

// Create operation
toast.showCreateSuccess('User'); // Shows "User created successfully"

// Update operation
toast.showUpdateSuccess('Department'); // Shows "Department updated successfully"

// Delete operation
toast.showDeleteSuccess('Equipment'); // Shows "Equipment deleted successfully"

// Save operation (generic)
toast.showSaveSuccess(); // Shows "Saved successfully"

// Error with default message
toast.showError(); // Shows "Error processing request"

// Error with custom message
toast.showError('Invalid input data');
```

### Custom Duration

By default, toasts auto-dismiss after 3.5 seconds. You can customize this:

```tsx
toast.success('Message', 5000); // Shows for 5 seconds
toast.error('Critical error', 0); // Stays until manually dismissed
```

## Usage in Non-React Modules

For service files, utilities, or any non-React code, use the toast helper functions:

```typescript
import { showSuccessToast, showErrorToast } from '../utils/toastHelper';

export const saveData = async (data: any) => {
  try {
    await api.post('/data', data);
    showSuccessToast('Data saved successfully');
  } catch (error) {
    showErrorToast('Failed to save data');
  }
};
```

### Available Helper Functions

```typescript
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  showSaveSuccessToast,
  showDeleteSuccessToast,
  showUpdateSuccessToast,
  showCreateSuccessToast,
} from '../utils/toastHelper';

// Basic toasts
showSuccessToast('Operation completed');
showErrorToast('Operation failed');
showInfoToast('Processing...');
showWarningToast('Please review before submitting');

// CRUD operation toasts
showCreateSuccessToast('Item'); // "Item created successfully"
showUpdateSuccessToast('Record'); // "Record updated successfully"
showDeleteSuccessToast('File'); // "File deleted successfully"
showSaveSuccessToast(); // "Saved successfully"
```

## Default Message Templates

The system includes predefined messages for common scenarios:

```typescript
DEFAULT_MESSAGES = {
  SAVE_SUCCESS: 'Saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  CREATE_SUCCESS: 'Created successfully',
  ERROR: 'Error processing request',
  LOAD_ERROR: 'Failed to load data',
  NETWORK_ERROR: 'Network error. Please check your connection.',
}
```

## Best Practices

### 1. Use Specific Messages

```tsx
// ❌ Not recommended
toast.success('Success');

// ✅ Recommended
toast.success('User created successfully');
```

### 2. Use Convenience Methods

```tsx
// ❌ Verbose
toast.success('CAPA created successfully');

// ✅ Concise
toast.showCreateSuccess('CAPA');
```

### 3. Don't Duplicate Error Messages

The API interceptor already shows toast notifications for HTTP errors. Only add explicit error toasts when you need custom messaging:

```tsx
// ❌ Redundant - API interceptor handles this
try {
  await api.get('/data');
} catch (error) {
  toast.error('Failed to load data'); // Shown twice!
}

// ✅ Let interceptor handle generic errors
try {
  await api.get('/data');
} catch (error) {
  // Only handle error logic, toast already shown
  setError('Failed to load data');
}

// ✅ Or provide specific context
try {
  await api.get('/critical-data');
} catch (error) {
  toast.error('Unable to load critical system data. Please contact support.');
}
```

### 4. Group Related Operations

```tsx
const handleBulkDelete = async (ids: number[]) => {
  try {
    await Promise.all(ids.map(id => deleteItem(id)));
    toast.success(`${ids.length} items deleted successfully`);
  } catch (error) {
    toast.error('Failed to delete some items');
  }
};
```

### 5. Provide Context in Long Operations

```tsx
const handleImport = async (file: File) => {
  toast.info('Importing data...');
  try {
    await importData(file);
    toast.success('Data imported successfully');
  } catch (error) {
    toast.error('Failed to import data');
  }
};
```

## Accessibility Features

The toast system includes several accessibility features:

- **ARIA Roles**: `role="alert"` for proper screen reader announcement
- **ARIA Live Regions**: `aria-live="assertive"` for errors, `"polite"` for other types
- **Keyboard Navigation**: Focus management and dismissal support
- **Color Contrast**: WCAG AA compliant color combinations
- **Visual Indicators**: Color + border + animation for better visibility

## Styling

Toast styles are defined in `/frontend/src/styles/Toast.css`. Key features:

- Slide-in animation from the right
- Hover effect for better interactivity
- Bottom-right positioning (can be customized)
- Responsive max-width
- Smooth transitions

## Integration with Existing Pages

Toast notifications have been integrated into key pages:

- ✅ **Departments**: Create, update, delete operations
- ✅ **CAPA**: Create, update, complete, verify, attachments
- ✅ **CAPADetail**: Full CRUD with status updates
- ✅ **Users**: Delete, role updates
- ✅ **Equipment**: Create, update, delete, QR regeneration
- ✅ **NCR**: Create operations
- ✅ **Documents**: Load error handling

## Troubleshooting

### Toast not appearing

1. Verify `ToastProvider` wraps your component in the component tree
2. Check that you're using the correct import: `import { useToast } from '../contexts/ToastContext'`
3. For non-React modules, ensure you're using the helper functions from `toastHelper.ts`

### Multiple toasts for same error

The API interceptor automatically shows toasts for HTTP errors. Remove explicit toast calls in catch blocks unless you need custom messaging.

### Toast appearing too briefly

Increase the duration parameter:
```tsx
toast.success('Message', 5000); // 5 seconds
```

## Future Enhancements

Potential improvements for future iterations:

- Toast position configuration (top/bottom, left/right)
- Toast stacking limits
- Action buttons in toasts
- Progress indicators for long operations
- Sound notifications (optional)
- Persistent toasts for critical errors

## Related Files

- **Context**: `/frontend/src/contexts/ToastContext.tsx`
- **Component**: `/frontend/src/components/ToastContainer.tsx`
- **Styles**: `/frontend/src/styles/Toast.css`
- **Helper**: `/frontend/src/utils/toastHelper.ts`
- **API Interceptor**: `/frontend/src/services/api.ts`
