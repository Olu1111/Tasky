import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, 
  Skeleton, Box, Alert, Button 
} from '@mui/material'; 
import { useNavigate } from 'react-router-dom';
import BoardModal from '../components/BoardModal'; 

const BoardsList = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New state for Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ADMIN-ONLY LOGIC: Replace with actual auth context/state
  const isAdmin = true; 

  // --- FETCH ACTUAL BOARDS FROM BACKEND ---
  const fetchBoards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/boards', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch boards from server');

      const result = await response.json();
      if (result.ok && result.data && result.data.boards) {
        setBoards(result.data.boards);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // --- HANDLE NEW BOARD CREATION ---
  const handleCreateBoard = async (title) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/boards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title })
      });

      const result = await response.json();
      if (result.ok) {
        setBoards([...boards, result.data.board]);
      } else {
        throw new Error(result.message || "Failed to create board");
      }
    } catch (err) {
      console.error("Board creation failed:", err);
      alert(err.message);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="h4" fontWeight="bold">My Boards</Typography>
          <Typography variant="body1" color="text.secondary">Select a project to start working.</Typography>
        </Box>

        {/* ADMIN-ONLY BUTTON */}
        {isAdmin && (
          <Button 
    variant="contained" 
    onClick={() => setIsModalOpen(true)}
    sx={{ 
      bgcolor: '#263238',
      color: '#ffffff',
      borderRadius: '6px', 
      textTransform: 'none', 
      fontWeight: '700',
      px: 3,
      '&:hover': { 
        bgcolor: '#1c252a', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)' 
      }
    }}
  >
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
        ) : boards.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1">No boards found. Create one to get started!</Typography>
          </Grid>
        ) : (
          boards.map((board) => (
            <Grid item xs={12} sm={6} md={4} key={board._id}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  borderRadius: 3,
                  transition: '0.3s',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } 
                }}
                onClick={() => navigate(`/boards/${board._id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {board.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {board.description || "No description provided."}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <BoardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateBoard} 
      />
    </Container>
  );
};

export default BoardsList;