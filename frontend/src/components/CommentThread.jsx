import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, Stack, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

const getAvatarColor = (id, name) => {
  if (name?.toLowerCase() === 'admin') return "#263238";
  let hash = 0;
  const identifier = id || name || "";
  for (let i = 0; i < identifier.length; i++) hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i++) color += `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2);
  return color;
};

const CommentThread = ({ comments = [], onAddComment, onDeleteComment, onUpdateComment, currentUserId, currentUserRole }) => {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };

  const handleEditStart = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;
    if (onUpdateComment) {
      await onUpdateComment(commentId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" fontWeight="800">Comments ({comments.filter(c => !c.isDeleted).length})</Typography>
      <TextField fullWidth multiline rows={2} placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} sx={{ mt: 1 }} />
      <Box display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button onClick={handleSubmit} disabled={!text.trim()} variant="contained" sx={{ bgcolor: '#263238', textTransform: 'none', fontWeight: 700 }}>Send</Button>
      </Box>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {comments.filter(c => !c.isDeleted).map((comment) => {
          const authorId = comment.author?._id || comment.author;
          const authorName = comment.author?.name || "Unknown User";
          
          const isAuthor = currentUserId && authorId && (authorId.toString() === currentUserId.toString());
          const isAdmin = currentUserRole === 'admin';
          const canEdit = (isAuthor || isAdmin);
          const canDelete = (isAuthor || isAdmin);
          const isEditing = editingId === comment._id;

          return (
            <Box key={comment._id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: getAvatarColor(authorId, authorName) }}>
                {authorName[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight="700">{authorName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'numeric', day: 'numeric' })}
                    </Typography>
                  </Box>
                  
                  {/* Edit and Delete buttons */}
                  <Box display="flex" gap={0.5}>
                    {canEdit && !isEditing && (
                      <IconButton size="small" onClick={() => handleEditStart(comment)} color="primary">
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                    {canDelete && !isEditing && (
                      <IconButton size="small" onClick={() => onDeleteComment(comment._id)} color="error">
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                {isEditing ? (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      variant="outlined"
                    />
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditSave(comment._id)}
                        color="success"
                        disabled={!editText.trim()}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton size="small" onClick={handleEditCancel} color="error">
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#444',
                      mt: 0.5 
                    }}
                  >
                    {comment.text}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default React.memo(CommentThread);