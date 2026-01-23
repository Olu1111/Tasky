import React, { useState, useEffect, useCallback } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge, Menu, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import NotificationItem from './NotificationItem';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { boardId } = useParams();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const open = Boolean(anchorEl);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!boardId || !token) {
      if (notifications.length > 0) setNotifications([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:4000/api/activity/boards/${boardId}/activity?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
if (result.success) {
  const formatted = result.data.map(log => ({
    id: log._id,
    user: log.userId?.username || 'System',
    action: log.action, // Pass the dot-notation string (e.g. "column.create")
    target: log.entityName || log.entityType, // Uses the name saved in the controller
    time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: false 
  }));
  setNotifications(formatted);
}
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]); 

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]); 

  const handleOpenNotifications = (event) => setAnchorEl(event.currentTarget);
  const handleCloseNotifications = () => setAnchorEl(null);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setNotifications([]);
    navigate('/login');
  };

  const hasToken = !!localStorage.getItem('token');
  const isLoginPage = location.pathname === '/login';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppBar position="static" sx={{ backgroundColor: '#263238', height: '64px', boxShadow: 'none' }}>
      <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: 4 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '150px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, userSelect: 'none', cursor: 'default' }}>
            Tasky
          </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
          {hasToken && <GlobalSearch />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: '360px', justifyContent: 'flex-end' }}>
          {hasToken ? (
            <>
              <IconButton color="inherit" onClick={handleOpenNotifications} sx={{ mr: 1 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <Button color="inherit" onClick={() => navigate('/my-tickets')}>My Tickets</Button>
              <Button color="inherit" onClick={() => navigate('/boards')}>Boards</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseNotifications}
                PaperProps={{ 
                  sx: { width: 340, maxHeight: 450, mt: 1.5, borderRadius: 2, boxShadow: 3 } 
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="700">Notifications</Typography>
                  {unreadCount > 0 && (
                    <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: 'none' }}>
                      Mark all as read
                    </Button>
                  )}
                </Box>
                <Divider />
                
                <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <NotificationItem 
                        key={n.id} 
                        notification={n} 
                        onClick={handleCloseNotifications} 
                      />
                    ))
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No activity in this board yet</Typography>
                    </Box>
                  )}
                </Box>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              disabled={isLoginPage}
              sx={{ "&.Mui-disabled": { color: '#ffffff', opacity: 1 } }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}