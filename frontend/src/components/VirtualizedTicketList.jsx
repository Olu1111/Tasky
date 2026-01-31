import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box } from '@mui/material';
import AutoSizer from 'react-window-auto-sizer';

const VirtualizedTicketList = ({ tickets, itemHeight = 120, renderItem }) => {
  const itemCount = useMemo(() => tickets?.length || 0, [tickets]);

  if (itemCount === 0) return null;

  return (
    <Box sx={{ width: '100%', flexGrow: 1, minHeight: '300px' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={Math.max(height, 300)}
            itemCount={itemCount}
            itemSize={itemHeight}
            width={width}
            overscanCount={3}
          >
            {({ index, style }) => (
              <div style={style}>
                {renderItem(tickets[index], index)}
              </div>
            )}
          </List>
        )}
      </AutoSizer>
    </Box>
  );
};

export default React.memo(VirtualizedTicketList);
