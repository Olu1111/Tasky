# Boards & Columns API (backend)

This document describes the request and response shapes and the available endpoints for Boards and Columns.

## Entities

- Board
  - Fields:
    - `_id` (string) : MongoDB id
    - `title` (string) : board title
    - `description` (string|null) : optional description
    - `owner` (string) : user id of owner
    - `createdAt` (string, ISO) : created timestamp
    - `updatedAt` (string, ISO) : last updated timestamp
    - `columns` (array of Column) : optional embedded columns when returned with details

- Column
  - Fields:
    - `_id` (string) : MongoDB id
    - `title` (string) : column title (e.g. Backlog, Todo)
    - `board` (string) : board id
    - `position` (number) : zero-based ordering index
    - `createdAt` (string, ISO)
    - `updatedAt` (string, ISO)

## Request / Response shapes

Create Board (POST /api/boards)
- Request JSON:

```json
{
  "title": "Project Board",
  "description": "Optional details"
}
```

- Response 201 JSON:

```json
{
  "ok": true,
  "data": {
    "board": {
      "_id": "...",
      "title": "Project Board",
      "description": "Optional details",
      "owner": "<userId>",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

Get Board details (GET /api/boards/:boardId)
- Response 200 JSON includes board with columns array:

```json
{
  "ok": true,
  "data": {
    "board": {
      "_id": "...",
      "title": "Project Board",
      "description": "...",
      "owner": "<userId>",
      "columns": [
        {
          "_id": "...",
          "title": "Backlog",
          "position": 0
        },
        {
          "_id": "...",
          "title": "Todo",
          "position": 1
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

Create Column (POST /api/boards/:boardId/columns)
- Request JSON:

```json
{
  "title": "Backlog",
  "position": 0
}
```

- Response 201 JSON:

```json
{
  "ok": true,
  "data": {
    "column": {
      "_id": "...",
      "title": "Backlog",
      "board": "<boardId>",
      "position": 0,
      "createdAt": "..."
    }
  }
}
```

Update Column (PATCH /api/columns/:columnId)
- Request JSON (any fields to update):

```json
{
  "title": "In Review",
  "position": 2
}
```

Delete Column (DELETE /api/columns/:columnId)
- Response 200 JSON: `{ "ok": true, "data": { "message": "Deleted" } }`

Reorder columns
- To change positions, clients should PATCH affected columns with new `position` values.

## Endpoints (brief)

- `GET /api/boards` — list boards accessible to the user (requires auth)
- `POST /api/boards` — create board (requires auth)
- `GET /api/boards/:boardId` — board details with columns (requires auth)
- `PATCH /api/boards/:boardId` — update board (owner or admin)
- `DELETE /api/boards/:boardId` — delete board (owner or admin)

- `POST /api/boards/:boardId/columns` — create column in board (requires auth)
- `PATCH /api/columns/:columnId` — update column (requires auth / board owner)
- `DELETE /api/columns/:columnId` — delete column (requires auth / board owner)

## Authorization notes

- All endpoints that modify data should require authentication (`Authorization: Bearer <token>`).
- Creating boards/columns and updating requires the acting user to be the board owner or an admin for destructive actions.

## Validation / Errors

- Standard error envelope:

```json
{ "ok": false, "error": "message" }
```

- Validation errors return `400` with a descriptive message. Unauthorized returns `401`, forbidden returns `403`, not found returns `404`.

---

This file is intentionally short; implementational details (routes, controllers) should follow these shapes.
