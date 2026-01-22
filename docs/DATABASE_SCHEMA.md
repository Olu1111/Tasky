# Database Schema Documentation

Complete reference for Tasky MongoDB data models and relationships.

## Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TASKY DATABASE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐        ┌──────────┐        ┌─────────────┐   │
│  │  User    │        │  Board   │        │  Column     │   │
│  ├──────────┤        ├──────────┤        ├─────────────┤   │
│  │ _id      │◄──────┤ owner    │        │ _id         │   │
│  │ username │        │ members[]│◄──────┤ board (ref) │   │
│  │ email    │        │ _id      │        │ title       │   │
│  │ password │        │ title    │        │ position    │   │
│  │ role     │        │ createdAt│        └─────────────┘   │
│  │ createdAt│        └──────────┘               △           │
│  └──────────┘              △                    │           │
│       △                    │              ┌─────────────┐   │
│       │              ┌──────────────┐     │   Ticket    │   │
│       │              │              │     ├─────────────┤   │
│       │         ┌────────────┐  ┌──────────┤ _id         │   │
│       │         │  Comment   │  │    │     │ board (ref) │   │
│       │         ├────────────┤  │    └────┤ column (ref)│   │
│       └────────┤ author(ref) │  │         │ title       │   │
│               │ ticket(ref) │  │         │ description │   │
│               │ text        │  │         │ priority    │   │
│               │ createdAt   │  │         │ assignee    │   │
│               └────────────┘  │         │ createdBy   │   │
│                           △    │         │ comments[]  │   │
│                           │    │         │ position    │   │
│       ┌───────────────────────┼─────────┤ createdAt   │   │
│       │                       │         └─────────────┘   │
│  ┌────────────┐               │                △           │
│  │ ActivityLog│               │                │           │
│  ├────────────┤               └────────────────┘           │
│  │ _id        │                                            │
│  │ action     │                                            │
│  │ userId(ref)│◄──────────────────────────────────────┐   │
│  │ entityType │                                        │   │
│  │ entityId   │                                        │   │
│  │ boardId(ref)│◄───────────────────────┐             │   │
│  │ metadata   │                         │             │   │
│  │ createdAt  │ (TTL: 90 days)         │             │   │
│  └────────────┘                    (indexed)         │   │
│                                                  (indexed)│   │
└─────────────────────────────────────────────────────────────┘
```

## Collections

### User

Stores user accounts and authentication information.

**Collection:** `users`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | MongoDB auto-generated |
| `username` | String | ✅ | ✅ | Unique, 3-50 chars |
| `email` | String | ✅ Unique | ✅ | Unique, valid email |
| `password` | String | | ✅ | Bcrypt hashed (not returned) |
| `role` | String (enum) | ✅ | ✅ | admin \| member \| viewer, default: member |
| `createdAt` | Date | ✅ | ✅ | Auto-set on creation |
| `updatedAt` | Date | ✅ | ✅ | Auto-updated |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "$2b$10$...(hashed)",
  "role": "member",
  "createdAt": "2025-01-22T10:00:00Z",
  "updatedAt": "2025-01-22T10:00:00Z"
}
```

**Indexes:**
```javascript
{ email: 1 }           // Unique email lookup
{ username: 1 }       // Unique username lookup
{ role: 1 }           // Role filtering
{ createdAt: -1 }     // Sort by creation date
```

---

### Board

Represents project/workspace kanban boards.

**Collection:** `boards`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | |
| `title` | String | ✅ | ✅ | Board name, 1-200 chars |
| `description` | String | | | Optional board description |
| `owner` | ObjectId (User) | ✅ | ✅ | Reference to User |
| `members` | [ObjectId] | ✅ | | Array of User IDs, default: [] |
| `createdAt` | Date | ✅ | ✅ | |
| `updatedAt` | Date | ✅ | ✅ | |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Project Alpha",
  "description": "Main development board",
  "owner": "507f1f77bcf86cd799439011",
  "members": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "createdAt": "2025-01-22T10:00:00Z",
  "updatedAt": "2025-01-22T10:00:00Z"
}
```

**Indexes:**
```javascript
{ owner: 1 }          // Find boards by owner
{ members: 1 }        // Find boards user is member of
{ createdAt: -1 }     // Sort by creation
{ title: "text" }     // Text search
```

---

### Column

Represents workflow columns/stages within a board (e.g., Backlog, Todo, Doing).

**Collection:** `columns`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | |
| `title` | String | | ✅ | Column name (e.g., "To Do") |
| `board` | ObjectId (Board) | ✅ | ✅ | Reference to Board |
| `position` | Number | ✅ | ✅ | Zero-based order within board |
| `createdAt` | Date | ✅ | ✅ | |
| `updatedAt` | Date | ✅ | ✅ | |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "title": "To Do",
  "board": "507f1f77bcf86cd799439012",
  "position": 1,
  "createdAt": "2025-01-22T10:00:00Z",
  "updatedAt": "2025-01-22T10:00:00Z"
}
```

**Indexes:**
```javascript
{ board: 1, position: 1 }  // Get columns for board in order
{ createdAt: -1 }          // Sort by creation
```

---

### Ticket

Represents task/issue items within columns.

**Collection:** `tickets`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | |
| `title` | String | ✅ | ✅ | Ticket title, 1-200 chars |
| `description` | String | | | Detailed description, markdown supported |
| `priority` | String (enum) | ✅ | ✅ | Low \| Medium \| High \| Critical, default: Medium |
| `status` | String (enum) | ✅ | ✅ | backlog \| todo \| in_progress \| review \| done |
| `board` | ObjectId (Board) | ✅ | ✅ | Reference to Board |
| `column` | ObjectId (Column) | ✅ | ✅ | Reference to Column (current) |
| `assignee` | ObjectId (User) | ✅ | | Person assigned (can be null) |
| `createdBy` | ObjectId (User) | ✅ | ✅ | Creator reference |
| `comments` | [ObjectId] | | | Array of Comment IDs, default: [] |
| `position` | Number | ✅ | ✅ | Order within column (for kanban) |
| `deletedAt` | Date | | | Soft delete timestamp (null = active) |
| `createdAt` | Date | ✅ | ✅ | |
| `updatedAt` | Date | ✅ | ✅ | |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "title": "Fix login bug",
  "description": "Users unable to login with email",
  "priority": "High",
  "status": "in_progress",
  "board": "507f1f77bcf86cd799439012",
  "column": "507f1f77bcf86cd799439014",
  "assignee": "507f1f77bcf86cd799439011",
  "createdBy": "507f1f77bcf86cd799439011",
  "comments": [
    "507f1f77bcf86cd799439017",
    "507f1f77bcf86cd799439018"
  ],
  "position": 0,
  "deletedAt": null,
  "createdAt": "2025-01-22T10:00:00Z",
  "updatedAt": "2025-01-22T10:30:00Z"
}
```

**Indexes:**
```javascript
{ board: 1, deletedAt: 1 }        // Tickets per board (active)
{ column: 1, position: 1 }        // Kanban ordering
{ assignee: 1 }                   // Tickets by assignee
{ createdBy: 1 }                  // Tickets by creator
{ priority: 1 }                   // Priority filtering
{ deletedAt: 1 }                  // Soft delete queries
{ title: "text", description: "text" }  // Text search
{ createdAt: -1 }                 // Sort by date
```

---

### Comment

Represents discussion/feedback on tickets.

**Collection:** `comments`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | |
| `ticket` | ObjectId (Ticket) | ✅ | ✅ | Reference to Ticket |
| `author` | ObjectId (User) | ✅ | ✅ | Reference to User |
| `text` | String | | ✅ | Comment content, 1-5000 chars |
| `isDeleted` | Boolean | ✅ | | Soft delete flag, default: false |
| `createdAt` | Date | ✅ | ✅ | |
| `updatedAt` | Date | ✅ | ✅ | |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "ticket": "507f1f77bcf86cd799439016",
  "author": "507f1f77bcf86cd799439021",
  "text": "I've started investigating this issue",
  "isDeleted": false,
  "createdAt": "2025-01-22T10:30:00Z",
  "updatedAt": "2025-01-22T10:30:00Z"
}
```

**Indexes:**
```javascript
{ ticket: 1, createdAt: -1 }  // Comments on ticket (ordered)
{ author: 1 }                 // Comments by user
{ isDeleted: 1 }              // Filter deleted comments
```

---

### ActivityLog

Stores audit trail of all significant actions.

**Collection:** `activitylogs`

**Fields:**

| Field | Type | Indexed | Required | Notes |
|-------|------|---------|----------|-------|
| `_id` | ObjectId | ✅ Primary | ✅ | |
| `action` | String (enum) | ✅ | ✅ | ticket.create \| ticket.update \| ticket.move \| ticket.delete \| comment.add \| comment.delete \| board.create \| board.update \| board.delete \| column.create \| column.update \| column.delete |
| `userId` | ObjectId (User) | ✅ | ✅ | Who performed action |
| `entityType` | String (enum) | ✅ | ✅ | ticket \| comment \| board \| column |
| `entityId` | ObjectId | ✅ | ✅ | ID of modified entity |
| `boardId` | ObjectId (Board) | ✅ | ✅ | Board scope (for filtering) |
| `metadata` | Object | | | Context-specific data (flexible) |
| `createdAt` | Date | ✅ TTL | ✅ | Auto-delete after 90 days |

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "action": "ticket.create",
  "userId": "507f1f77bcf86cd799439011",
  "entityType": "ticket",
  "entityId": "507f1f77bcf86cd799439016",
  "boardId": "507f1f77bcf86cd799439012",
  "metadata": {
    "title": "Fix login bug",
    "priority": "High",
    "column": "To Do"
  },
  "createdAt": "2025-01-22T10:00:00Z"
}
```

**Indexes:**
```javascript
{ boardId: 1, createdAt: -1 }          // Board activity timeline
{ userId: 1, createdAt: -1 }           // User activity history
{ boardId: 1, entityType: 1, createdAt: -1 }  // Filter by type
{ createdAt: 1 } with TTL: 7776000    // Auto-expire after 90 days
```

---

## Relationships

### User → Board (1:Many)
- User can own multiple boards
- User can be member of multiple boards
- Field: `board.owner` references `user._id`
- Field: `board.members[]` contains `user._id`

### User → Ticket (1:Many)
- User can create multiple tickets
- User can be assigned multiple tickets
- Field: `ticket.createdBy` references `user._id`
- Field: `ticket.assignee` references `user._id`

### User → Comment (1:Many)
- User can create multiple comments
- Field: `comment.author` references `user._id`

### User → ActivityLog (1:Many)
- User actions logged to activity log
- Field: `activitylog.userId` references `user._id`

### Board → Column (1:Many)
- Board contains multiple columns
- Field: `column.board` references `board._id`

### Board → Ticket (1:Many)
- Board contains multiple tickets
- Field: `ticket.board` references `board._id`

### Board → ActivityLog (1:Many)
- Activity log scoped to board
- Field: `activitylog.boardId` references `board._id`

### Column → Ticket (1:Many)
- Column contains multiple tickets
- Field: `ticket.column` references `column._id`

### Ticket → Comment (1:Many)
- Ticket has multiple comments
- Field: `ticket.comments[]` contains `comment._id`
- Field: `comment.ticket` references `ticket._id`

---

## Data Constraints

### Unique Constraints
- User email must be globally unique
- User username must be globally unique
- Board title must be unique per owner

### Required Fields
- User: username, email, password, role
- Board: title, owner
- Column: title, board, position
- Ticket: title, board, column, createdBy
- Comment: ticket, author, text
- ActivityLog: action, userId, entityType, entityId, boardId

### Default Values
- User.role: "member"
- Board.members: []
- Ticket.position: 0 (assigned by system)
- Ticket.deletedAt: null (active)
- Comment.isDeleted: false
- ActivityLog.createdAt: current timestamp

### Field Lengths
- username: 3-50 chars
- email: valid email format
- password: bcrypt hash (60 chars)
- title: 1-200 chars
- description: 0-5000 chars
- comment text: 1-5000 chars

---

## Indexing Strategy

**High-traffic queries optimized:**

1. Board queries (owner, members)
2. Ticket queries (column position, kanban display)
3. Activity timeline (board + date)
4. Text search (title, description)
5. User activity (userId + date)

**Index sizes estimated:**
- User collection: ~10KB per document
- Board collection: ~2KB per document
- Ticket collection: ~3KB per document
- Comment collection: ~1KB per document
- ActivityLog collection: ~1KB per document, auto-expires

---

## Performance Notes

### Query Optimization
- Use projection to limit returned fields
- Paginate large result sets (tickets, comments)
- TTL index automatically removes old activity logs
- Compound indexes optimize common filter combinations

### Soft Delete Strategy
- Tickets use `deletedAt` field for soft delete
- Comments use `isDeleted` boolean flag
- Queries typically filter `deletedAt: null`
- Hard deletes require admin role

### Scalability
- Activity logs auto-expire (90 days) → prevents unlimited growth
- Pagination prevents memory/bandwidth issues
- Indexes prevent collection scans
- Denormalization (user names in responses) reduces queries

---

## Backup & Recovery

### Backup Strategy
- Daily MongoDB automated backups
- Point-in-time recovery available
- Activity logs provide audit trail

### Data Recovery
- Deleted records: recoverable from soft-delete flag
- Hard-deleted records: from backup only
- Audit trail: preserved in ActivityLog (90 days)

---

## Future Schema Enhancements

1. **Board Templates** - Pre-configured board layouts
2. **Card Attachments** - File storage for tickets
3. **Labels/Tags** - Categorize tickets
4. **Milestones/Sprints** - Release planning
5. **Webhooks** - Event subscriptions
6. **Notifications** - User preferences storage
7. **File Storage** - Attachment metadata
