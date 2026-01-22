# Activity Logging & Audit Trail

## Overview

The Activity Logging system provides a complete audit trail for the Tasky application, tracking all significant actions performed by users. This enables compliance monitoring, debugging, and historical analysis of board activities.

## Architecture

### Components

1. **ActivityLog Model** (`backend/src/models/ActivityLog.js`)
   - Stores activity records in MongoDB
   - Indexed for efficient querying
   - Auto-expires records after 90 days

2. **Activity Logger Middleware** (`backend/src/middleware/activityLogger.js`)
   - Provides logging functions for controllers
   - Handles async logging without blocking main operations
   - Comprehensive error handling

3. **Activity Controller** (`backend/src/controllers/activity.controller.js`)
   - Retrieves and filters activity logs
   - Provides timeline and statistics endpoints

4. **Activity Routes** (`backend/src/routes/activity.routes.js`)
   - REST endpoints for activity queries

## Activity Types

The system logs these action types:

| Action | Description | Entity Type |
|--------|-------------|------------|
| `ticket.create` | Ticket created | ticket |
| `ticket.update` | Ticket properties updated | ticket |
| `ticket.move` | Ticket moved between columns | ticket |
| `ticket.delete` | Ticket deleted | ticket |
| `comment.add` | Comment added to ticket | comment |
| `comment.delete` | Comment deleted | comment |
| `board.create` | Board created | board |
| `board.update` | Board updated | board |
| `board.delete` | Board deleted | board |
| `column.create` | Column created | column |
| `column.update` | Column updated | column |
| `column.delete` | Column deleted | column |

## API Endpoints

### Get Board Activity Logs
```
GET /api/boards/:boardId/activity
```

**Query Parameters:**
- `entityType` (optional): Filter by entity type (ticket, comment, board, column)
- `userId` (optional): Filter by user who performed action
- `action` (optional): Filter by action type
- `limit` (optional, default: 50): Records per page
- `skip` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "action": "ticket.create",
      "userId": {...},
      "entityType": "ticket",
      "entityId": "...",
      "boardId": "...",
      "metadata": {
        "title": "New Feature",
        "priority": "High",
        "column": "..."
      },
      "createdAt": "2025-01-22T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "skip": 0,
    "hasMore": true
  }
}
```

### Get Activity Timeline (Grouped by Date)
```
GET /api/boards/:boardId/activity/timeline
```

**Query Parameters:**
- `days` (optional, default: 7): Number of days to retrieve
- `limit` (optional, default: 100): Maximum records

**Response:** Activities grouped by date
```json
{
  "success": true,
  "data": {
    "2025-01-22": [...],
    "2025-01-21": [...],
    "2025-01-20": [...]
  },
  "dateRange": {
    "start": "2025-01-15T00:00:00Z",
    "end": "2025-01-22T23:59:59Z",
    "days": 7
  }
}
```

### Get Activity Statistics
```
GET /api/boards/:boardId/activity/stats
```

**Query Parameters:**
- `days` (optional, default: 30): Lookback period

**Response:**
```json
{
  "success": true,
  "data": {
    "actionStats": [
      { "_id": "ticket.create", "count": 45 },
      { "_id": "ticket.update", "count": 123 },
      { "_id": "comment.add", "count": 89 }
    ],
    "userStats": [
      {
        "userId": "...",
        "username": "john_doe",
        "email": "john@example.com",
        "actionCount": 87
      }
    ],
    "dateRange": {
      "start": "2024-12-23T00:00:00Z",
      "end": "2025-01-22T23:59:59Z",
      "days": 30
    }
  }
}
```

### Get Ticket Activity
```
GET /api/tickets/:ticketId/activity
```

**Query Parameters:**
- `limit` (optional, default: 50): Records per page
- `skip` (optional, default: 0): Pagination offset

**Response:** All activities related to a specific ticket

## Integration Points

### Ticket Controller
- ✅ `createTicket()` - Logs ticket creation with title, priority, column
- ✅ `updateTicket()` - Logs updates with change details
- ✅ `moveTicket()` - Logs column changes with old/new positions
- ✅ `deleteTicket()` - Logs deletions with hard/soft delete flag
- ✅ `addComment()` - Logs comment additions with text length
- ✅ `deleteComment()` - Logs comment deletions

### Boards Controller
- ✅ `createBoard()` - Logs board creation with title
- ✅ `deleteBoard()` - Logs board deletion

### Columns Controller
- ⏳ Pending integration for column CRUD operations

### Comments Controller
- ⏳ Pending integration for direct comment operations

## Data Structure

### ActivityLog Schema
```javascript
{
  action: String,           // Enum of action types
  userId: ObjectId,         // Reference to User
  entityType: String,       // Type: ticket, comment, board, column
  entityId: ObjectId,       // ID of modified entity
  boardId: ObjectId,        // Reference to Board (for scoping)
  metadata: Mixed,          // Flexible context object
  createdAt: Date,          // Auto-timestamp
  updatedAt: Date           // Auto-timestamp
}
```

### Indexes
1. `{ boardId: 1, createdAt: -1 }` - Board-specific timeline queries
2. `{ userId: 1, createdAt: -1 }` - User activity history
3. `{ boardId: 1, entityType: 1, createdAt: -1 }` - Entity-type filtering
4. `{ createdAt: 1 }` with TTL=7776000 (90 days) - Auto-cleanup

## Metadata Examples

### Ticket Creation
```json
{
  "title": "Fix login bug",
  "priority": "High",
  "column": "In Progress"
}
```

### Ticket Update
```json
{
  "changes": {
    "title": "Fix login bug",
    "assignee": "user_id",
    "priority": "Critical"
  }
}
```

### Ticket Move
```json
{
  "fromColumn": "Todo",
  "toColumn": "In Progress",
  "oldIndex": 3,
  "newIndex": 0
}
```

### Comment Addition
```json
{
  "ticketId": "...",
  "textLength": 142
}
```

## Usage Examples

### Get all activities for a board
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.tasky.app/api/boards/board_id/activity
```

### Filter by action type
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.tasky.app/api/boards/board_id/activity?action=ticket.create"
```

### Get statistics for last 7 days
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.tasky.app/api/boards/board_id/activity/stats?days=7"
```

### Get timeline grouped by date
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.tasky.app/api/boards/board_id/activity/timeline?days=30"
```

## Performance Considerations

1. **Indexing**: Queries are optimized with strategic indexes
2. **Pagination**: Always use limit/skip for large result sets
3. **TTL**: Records automatically expire after 90 days
4. **Async Logging**: Activities logged asynchronously; failures don't affect main operations

## Error Handling

Activity logging failures are silent and non-blocking:
- Errors logged to console but don't interrupt user operations
- Main action completes successfully even if logging fails
- Prevents activity logging from causing service disruptions

## Future Enhancements

1. **Column Operations** - Log column creation/updates/deletion
2. **Board Management** - Log member additions/removals
3. **Webhooks** - Send activity events to external services
4. **Export** - CSV/JSON export of activity logs
5. **Real-time Updates** - WebSocket notifications for activities
6. **Activity Filters** - Advanced filtering UI in frontend

## Security Notes

- Only authenticated users can access activity logs
- Activity logs restricted to boards user has access to
- Sensitive data (passwords) never included in metadata
- All queries validated and sanitized

## Monitoring

Monitor activity logs for:
- Unusual deletion patterns
- Bulk modifications
- Unauthorized access attempts (via activity patterns)
- User engagement metrics
- Board collaboration trends
