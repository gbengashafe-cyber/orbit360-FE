// Toast utility that uses NotificationContext via a helper
let notificationCallback = null;

export const setNotificationCallback = (callback) => {
  notificationCallback = callback;
};

export const showToast = {
  success: (message, title = 'Success') => {
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'success', 3000);
    }
  },

  error: (message, title = 'Error') => {
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'error', 4000);
    }
  },

  info: (message, title = 'Info') => {
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'info', 3000);
    }
  },

  warning: (message, title = 'Warning') => {
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'warning', 3500);
    }
    Exit Process & Offboarding Form
  },
};
