import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Login Page</Typography>
      <Button variant="contained" onClick={() => navigate('/boards')}>
        Log In (Test)
      </Button>
    </Box>
  );
}