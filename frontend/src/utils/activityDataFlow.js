// Activity data flow utilities
// Formats backend activity data and injects context into boards/tickets

/**
 * Format activity data with user context
 * Enriches activity logs with human-readable descriptions
 */
export const formatActivityData = (activity, users = {}) => {
  const getUsername = (userId) => users[userId]?.name || 'Unknown User';
  const getTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const actionMessages = {
    'ticket.created': (act) => `${getUsername(act.userId)} created ticket "${act.ticketTitle}"`,
    'ticket.updated': (act) => `${getUsername(act.userId)} updated "${act.ticketTitle}"`,
    'ticket.assigned': (act) => `${getUsername(act.userId)} assigned "${act.ticketTitle}" to ${getUsername(act.data?.assigneeId)}`,
    'ticket.moved': (act) => `${getUsername(act.userId)} moved "${act.ticketTitle}" to ${act.data?.columnTitle}`,
    'ticket.deleted': (act) => `${getUsername(act.userId)} deleted ticket "${act.ticketTitle}"`,
    'comment.created': (act) => `${getUsername(act.userId)} commented on "${act.ticketTitle}"`,
    'comment.updated': (act) => `${getUsername(act.userId)} edited comment on "${act.ticketTitle}"`,
    'comment.deleted': (act) => `${getUsername(act.userId)} deleted comment from "${act.ticketTitle}"`,
    'column.created': (act) => `${getUsername(act.userId)} created column "${act.data?.columnTitle}"`,
    'column.updated': (act) => `${getUsername(act.userId)} updated column "${act.data?.columnTitle}"`,
    'board.created': (act) => `${getUsername(act.userId)} created board "${act.boardTitle}"`,
    'board.updated': (act) => `${getUsername(act.userId)} updated board "${act.boardTitle}"`,
  };

  const getMessage = actionMessages[activity.action] || 
    (() => `${getUsername(activity.userId)} performed action: ${activity.action}`);

  return {
    ...activity,
    message: getMessage(activity),
    timeAgo: getTime(activity.createdAt),
    username: getUsername(activity.userId),
    formattedDate: new Date(activity.createdAt).toLocaleString()
  };
};

/**
 * Inject activity changes back into board data
 * Updates board/ticket/comment state based on activity
 */
export const injectActivityIntoBoard = (board, activity) => {
  if (!board || !activity) return board;

  const updated = { ...board };
  const action = activity.action;

  // Inject into columns
  if (action.startsWith('column.')) {
    updated.columns = [...(board.columns || [])];
    
    if (action === 'column.created') {
      updated.columns.push(activity.data);
    } else if (action === 'column.updated') {
      const idx = updated.columns.findIndex(c => c._id === activity.data._id);
      if (idx >= 0) updated.columns[idx] = activity.data;
    } else if (action === 'column.deleted') {
      updated.columns = updated.columns.filter(c => c._id !== activity.data._id);
    }
  }

  // Inject into tickets
  if (action.startsWith('ticket.')) {
    updated.columns = [...(board.columns || [])];
    
    updated.columns = updated.columns.map(col => ({
      ...col,
      tickets: [...(col.tickets || [])]
    }));

    const ticketId = activity.ticketId;
    let ticketFound = false;

    updated.columns.forEach(col => {
      const ticketIdx = col.tickets.findIndex(t => t._id === ticketId);
      
      if (ticketIdx >= 0) {
        ticketFound = true;
        
        if (action === 'ticket.updated' || action === 'ticket.assigned') {
          col.tickets[ticketIdx] = {
            ...col.tickets[ticketIdx],
            ...activity.data
          };
        } else if (action === 'ticket.moved') {
          col.tickets.splice(ticketIdx, 1);
        } else if (action === 'ticket.deleted') {
          col.tickets.splice(ticketIdx, 1);
        }
      }
    });

    // Add newly created ticket
    if (action === 'ticket.created' && activity.data) {
      const targetCol = updated.columns.find(c => c._id === activity.data.columnId);
      if (targetCol) {
        targetCol.tickets.push(activity.data);
      }
    }
  }

  // Inject into comments
  if (action.startsWith('comment.')) {
    updated.columns = [...(board.columns || [])];
    
    updated.columns = updated.columns.map(col => ({
      ...col,
      tickets: col.tickets?.map(ticket => ({
        ...ticket,
        comments: [...(ticket.comments || [])]
      })) || []
    }));

    let ticketFound = false;
    updated.columns.forEach(col => {
      col.tickets.forEach(ticket => {
        if (ticket._id === activity.ticketId) {
          ticketFound = true;
          
          if (action === 'comment.created' && activity.data) {
            ticket.comments.push(activity.data);
          } else if (action === 'comment.updated') {
            const cmtIdx = ticket.comments.findIndex(c => c._id === activity.data._id);
            if (cmtIdx >= 0) ticket.comments[cmtIdx] = activity.data;
          } else if (action === 'comment.deleted') {
            ticket.comments = ticket.comments.filter(c => c._id !== activity.data._id);
          }
        }
      });
    });
  }

  return updated;
};

/**
 * Get activity delta (what actually changed)
 * Returns before/after for display
 */
export const getActivityDelta = (activity) => {
  const delta = {
    action: activity.action,
    timestamp: activity.createdAt,
    changes: []
  };

  if (activity.data?.changes) {
    Object.entries(activity.data.changes).forEach(([field, { before, after }]) => {
      delta.changes.push({
        field,
        before: before || 'N/A',
        after: after || 'N/A'
      });
    });
  }

  return delta;
};

/**
 * Batch inject multiple activities
 * Apply series of activities to board state
 */
export const batchInjectActivities = (board, activities) => {
  if (!Array.isArray(activities)) return board;
  
  let updated = board;
  activities.forEach(activity => {
    updated = injectActivityIntoBoard(updated, activity);
  });
  return updated;
};

/**
 * Detect activity differences for polling
 * Compare two activity lists to find new activities
 */
export const detectNewActivities = (previousActivities, currentActivities) => {
  const previousIds = new Set(previousActivities.map(a => a._id));
  return currentActivities.filter(a => !previousIds.has(a._id));
};

/**
 * Activity change detection for polling
 * Lightweight comparison to avoid full re-renders
 */
export const hasActivityChanged = (prev, curr) => {
  if (!prev && !curr) return false;
  if (!prev || !curr) return true;
  if (prev.length !== curr.length) return true;
  
  // Quick check: compare recent activity IDs
  const prevIds = prev.slice(0, 5).map(a => a._id).join(',');
  const currIds = curr.slice(0, 5).map(a => a._id).join(',');
  return prevIds !== currIds;
};

/**
 * Activity polling strategy
 * Adaptive polling with exponential backoff for rate limit avoidance
 */
export class ActivityPoller {
  constructor(fetchFn, interval = 60000) { // Default 60s instead of 30s
    this.fetchFn = fetchFn;
    this.interval = interval;
    this.isRunning = false;
    this.timerId = null;
    this.lastActivities = [];
    this.callbacks = [];
    this.failureCount = 0;
    this.maxFailures = 3;
  }

  onNewActivities(callback) {
    this.callbacks.push(callback);
  }

  async poll() {
    try {
      const newActivities = await this.fetchFn();
      const newItems = detectNewActivities(this.lastActivities, newActivities);
      
      if (newItems.length > 0) {
        this.callbacks.forEach(cb => cb(newItems));
        this.lastActivities = newActivities;
      }

      // Reset failure count on success
      this.failureCount = 0;
    } catch (err) {
      this.failureCount++;
      
      // If we get 429 (rate limited), back off exponentially
      if (err.status === 429) {
        const backoffInterval = this.interval * Math.pow(2, this.failureCount);
        console.warn(`Rate limited. Backing off to ${backoffInterval}ms`);
        this.setInterval(backoffInterval);
      } else {
        console.error('Activity polling error:', err);
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll(); // Initial fetch
    this.timerId = setInterval(() => this.poll(), this.interval);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  setInterval(interval) {
    this.interval = interval;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

/**
 * Real-time WebSocket activity handler
 * For future real-time implementation
 */
export class ActivityWebSocketHandler {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.callbacks = [];
  }

  onActivity(callback) {
    this.callbacks.push(callback);
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('Activity WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const activity = JSON.parse(event.data);
        this.callbacks.forEach(cb => cb(activity));
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.reconnect();
      };

      this.ws.onclose = () => {
        console.log('Activity WebSocket disconnected');
        this.reconnect();
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      this.reconnect();
    }
  }

  reconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.log(`Reconnecting in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Compare polling vs real-time performance
 */
export class ActivityUpdateMetrics {
  constructor() {
    this.pollingMetrics = [];
    this.realtimeMetrics = [];
  }

  recordPollingUpdate(latency, newActivities) {
    this.pollingMetrics.push({
      type: 'polling',
      timestamp: Date.now(),
      latency, // ms from poll to update
      activityCount: newActivities,
      delay: 30000 // fixed interval
    });
  }

  recordRealtimeUpdate(latency, newActivities) {
    this.realtimeMetrics.push({
      type: 'realtime',
      timestamp: Date.now(),
      latency, // ms from event to update
      activityCount: newActivities,
      delay: latency // actual delay
    });
  }

  getPollingStats() {
    if (this.pollingMetrics.length === 0) return null;
    const latencies = this.pollingMetrics.map(m => m.latency);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      pollInterval: 30000,
      effectiveLatency: 15000 // average: half of poll interval + latency
    };
  }

  getRealtimeStats() {
    if (this.realtimeMetrics.length === 0) return null;
    const latencies = this.realtimeMetrics.map(m => m.latency);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      effectiveLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length
    };
  }

  compare() {
    const polling = this.getPollingStats();
    const realtime = this.getRealtimeStats();

    if (!polling || !realtime) return null;

    return {
      pollingLatency: polling.effectiveLatency,
      realtimeLatency: realtime.effectiveLatency,
      improvement: ((polling.effectiveLatency - realtime.effectiveLatency) / polling.effectiveLatency * 100).toFixed(1) + '%',
      recommendation: realtime.effectiveLatency < polling.effectiveLatency / 2 ? 
        'Real-time is significantly better' : 
        'Polling is acceptable'
    };
  }
}
/**
 * Activity Feed Limiter
 * Enforces 50 max items and 12-hour time window
 * Implements "forgetting" mechanism for old activities
 */
export class ActivityFeedLimiter {
  constructor(maxItems = 25, maxHours = 12) {
    this.maxItems = maxItems;
    this.maxHours = maxHours;
    this.activities = [];
  }

  /**
   * Add activity and enforce limits
   */
  addActivity(activity) {
    this.activities.unshift(activity);
    this._enforceLimit();
    return this.activities;
  }

  /**
   * Set activities and enforce limits
   */
  setActivities(activities) {
    this.activities = activities || [];
    this._enforceLimit();
    return this.activities;
  }

  /**
   * Enforce size and time limits
   * Private method
   */
  _enforceLimit() {
    // Remove activities older than max hours
    const cutoffTime = new Date(Date.now() - this.maxHours * 60 * 60 * 1000);
    this.activities = this.activities.filter(a => new Date(a.createdAt) > cutoffTime);

    // Keep only max items
    if (this.activities.length > this.maxItems) {
      this.activities = this.activities.slice(0, this.maxItems);
    }
  }

  /**
   * Get filtered activities
   */
  getActivities() {
    return this.activities;
  }

  /**
   * Get activities count
   */
  getCount() {
    return this.activities.length;
  }

  /**
   * Check if activity is within limits
   */
  isWithinLimits(activity) {
    const activityTime = new Date(activity.createdAt);
    const cutoffTime = new Date(Date.now() - this.maxHours * 60 * 60 * 1000);
    return activityTime > cutoffTime;
  }

  /**
   * Get limit status
   */
  getStatus() {
    const cutoffTime = new Date(Date.now() - this.maxHours * 60 * 60 * 1000);
    const forgotten = this.activities.filter(a => new Date(a.createdAt) <= cutoffTime);

    return {
      currentCount: this.activities.length,
      maxItems: this.maxItems,
      maxHours: this.maxHours,
      isFull: this.activities.length >= this.maxItems,
      forgottenCount: forgotten.length,
      cutoffTime: cutoffTime.toISOString(),
      oldestActivity: this.activities.length > 0 ? this.activities[this.activities.length - 1].createdAt : null
    };
  }

  /**
   * Cleanup old activities (can be called periodically)
   */
  cleanup() {
    const before = this.activities.length;
    this._enforceLimit();
    const after = this.activities.length;
    return {
      removed: before - after,
      remaining: after
    };
  }

  /**
   * Get activities by time range (within the feed window)
   */
  getActivitiesByTimeRange(startHours, endHours) {
    const now = Date.now();
    const startTime = now - startHours * 60 * 60 * 1000;
    const endTime = now - endHours * 60 * 60 * 1000;

    return this.activities.filter(a => {
      const time = new Date(a.createdAt).getTime();
      return time >= endTime && time <= startTime;
    });
  }
}