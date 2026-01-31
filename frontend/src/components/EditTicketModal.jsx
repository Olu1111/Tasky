import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, MenuItem, Typography,
  Avatar, ListItemIcon, ListItemText, Divider, Checkbox, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CommentThread from './CommentThread';

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
  const [assignees, setAssignees] = useState([]);
  const [columnId, setColumnId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const dialogRef = useRef(null);
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
            // Support both assignee (single) and assignees (array)
            if (t.assignees && Array.isArray(t.assignees)) {
              setAssignees(t.assignees.map(a => a._id || a));
            } else if (t.assignee) {
              setAssignees([t.assignee._id || t.assignee]);
            } else {
              setAssignees([]);
            }
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
        const res = await fetch('http://localhost:4000/api/users/team', { 
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

  const toggleAssignee = (userId) => {
    setAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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

  const handleUpdateComment = async (commentId, text) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalComments(prev => prev.map(c => 
        c._id === commentId ? json.data.comment : c
      ));
      onUpdate(ticket._id, {});
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const json = await res.json();
        
        // Update local comments with the response data to keep in sync
        if (json.data && json.data.ticket) {
          setLocalComments(json.data.ticket.comments || []);
        } else {
          // Fallback: just filter out the deleted comment
          setLocalComments(prev => prev.filter(c => c._id !== commentId));
        }
        
        // Notify parent to update ticket count
        if (onUpdate) {
          onUpdate(ticket._id, { comments: json.data?.ticket?.comments || [] });
        }
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleSave = async () => {
    onUpdate(ticket._id, { title, description, priority, assignees: assignees.length > 0 ? assignees : [], columnId });
    
    // Refetch the ticket to ensure all changes (including deleted comments) are synced
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${ticket._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.ok) {
        setLocalComments(json.data.ticket.comments || []);
      }
    } catch (error) {
      console.error("Failed to refetch ticket:", error);
    }
    
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

  // Focus trapping and keyboard handling
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

  return (
    <Dialog 
      ref={dialogRef}
      open={isOpen} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm" 
      disableRestoreFocus
      onKeyDown={handleKeyDown}
      PaperProps={{ sx: { borderRadius: '12px' } }}
      TransitionProps={{ timeout: 300 }}
      aria-labelledby="edit-ticket-title"
    >
      <DialogTitle id="edit-ticket-title" component="div">
        <Typography variant="h6" component="div" fontWeight="800">Edit Task</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField 
            label="Title" 
            fullWidth 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
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
          <Box display="flex" gap={2}>
            <TextField 
              select 
              label="Priority" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              sx={{ flex: 1 }}
              variant="outlined"
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>
            <TextField 
              select 
              label="Status" 
              value={columnId} 
              onChange={(e) => setColumnId(e.target.value)} 
              sx={{ flex: 1 }}
              variant="outlined"
            >
              {columns.map((col) => (
                <MenuItem key={col._id} value={col._id}>{col.title}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#263238' }}>Assign To</Typography>
            <TextField
              size="small"
              placeholder="Search team members..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1.2rem', color: '#888' }} /></InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                maxHeight: '240px',
                overflowY: 'auto',
                bgcolor: '#f9fafb',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { bgcolor: '#f0f0f0' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#999', borderRadius: '3px' },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#666' }
              }}
            >
              {teamMembers
                .filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((user) => (
                  <Box
                    key={user._id}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    p={1.5}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      borderBottom: '1px solid #eee',
                      '&:hover': { bgcolor: '#e8f4f8' }
                    }}
                    onClick={() => toggleAssignee(user._id)}
                  >
                    <Checkbox
                      checked={assignees.includes(user._id)}
                      onChange={() => toggleAssignee(user._id)}
                      size="small"
                      sx={{ m: 0 }}
                    />
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        bgcolor: getAvatarColor(user._id, user.name)
                      }}
                    >
                      {user.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">{user.name}</Typography>
                  </Box>
                ))}
            </Box>
            {assignees.length > 0 && (
              <Box display="flex" gap={0.8} flexWrap="wrap" mt={1.5}>
                {assignees.map((id) => {
                  const user = teamMembers.find(u => u._id === id);
                  return user ? (
                    <Box
                      key={id}
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      px={1.2}
                      py={0.6}
                      bgcolor="#e3f2fd"
                      borderRadius="16px"
                      sx={{ border: '1px solid #90caf9' }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                      <Box
                        component="span"
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          ml: 0.2,
                          '&:hover': { opacity: 0.7 }
                        }}
                        onClick={() => toggleAssignee(id)}
                      >
                        ✕
                      </Box>
                    </Box>
                  ) : null;
                })}
              </Box>
            )}
          </Box>
          <Divider sx={{ my: 1 }} />
          {/* 🎯 PASSING CORRECT IDs: currentUserId is now mapped from 'sub' */}
          <CommentThread 
            comments={localComments} 
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole} 
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button 
          onClick={handleDeleteTicket} 
          color="error" 
          sx={{ 
            textTransform: 'none', 
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' },
            '&:focus-visible': { outline: '2px solid #d32f2f', outlineOffset: '2px' }
          }}
        >
          Delete Task
        </Button>
        <Box>
          <Button 
            onClick={onClose} 
            variant="text"
            sx={{ 
              textTransform: 'none',
              mr: 1,
              fontWeight: 700,
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-visible': { outline: '2px solid #263238', outlineOffset: '2px' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ 
              bgcolor: '#263238',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#37474f', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
              '&:active': { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
              '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' }
            }}
          >
            Save Changes
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditTicketModal;