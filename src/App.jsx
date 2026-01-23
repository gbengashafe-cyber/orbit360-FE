import Pages from '@/pages/index.jsx';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import LoginPage from './pages/login/Login';
import { GlobalContextProvider } from './state/context';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
      <GlobalContextProvider>
        <Pages />
      </GlobalContextProvider>
      <Toaster />
    </>
  );
}

export default App;
