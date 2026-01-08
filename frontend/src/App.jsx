import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import BoardsList from './pages/BoardsList';
import BoardViewPage from './pages/BoardViewPage';
import ErrorBoundary from './components/ErrorBoundary';

// --- NEW IMPORTS ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      {/* GLOBAL TOAST CONTAINER */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        {/* Everything inside this Box is protected by the Error Boundary */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/boards" element={<BoardsList />} />
              <Route path="/boards/:id" element={<BoardViewPage />} />
            </Routes>
          </ErrorBoundary>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;