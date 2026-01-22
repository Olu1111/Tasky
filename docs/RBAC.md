# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the Role-Based Access Control enhancement implemented in the Tasky backend. The RBAC system provides fine-grained permission control with a three-tier role hierarchy.

## Role Hierarchy

The system implements three distinct roles with the following hierarchy:

```
admin (Level 3) > member (Level 2) > viewer (Level 1)
```

### Role Definitions

#### Admin
- **Level**: 3 (highest)
- **Permissions**:
  - View all boards and tickets (regardless of ownership)
  - Create, edit, and delete any board
  - Create, edit, and delete any ticket
  - Add/remove board members
  - Perform hard deletes on tickets
  - Add, edit, and delete comments on any ticket
  - Create and manage columns on any board

#### Member
- **Level**: 2 (intermediate)
- **Permissions**:
  - Create boards (becomes owner)
  - View and edit boards they own
  - View boards they are members of
  - Create tickets on accessible boards
  - Edit/delete tickets they created or are assigned to
  - Edit/delete tickets on boards they own/manage
  - Add, edit, and delete comments
  - Cannot hard delete tickets (soft delete only)
  - Cannot view boards they don't own/manage

#### Viewer
- **Level**: 1 (lowest)
- **Permissions**:
  - View boards (if owner or member)
  - View tickets on accessible boards
  - Search across accessible boards
  - Cannot create, edit, or delete resources
  - Cannot add or delete comments
  - Cannot modify board structure

## Implementation Details

### User Model Changes

**File**: `backend/src/models/User.js`

The User model was updated to:
1. Change role enum from `["admin", "user"]` to `["admin", "member", "viewer"]`
2. Change default role from `"user"` to `"member"`
3. Add role hierarchy helper methods:
   - `isAdmin()` - Check if user is admin
   - `isMember()` - Check if user is member or above
   - `isViewer()` - Check if user is viewer or above
   - `hasRoleLevel(requiredRole)` - Compare role levels

### Authentication Middleware Updates

**File**: `backend/src/middleware/auth.js`

Enhanced with:
- `requireRole(...roles)` - Check if user has any of the specified roles
- `requireMember()` - Enforce member or admin access
- Updated `requireAdmin()` for consistency
- All endpoints maintain backward compatibility

### New Role Validation Middleware

**File**: `backend/src/middleware/roleAuth.js`

Provides specialized permission checking:
- `requireRole()` - Flexible role checking with hierarchy support
- `requireAdmin()` - Admin-only access
- `requireMember()` - Member or admin access
- `canModifyBoard()` - Check board modification permissions
- `canModifyTicket()` - Check ticket modification permissions

### Controller Permission Checks

#### Board Controller (`backend/src/controllers/boards.controller.js`)
- **getBoardById**: Verify user has access to the board
- **listBoards**: Return only boards user owns/manages (except for admins)
- **createBoard**: Only members and admins can create
- **deleteBoard**: Only board owner or admin can delete

#### Ticket Controller (`backend/src/controllers/ticket.controller.js`)
- **createTicket**: Only members/admins; verify board access
- **updateTicket**: Only members/admins; verify ticket access
- **deleteTicket**: Only members/admins; soft delete or hard delete (admin only)
- **getTicket**: Verify user has access to ticket's board

#### Comment Controller (`backend/src/controllers/comment.controller.js`)
- **addComment**: Only members/admins; verify ticket access
- **deleteComment**: Author or admin only; verify role level

#### Columns Controller (`backend/src/controllers/columns.controller.js`)
- **addColumn**: Board owner or admin only
- **listColumnsByBoard**: Verify user has access to board
- **updateColumn**: Board owner or admin only
- **deleteColumn**: Board owner or admin only

### Route Protection

#### Board Routes (`backend/src/routes/boards.routes.js`)
```
GET    /api/boards              - requireAuth
GET    /api/boards/:id          - requireAuth
POST   /api/boards              - requireAuth + requireMember
DELETE /api/boards/:id          - requireAuth + requireMember
GET    /api/boards/:id/columns  - requireAuth
POST   /api/boards/:id/columns  - requireAuth + requireMember
```

#### Ticket Routes (`backend/src/routes/ticket.routes.js`)
```
GET    /api/tickets             - requireAuth
GET    /api/tickets/mine        - requireAuth
GET    /api/tickets/:id         - requireAuth
POST   /api/tickets             - requireAuth + requireMember
PUT    /api/tickets/:id         - requireAuth + requireMember
PATCH  /api/tickets/:id         - requireAuth + requireMember
PATCH  /api/tickets/:id/move    - requireAuth + requireMember
DELETE /api/tickets/:id         - requireAuth + requireMember
POST   /api/tickets/:id/comments        - requireAuth + requireMember
DELETE /api/tickets/:id/comments/:cId   - requireAuth + requireMember
```

## Permission Checks Flow

### Board Access Check
```javascript
1. Is user admin? → Allow
2. Is user board owner? → Allow
3. Is user in board members list? → Allow
4. Otherwise → Deny (403)
```

### Ticket Modification Check
```javascript
1. Is user admin? → Allow
2. Is user ticket assignee? → Allow
3. Is user board owner? → Allow
4. Is user board member? → Allow
5. Otherwise → Deny (403)
```

### Comment Permission Check
```javascript
1. User must be member or admin
2. For deletion: Author or admin only
3. Otherwise → Deny (403)
```

## Database Considerations

### Existing Data Migration

When upgrading from the previous role system (`"admin"`, `"user"`) to the new system (`"admin"`, `"member"`, `"viewer"`):

**Recommended Migration Strategy**:
```javascript
// Convert all existing "user" roles to "member"
db.users.updateMany(
  { role: "user" },
  { $set: { role: "member" } }
);
```

### User Role Assignment

**For new users**: Default role is `"member"`
**For existing users**: Manually assign roles as needed via admin panel or direct database update

## API Response Examples

### Success Response
```json
{
  "ok": true,
  "data": { /* resource */ }
}
```

### Permission Denied Response
```json
{
  "ok": false,
  "error": "You do not have permission to [action] this [resource]"
}
```

### Authentication Failed Response
```json
{
  "ok": false,
  "error": "Not authenticated"
}
```

## Testing RBAC

### Test Scenarios

1. **Admin user**:
   - Can view all boards
   - Can create/edit/delete any board
   - Can create/edit/delete any ticket
   - Can perform hard deletes

2. **Member user (owner)**:
   - Can view their own boards
   - Can create new boards
   - Can edit/delete tickets on their boards
   - Can soft delete tickets only

3. **Member user (non-owner)**:
   - Can only view boards they're members of
   - Can create/edit tickets on those boards
   - Cannot modify board structure

4. **Viewer user**:
   - Can only view boards/tickets
   - Cannot create or modify anything

### Running Tests

```bash
# Run with supertest or your test framework
npm run test:rbac

# Manual testing with curl
curl -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/boards
```

## Security Best Practices

1. **Always verify user role and ownership** before allowing modifications
2. **Use middleware for early rejection** of unauthorized requests
3. **Log permission denials** for security monitoring
4. **Validate board membership** before ticket operations
5. **Implement rate limiting** on sensitive endpoints
6. **Sanitize error messages** to avoid information leakage

## Future Enhancements

1. **Fine-grained permissions**: Per-ticket role assignments
2. **Custom roles**: Allow creation of custom role hierarchies
3. **Time-based access**: Temporary member assignments
4. **Activity logging**: Track all permission-related actions
5. **Audit trails**: Maintain audit log of sensitive operations
6. **Permission inheritance**: Conditional permissions based on relationships

## Backward Compatibility

The implementation maintains backward compatibility:
- Existing "admin" role continues to work unchanged
- "user" role should be migrated to "member" or "viewer" as appropriate
- All existing endpoints maintain their authentication requirements
- No breaking changes to API response formats

## Troubleshooting

### "Access denied" errors
1. Check user role in database
2. Verify board ownership/membership
3. Check route middleware configuration
4. Review controller permission checks

### Role hierarchy not working
1. Verify `roleHierarchy` object in User model
2. Check role enum values match
3. Validate JWT token contains correct role

### Migration issues
1. Backup database before migration
2. Run test queries before full update
3. Verify all documents have valid roles
4. Check application logs for role conversion errors
