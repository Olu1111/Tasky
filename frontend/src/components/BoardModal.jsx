import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box 
} from '@mui/material';

const BoardModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title);
    setTitle(""); // Reset for next time
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="800">Create New Board</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box mt={1}>
          <TextField
            autoFocus
            label="Board Title"
            placeholder="e.g., Marketing Project"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#5e6c84', textTransform: 'none' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title.trim()}
          sx={{ 
            bgcolor: '#263238', 
            textTransform: 'none', 
            fontWeight: 700,
            borderRadius: '8px',
            '&:hover': { bgcolor: '#1c252a' } 
          }}
        >
          Create Board
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardModal;