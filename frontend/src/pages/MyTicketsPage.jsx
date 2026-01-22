import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Skeleton, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/tickets/mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.ok) setTickets(json.data.tickets);
      } catch (error) {
        console.error("Failed to load tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyTickets();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
      <Typography variant="h4" fontWeight="800" mb={3}>My Tickets</Typography>
      
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: '12px' }} />)}
        </Stack>
      ) : tickets.length > 0 ? (
        <Stack spacing={2}>
          {tickets.map((ticket) => (
            <Card 
              key={ticket._id} 
              onClick={() => navigate(`/boards/${ticket.board._id}`)}
              sx={{ 
                borderRadius: '12px', 
                cursor: 'pointer', 
                '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                transition: 'all 0.2s'
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" fontWeight="700">{ticket.title}</Typography>
                  <Chip 
                    label={ticket.priority} 
                    size="small" 
                    color={ticket.priority === 'High' ? 'error' : ticket.priority === 'Medium' ? 'warning' : 'success'} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {ticket.description || "No description provided."}
                </Typography>
                <Box mt={2} display="flex" gap={1}>
                  <Chip label={`Board: ${ticket.board?.title}`} variant="outlined" size="small" />
                  <Chip label={`Status: ${ticket.column?.title}`} variant="outlined" size="small" />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Box textAlign="center" py={10}>
          <Typography variant="h6" color="text.secondary">You don't have any assigned tickets yet!</Typography>
        </Box>
      )}
    </Container>
  );
};

export default MyTicketsPage;