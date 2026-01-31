/**
 * Notification Utilities
 * Centralized toast/error notification system with dismissible notifications
 */

import { toast } from 'react-toastify';

/**
 * Show error notification with close button
 * @param {string} message - Error message to display
 * @param {object} options - Additional toast options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    closeButton: true,
    draggable: true,
    pauseOnHover: true,
    ...options
  });
};

/**
 * Show success notification
 * @param {string} message - Success message to display
 * @param {object} options - Additional toast options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    closeButton: true,
    draggable: true,
    ...options
  });
};

/**
 * Show warning notification
 * @param {string} message - Warning message to display
 * @param {object} options - Additional toast options
 */
export const showWarning = (message, options = {}) => {
  return toast.warning(message, {
    position: 'top-right',
    autoClose: 4000,
    closeButton: true,
    draggable: true,
    pauseOnHover: true,
    ...options
  });
};

/**
 * Show info notification
 * @param {string} message - Info message to display
 * @param {object} options - Additional toast options
 */
export const showInfo = (message, options = {}) => {
  return toast.info(message, {
    position: 'top-right',
    autoClose: 3500,
    closeButton: true,
    draggable: true,
    ...options
  });
};

/**
 * Network error handler with dismissible notification
 * @param {Error} error - Error object from fetch/API call
 * @param {string} context - Where error occurred (e.g., 'Loading boards')
 */
export const handleNetworkError = (error, context = '') => {
  let message = 'Network error occurred';

  if (error?.response?.status === 429) {
    message = '⏳ Too many requests. Please wait a moment and try again.';
  } else if (error?.response?.status === 401) {
    message = '🔒 Session expired. Please log in again.';
  } else if (error?.response?.status === 403) {
    message = '🚫 You don\'t have permission to perform this action.';
  } else if (error?.response?.status === 404) {
    message = '❌ Resource not found.';
  } else if (error?.response?.status === 500) {
    message = '⚠️ Server error. Please try again later.';
  } else if (error?.message?.includes('fetch')) {
    message = '🌐 Network connection failed. Check your internet.';
  } else if (error?.message) {
    message = error.message;
  }

  const fullMessage = context ? `${context}: ${message}` : message;
  
  showError(fullMessage, {
    autoClose: 5000
  });

  console.error(`[${context}]`, error);
};

/**
 * Dismiss all notifications
 */
export const dismissAllNotifications = () => {
  toast.dismiss();
};

/**
 * Dismiss specific notification by ID
 * @param {string|number} toastId - ID of toast to dismiss
 */
export const dismissNotification = (toastId) => {
  toast.dismiss(toastId);
};
