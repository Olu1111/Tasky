import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, Skeleton, Box } from '@mui/material'; 
import { useNavigate } from 'react-router-dom';

const mockBoards = [
  { id: 'board-1', title: 'Marketing Campaign', desc: 'Social media and ad planning' },
  { id: 'board-2', title: 'Design System', desc: 'UI components and typography' },
  { id: 'board-3', title: 'Tasky Roadmap', desc: 'Future features and timeline' },
];

const BoardsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Simulate fetching the list of boards
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 second load time to show off the skeleton
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">My Boards</Typography>
        <Typography variant="body1" color="text.secondary">Select a project to start working.</Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* LOADING STATE (The Skeleton) */}
        {loading ? (
           Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : (
          /* REAL DATA STATE (The Cards) */
          mockBoards.map((board) => (
            <Grid item xs={12} sm={6} md={4} key={board.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  borderRadius: 3,
                  transition: '0.3s',
                  '&:hover': { translateY: '-5px', boxShadow: 6 } 
                }}
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {board.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {board.desc}
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