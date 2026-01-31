import React from 'react';
import { Avatar as MuiAvatar, Skeleton } from '@mui/material';
import { useState, useEffect } from 'react';

const OptimizedAvatar = ({ 
  src, 
  children, 
  sx, 
  getColor,
  alt,
  loading = 'lazy',
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.loading = loading;
      img.src = src;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
    }
  }, [src, loading]);

  // Show initials if no image or image failed to load
  if (!src || imageError || !imageLoaded) {
    return (
      <MuiAvatar 
        sx={{ 
          ...sx,
          bgcolor: getColor ? getColor() : '#ccc',
          fontWeight: 600
        }} 
        {...props}
      >
        {children}
      </MuiAvatar>
    );
  }

  return (
    <MuiAvatar 
      src={src}
      alt={alt}
      sx={sx}
      {...props}
    >
      {children}
    </MuiAvatar>
  );
};

export default React.memo(OptimizedAvatar);
