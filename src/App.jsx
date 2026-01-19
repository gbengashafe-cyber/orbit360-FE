import { Toaster } from '@/components/ui/toaster';
import Pages from '@/pages/index.jsx';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/login/Login';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
      <Pages />
      <Toaster />
    </>
  );
}

export default App;
