import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/'; // Hard reset to home
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h2" fontSize="4rem">🤕</Typography>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            We encountered an unexpected error.
          </Typography>
<Button 
            variant="contained" 
            onClick={this.handleReset}
            sx={{
              bgcolor: '#42526e', 
              color: 'white',    
              fontWeight: 'bold',
              textTransform: 'none',
              px: 3,             
              '&:hover': {
                bgcolor: '#344563', 
              }
            }}
          >
            Refresh Page
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;