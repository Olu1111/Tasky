# RBAC Architecture Diagram

## Role Hierarchy

```
                          ┌─────────────────┐
                          │     ADMIN       │
                          │   (Level 3)     │
                          │                 │
                          │  All Permissions│
                          └────────┬────────┘
                                   │
                                   │
                          ┌────────▼────────┐
                          │     MEMBER      │
                          │   (Level 2)     │
                          │                 │
                          │ Create, Edit,   │
                          │ Delete own      │
                          └────────┬────────┘
                                   │
                                   │
                          ┌────────▼────────┐
                          │     VIEWER      │
                          │   (Level 1)     │
                          │                 │
                          │ Read-only       │
                          │ access          │
                          └─────────────────┘
```

## Permission Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         INCOMING REQUEST                             │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    requireAuth Middleware    │
        │  (Verify JWT Token)          │
        └──────────────┬───────────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
          PASS                 FAIL
             │                   │
             ▼                   ▼
     ┌──────────────┐    ┌──────────────┐
     │ Load User    │    │ Return 401   │
     │ from DB      │    │ Unauthorized │
     └──────┬───────┘    └──────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │  requireMember Middleware (if needed)│
   │  Check: user.role in ['admin',      │
   │         'member']                   │
   └────────────┬────────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
     PASS               FAIL
       │                 │
       ▼                 ▼
   ┌────────────┐  ┌─────────────┐
   │  Proceed   │  │ Return 403  │
   │   to       │  │ Forbidden   │
   │ Controller │  └─────────────┘
   └─────┬──────┘
         │
         ▼
┌────────────────────────────────────────┐
│    Controller Permission Checks        │
│                                        │
│  • canAccessBoard()                    │
│  • canModifyBoard()                    │
│  • canModifyTicket()                   │
│  • Board membership verification       │
│  • Ticket assignment verification      │
│  • Comment author verification         │
└────────────┬─────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
   PASS             FAIL
     │                │
     ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Execute    │  │ Return 403  │
│  Operation  │  │ or 404      │
└────────┬────┘  └─────────────┘
         │
         ▼
   ┌──────────────┐
   │ Return 200   │
   │ with data    │
   └──────────────┘
```

## Route Protection Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOARDS ENDPOINTS                             │
├─────────────────┬──────────┬──────────┬──────────┬──────────────┤
│ Endpoint        │ Method   │ Auth     │ Role     │ Additional   │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /               │ GET      │ Required │ None     │ Filtered by  │
│                 │          │          │          │ ownership    │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ GET      │ Required │ None     │ Access check │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /               │ POST     │ Required │ Member   │ None         │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ DELETE   │ Required │ Member   │ Owner check  │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id/columns    │ GET      │ Required │ None     │ Access check │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id/columns    │ POST     │ Required │ Member   │ Owner check  │
└─────────────────┴──────────┴──────────┴──────────┴──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TICKETS ENDPOINTS                            │
├─────────────────┬──────────┬──────────┬──────────┬──────────────┤
│ Endpoint        │ Method   │ Auth     │ Role     │ Additional   │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /               │ GET      │ Required │ None     │ Filtered by  │
│                 │          │          │          │ board access │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /mine           │ GET      │ Required │ None     │ User's tasks │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /search         │ GET      │ Required │ None     │ Search access│
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ GET      │ Required │ None     │ Access check │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /               │ POST     │ Required │ Member   │ Board access │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ PUT      │ Required │ Member   │ Ownership    │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ PATCH    │ Required │ Member   │ Ownership    │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id/move       │ PATCH    │ Required │ Member   │ Ownership    │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id            │ DELETE   │ Required │ Member   │ Soft/Hard    │
│                 │          │          │          │ delete check │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id/comments   │ POST     │ Required │ Member   │ Access check │
├─────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ /:id/comments   │ DELETE   │ Required │ Member   │ Author check │
│ /:commentId     │          │          │          │              │
└─────────────────┴──────────┴──────────┴──────────┴──────────────┘
```

## Permission Check Decision Tree - Boards

```
                    User Requests Board
                          │
                          ▼
                   Is User Admin?
                    /          \
                  YES            NO
                   │              │
                   │              ▼
                   │        Is User Owner?
                   │          /        \
                   │        YES         NO
                   │         │          │
                   │         │          ▼
                   │         │    Is User Member?
                   │         │      /        \
                   │         │    YES         NO
                   │         │     │          │
                   └─────────┴──────┴──────┐   │
                           │               │   │
                          YES             NO  │
                           │               │   │
                           ▼               ▼   ▼
                        ALLOW            DENY (403)
```

## Permission Check Decision Tree - Tickets

```
              User Requests Ticket Modification
                          │
                          ▼
                   Is User Admin?
                    /          \
                  YES            NO
                   │              │
                   │              ▼
                   │        Is User Assignee?
                   │          /        \
                   │        YES         NO
                   │         │          │
                   │         │          ▼
                   │         │    Is Board Owner?
                   │         │      /        \
                   │         │    YES         NO
                   │         │     │          │
                   │         │     │          ▼
                   │         │     │    Is Board Member?
                   │         │     │      /        \
                   │         │     │    YES         NO
                   │         │     │     │          │
                   └─────────┴──────┴──────┴──────┐  │
                           │                      │  │
                          YES                    NO  │
                           │                      │  │
                           ▼                      ▼  ▼
                        ALLOW                  DENY (403)
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  CLIENT REQUEST                                                      │
│        │                                                            │
│        ▼                                                            │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │            Express Router                              │       │
│  │  (routes/boards.routes.js, etc.)                       │       │
│  └──────────────────┬──────────────────────────────────────┘       │
│                     │                                              │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ MIDDLEWARE LAYER                                       │        │
│  │                                                        │        │
│  │  1. requireAuth (auth.js)                             │        │
│  │     ├─ Validate JWT                                  │        │
│  │     ├─ Load user from DB                             │        │
│  │     └─ Attach to req.user                            │        │
│  │                                                        │        │
│  │  2. requireMember (auth.js) [if needed]               │        │
│  │     ├─ Check role is "admin" or "member"            │        │
│  │     └─ Block viewers                                 │        │
│  └──────────────────┬───────────────────────────────────┘        │
│                     │                                              │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ CONTROLLER LAYER                                       │        │
│  │                                                        │        │
│  │  boards.controller.js                                 │        │
│  │  ├─ canAccessBoard() helper                           │        │
│  │  ├─ canModifyBoard() helper                           │        │
│  │  └─ Permission logic in each function                 │        │
│  │                                                        │        │
│  │  ticket.controller.js                                 │        │
│  │  ├─ canModifyTicket() helper                          │        │
│  │  └─ Access checks in each function                    │        │
│  │                                                        │        │
│  │  comment.controller.js                                │        │
│  │  ├─ Role checks                                       │        │
│  │  └─ Author/Admin checks                               │        │
│  │                                                        │        │
│  │  columns.controller.js                                │        │
│  │  ├─ canModifyBoard() helper                           │        │
│  │  └─ Board owner checks                                │        │
│  └──────────────────┬───────────────────────────────────┘        │
│                     │                                              │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ DATABASE LAYER                                         │        │
│  │                                                        │        │
│  │  User.js Model                                        │        │
│  │  ├─ role: enum ["admin", "member", "viewer"]         │        │
│  │  ├─ isAdmin()                                         │        │
│  │  ├─ isMember()                                        │        │
│  │  └─ hasRoleLevel()                                    │        │
│  │                                                        │        │
│  │  Board.js Model                                       │        │
│  │  ├─ owner: User reference                            │        │
│  │  └─ members: User[] array                            │        │
│  │                                                        │        │
│  │  Ticket.js Model                                      │        │
│  │  ├─ board: Board reference                           │        │
│  │  └─ assignee: User reference                         │        │
│  │                                                        │        │
│  │  Comment.js Model                                     │        │
│  │  └─ author: User reference                           │        │
│  └──────────────────┬───────────────────────────────────┘        │
│                     │                                              │
│                     ▼                                              │
│  CLIENT RESPONSE (200/403/401)                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

## Middleware Stack Example

```
ENDPOINT: POST /api/tickets

Request comes in
       │
       ▼
    router.post('/', ...)
       │
       ├─ Middleware 1: requireAuth
       │  ├─ Check JWT token exists
       │  ├─ Verify JWT signature
       │  └─ Load user from database
       │     If fails → 401 Unauthorized
       │
       ├─ Middleware 2: requireMember
       │  ├─ Check user.role in ['admin', 'member']
       │     If fails → 403 Forbidden
       │
       └─ Handler: ticketController.createTicket()
          ├─ Check user role (internal)
          ├─ Check board access (internal)
          ├─ Check column validity (internal)
          └─ Create ticket if all pass
             If any fails → 403 Forbidden

Response sent to client
```

## Data Flow for Permission Check

```
REQUEST: PUT /api/tickets/:id

┌──────────────────────────────────┐
│ req.params.id: "123"             │
│ req.user: {                       │
│   _id: "user-1",                 │
│   role: "member"                 │
│ }                                │
└──────────────────────────────────┘
         │
         ▼
    ┌────────────────────────────┐
    │ updateTicket()             │
    │                            │
    │ const { id } = req.params  │
    │ Check 1: Has Access?       │
    │   → Query Ticket by ID     │
    │   → Check board ownership  │
    │   → If fail → 403          │
    │                            │
    │ Check 2: Has Role?         │
    │   → Is member/admin?       │
    │   → If not → 403           │
    │                            │
    │ Check 3: All Pass?         │
    │   → Update ticket          │
    │   → Return 200 + data      │
    └────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ res.json({                        │
│   ok: true,                       │
│   data: { ticket: {...} }        │
│ })                               │
└──────────────────────────────────┘
```

---

This visual representation shows how the RBAC system flows through the application from request to response, with multiple layers of permission checking at middleware and controller levels.
