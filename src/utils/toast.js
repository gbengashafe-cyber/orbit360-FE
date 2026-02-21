import { toast } from 'sonner';

export const showToast = {
  success: (message, title = 'Success') => {
    toast.success(title, {
      description: message,
      duration: 3000,
    });
  },

  error: (message, title = 'Error') => {
    toast.error(title, {
      description: message,
      duration: 4000,
    });
  },

  info: (message, title = 'Info') => {
    toast.info(title, {
      description: message,
      duration: 3000,
    });
  },

  warning: (message, title = 'Warning') => {
    toast.warning(title, {
      description: message,
      duration: 3500,
    });
  },
};
