
import Swal from 'sweetalert2';

// Types for notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'question';

interface NotificationOptions {
  title?: string;
  text: string;
  footer?: string;
  confirmButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  timer?: number;
  timerProgressBar?: boolean;
  backdrop?: boolean;
  toast?: boolean;
  width?: string | number;
  padding?: string | number;
  customClass?: {
    container?: string;
    popup?: string;
    header?: string;
    title?: string;
    closeButton?: string;
    icon?: string;
    image?: string;
    content?: string;
    input?: string;
    actions?: string;
    confirmButton?: string;
    cancelButton?: string;
    footer?: string;
  };
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Base colors from our palette
const colors = {
  success: '#62c97d', // Green
  error: '#ea384c', // Red
  warning: '#F97316', // Orange
  info: '#0EA5E9', // Blue
  question: '#9b87f5', // Purple/Crocus
};

// Default options for all notifications
const defaultOptions = {
  confirmButtonColor: colors.info,
  cancelButtonColor: '#6b7280', // Gray
  customClass: {
    popup: 'rounded-lg shadow-lg',
    title: 'text-lg font-medium',
    confirmButton: 'rounded-md',
    cancelButton: 'rounded-md',
  },
};

// Toast specific defaults
const toastDefaults = {
  toast: true,
  position: 'top-end' as const,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: 'auto',
  padding: '0.75rem',
};

// Function to show a standard notification
export const showNotification = (type: NotificationType, options: NotificationOptions) => {
  const { onConfirm, onCancel, ...swalOptions } = options;
  
  return Swal.fire({
    icon: type,
    iconColor: colors[type],
    ...defaultOptions,
    ...swalOptions,
  }).then((result) => {
    if (result.isConfirmed && onConfirm) {
      onConfirm();
    } else if (result.isDismissed && onCancel) {
      onCancel();
    }
    return result;
  });
};

// Toast notifications
export const showToast = (type: NotificationType, text: string, timer = 3000) => {
  return Swal.fire({
    icon: type,
    title: text,
    iconColor: colors[type],
    ...defaultOptions,
    ...toastDefaults,
    timer,
  });
};

// Confirmation dialog
export const showConfirmation = (options: NotificationOptions) => {
  return showNotification('question', {
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    cancelButtonText: options.cancelButtonText || 'No',
    ...options,
  });
};

// Success notification
export const showSuccess = (text: string, title = 'Success', options = {}) => {
  return showNotification('success', { title, text, ...options });
};

// Error notification
export const showError = (text: string, title = 'Error', options = {}) => {
  return showNotification('error', { title, text, ...options });
};

// Warning notification
export const showWarning = (text: string, title = 'Warning', options = {}) => {
  return showNotification('warning', { title, text, ...options });
};

// Info notification
export const showInfo = (text: string, title = 'Information', options = {}) => {
  return showNotification('info', { title, text, ...options });
};

// Toast shortcuts
export const successToast = (text: string) => showToast('success', text);
export const errorToast = (text: string) => showToast('error', text);
export const warningToast = (text: string) => showToast('warning', text);
export const infoToast = (text: string) => showToast('info', text);
