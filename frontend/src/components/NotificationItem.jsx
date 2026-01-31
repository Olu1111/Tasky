import React from 'react';
import { MenuItem, Typography, Box } from '@mui/material';

const NotificationItem = ({ notification, onClick }) => {
  const { user, action, target, time, isRead } = notification;

  const getActionText = (actionType) => {
    switch (actionType) {
      // Ticket Actions
      case 'ticket.create': return 'created task';
      case 'ticket.move':   return 'moved task';
      case 'ticket.update': return 'updated task';
      case 'ticket.delete': return 'deleted task';
      
      // Column Actions
      case 'column.create': return 'added column';
      case 'column.update': return 'renamed column';
      case 'column.delete': return 'removed column';

      // Board Actions
      case 'board.create': return 'created board';
      case 'board.update': return 'updated board';
      
      // Comment Actions
      case 'comment.add':    return 'commented on';
      case 'comment.delete': return 'removed a comment from';

      // Fallback for old simple strings
      case 'created': return 'created';
      case 'moved':   return 'moved';
      default: return actionType.includes('.') ? actionType.split('.')[1] : actionType;
    }
  };

  return (
    <MenuItem 
      onClick={onClick} 
      sx={{ 
        py: 1.5, px: 2,
        backgroundColor: isRead ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        borderBottom: '1px solid #eee', whiteSpace: 'normal'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.4 }}>
          <b>{user}</b> {getActionText(action)} <b>{target}</b>
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {time}
      </Typography>
    </MenuItem>
  );
};

export default React.memo(NotificationItem);