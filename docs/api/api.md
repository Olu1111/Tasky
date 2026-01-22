# Tasky API Documentation

Complete reference for all Tasky REST API endpoints, including authentication, boards, tickets, comments, activity logs, and search functionality.

## Base URL

```
http://localhost:4000/api
```

## Table of Contents

1. [Authentication](#authentication)
2. [Boards](#boards)
3. [Columns](#columns)
4. [Tickets](#tickets)
5. [Comments](#comments)
6. [Activity Logs](#activity-logs)
7. [Search](#search)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register

Create a new user account.

```
POST /auth/register
```

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 400:**
```json
{
  "ok": false,
  "error": "Email already exists"
}
```

### Login

Authenticate user and get JWT token.

```
POST /auth/login
```

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 401:**
```json
{
  "ok": false,
  "error": "Invalid email or password"
}
```

### Get Current User

Retrieve authenticated user information.

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

### List Users

Get all users (admin only).

```
GET /users
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "member"
      }
    ]
  }
}
```

---

## Boards

### List Boards

Get all accessible boards (all authenticated users).

```
GET /boards
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "boards": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Project Alpha",
        "description": "Main project board",
        "owner": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "member"
        },
        "members": [],
        "createdAt": "2025-01-22T10:00:00Z",
        "updatedAt": "2025-01-22T10:00:00Z"
      }
    ]
  }
}
```

### Get Board Details

Retrieve specific board with columns.

```
GET /boards/:boardId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `boardId` (string, required) - Board ID

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "board": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Project Alpha",
      "description": "Main project board",
      "owner": {...},
      "members": [],
      "columns": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Backlog",
          "position": 0
        },
        {
          "_id": "507f1f77bcf86cd799439014",
          "title": "To Do",
          "position": 1
        }
      ],
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

### Create Board

Create new board (members+ only).

```
POST /boards
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Rate Limit:** 50 requests per 5 minutes

**Request Body:**
```json
{
  "title": "New Project",
  "description": "Project description"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "board": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "New Project",
      "description": "Project description",
      "owner": "507f1f77bcf86cd799439011",
      "members": [],
      "createdAt": "2025-01-22T10:00:00Z"
    },
    "columns": [
      {"_id": "...", "title": "Backlog", "position": 0},
      {"_id": "...", "title": "Todo", "position": 1}
    ]
  }
}
```

### Delete Board

Delete board and all associated data (owner+ only).

```
DELETE /boards/:boardId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "ok": true,
  "message": "Board and all associated data deleted"
}
```

---

## Columns

### List Columns

Get all columns in a board.

```
GET /boards/:boardId/columns
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "columns": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Backlog",
        "board": "507f1f77bcf86cd799439012",
        "position": 0,
        "createdAt": "2025-01-22T10:00:00Z"
      }
    ]
  }
}
```

### Create Column

Add column to board (members+ only).

```
POST /boards/:boardId/columns
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "In Review"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "column": {
      "_id": "507f1f77bcf86cd799439015",
      "title": "In Review",
      "board": "507f1f77bcf86cd799439012",
      "position": 2,
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

### Update Column

Update column details (admin only).

```
PATCH /columns/:columnId
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Code Review"
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "column": {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Code Review",
      "position": 2
    }
  }
}
```

### Delete Column

Remove column (admin only).

```
DELETE /columns/:columnId
```

**Response 200:**
```json
{
  "ok": true,
  "message": "Column deleted"
}
```

---

## Tickets

### List Tickets

Get paginated list of tickets (with filters).

```
GET /tickets
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `assignee` (string, optional) - User ID
- `status` (string, optional) - backlog, todo, in_progress, review, done
- `priority` (string, optional) - Low, Medium, High, Critical
- `sort` (string, default: createdAt)
- `order` (asc|desc, default: desc)

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "tickets": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "title": "Fix login bug",
        "description": "Users can't login with email",
        "priority": "High",
        "status": "in_progress",
        "board": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Project Alpha"
        },
        "column": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Doing"
        },
        "assignee": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdBy": {...},
        "createdAt": "2025-01-22T10:00:00Z"
      }
    ],
    "total": 42,
    "totalPages": 3
  }
}
```

### Get Ticket

Retrieve specific ticket with comments.

```
GET /tickets/:ticketId
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "_id": "507f1f77bcf86cd799439016",
      "title": "Fix login bug",
      "description": "Users can't login with email",
      "priority": "High",
      "status": "in_progress",
      "board": {...},
      "column": {...},
      "assignee": {...},
      "createdBy": {...},
      "comments": [
        {
          "_id": "507f1f77bcf86cd799439017",
          "text": "Started investigating",
          "author": {...},
          "createdAt": "2025-01-22T10:30:00Z"
        }
      ],
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

### Create Ticket

Create new ticket (members+ only).

```
POST /tickets
```

**Rate Limit:** 50 requests per 5 minutes

**Request Body:**
```json
{
  "title": "Add dark mode",
  "description": "Implement dark theme",
  "priority": "Medium",
  "boardId": "507f1f77bcf86cd799439012",
  "columnId": "507f1f77bcf86cd799439013",
  "assignee": "507f1f77bcf86cd799439011"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "_id": "507f1f77bcf86cd799439018",
      "title": "Add dark mode",
      "description": "Implement dark theme",
      "priority": "Medium",
      "board": {...},
      "column": {...},
      "assignee": {...},
      "createdBy": {...},
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

### Update Ticket

Update ticket properties (members+ only).

```
PUT /tickets/:ticketId
PATCH /tickets/:ticketId
```

**Request Body:**
```json
{
  "title": "Add dark mode (updated)",
  "priority": "High",
  "assignee": "507f1f77bcf86cd799439011"
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "ticket": {...}
  }
}
```

### Move Ticket

Move ticket to different column/position.

```
PATCH /tickets/:ticketId/move
```

**Request Body:**
```json
{
  "columnId": "507f1f77bcf86cd799439014",
  "index": 0
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "ticket": {...}
  }
}
```

### Delete Ticket

Delete ticket (soft delete by default, members+ only).

```
DELETE /tickets/:ticketId?hardDelete=true
```

**Query Parameters:**
- `hardDelete` (boolean, optional) - Permanently delete (admin only)

**Response 200:**
```json
{
  "ok": true,
  "message": "Ticket deleted"
}
```

### Get My Tickets

Get tickets assigned to current user.

```
GET /tickets/mine
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `priority` (string, optional)

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "tickets": [...],
    "total": 5,
    "totalPages": 1
  }
}
```

---

## Comments

### Add Comment

Add comment to ticket (members+ only).

```
POST /tickets/:ticketId/comments
```

**Request Body:**
```json
{
  "text": "This is a comment on the ticket"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "comment": {
      "_id": "507f1f77bcf86cd799439017",
      "text": "This is a comment on the ticket",
      "author": {...},
      "createdAt": "2025-01-22T10:30:00Z"
    }
  }
}
```

### Delete Comment

Delete own comment or any comment (admin only).

```
DELETE /tickets/:ticketId/comments/:commentId
```

**Response 200:**
```json
{
  "ok": true,
  "message": "Comment deleted"
}
```

---

## Activity Logs

### Get Board Activity

Retrieve activity logs for a board with optional filtering.

```
GET /boards/:boardId/activity
```

**Query Parameters:**
- `action` (string, optional) - Filter by action type
- `entityType` (string, optional) - Filter by entity type
- `userId` (string, optional) - Filter by user
- `limit` (number, default: 50)
- `skip` (number, default: 0)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "action": "ticket.create",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "entityType": "ticket",
      "entityId": "507f1f77bcf86cd799439016",
      "boardId": "507f1f77bcf86cd799439012",
      "metadata": {
        "title": "Fix login bug",
        "priority": "High"
      },
      "createdAt": "2025-01-22T10:00:00Z"
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

### Get Activity Timeline

Get activities grouped by date.

```
GET /boards/:boardId/activity/timeline
```

**Query Parameters:**
- `days` (number, default: 7) - Look back X days
- `limit` (number, default: 100)

**Response 200:**
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

Get activity summary and user statistics.

```
GET /boards/:boardId/activity/stats
```

**Query Parameters:**
- `days` (number, default: 30)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "actionStats": [
      {"_id": "ticket.create", "count": 45},
      {"_id": "ticket.update", "count": 123}
    ],
    "userStats": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "username": "john_doe",
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

Get activities related to specific ticket.

```
GET /tickets/:ticketId/activity
```

**Query Parameters:**
- `limit` (number, default: 50)
- `skip` (number, default: 0)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {...activity records...}
  ],
  "pagination": {...}
}
```

---

## Search

### Search Tickets

Full-text search across accessible tickets.

```
GET /tickets/search
```

**Rate Limit:** 30 requests per minute

**Query Parameters:**
- `q` (string, required) - Search query
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "tickets": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "title": "Fix login bug",
        "description": "Users can't login with email",
        "board": {...},
        "priority": "High"
      }
    ],
    "total": 5,
    "totalPages": 1
  }
}
```

---

## Error Handling

All error responses follow consistent format:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created (POST) |
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### Common Error Messages

| Error | Status | Description |
|-------|--------|-------------|
| Missing token | 401 | Authorization header or token missing |
| Invalid token | 401 | Token invalid, expired, or malformed |
| User not found | 401 | Token user no longer exists |
| Invalid email or password | 401 | Login credentials incorrect |
| Email already exists | 400 | Email already registered |
| Only members and admins can... | 403 | User role insufficient |
| You don't have access to this board | 403 | User not owner or member |
| Board not found | 404 | Board ID doesn't exist |
| Ticket not found | 404 | Ticket ID doesn't exist |
| Too many requests | 429 | Rate limit exceeded |

---

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint | Limit |
|----------|-------|
| Login | 5 requests / 15 minutes |
| Register | 3 requests / 1 hour |
| Search | 30 requests / 1 minute |
| General API | 300 requests / 15 minutes |
| Write ops | 50 requests / 5 minutes |

Rate limit info in response headers:
```
RateLimit-Limit: 50
RateLimit-Remaining: 47
RateLimit-Reset: 1642854900
```

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token obtained from login/register response and valid for 7 days.

---

## Examples Using cURL

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Create Ticket
```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"New feature",
    "priority":"High",
    "boardId":"BOARD_ID",
    "columnId":"COLUMN_ID"
  }'
```

### Get Board Activity
```bash
curl http://localhost:4000/api/boards/BOARD_ID/activity \
  -H "Authorization: Bearer TOKEN"
```

### Search Tickets
```bash
curl "http://localhost:4000/api/tickets/search?q=login" \
  -H "Authorization: Bearer TOKEN"
```
