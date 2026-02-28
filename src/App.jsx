import { NotificationBar } from '@/components/NotificationBar';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';
import Pages from '@/pages/index.jsx';
import { setNotificationCallback } from '@/utils/toast';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

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
      <Toaster position="top-right" closeButton={true} richColors={true} />
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
