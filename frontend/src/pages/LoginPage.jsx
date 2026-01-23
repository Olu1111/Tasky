import React, { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Alert, CssBaseline, Avatar 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; 
import { useNavigate } from 'react-router-dom';
// --- NEW IMPORT ---
import { apiClient } from '../utils/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // APICLIENT: Automatically handles headers, retries, and error toasts
      const response = await apiClient.post('/auth/login', { email, password });

      if (response?.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.data.token); 
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/boards');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
            elevation={6} 
            sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                borderRadius: 2,
                width: '100%'
            }}
        >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            
            <Typography component="h1" variant="h5" fontWeight="600">
              Sign in to Tasky
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Sign In
              </Button>
            </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;