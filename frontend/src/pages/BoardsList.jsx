import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, Skeleton, Box, Alert } from '@mui/material'; 
import { useNavigate } from 'react-router-dom';

const BoardsList = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]); // Real data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FETCH ACTUAL BOARDS FROM BACKEND ---
  useEffect(() => {
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

        if (!response.ok) {
          throw new Error('Failed to fetch boards from server');
        }

        const result = await response.json();
        
        // Match the data structure from your boards.controller.js
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

    fetchBoards();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">My Boards</Typography>
        <Typography variant="body1" color="text.secondary">Select a project to start working.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {/* LOADING STATE: Shows skeletons while fetching */}
        {loading ? (
           Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : boards.length === 0 ? (
          /* EMPTY STATE */
          <Grid item xs={12}>
            <Typography variant="body1">No boards found. Create one to get started!</Typography>
          </Grid>
        ) : (
          /* REAL DATA STATE: Rendering from MongoDB */
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
                // Uses the MongoDB _id to navigate to the correct board
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
    </Container>
  );
};

export default BoardsList;