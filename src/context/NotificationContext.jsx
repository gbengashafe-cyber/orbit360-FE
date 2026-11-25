import { createContext, useCallback, useContext, useMemo } from 'react';
import { toast } from 'sonner';

/*
 * Legacy toast API, kept so older pages keep working while they are migrated.
 * It now forwards to Sonner, the app's only toast system (DESIGN.md §6 Toasts).
 * New code should call `toast` from 'sonner' directly; don't use this context.
 */

const NotificationContext = createContext(null);

const showByType = {
  success: toast.success,
  error: (message, options) => toast.error(message, options),
  warning: toast.warning,
  info: toast.info,
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const addNotification = useCallback((message, type = 'success', duration) => {
    const show = showByType[type] ?? toast;
    // `duration` 0 used to mean "stay open"; errors stay open regardless.
    const options = duration === 0 ? { duration: Infinity } : duration ? { duration } : undefined;
    return show(message, options);
  }, []);

  const removeNotification = useCallback((id) => toast.dismiss(id), []);

  const value = useMemo(
    () => ({ notifications: [], addNotification, removeNotification }),
    [addNotification, removeNotification],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
