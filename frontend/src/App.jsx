import React, { useState, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import BoardsList from './pages/BoardsList';
import BoardViewPage from './pages/BoardViewPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const location = useLocation();
  
  // ATOMIC NULL STATE: Starts as null so Navbar remains hidden 
  // via CSS until we are 100% sure of the auth status.
  const [authState, setAuthState] = useState(null);

  useLayoutEffect(() => {
    // Synchronous check before the browser paints the first frame
    const isLoginPath = location.pathname === '/login';
    const hasToken = !!localStorage.getItem('token');
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthState(hasToken && !isLoginPath);
  }, [location.pathname]);

  return (
    <Box 
      // This attribute triggers the CSS rules you put in App.css
      data-auth={authState === null ? "null" : authState ? "true" : "false"}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Navbar authenticated={authState} />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/boards" element={<BoardsList />} />
            <Route path="/boards/:id" element={<BoardViewPage />} />
            <Route path="/my-tickets" element={<MyTicketsPage />} />
          </Routes>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <AppContent />
    </BrowserRouter>
  );
}