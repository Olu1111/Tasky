import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

export default function BoardSkeleton() {
  // We'll mimic 3 columns of tasks
  const skeletonColumns = [1, 2, 3];
  // We'll mimic 4 task cards per column
  const skeletonCards = [1, 2, 3, 4];

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', overflowX: 'auto', backgroundColor: '#f4f5f7' }}>
      <Stack direction="row" spacing={3} sx={{ height: '100%', alignItems: 'flex-start' }}>
        {skeletonColumns.map((col) => (
          <Paper
            key={col}
            sx={{
              width: 300,
              minWidth: 300,
              p: 1.5,
              backgroundColor: '#ebedf0',
              borderRadius: 2,
              flexShrink: 0
            }}
          >
            {/* Column Title Placeholder */}
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2, borderRadius: 1 }} />

            {/* Task Card Placeholders */}
            <Stack spacing={1.5}>
              {skeletonCards.map((card) => (
                <Paper key={card} sx={{ p: 2, borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                  <Skeleton variant="text" width="90%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                  <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="rectangular" width={40} height={16} sx={{ borderRadius: 1 }} />
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}