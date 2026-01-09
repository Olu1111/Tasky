import React from 'react';
import { Box, Typography, Button, Link } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="flex-start" 
          height="100vh"              
          textAlign="center"
          pt={15}                    
          p={3}
        >
          <ErrorOutlineIcon sx={{ fontSize: 80, color: '#d32f2f', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            The page crashed unexpectedly. Try refreshing or going back.
          </Typography>

          {/* REFRESH BUTTON */}
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: '#424242', 
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: '#212121', 
                boxShadow: 6
              }
            }}
          >
            Reload Page
          </Button>

          {/* SAFETY LINK */}
          <Link 
            href="/boards" 
            sx={{ mt: 3, color: 'text.secondary', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Go back to My Boards
          </Link>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;