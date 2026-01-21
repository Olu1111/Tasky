import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLoggedIn = !!localStorage.getItem('token');
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#263238', height: '64px', boxShadow: 'none' }}>
      <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: 4 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '150px' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800,
              userSelect: 'none',
              cursor: 'default'
            }}
          >
            Tasky
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
          {isLoggedIn && <GlobalSearch />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, minWidth: '150px', justifyContent: 'flex-end' }}>
          {isLoggedIn ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/boards')} 
              >
                Boards
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout} 
              >
                Logout
              </Button>
            </>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              disabled={isLoginPage}
              sx={{ 
                "&.Mui-disabled": { color: '#ffffff', opacity: 1 } 
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}