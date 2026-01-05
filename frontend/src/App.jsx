import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import BoardsList from './pages/BoardsList';
import BoardViewPage from './pages/BoardViewPage';

function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        
        <Routes>
          {/* If user goes to root "/", redirect them to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/boards" element={<BoardsList />} />
          <Route path="/board/:id" element={<BoardViewPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;