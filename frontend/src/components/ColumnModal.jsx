import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const ColumnModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const dialogRef = useRef(null);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title);
    setTitle("");
    onClose();
  };

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    dialogRef.current.addEventListener('keydown', handleEscapeKey);
    return () => dialogRef.current?.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  return (
    <Dialog 
      ref={dialogRef}
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '12px' } }}
      TransitionProps={{ timeout: 300 }}
      aria-labelledby="column-modal-title"
    >
      <DialogTitle id="column-modal-title" sx={{ fontWeight: 800 }}>Create New Column</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Column Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          variant="outlined"
          inputProps={{ 'aria-label': 'Column title' }}
          sx={{ 
            mt: 1,
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#263238' },
              '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(38,50,56,0.1)' }
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="text"
          sx={{ 
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: 'action.hover' },
            '&:focus-visible': { outline: '2px solid #263238', outlineOffset: '2px' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title.trim()} 
          sx={{ 
            bgcolor: '#263238',
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            '&:hover:not(:disabled)': { bgcolor: '#37474f', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
            '&:active:not(:disabled)': { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
            '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' }
          }}
        >
          Add Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnModal;