import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, MenuItem,
  Avatar, ListItemIcon, ListItemText, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const PRIORITIES = ['High', 'Medium', 'Low'];

const TicketModal = ({ isOpen, onClose, onCreate, columnTitle }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  
  // --- Search State for Filtering ---
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.ok) setTeamMembers(json.data.users); 
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  // --- Filter Logic ---
  const filteredMembers = teamMembers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!title.trim() || !assignee) return;
    onCreate({ 
      title: title.trim(), 
      description, 
      priority, 
      assigneeId: assignee 
    });
    // Reset all states
    setTitle(""); setDescription(""); setPriority("Medium"); setAssignee(""); setSearchTerm("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography variant="h5" fontWeight="800">New Task</Typography>
        <Typography variant="body2" color="text.secondary">Column: <strong>{columnTitle}</strong></Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2.5}>
          <TextField label="Task Title *" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          
          <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />

          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} fullWidth>
            {PRIORITIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </TextField>

          {/* --- Assignee Selector with Search and Avatars --- */}
          <TextField
            select
            label="Assignee *"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            fullWidth
            helperText={teamMembers.length === 0 ? "No real users found" : "Select a team member"}
            SelectProps={{
              // This keeps the search field from closing the menu when clicked
              MenuProps: { autoFocus: false }
            }}
          >
            {/* Search Input inside the Dropdown */}
            <Box sx={{ p: 2, pb: 1 }}>
              <TextField
                size="small"
                autoFocus
                placeholder="Search teammates..."
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {filteredMembers.length > 0 ? (
              filteredMembers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#263238' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary={user.name} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2">No matching teammates</Typography>
              </MenuItem>
            )}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title.trim() || !assignee}
          sx={{ bgcolor: '#263238', fontWeight: 700, textTransform: 'none' }}
        >
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketModal;