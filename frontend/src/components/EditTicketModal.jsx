import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, MenuItem,
  Avatar, ListItemIcon, ListItemText
} from '@mui/material';

// SHARED HELPER
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

const EditTicketModal = ({ isOpen, onClose, onUpdate, ticket, columns }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [columnId, setColumnId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (ticket && ticket._id) {
      // Comparison checks to prevent cascading update warning
      if (title !== (ticket.title || "")) setTitle(ticket.title || "");
      if (description !== (ticket.description || "")) setDescription(ticket.description || "");
      if (priority !== (ticket.priority || "Medium")) setPriority(ticket.priority || "Medium");

      const currentAssignee = ticket.assignee?._id || ticket.assignee || "";
      if (assignee !== currentAssignee) setAssignee(currentAssignee);

      const currentColumn = ticket.column?._id || ticket.column || "";
      if (columnId !== currentColumn) setColumnId(currentColumn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?._id]);

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

  const handleSave = () => {
    onUpdate(ticket._id, { title, description, priority, assignee, columnId });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle><Typography variant="h5" fontWeight="800">Edit Task</Typography></DialogTitle>
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2.5}>
          <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} fullWidth>
            {PRIORITIES.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={columnId} onChange={(e) => setColumnId(e.target.value)} fullWidth>
            {columns.map((col) => <MenuItem key={col._id} value={col._id}>{col.title}</MenuItem>)}
          </TextField>
          <TextField select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} fullWidth>
            {teamMembers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                <ListItemIcon>
                  <Avatar 
                    sx={{ 
                      width: 24, height: 24, fontSize: '0.75rem', fontWeight: 600,
                      bgcolor: getAvatarColor(user._id, user.name) 
                    }}
                  >
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
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#263238', fontWeight: 700, textTransform: 'none' }}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTicketModal;