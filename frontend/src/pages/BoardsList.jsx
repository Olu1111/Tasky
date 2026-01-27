import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, 
  Skeleton, Box, Alert, Button, IconButton, CardActionArea 
} from '@mui/material'; 
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import BoardModal from '../components/BoardModal';
import { isAdmin, isMember } from '../utils/auth'; 

const BoardsList = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check user role from localStorage
  const userIsAdmin = isAdmin();
  const userIsMember = isMember();

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/boards', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch boards');
      const result = await response.json();
      if (result.ok) setBoards(result.data.boards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  const handleCreateBoard = async (title) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title })
      });
      const result = await response.json();
      if (result.ok) {
        setBoards([result.data.board, ...boards]);
        setIsModalOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure? This will delete all tasks and columns in this board.")) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBoards(boards.filter(b => b._id !== boardId));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="h4" fontWeight="bold">My Boards</Typography>
          <Typography variant="body1" color="text.secondary">Select a project to start working.</Typography>
        </Box>
        {userIsMember && (
          <Button variant="contained" onClick={() => setIsModalOpen(true)}
            sx={{ bgcolor: '#263238', color: '#ffffff', textTransform: 'none', fontWeight: '700', px: 3 }}>
            + Create Board
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : (
          boards.map((board) => (
            <Grid item xs={12} sm={6} md={4} key={board._id}>
              <Card sx={{ 
                height: '100%', borderRadius: 3, position: 'relative', transition: '0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6, '& .delete-btn': { opacity: 1 } } 
              }}>
                <CardActionArea onClick={() => navigate(`/boards/${board._id}`)} sx={{ height: '100%', p: 1 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>{board.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {board.description || "No description provided."}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                {userIsAdmin && (
                  <IconButton 
                    className="delete-btn"
                    onClick={(e) => handleDeleteBoard(e, board._id)}
                    sx={{ 
                      position: 'absolute', top: 10, right: 10, opacity: 0, 
                      transition: '0.2s', color: '#9e9e9e',
                      '&:hover': { color: '#d32f2f', bgcolor: 'rgba(211, 47, 47, 0.1)' } 
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <BoardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateBoard} />
    </Container>
  );
};

export default BoardsList;