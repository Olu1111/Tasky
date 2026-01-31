import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Avatar, Divider,
  Button, CircularProgress, Chip, Stack, Tooltip, Collapse, Alert
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import { apiClient } from '../utils/apiClient';
import { formatActivityData, ActivityPoller, hasActivityChanged, ActivityFeedLimiter } from '../utils/activityDataFlow';

const getActivityMessage = (activity) => {
  const { action, entityName, userId } = activity;
  const user = userId?.username || 'System';
  
  const actionMap = {
    'ticket.create': `${user} created task`,
    'ticket.update': `${user} updated task`,
    'ticket.move': `${user} moved task`,
    'ticket.delete': `${user} deleted task`,
    'column.create': `${user} created column`,
    'column.update': `${user} updated column`,
    'column.delete': `${user} deleted column`,
    'board.create': `${user} created board`,
    'board.update': `${user} updated board`,
    'comment.add': `${user} commented on`,
    'comment.delete': `${user} removed comment from`,
  };

  const baseMessage = actionMap[action] || `${user} ${action}`;
  return `${baseMessage} ${entityName || ''}`.trim();
};

const getActivityIcon = (action) => {
  const colorMap = {
    'ticket.create': '#4CAF50',
    'ticket.move': '#2196F3',
    'ticket.update': '#FF9800',
    'ticket.delete': '#F44336',
    'column.create': '#9C27B0',
    'column.update': '#673AB7',
    'comment.add': '#00BCD4',
  };
  return colorMap[action] || '#757575';
};

const ActivityFeed = ({ boardId, autoRefreshInterval = 30000, users = {} }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [updateStrategy, setUpdateStrategy] = useState('polling'); // 'polling' or 'realtime'
  const [limiterStatus, setLimiterStatus] = useState(null);
  const lastDataRef = useRef("");
  const pollerRef = useRef(null);
  const limiterRef = useRef(new ActivityFeedLimiter(25, 12)); // Max 25 items, 12-hour window

  const fetchActivities = useCallback(async () => {
    if (!boardId) return;

    try {
      const response = await apiClient.get(`/boards/${boardId}/activity?limit=50`);
      if (response?.ok) {
        const result = await response.json();
        const activities = result.data || [];
        
        // Check if data actually changed
        if (!hasActivityChanged(JSON.parse(lastDataRef.current || '[]'), activities)) {
          return activities;
        }

        // Format activities with user context
        const formattedActivities = activities.map(activity => 
          formatActivityData(activity, users)
        );
        
        // Apply limiter (enforces 50 max, 12-hour window)
        const limited = limiterRef.current.setActivities(formattedActivities);
        const status = limiterRef.current.getStatus();
        setLimiterStatus(status);
        
        lastDataRef.current = JSON.stringify(activities);
        setActivities(limited);
        return limited;
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }, [boardId, users]);

  // Auto-refresh with polling strategy
  useEffect(() => {
    if (!boardId || updateStrategy !== 'polling') return;

    fetchActivities();

    const poller = new ActivityPoller(
      fetchActivities,
      autoRefreshInterval
    );

    poller.onNewActivities((newActivities) => {
      const formattedNew = newActivities.map(a => formatActivityData(a, users));
      const updated = formattedNew.concat(activities);
      
      // Apply limiter
      const limited = limiterRef.current.setActivities(updated);
      const status = limiterRef.current.getStatus();
      setLimiterStatus(status);
      
      setActivities(limited);
    });

    poller.start();
    pollerRef.current = poller;

    return () => {
      poller.stop();
    };
  }, [boardId, autoRefreshInterval, fetchActivities, users, updateStrategy]);

  const handleMarkAsRead = useCallback((activityId) => {
    setReadIds(prev => new Set([...prev, activityId]));
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    const allIds = new Set(activities.map(a => a._id));
    setReadIds(allIds);
  }, [activities]);

  const unreadCount = activities.filter(a => !readIds.has(a._id)).length;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: '#fafafa'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: '#fff', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon sx={{ color: '#263238' }} />
          <Typography variant="h6" fontWeight="700">Activity Feed</Typography>
          {unreadCount > 0 && (
            <Chip 
              label={unreadCount} 
              size="small" 
              sx={{ bgcolor: '#FF5722', color: '#fff', fontWeight: 700 }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchActivities}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? <CircularProgress size={16} /> : 'Refresh'}
          </Button>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ textTransform: 'none' }}
            >
              Mark all read
            </Button>
          )}
        </Stack>
      </Box>

      {/* Activity List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* Limiter Status Alert */}
        {limiterStatus && limiterStatus.isFull && (
          <Alert 
            severity="info" 
            icon={<InfoIcon />}
            sx={{ m: 2, mb: 1 }}
          >
            <Typography variant="body2" fontWeight="600">
              📊 Activity Feed Limited to 50 Recent Items (Last 12 Hours)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {limiterStatus.currentCount} of {limiterStatus.currentCount} notifications. 
              Older activities are automatically forgotten to keep the feed manageable.
            </Typography>
          </Alert>
        )}

        {loading && activities.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No activity yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.map((activity, idx) => {
              const isRead = readIds.has(activity._id);
              return (
                <React.Fragment key={activity._id}>
                  <ListItem
                    onClick={() => handleMarkAsRead(activity._id)}
                    sx={{
                      bgcolor: isRead ? 'transparent' : 'rgba(25, 118, 210, 0.03)',
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: isRead ? '#f5f5f5' : 'rgba(25, 118, 210, 0.08)' },
                      transition: 'all 0.15s ease',
                      borderLeft: isRead ? 'none' : '4px solid #1976D2',
                    }}
                  >
                    {/* Avatar */}
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        mr: 2,
                        bgcolor: getActivityIcon(activity.action),
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    >
                      {activity.userId?.username?.[0].toUpperCase() || 'S'}
                    </Avatar>

                    {/* Content */}
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={isRead ? 500 : 700}
                            sx={{ color: '#263238' }}
                          >
                            {activity.message}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {activity.timeAgo} • {activity.username}
                          </Typography>
                          {activity.data?.changes && Object.keys(activity.data.changes).length > 0 && (
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(expandedId === activity._id ? null : activity._id);
                              }}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'pointer',
                                gap: 0.5,
                                width: 'fit-content',
                                p: 0.5,
                                borderRadius: '4px',
                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' }
                              }}
                            >
                              <ExpandMoreIcon 
                                sx={{ 
                                  fontSize: '1rem',
                                  transform: expandedId === activity._id ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease'
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976D2' }}>
                                View changes
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />

                    {/* Unread indicator */}
                    {!isRead && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: '#1976D2',
                          ml: 1,
                          flexShrink: 0
                        }}
                      />
                    )}
                  </ListItem>

                  {/* Expanded changes view */}
                  <Collapse in={expandedId === activity._id} timeout="auto" unmountOnExit>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, ml: 7, mb: 1, borderRadius: '4px' }}>
                      <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
                        Changes:
                      </Typography>
                      {activity.data?.changes && Object.entries(activity.data.changes).map(([field, change]) => (
                        <Box key={field} sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            <strong>{field}:</strong> {change.before || 'N/A'} → {change.after || 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>

                  {idx < activities.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ActivityFeed);
