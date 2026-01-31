import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge, Menu, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import NotificationItem from './NotificationItem';
import { useRole } from '../hooks/useRole.jsx';
import { apiClient } from '../utils/apiClient';

export default function Navbar({ authenticated, searchInputRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getRole } = useRole();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const lastDataRef = useRef(""); 

  const pathParts = location.pathname.split('/');
  const boardId = pathParts[1] === 'boards' && pathParts[2] ? pathParts[2] : null;

  const fetchNotifications = useCallback(async () => {
    if (authenticated !== true || !boardId) {
      if (notifications.length > 0) setNotifications([]);
      return;
    }

    try {
      const response = await apiClient.get(`/boards/${boardId}/activity?limit=10`);
      if (response?.ok) {
        const result = await response.json();
        const dataString = JSON.stringify(result.data);
        
        if (dataString !== lastDataRef.current) {
          lastDataRef.current = dataString;
          setNotifications(result.data.map(log => ({
            id: log._id,
            user: log.userId?.username || 'System',
            action: log.action,
            target: log.entityName || log.entityType,
            time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false 
          })));
        }
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  }, [authenticated, boardId, notifications.length]);

  useEffect(() => {
    if (authenticated === true && boardId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 60000);
      return () => clearInterval(timer);
    }
  }, [authenticated, boardId, fetchNotifications]);

  // RESTORED: Clear notifications logic
  const handleClearNotifications = async () => {
    try {
      const response = await apiClient.post(`/boards/${boardId}/activity/clear`);
      if (response?.ok) {
        setNotifications([]);
        lastDataRef.current = "";
        setAnchorEl(null);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setNotifications([]);
    lastDataRef.current = "";
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#263238', height: '64px', boxShadow: 'none' }}>
      <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: 4 }}>
        
        <Typography 
          variant="h6" 
          sx={{ fontWeight: 800, cursor: 'pointer', flexShrink: 0 }} 
          onClick={() => navigate(authenticated === true ? '/boards' : '/login')}
        >
          Tasky
        </Typography>

        <Box className="auth-sensitive" sx={{ display: 'flex', flex: 1, alignItems: 'center', height: '100%' }}>
          
          <Box sx={{ flex: 2 }} />

          <Box 
            className="authenticated-only" 
            sx={{ 
              flex: 5, 
              display: 'flex', 
              justifyContent: 'flex-start', 
              mr: 20, 
              maxWidth: '1000px',
              '& > *': { width: '100% !important' } 
            }}
          >
            {authenticated === true && <GlobalSearch />}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {authenticated === true && (
              <Box className="authenticated-only" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                
                <Button color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => navigate('/my-tickets')}>My Tickets</Button>
                <Button color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => navigate('/boards')}>Boards</Button>
                {getRole() === 'admin' && (
                  <Button 
                    color="inherit" 
                    startIcon={<AdminPanelSettingsIcon />}
                    sx={{ whiteSpace: 'nowrap' }} 
                    onClick={() => navigate('/admin')}
                  >
                    Admin
                  </Button>
                )}
                <Button color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={handleLogout}>Logout</Button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{ sx: { width: 340, mt: 1.5, borderRadius: 2 } }}
                >
                  {/* RESTORED: Header with Clear All button */}
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="700">Activity</Typography>
                    {notifications.length > 0 && (
                      <Button 
                        size="small" 
                        onClick={handleClearNotifications} 
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#263238' }}
                      >
                        Clear All
                      </Button>
                    )}
                  </Box>
                  <Divider />
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                    ) : (
                      <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>All caught up!</Typography>
                    )}
                  </Box>
                </Menu>

              </Box>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}