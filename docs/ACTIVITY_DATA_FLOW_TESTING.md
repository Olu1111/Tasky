# Activity Feed Data Flow - Testing Guide

## Overview

Activity Feed Data Flow implements three key features:
1. **Backend data formatting** - Structures activity with user context
2. **Frontend display** - Shows activities with proper context (user, changes, timestamps)
3. **Update strategies** - Tests polling vs real-time performance

---

## 1. Backend Data Format

### Activity Data Structure
```javascript
{
  _id: ObjectId,
  action: 'ticket.created', // ticket.*, comment.*, column.*, board.*
  boardId: ObjectId,
  ticketId: ObjectId, // if ticket-related
  userId: ObjectId,
  entityName: 'Ticket Title',
  data: {
    changes: {
      fieldName: {
        before: 'old value',
        after: 'new value'
      }
    },
    // ... other context data
  },
  createdAt: ISO8601 timestamp
}
```

### Formatted Output (Frontend)
```javascript
{
  // Original fields...
  message: "John created ticket 'Login Bug'",
  username: "john",
  timeAgo: "5m ago",
  formattedDate: "Jan 27, 2026 10:30 AM"
}
```

---

## 2. Frontend Display

### Activity List Layout
```
┌────────────────────────────────────┐
│  Activity Feed          [5 unread]  │
├────────────────────────────────────┤
│                                    │
│  👤 John created ticket 'Login...' │
│     5m ago • john                  │
│     [View changes ▼]               │
│                                    │
│  Expanded changes:                 │
│  - priority: Low → High            │
│  - assignee: None → Sarah          │
│                                    │
├────────────────────────────────────┤
│                                    │
│  📝 Sarah commented on 'Login Bug' │
│     3m ago • sarah                 │
│                                    │
└────────────────────────────────────┘
```

### Key Features
- ✅ User context (who did what)
- ✅ Change details (expandable)
- ✅ Relative timestamps (5m ago)
- ✅ Unread indicators (blue left border)
- ✅ Avatar colors by action type

---

## 3. Update Strategies - Testing

### Polling Strategy (Current)

**How it works:**
- Fetches activities every 30 seconds
- Smart change detection (only updates if data changed)
- Less server load
- Up to 30s delay for updates

**Test Scenario 1: Polling Latency**
```
1. Create a new ticket in Board A
2. Check Activity Feed - note time
3. Measure delay before activity appears
4. Expected: < 30 seconds (usually 15-30s average)
5. Reason: Half the poll interval + backend latency
```

**Test Scenario 2: Multiple Updates**
```
1. Create 5 tickets rapidly (within 1 second)
2. Note Activity Feed
3. Expected: All 5 appear in next poll cycle
4. Verify: Most recent appear at top
5. Check: No duplicates or missing items
```

**Test Scenario 3: Change Detection**
```
1. Create ticket (activity appears)
2. Wait 35 seconds (skip 1 poll cycle)
3. Expected: No duplicate activity on next poll
4. Verify: hasActivityChanged() prevents re-renders
5. Monitor: CPU/memory stable (no unnecessary updates)
```

### Real-Time Strategy (Implementation Ready)

**How it works:**
- WebSocket connection
- Instant updates (<100ms)
- Higher server resource usage
- Live collaboration feel

**Test Scenario 1: Real-Time Latency**
```javascript
// Use ActivityWebSocketHandler

import { ActivityWebSocketHandler } from '@/utils/activityDataFlow'

const ws = new ActivityWebSocketHandler('ws://localhost:4000/activity');
const startTime = Date.now();

ws.onActivity((activity) => {
  const latency = Date.now() - startTime;
  console.log(`Real-time update: ${latency}ms`);
  // Expected: < 100ms
});

ws.connect();
```

**Test Scenario 2: Connection Resilience**
```
1. Start real-time updates
2. Kill backend server
3. Expected: Automatic reconnect with exponential backoff
4. Verify: Shows "Reconnecting..." indicator
5. Restart backend
6. Verify: Reconnects and resumes receiving updates
```

**Test Scenario 3: Load Testing**
```
1. Create 50 tickets rapidly (5 per second)
2. Monitor WebSocket:
   - Message rate: 50 messages
   - Latency: Each < 100ms
   - Memory: Should not balloon
3. Expected: All activities delivered in order
```

---

## 4. Performance Comparison

### Metrics Class

Use `ActivityUpdateMetrics` to compare strategies:

```javascript
import { ActivityUpdateMetrics } from '@/utils/activityDataFlow'

const metrics = new ActivityUpdateMetrics();

// After polling updates
metrics.recordPollingUpdate(8, 3); // 8ms latency, 3 new activities
metrics.recordPollingUpdate(12, 1);
metrics.recordPollingUpdate(15, 2);

// After real-time updates
metrics.recordRealtimeUpdate(35, 1); // 35ms latency, 1 activity
metrics.recordRealtimeUpdate(48, 1);
metrics.recordRealtimeUpdate(28, 2);

// Get comparison
console.log(metrics.compare());
// {
//   pollingLatency: 15000 (average ~15s = half of 30s interval)
//   realtimeLatency: 37.33 (average ~37ms)
//   improvement: "99.8%"
//   recommendation: "Real-time is significantly better"
// }
```

### Expected Results

| Metric | Polling | Real-Time |
|--------|---------|-----------|
| Update Latency | 5-30s | 20-100ms |
| Effective Latency | ~15s (half interval) | ~50ms |
| Server Load | Low | Medium |
| User Experience | Delayed | Instant |
| Complexity | Simple | Complex |

---

## 5. Manual Testing Checklist

### Display Testing
- [ ] Activities show formatted message (e.g., "John created ticket 'Bug'")
- [ ] Username displays correctly ("john", not ObjectId)
- [ ] Timestamps show relative (e.g., "5m ago")
- [ ] Unread activities have blue left border
- [ ] Read activities lose border when clicked
- [ ] Avatar colors match action type
- [ ] "View changes" link appears only when changes exist

### Interaction Testing
- [ ] Click activity → marked as read (border disappears)
- [ ] Click "View changes" → expands details
- [ ] Click again → collapses details
- [ ] "Mark all read" → all borders disappear
- [ ] Refresh button → fetches latest activities

### Data Flow Testing
- [ ] Create ticket → appears in Activity Feed
- [ ] Update ticket title → activity shows change
- [ ] Edit comment → activity shows with changes
- [ ] Delete ticket → activity shows deletion
- [ ] Move ticket → shows "moved to [column]"

### User Context Testing
- [ ] Multiple users visible in activities
- [ ] Correct user name for each activity
- [ ] User context preserved across sessions
- [ ] Avatar colors consistent per action type

---

## 6. Automated Testing

### Test 1: Format Activity Data
```javascript
import { formatActivityData } from '@/utils/activityDataFlow'

const activity = {
  _id: '123',
  action: 'ticket.created',
  userId: 'user1',
  ticketTitle: 'Login Bug',
  createdAt: new Date(Date.now() - 5 * 60000) // 5 minutes ago
};

const users = { user1: { name: 'John' } };

const formatted = formatActivityData(activity, users);

// Verify
expect(formatted.message).toBe('John created ticket "Login Bug"');
expect(formatted.username).toBe('John');
expect(formatted.timeAgo).toBe('5m ago');
```

### Test 2: Change Detection
```javascript
import { hasActivityChanged } from '@/utils/activityDataFlow'

const prev = [
  { _id: 'a1', action: 'ticket.created' },
  { _id: 'a2', action: 'comment.added' }
];

const curr = [
  { _id: 'a3', action: 'ticket.updated' }, // new!
  { _id: 'a1', action: 'ticket.created' },
  { _id: 'a2', action: 'comment.added' }
];

// Verify
expect(hasActivityChanged(prev, curr)).toBe(true);
```

### Test 3: Activity Injection
```javascript
import { injectActivityIntoBoard } from '@/utils/activityDataFlow'

const board = {
  columns: [
    {
      _id: 'col1',
      tickets: [{ _id: 't1', title: 'Old Title' }]
    }
  ]
};

const activity = {
  action: 'ticket.updated',
  ticketId: 't1',
  data: { title: 'New Title' }
};

const updated = injectActivityIntoBoard(board, activity);

// Verify
expect(updated.columns[0].tickets[0].title).toBe('New Title');
```

### Test 4: Polling Performance
```javascript
import { ActivityPoller } from '@/utils/activityDataFlow'

let pollCount = 0;
const poller = new ActivityPoller(
  async () => [{ _id: `activity-${++pollCount}` }],
  1000 // 1 second interval for testing
);

const updates = [];
poller.onNewActivities((newActs) => {
  updates.push(newActs);
});

poller.start();

// After 3 seconds
setTimeout(() => {
  poller.stop();
  expect(updates.length).toBeGreaterThan(0);
  expect(pollCount).toBeGreaterThanOrEqual(2);
}, 3000);
```

---

## 7. Real-Time vs Polling Comparison Test

### Setup Test Environment
```javascript
// testActivityFlow.js

import { 
  ActivityPoller, 
  ActivityWebSocketHandler,
  ActivityUpdateMetrics 
} from '@/utils/activityDataFlow'

const metrics = new ActivityUpdateMetrics();

// Test polling
const pollingTest = async () => {
  const poller = new ActivityPoller(
    async () => {
      // Simulate API call
      const start = Date.now();
      await new Promise(r => setTimeout(r, 50)); // 50ms latency
      return [{ _id: Math.random() }];
    },
    1000 // Poll every 1 second
  );

  poller.onNewActivities((acts) => {
    metrics.recordPollingUpdate(50, acts.length);
  });

  poller.start();

  // Run for 10 seconds
  await new Promise(r => setTimeout(r, 10000));
  poller.stop();

  return metrics.getPollingStats();
};

// Test real-time
const realtimeTest = async () => {
  const ws = new ActivityWebSocketHandler('ws://localhost:4000/activity');
  
  const startTimes = new Map();

  ws.onActivity((activity) => {
    const latency = Date.now() - startTimes.get(activity._id);
    metrics.recordRealtimeUpdate(latency, 1);
    startTimes.delete(activity._id);
  });

  ws.connect();

  // Simulate 50 activities over 10 seconds
  for (let i = 0; i < 50; i++) {
    const id = Math.random();
    startTimes.set(id, Date.now());
    // Backend would send activity after ~20-40ms
    await new Promise(r => setTimeout(r, 200));
  }

  ws.disconnect();
  return metrics.getRealtimeStats();
};

// Run comparison
const runComparison = async () => {
  console.log('Testing polling...');
  const pollingStats = await pollingTest();
  console.log('Polling stats:', pollingStats);

  console.log('Testing real-time...');
  const realtimeStats = await realtimeTest();
  console.log('Real-time stats:', realtimeStats);

  const comparison = metrics.compare();
  console.log('Comparison:', comparison);
};

runComparison();
```

### Expected Output
```
Testing polling...
Polling stats: {
  avgLatency: 48.5,
  maxLatency: 62,
  minLatency: 35,
  pollInterval: 1000,
  effectiveLatency: 535
}

Testing real-time...
Real-time stats: {
  avgLatency: 35.2,
  maxLatency: 48,
  minLatency: 22,
  effectiveLatency: 35.2
}

Comparison: {
  pollingLatency: 535,
  realtimeLatency: 35.2,
  improvement: "93.4%",
  recommendation: "Real-time is significantly better"
}
```

---

## 8. Production Recommendations

### When to Use Polling
- ✅ Simple deployment (no WebSocket)
- ✅ Low activity frequency
- ✅ Limited server resources
- ✅ Good for 30-60 second delays acceptable

### When to Use Real-Time
- ✅ Collaborative features needed
- ✅ Low latency critical
- ✅ Multiple users on same board
- ✅ Trading/time-sensitive data

### Hybrid Approach
```javascript
// Start with polling, upgrade to real-time on demand
let strategy = 'polling';

// Detect high activity, switch to real-time
if (activitiesPerMinute > 20) {
  switchToRealTime();
  strategy = 'realtime';
}

// Fall back to polling if WebSocket drops
function onWebSocketDisconnect() {
  strategy = 'polling';
  poller.start();
}
```

---

## Summary

### What Was Implemented
✅ Backend activity data formatting with user context
✅ Frontend display with changes, timestamps, user info
✅ Polling strategy (30s intervals)
✅ Real-time strategy (WebSocket ready)
✅ Performance metrics and comparison
✅ Change detection to prevent unnecessary updates
✅ Expandable change details

### Performance Targets
- Polling: ~15-30s effective latency
- Real-time: ~30-50ms effective latency
- 99%+ accuracy in activity delivery
- Zero data loss on updates

### Testing Approach
- Manual: User-facing display and interactions
- Automated: Data flow, formatting, injection
- Performance: Polling vs real-time benchmarks
- Resilience: Network failures and reconnection
