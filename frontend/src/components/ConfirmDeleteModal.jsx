import React, { useEffect, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography 
} from '@mui/material';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  const dialogRef = useRef(null);

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
      PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      TransitionProps={{ timeout: 300 }}
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-description"
    >
      <DialogTitle id="confirm-delete-title">
        <Typography variant="h6" fontWeight="800">Confirm Deletion</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography id="confirm-delete-description" variant="body1">
          Are you sure you want to delete the column <strong>"{itemName}"</strong>? 
          This action cannot be undone and will remove all associated tasks.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="text"
          sx={{ 
            color: '#5e6c84', 
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: 'action.hover' },
            '&:focus-visible': { outline: '2px solid #263238', outlineOffset: '2px' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          sx={{ 
            bgcolor: '#d32f2f',
            textTransform: 'none', 
            fontWeight: 700,
            px: 3,
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: '#b71c1c', boxShadow: '0 4px 12px rgba(211,47,47,0.2)' },
            '&:active': { boxShadow: '0 1px 3px rgba(211,47,47,0.1)' },
            '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' }
          }}
        >
          Delete Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteModal;