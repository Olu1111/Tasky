import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography 
} from '@mui/material';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight="800">Confirm Deletion</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete the column <strong>"{itemName}"</strong>? 
          This action cannot be undone and will remove all associated tasks.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#5e6c84', textTransform: 'none' }}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          sx={{ 
            bgcolor: '#d32f2f', // Standard Red for Delete actions
            textTransform: 'none', 
            fontWeight: 600,
            borderRadius: '8px',
            '&:hover': { bgcolor: '#b71c1c' } 
          }}
        >
          Delete Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteModal;