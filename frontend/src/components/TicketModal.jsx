import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, MenuItem 
} from '@mui/material';

// Mock data for the assignee dropdown
const TEAM_MEMBERS = ['Keyon', 'Manny', 'Olu'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const TicketModal = ({ isOpen, onClose, onCreate, columnTitle }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");

  const handleSubmit = () => {
    // Form validation: ensure title and assignee are present
    if (!title.trim() || !assignee) return;

    onCreate({ title, description, priority, assignee });
    
    // Reset state
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setAssignee("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography variant="h5" fontWeight="800">New Task</Typography>
        <Typography variant="body2" color="text.secondary">
          Status: <strong>{columnTitle}</strong> (Pre-selected)
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Task Title *"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!title && title !== ""} // Visual validation
          />
          
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* NEW: Priority Dropdown */}
          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            fullWidth
          >
            {PRIORITIES.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>

          {/* NEW: Assignee Dropdown */}
          <TextField
            select
            label="Assignee *"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            fullWidth
            error={!assignee}
          >
            {TEAM_MEMBERS.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title.trim() || !assignee} // Validation
          sx={{ bgcolor: '#263238', fontWeight: 700, textTransform: 'none' }}
        >
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketModal;