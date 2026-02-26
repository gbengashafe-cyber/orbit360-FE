import Pages from '@/pages/index.jsx';
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/context/NotificationContext';
import { NotificationBar } from '@/components/NotificationBar';

function App() {
  return (
    <NotificationProvider>
      <NotificationBar />
      <Pages />
      <Toaster />
    </NotificationProvider>
  );
}

export default App;
