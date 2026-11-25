import { notificationService } from '@/api/notification.service';
import { shouldPresentRealtimeAlert, suppressRealtimeAlert as registerSuppressedRealtimeAlert } from '@/notifications/realtime-presentation';
import { useGlobalContext } from '@/state/context';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const NotificationCenterContext = createContext(null);
const useCenter = () => useContext(NotificationCenterContext);

export function NotificationCenterProvider({ children }) {
  const { currentUser } = useGlobalContext();
  const [unread, setUnread] = useState({ total: 0, byCategory: {} });
  const seenIds = useRef(new Set());
  const suppressedAlertKeys = useRef(new Set());
  const userKey = currentUser?.id ?? currentUser?.email;

  const refreshUnread = useCallback(async () => {
    if (!userKey) return;
    const response = await notificationService.getUnreadCount();
    setUnread(response?.data ?? { total: 0, byCategory: {} });
  }, [userKey]);

  useEffect(() => {
    if (!userKey) {
      setUnread({ total: 0, byCategory: {} });
      seenIds.current.clear();
      suppressedAlertKeys.current.clear();
      return undefined;
    }
    let active = true;
    let inFlight = false;
    const deliveredIds = seenIds.current;
    const suppressedKeys = suppressedAlertKeys.current;
    const poll = async () => {
      if (!active || document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      try {
        const response = await notificationService.getRealtime();
        if (!active) return;
        const alerts = response?.data ?? [];
        for (const alert of alerts) {
          if (!shouldPresentRealtimeAlert(deliveredIds, suppressedKeys, alert)) continue;
          toast(alert.title, { description: alert.message, duration: 7000 });
          refreshUnread().catch(() => {});
        }
        if (alerts.length) {
          await notificationService.acknowledgeRealtime(alerts.map(({ id }) => id));
        }
      } catch {
        // Keep the alert polling loop quiet; the shared authenticated API client handles session expiry.
      } finally {
        inFlight = false;
      }
    };
    let timer;
    const schedule = () => {
      clearInterval(timer);
      if (document.visibilityState === 'visible') {
        poll();
        timer = window.setInterval(poll, 30000);
      }
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    refreshUnread().catch(() => {});
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', schedule);
      deliveredIds.clear();
      suppressedKeys.clear();
    };
  }, [userKey, refreshUnread]);

  const suppressRealtimeAlert = useCallback((alert) => {
    registerSuppressedRealtimeAlert(suppressedAlertKeys.current, alert);
  }, []);

  const value = useMemo(() => ({ unread, refreshUnread, suppressRealtimeAlert }), [unread, refreshUnread, suppressRealtimeAlert]);
  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>;
}

export const useNotificationCenter = () => {
  const context = useCenter();
  if (!context) throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  return context;
};
