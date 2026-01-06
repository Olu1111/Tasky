import React from 'react';
import { Container, Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const mockBoards = [
  { id: 1, title: 'Project Alpha', desc: 'Main development board' },
  { id: 2, title: 'Marketing Launch', desc: 'Q4 Marketing Tasks' },
  { id: 3, title: 'Personal Tasks', desc: 'Grocery and Gym' },
];

const BoardsList = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Boards
      </Typography>
      <Grid container spacing={3}>
        {mockBoards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card 
              sx={{ cursor: 'pointer', height: '100%', '&:hover': { boxShadow: 6 } }}
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {board.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {board.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default BoardsList;