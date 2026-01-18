import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, MenuItem,
  Avatar, ListItemIcon, ListItemText, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const getAvatarColor = (id, name) => {
  if (name?.toLowerCase() === 'admin') return '#263238';
  let hash = 0;
  const identifier = id || name || "";
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const PRIORITIES = ['High', 'Medium', 'Low'];

const TicketModal = ({ isOpen, onClose, onCreate, columnTitle }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.ok) setTeamMembers(json.data.users || []); 
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const filteredMembers = teamMembers.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onCreate({ 
      title: title.trim(), 
      description, 
      priority, 
      assignee: assignee === "" ? null : assignee 
    });

    setTitle(""); setDescription(""); setPriority("Medium"); setAssignee(""); setSearchTerm("");
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs"
      disableRestoreFocus 
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="h5" component="span" fontWeight="800" display="block">
          New Task
        </Typography>
        <Typography variant="body2" component="span" color="text.secondary" display="block">
          Column: <strong>{columnTitle}</strong>
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2.5}>
          <TextField label="Task Title *" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />

          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} fullWidth>
            {PRIORITIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </TextField>

          <TextField select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} fullWidth
            SelectProps={{ MenuProps: { autoFocus: false } }}>
            <Box sx={{ p: 2, pb: 1 }}>
              <TextField size="small" placeholder="Search teammates..." fullWidth value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
              />
            </Box>

            <MenuItem value="">
              <ListItemIcon>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#eeeeee', color: '#9e9e9e' }}>-</Avatar>
              </ListItemIcon>
              <ListItemText primary="None (Unassigned)" />
            </MenuItem>

            {filteredMembers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: getAvatarColor(user._id, user.name) }}>
                    {user.name?.trim().charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={user.name} />
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()} sx={{ bgcolor: '#263238', fontWeight: 700, textTransform: 'none' }}>
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketModal;