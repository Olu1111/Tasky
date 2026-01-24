import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge, Menu, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import NotificationItem from './NotificationItem';
import { apiClient } from '../utils/apiClient';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  const pathParts = location.pathname.split('/');
  const boardId = pathParts[1] === 'boards' && pathParts[2] ? pathParts[2] : null;

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const lastDataRef = useRef(""); 

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn || !boardId) {
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
  }, [boardId, isLoggedIn, notifications.length]); 

  useEffect(() => {
    if (isLoggedIn && boardId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 60000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn, boardId, fetchNotifications]);

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
        <Typography variant="h6" sx={{ fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate('/boards')}>Tasky</Typography>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {isLoggedIn && <GlobalSearch />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <Button color="inherit" onClick={() => navigate('/my-tickets')}>My Tickets</Button>
              <Button color="inherit" onClick={() => navigate('/boards')}>Boards</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { width: 340, mt: 1.5, borderRadius: 2 } }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="700">Activity</Typography>
                  {notifications.length > 0 && (
                    <Button size="small" onClick={handleClearNotifications} sx={{ textTransform: 'none' }}>Clear All</Button>
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
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}