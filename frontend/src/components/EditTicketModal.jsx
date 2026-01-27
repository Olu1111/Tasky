import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, MenuItem, Typography,
  Avatar, ListItemIcon, ListItemText, Divider 
} from '@mui/material';
import CommentThread from './CommentThread';
import { isMember } from '../utils/auth';

const getAvatarColor = (id, name) => {
  if (name?.toLowerCase() === 'admin') return "#263238";
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

const EditTicketModal = ({ isOpen, onClose, onUpdate, ticket, columns }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [columnId, setColumnId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [localComments, setLocalComments] = useState([]);

  useEffect(() => {
    const fetchFullTicket = async () => {
      if (ticket && ticket._id && isOpen) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.ok) {
            const t = json.data.ticket;
            setTitle(t.title || "");
            setDescription(t.description || "");
            setPriority(t.priority || "Medium");
            setAssignee(t.assignee?._id || t.assignee || "");
            setColumnId(t.column?._id || t.column || "");
            setLocalComments(t.comments || []);
          }
        } catch (error) { 
          console.error("Ticket fetch failed:", error); 
        }
      }
    };
    fetchFullTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?._id, isOpen]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/users', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        const json = await res.json();
        if (json.ok) setTeamMembers(json.data.users || []);
      } catch (error) { 
        console.error(error); 
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  // 🎯 KEYBOARD SHORTCUTS: Ctrl/Cmd + Enter to Save
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleAddComment = async (text) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalComments([...localComments, json.data.comment]);
      onUpdate(ticket._id, {}); 
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('token');
    // 🎯 ROUTE FIX: Ensure the URL matches the nested backend route structure
    const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setLocalComments(prev => prev.map(c => 
        c._id === commentId ? { ...c, text: "This comment has been deleted.", isDeleted: true } : c
      ));
      onUpdate(ticket._id, {});
    }
  };

  const handleSave = () => {
    const updatedAssignee = assignee === "" ? null : assignee;
    onUpdate(ticket._id, { title, description, priority, assignee: updatedAssignee, columnId });
    onClose();
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onUpdate(ticket._id, { isDeleted: true });
        onClose();
      }
    } catch (error) { 
      console.error("Delete failed:", error); 
    }
  };

  if (!isOpen || !ticket) return null;

  const token = localStorage.getItem('token');
  let currentUserId = null;
  let currentUserRole = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 🎯 AUTH FIX: Using 'sub' to match backend's req.user._id
      currentUserId = payload.sub || payload.id || payload._id; 
      currentUserRole = payload.role;
    }
  } catch { 
    console.error("Token parsing failed");
  }

  // Check if user can edit (member or admin)
  const canEdit = isMember();

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm" 
      disableRestoreFocus
      onKeyDown={handleKeyDown}
    >
      <DialogTitle component="div">
        <Typography variant="h6" component="div" fontWeight="800">Edit Task</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
          <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} />
          <Box display="flex" gap={2}>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ flex: 1 }} disabled={!canEdit}>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>
            <TextField select label="Status" value={columnId} onChange={(e) => setColumnId(e.target.value)} sx={{ flex: 1 }} disabled={!canEdit}>
              {columns.map((col) => (
                <MenuItem key={col._id} value={col._id}>{col.title}</MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} fullWidth disabled={!canEdit}>
            <MenuItem value=""><ListItemIcon><Avatar sx={{ width: 24, height: 24, bgcolor: '#eee' }}>-</Avatar></ListItemIcon><ListItemText primary="None (Unassigned)" /></MenuItem>
            {teamMembers.map((u) => (
              <MenuItem key={u._id} value={u._id}>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: getAvatarColor(u._id, u.name) }}>
                    {u.name?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={u.name} />
              </MenuItem>
            ))}
          </TextField>
          <Divider sx={{ my: 1 }} />
          {/* 🎯 PASSING CORRECT IDs: currentUserId is now mapped from 'sub' */}
          <CommentThread 
            comments={localComments} 
            onAddComment={handleAddComment} 
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole} 
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        {isMember() && (
          <Button onClick={handleDeleteTicket} color="error" sx={{ textTransform: 'none', fontWeight: 700 }}>Delete Task</Button>
        )}
        <Box sx={{ ml: 'auto' }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', mr: 1 }}>Cancel</Button>
          {canEdit && (
            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#263238', fontWeight: 700, textTransform: 'none' }}>Save Changes</Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditTicketModal;