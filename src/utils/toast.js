// Toast utility that uses NotificationContext via a helper
let notificationCallback = null;

export const setNotificationCallback = (callback) => {
  console.log('🔧 setNotificationCallback called');
  notificationCallback = callback;
};

export const showToast = {
  success: (message, title = 'Success') => {
    console.log('🟢 showToast.success called:', { message, title, hasCallback: !!notificationCallback });
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'success', 3000);
    } else {
      console.warn('⚠️ notificationCallback not set!');
    }
  },

  error: (message, title = 'Error') => {
    console.log('🔴 showToast.error called:', { message, title, hasCallback: !!notificationCallback });
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'error', 4000);
    } else {
      console.warn('⚠️ notificationCallback not set!');
    }
  },

  info: (message, title = 'Info') => {
    console.log('🔵 showToast.info called:', { message, title, hasCallback: !!notificationCallback });
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'info', 3000);
    } else {
      console.warn('⚠️ notificationCallback not set!');
    }
  },

  warning: (message, title = 'Warning') => {
    console.log('🟡 showToast.warning called:', { message, title, hasCallback: !!notificationCallback });
    if (notificationCallback) {
      notificationCallback(`${title}: ${message}`, 'warning', 3500);
    } else {
      console.warn('⚠️ notificationCallback not set!');
    }
  },
};
