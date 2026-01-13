import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const ColumnModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title);
    setTitle("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Create New Column</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Column Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()} sx={{ bgcolor: '#263238' }}>
          Add Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnModal;