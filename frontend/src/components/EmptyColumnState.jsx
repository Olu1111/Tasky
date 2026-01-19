import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyColumnState = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 4, 
        opacity: 0.6 
      }}
    >
      {/* 🎯 Minimalist Task Illustration */}
      <svg 
        width="100" 
        height="100" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#ccc" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
        No tasks yet
      </Typography>
    </Box>
  );
};

export default EmptyColumnState;