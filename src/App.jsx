import Pages from '@/pages/index.jsx';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';
import { NotificationBar } from '@/components/NotificationBar';
import { useEffect } from 'react';
import { setNotificationCallback } from '@/utils/toast';

function AppContent() {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Set up the notification callback for the toast utility
    setNotificationCallback((message, type, duration) => {
      addNotification(message, type, duration);
    });
  }, [addNotification]);

  return (
    <>
      <NotificationBar />
      <Pages />
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
