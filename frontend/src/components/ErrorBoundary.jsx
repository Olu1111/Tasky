import React from 'react';
import { Box, Typography, Button, Link } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group('%c🛡️ Global Error Boundary', 'color: #d32f2f; font-weight: bold;');
    console.error("Caught error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = 
        (typeof window !== 'undefined' && window?.location?.hostname === 'localhost') ||
        (import.meta.env && import.meta.env.DEV);

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

          <Button
            variant="contained"
            onClick={this.handleReload}
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

          <Link 
            href="/boards" 
            sx={{ mt: 3, color: 'text.secondary', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Go back to My Boards
          </Link>

          {/* DEVELOPER DEBUGGING: Only shows in local development */}
          {isDev && (
            <Box 
              sx={{ 
                mt: 6, 
                p: 2, 
                bgcolor: '#fafafa', 
                border: '1px solid #eee', 
                borderRadius: '8px', 
                maxWidth: '80%', 
                textAlign: 'left' 
              }}
            >
              <Typography variant="caption" color="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                DEBUG: {this.state.error?.toString()}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;