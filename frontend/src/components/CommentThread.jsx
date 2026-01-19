import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, Stack, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const getAvatarColor = (id, name) => {
  if (name?.toLowerCase() === 'admin') return "#263238";
  let hash = 0;
  const identifier = id || name || "";
  for (let i = 0; i < identifier.length; i++) hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  let color = '#';
  for (let i = 0; i < 3; i++) color += `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2);
  return color;
};

const CommentThread = ({ comments = [], onAddComment, onDeleteComment, currentUserId, currentUserRole }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" fontWeight="800">Comments ({comments.length})</Typography>
      <TextField fullWidth multiline rows={2} placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} sx={{ mt: 1 }} />
      <Box display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button onClick={handleSubmit} disabled={!text.trim()} variant="contained" sx={{ bgcolor: '#263238', textTransform: 'none', fontWeight: 700 }}>Send</Button>
      </Box>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {comments.map((comment) => {
          const authorId = comment.author?._id || comment.author;
          const authorName = comment.author?.name || "Unknown User";
          
          // 🎯 DEBUGGING PERMISSIONS: If the button is missing, check these IDs in your console
          // console.log("Author ID:", authorId, "Current User ID:", currentUserId);

          const isAuthor = currentUserId && authorId && (authorId.toString() === currentUserId.toString());
          const isAdmin = currentUserRole === 'admin';
          const canDelete = (isAuthor || isAdmin) && !comment.isDeleted;

          return (
            <Box key={comment._id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', opacity: comment.isDeleted ? 0.6 : 1 }}>
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
                  
                  {/* 🎯 DELETE BUTTON: visible if user is Author or Admin */}
                  {canDelete && (
                    <IconButton size="small" onClick={() => onDeleteComment(comment._id)} color="error">
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: comment.isDeleted ? 'text.secondary' : '#444', 
                    fontStyle: comment.isDeleted ? 'italic' : 'normal',
                    mt: 0.5 
                  }}
                >
                  {comment.text}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default CommentThread;