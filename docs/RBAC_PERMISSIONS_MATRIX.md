# Role-Based Access Control (RBAC) Permissions Matrix

Complete reference for Tasky role permissions and access control.

## Role Hierarchy

Tasky uses a three-tier role hierarchy with inheritance:

```
Admin (Level 3)
  ↓ inherits all
Member (Level 2)
  ↓ inherits all
Viewer (Level 1)
```

### Role Definitions

| Role | Description | Use Case |
|------|-------------|----------|
| **Admin** | Full system access, user management, can override any permission | System administrators, team leads |
| **Member** | Can create/modify boards and tickets, limited user management | Project team members, contributors |
| **Viewer** | Read-only access to assigned/visible boards and tickets | Stakeholders, clients, auditors |

---

## Permission Matrix

### Legend
- ✅ Allowed
- ❌ Denied
- 🔑 Requires condition

### Authentication Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| POST /auth/register | ✅ | ✅ | ✅ | Public (rate-limited) |
| POST /auth/login | ✅ | ✅ | ✅ | Public (rate-limited) |
| GET /auth/me | ✅ | ✅ | ✅ | Authenticated |
| GET /users | ✅ | ❌ | ❌ | Admin only |

### Board Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| GET /boards | ✅ All | ✅ Owned/Member | ✅ Owned/Member | Visibility-based |
| GET /boards/:id | ✅ All | 🔑 Has access | 🔑 Has access | Board membership |
| POST /boards | ✅ | ✅ | ❌ | Members+ only |
| DELETE /boards/:id | ✅ All | 🔑 Owned | ❌ | Owner only |
| POST /boards/:id/columns | ✅ | ✅ | ❌ | Members+ only |
| GET /boards/:id/columns | ✅ All | 🔑 Has access | 🔑 Has access | Board membership |

### Column Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| PATCH /columns/:id | ✅ All | ❌ | ❌ | Admin only |
| DELETE /columns/:id | ✅ All | ❌ | ❌ | Admin only |

### Ticket Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| GET /tickets | ✅ | ✅ | ✅ | See accessible only |
| GET /tickets/:id | ✅ All | 🔑 Board access | 🔑 Board access | Board accessibility |
| POST /tickets | ✅ | ✅ | ❌ | Members+ only |
| PUT /tickets/:id | ✅ All | 🔑 Can modify | ❌ | Board member/owner/assignee |
| PATCH /tickets/:id | ✅ All | 🔑 Can modify | ❌ | Board member/owner/assignee |
| PATCH /tickets/:id/move | ✅ All | 🔑 Can modify | ❌ | Board member/owner/assignee |
| DELETE /tickets/:id | ✅ All | 🔑 Can modify | ❌ | Board member/owner/assignee |
| DELETE /tickets/:id?hardDelete | ✅ | ❌ | ❌ | Admin only (permanent) |
| GET /tickets/mine | ✅ All | ✅ | ✅ | Assigned to user |
| GET /tickets/search | ✅ All | ✅ | ✅ | Search accessible boards |

### Comment Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| POST /tickets/:id/comments | ✅ | ✅ | ❌ | Members+ only |
| DELETE /tickets/:id/comments/:cid | ✅ All | 🔑 Own comment | ❌ | Author or admin |

### Activity Endpoints

| Endpoint | Admin | Member | Viewer | Condition |
|----------|-------|--------|--------|-----------|
| GET /boards/:id/activity | ✅ All | 🔑 Has access | 🔑 Has access | Board membership |
| GET /boards/:id/activity/timeline | ✅ All | 🔑 Has access | 🔑 Has access | Board membership |
| GET /boards/:id/activity/stats | ✅ All | 🔑 Has access | 🔑 Has access | Board membership |
| GET /tickets/:id/activity | ✅ All | 🔑 Can access | 🔑 Can access | Ticket accessibility |

---

## Resource-Specific Permissions

### Board Permissions

A user can access a board if:
- User is the **owner**, OR
- User is in board's **members** array, OR
- User is an **admin**

**Modification (edit/delete):**
- Admin can modify any board
- Member can only modify boards they **own**

### Ticket Permissions

A user can **view** ticket if:
- User has access to parent board

A user can **modify** (edit/move/delete) ticket if:
- User is an **admin**, OR
- User is **ticket assignee**, OR
- User is board **owner**, OR
- User is board **member**

### Comment Permissions

A user can **add** comment if:
- User is **member or admin** (role check)
- User has access to parent ticket

A user can **delete** comment if:
- User is **author** of comment, OR
- User is **admin**

---

## Permission Evaluation Flow

```
Request → Authentication Check
        ↓
        Is user authenticated?
        ├─ No → 401 Unauthorized
        └─ Yes ↓
          Check Route Authorization
          ├─ Does role match requirement?
          │  ├─ Admin route + User is admin? → Continue
          │  ├─ Member route + User is member/admin? → Continue
          │  └─ No match → 403 Forbidden
          └─ Yes ↓
            Check Resource Access
            ├─ Has user access to resource?
            │  ├─ Board membership check
            │  ├─ Ticket ownership check
            │  ├─ Comment author check
            │  └─ No access → 403 Forbidden
            └─ Yes ↓
              Check Resource Modification (if write operation)
              ├─ Can user modify?
              │  ├─ Ownership/authorship check
              │  └─ Role-based override check
              └─ Execute operation
```

---

## Role Inheritance

Admins inherit all member permissions:

```javascript
admin.can("create_board")      // true (via member)
admin.can("delete_any_board")  // true (exclusive)
admin.can("list_users")        // true (exclusive)

member.can("create_board")     // true
member.can("delete_any_board") // false
member.can("list_users")       // false

viewer.can("create_board")     // false
viewer.can("view_board")       // true (if member)
```

---

## Common Permission Scenarios

### Scenario 1: User Creates Board
1. Check: Is user member or admin? **YES** → Continue
2. Create board with user as owner
3. Auto-create default columns
4. Log activity (if not viewer)

### Scenario 2: User Updates Ticket
1. Check: Is user member or admin? **YES** → Continue
2. Check: Is user admin OR board owner OR board member OR ticket assignee? **YES** → Continue
3. Update ticket fields
4. Log activity

### Scenario 3: Admin Deletes Any Board
1. Check: Is user admin? **YES** → Continue
2. Override all ownership checks
3. Delete board + columns + tickets
4. Log activity

### Scenario 4: Viewer Searches Tickets
1. Check: Is user authenticated? **YES** → Continue
2. Search only accessible boards/tickets
3. Return filtered results
4. Log search (if enabled)

---

## Role Assignment

### Initial Assignment
- Users register as **member** by default
- Admins manually upgrade/downgrade roles

### Upgrade Path
```
viewer → member → admin (by admin only)
```

### Permission Changes
Changes take effect immediately:
- JWT token contains role at issuance
- Users get new token on re-login
- Admin changes reflected next token refresh

---

## Default Roles

| Resource | Default Creator Role |
|----------|----------------------|
| Board | Owner (creator) |
| Ticket | Created by member/admin |
| Column | Created by system (board) |
| Comment | Posted by member/admin |

---

## Rate Limiting by Role

Rate limits apply to all roles equally:

| Operation | Limit |
|-----------|-------|
| Login attempts | 5 / 15 min |
| Register | 3 / 1 hour |
| Search | 30 / 1 min |
| Write operations | 50 / 5 min |

Admins NOT exempt from rate limiting.

---

## Audit Trail for Permissions

All permission checks logged to audit trail:
- User role at request time
- Resource access grant/deny
- Permission evaluation reason
- Timestamp and IP address

Access denied events flagged for monitoring.

---

## Future Permission Enhancements

- Fine-grained board permissions (e.g., "can edit only own tickets")
- Time-based access (e.g., temporary viewer access)
- Granular column/board section permissions
- Custom role creation
- Permission delegation
- Audit approval workflows

---

## Security Notes

- ✅ Roles checked on every request
- ✅ Resource ownership verified server-side
- ✅ No reliance on client-side role information
- ✅ Permission checks not bypassable via API
- ✅ Admin can override but is logged
- ✅ Role changes require authentication re-check

---

## Testing Permissions

### Admin Testing
```bash
# Login as admin
curl -X POST /api/auth/login -d '{"email":"admin@example.com","password":"..."}'

# Should succeed (list users)
curl /api/users -H "Authorization: Bearer ADMIN_TOKEN"

# Should succeed (delete any board)
curl -X DELETE /api/boards/BOARD_ID -H "Authorization: Bearer ADMIN_TOKEN"
```

### Member Testing
```bash
# Login as member
curl -X POST /api/auth/login -d '{"email":"member@example.com","password":"..."}'

# Should fail (list users not allowed)
curl /api/users -H "Authorization: Bearer MEMBER_TOKEN"

# Should succeed (create board)
curl -X POST /api/boards -H "Authorization: Bearer MEMBER_TOKEN"
```

### Viewer Testing
```bash
# Login as viewer
curl -X POST /api/auth/login -d '{"email":"viewer@example.com","password":"..."}'

# Should fail (can't create board)
curl -X POST /api/boards -H "Authorization: Bearer VIEWER_TOKEN"

# Should succeed (view accessible board)
curl /api/boards/BOARD_ID -H "Authorization: Bearer VIEWER_TOKEN"
```
