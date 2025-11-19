import { ToastType } from '../contexts/ToastContext';

/**
 * Helper function to dispatch toast events from non-React modules (services, utilities, etc.)
 * This uses the CustomEvent system that ToastContext listens to
 */
export const dispatchToast = (message: string, type: ToastType = 'info', duration?: number) => {
  try {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message, type, duration },
      })
    );
  } catch (error) {
    console.error('Failed to dispatch toast:', error);
  }
};

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string, duration?: number) => {
  dispatchToast(message, 'success', duration);
};

/**
 * Show an error toast
 */
export const showErrorToast = (message: string, duration?: number) => {
  dispatchToast(message, 'error', duration);
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, duration?: number) => {
  dispatchToast(message, 'info', duration);
};

/**
 * Show a warning toast
 */
export const showWarningToast = (message: string, duration?: number) => {
  dispatchToast(message, 'warning', duration);
};

// Default message templates for CRUD operations
export const TOAST_MESSAGES = {
  SAVE_SUCCESS: 'Saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  CREATE_SUCCESS: 'Created successfully',
  ERROR: 'Error processing request',
  LOAD_ERROR: 'Failed to load data',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

/**
 * Show a toast for successful save operation
 */
export const showSaveSuccessToast = (itemName?: string) => {
  const message = itemName 
    ? `${itemName} ${TOAST_MESSAGES.SAVE_SUCCESS.toLowerCase()}` 
    : TOAST_MESSAGES.SAVE_SUCCESS;
  showSuccessToast(message);
};

/**
 * Show a toast for successful delete operation
 */
export const showDeleteSuccessToast = (itemName?: string) => {
  const message = itemName 
    ? `${itemName} ${TOAST_MESSAGES.DELETE_SUCCESS.toLowerCase()}` 
    : TOAST_MESSAGES.DELETE_SUCCESS;
  showSuccessToast(message);
};

/**
 * Show a toast for successful update operation
 */
export const showUpdateSuccessToast = (itemName?: string) => {
  const message = itemName 
    ? `${itemName} ${TOAST_MESSAGES.UPDATE_SUCCESS.toLowerCase()}` 
    : TOAST_MESSAGES.UPDATE_SUCCESS;
  showSuccessToast(message);
};

/**
 * Show a toast for successful create operation
 */
export const showCreateSuccessToast = (itemName?: string) => {
  const message = itemName 
    ? `${itemName} ${TOAST_MESSAGES.CREATE_SUCCESS.toLowerCase()}` 
    : TOAST_MESSAGES.CREATE_SUCCESS;
  showSuccessToast(message);
};
