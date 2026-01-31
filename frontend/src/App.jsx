import React, { useState, useLayoutEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/mobile.css';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ErrorBoundary from './components/ErrorBoundary';
import { RoleProvider, useRole } from './hooks/useRole.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Code splitting: Lazy load heavy route components
const BoardsList = lazy(() => import('./pages/BoardsList'));
const BoardViewPage = lazy(() => import('./pages/BoardViewPage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Admin route protection wrapper
function AdminRouteGuard() {
  const { getRole, user } = useRole();
  const navigate = useNavigate();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (err) {
      return null;
    }
  })();
  const role = getRole() || storedUser?.role;
  const hasToken = !!localStorage.getItem('token');

  React.useEffect(() => {
    if (!hasToken) {
      navigate('/login', { replace: true });
      return;
    }

    if (role && role !== 'admin') {
      navigate('/boards', { replace: true });
    }
  }, [hasToken, role, navigate]);

  if (hasToken && !role) return null;

  return role === 'admin' ? <AdminPage /> : null;
}

function AppContent() {
  const location = useLocation();
  const searchInputRef = useRef(null);
  const userFetchedRef = useRef(false);
  
  // ATOMIC NULL STATE: Starts as null so Navbar remains hidden 
  // via CSS until we are 100% sure of the auth status.
  const [authState, setAuthState] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (err) {
      return null;
    }
  });

  useLayoutEffect(() => {
    // Synchronous check before the browser paints the first frame
    const isLoginPath = location.pathname === '/login';
    const hasToken = !!localStorage.getItem('token');
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthState(hasToken && !isLoginPath);

    if (!hasToken) {
      setUser(null);
    }

    // Fetch user with role/permissions ONCE (avoid repeated fetches)
    if (hasToken && !isLoginPath && !userFetchedRef.current) {
      userFetchedRef.current = true;
      fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.json())
        .then(json => {
          if (json.ok) {
            setUser(json.data);
            localStorage.setItem('user', JSON.stringify(json.data));
          }
        })
        .catch(err => console.error('Failed to fetch user role:', err));
    }
  }, [location.pathname]);

  // Keyboard shortcuts
  useLayoutEffect(() => {
    const handleKeyDown = (e) => {
      // / to focus search (skip if in input already)
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <RoleProvider user={user}>
      <Box 
        // This attribute triggers the CSS rules you put in App.css
        data-auth={authState === null ? "null" : authState ? "true" : "false"}
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Navbar authenticated={authState} searchInputRef={searchInputRef} />

        <Box component="main" sx={{ flexGrow: 1 }}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/boards" element={<BoardsList />} />
                <Route path="/boards/:id" element={<BoardViewPage />} />
                <Route path="/my-tickets" element={<MyTicketsPage />} />
                <Route path="/admin" element={<AdminRouteGuard />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </RoleProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <ToastContainer 
        position="top-right" 
        autoClose={4000} 
        hideProgressBar={false}
        closeButton={true}
        draggable={true}
        pauseOnHover={true}
        theme="light"
      />
      <AppContent />
    </BrowserRouter>
  );
}