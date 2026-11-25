import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/context/NotificationContext';
import Pages from '@/pages/index.jsx';

function App() {
  return (
    <NotificationProvider>
      <Pages />
      <Toaster />
    </NotificationProvider>
  );
}

export default App;
