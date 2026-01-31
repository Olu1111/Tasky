import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const BoardCard = ({ board, onNavigate, onDelete, isAdmin }) => (
  <Card sx={{ borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardActionArea onClick={() => onNavigate(board._id)} sx={{ flexGrow: 1 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="700" sx={{ mb: 1 }}>
          {board.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {board.description || 'No description'}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, fontSize: '0.85rem', color: 'text.secondary' }}>
          <span>{board.columns?.length || 0} columns</span>
          <span>{board.ticketCount || 0} tasks</span>
        </Box>
      </CardContent>
    </CardActionArea>
    {isAdmin && (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(board._id);
          }}
          aria-label="Delete board"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    )}
  </Card>
);

export default React.memo(BoardCard);
