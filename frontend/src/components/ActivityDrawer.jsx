import React from 'react';
import {
  Drawer, Box, IconButton, useMediaQuery, useTheme,
  Fab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TimelineIcon from '@mui/icons-material/Timeline';
import ActivityFeed from './ActivityFeed';

const ActivityDrawer = ({ boardId, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = isMobile ? '100%' : 380;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: drawerWidth,
          boxShadow: isMobile ? 'none' : '0 -2px 8px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative'
      }}>
        {/* Close button */}
        {isMobile && (
          <Box sx={{ p: 1, textAlign: 'right' }}>
            <IconButton 
              onClick={onClose}
              size="small"
              aria-label="Close activity feed"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        
        {/* Activity Feed */}
        <ActivityFeed boardId={boardId} autoRefreshInterval={30000} />
      </Box>
    </Drawer>
  );
};

// FAB button for opening activity drawer on mobile
export const ActivityFAB = ({ onClick, unreadCount = 0 }) => (
  <Fab
    color="primary"
    aria-label="Activity feed"
    onClick={onClick}
    sx={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      bgcolor: '#263238',
      '&:hover': { bgcolor: '#37474f' },
      badge: unreadCount > 0 ? { badgeContent: unreadCount, color: 'error' } : undefined
    }}
  >
    <TimelineIcon />
  </Fab>
);

export default ActivityDrawer;
