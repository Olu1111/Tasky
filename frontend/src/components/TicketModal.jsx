import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, MenuItem,
  Avatar, ListItemIcon, ListItemText, InputAdornment, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRole, ProtectedFeature } from '../hooks/useRole.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
  const dialogRef = useRef(null);
  const { canPerform } = useRole();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/team`, {
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

  const handleKeyDown = (e) => {
    const isHotkey = (e.key === 'Enter' && (e.ctrlKey || e.metaKey));
    const isTitleEnter = (e.key === 'Enter' && e.target.name === 'title');
    if (isHotkey || isTitleEnter) {
      if (title.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

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
      disableRestoreFocus 
      onKeyDown={handleKeyDown}
      PaperProps={{ sx: { borderRadius: '12px' } }}
      TransitionProps={{ timeout: 300 }}
      aria-labelledby="ticket-modal-title"
      aria-describedby="ticket-modal-description"
    >
      <DialogTitle id="ticket-modal-title" component="div" sx={{ pb: 1 }}>
        <Typography variant="h5" component="span" fontWeight="800" display="block">
          New Task
        </Typography>
        <Typography id="ticket-modal-description" variant="body2" component="span" color="text.secondary" display="block">
          Column: <strong>{columnTitle}</strong>
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {!canPerform('create_ticket') && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            🔒 You don't have permission to create tickets. Contact an admin to upgrade your role.
          </Alert>
        )}
        <Box mt={1} display="flex" flexDirection="column" gap={2.5}>
          <TextField 
            label="Task Title *" 
            name="title"
            fullWidth 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            autoFocus
            variant="outlined"
            inputProps={{ 'aria-label': 'Task title' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#263238' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(38,50,56,0.1)' }
              }
            }}
          />
          <TextField 
            label="Description" 
            multiline 
            rows={3} 
            fullWidth 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#263238' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(38,50,56,0.1)' }
              }
            }}
          />

          <TextField 
            select 
            label="Priority" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)} 
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#263238' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(38,50,56,0.1)' }
              }
            }}
          >
            {PRIORITIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            label="Assignee" 
            value={assignee} 
            onChange={(e) => setAssignee(e.target.value)} 
            fullWidth
            variant="outlined"
            SelectProps={{ MenuProps: { autoFocus: false } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#263238' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(38,50,56,0.1)' }
              }
            }}
          >
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

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="text"
          sx={{ 
            textTransform: 'none',
            fontWeight: 700,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
            '&:focus-visible': { outline: '2px solid #263238', outlineOffset: '2px' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!title.trim() || !canPerform('create_ticket')} 
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
          Create Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketModal;