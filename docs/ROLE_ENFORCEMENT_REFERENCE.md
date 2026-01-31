# 🔐 Role Enforcement - Quick Reference

## Files Created/Modified

### Backend
- **Modified:** [backend/src/controllers/auth.controller.js](backend/src/controllers/auth.controller.js)
  - Updated `/api/users/me` endpoint
  - Returns: `role`, `permissions` array, role flags (`isAdmin`, `isMember`, `isViewer`)

### Frontend
- **Created:** [frontend/src/hooks/useRole.js](frontend/src/hooks/useRole.js)
  - `useRole()` hook - Role checks and permission enforcement
  - `RoleProvider` - Context wrapper for app
  - `ProtectedFeature` - Component for conditional UI rendering
  - `RoleBadge` - Display user's role
  - `getPermissionMatrix()` - View permission structure

- **Modified:** [frontend/src/App.jsx](frontend/src/App.jsx)
  - Wrapped with `RoleProvider`
  - Fetches user role/permissions on auth

- **Modified:** [frontend/src/components/TicketModal.jsx](frontend/src/components/TicketModal.jsx)
  - Added permission check: `canPerform('create_ticket')`
  - Shows warning for viewers
  - Disables button if no permission

---

## Usage Examples

### Check Permission in Component
```jsx
import { useRole } from '@/hooks/useRole';

function MyComponent() {
  const { canPerform, hasRole } = useRole();

  return (
    <div>
      {canPerform('create_ticket') && <Button>New Ticket</Button>}
      {hasRole('admin') && <Button>Admin Settings</Button>}
    </div>
  );
}
```

### Protect UI Element
```jsx
import { ProtectedFeature } from '@/hooks/useRole';

<ProtectedFeature requires="delete_board">
  <Button color="error">Delete Board</Button>
</ProtectedFeature>

// With fallback
<ProtectedFeature 
  requires="delete_board"
  fallback={<Typography>No permission</Typography>}
>
  <Button color="error">Delete Board</Button>
</ProtectedFeature>
```

### Use Role Context
```jsx
import { useRole } from '@/hooks/useRole';

const { user, getRole, isAdmin, isMember, isViewer } = useRole();

console.log(user.role);        // 'admin', 'member', or 'viewer'
console.log(user.permissions); // ['create_ticket', 'edit_ticket', ...]
console.log(isAdmin());        // true/false
console.log(getPermissions()); // Full permission array
```

---

## Permission Matrix

| Permission | Admin | Member | Viewer |
|-----------|-------|--------|--------|
| create_board | ✅ | ✅ | ❌ |
| edit_board | ✅ | ✅ | ❌ |
| delete_board | ✅ | ❌ | ❌ |
| create_ticket | ✅ | ✅ | ❌ |
| edit_ticket | ✅ | ✅ | ❌ |
| delete_ticket | ✅ | ❌ | ❌ |
| assign_ticket | ✅ | ✅ | ❌ |
| create_comment | ✅ | ✅ | ❌ |
| edit_comment | ✅ | ✅ | ❌ |
| delete_comment | ✅ | ❌ | ❌ |
| create_column | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ |
| view_board | ✅ | ✅ | ✅ |
| view_ticket | ✅ | ✅ | ✅ |
| view_comment | ✅ | ✅ | ✅ |

---

## API Response Format

### GET /api/users/me
```json
{
  "ok": true,
  "data": {
    "_id": "user_id",
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": [
      "create_board",
      "edit_board",
      "delete_board",
      "create_ticket",
      ...
    ],
    "isAdmin": true,
    "isMember": true,
    "isViewer": true
  }
}
```

---

## Quick Tests

### Test 1: Admin Features Visible
```
Login: admin@example.com
Expected: 
- Create button visible ✅
- Edit/Delete options visible ✅
- No permission warnings ✅
```

### Test 2: Viewer Cannot Create
```
Login: viewer@example.com
Expected:
- No create button ❌ (hidden)
- If modal opens: warning shown + button disabled
- "Contact admin" message shown
```

### Test 3: Backend Enforces
```
As viewer, try API:
POST /api/tickets
Expected: 403 Forbidden
(Backend also checks permissions, not just UI)
```

---

## Customizing Permissions

Edit [backend/src/controllers/auth.controller.js](backend/src/controllers/auth.controller.js):

```javascript
const permissions = {
  admin: ['create_board', 'edit_board', ...],   // ← Add/remove here
  member: ['create_ticket', 'edit_ticket', ...],
  viewer: ['view_board', 'view_ticket', ...]
};
```

---

## Hook Methods

### `useRole()`
```javascript
const {
  user,              // Full user object with role + permissions
  hasRole,           // fn: hasRole('admin') → boolean
  canPerform,        // fn: canPerform('create_ticket') → boolean
  getPermissions,    // fn: → ['create_ticket', 'edit_ticket', ...]
  isAdmin,           // fn: → boolean
  isMember,          // fn: → boolean
  isViewer,          // fn: → boolean
  getRole            // fn: → 'admin'|'member'|'viewer'
} = useRole();
```

### `ProtectedFeature` Props
```javascript
<ProtectedFeature 
  requires="create_ticket"     // Permission required
  requireRole="admin"          // OR role required (not permission)
  fallback={<Text>No access</Text>}  // Optional fallback UI
>
  <Button>Create</Button>       // Content shown if allowed
</ProtectedFeature>
```

---

## Testing with cURL

```bash
# Get user with role/permissions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/users/me
```

---

## Deployment Checklist

- ✅ Backend returns role + permissions in /api/users/me
- ✅ Frontend useRole hook implemented
- ✅ RoleProvider wraps App
- ✅ ProtectedFeature component created
- ✅ TicketModal checks permission
- ✅ Warning shown for denied actions
- ✅ Testing guide complete

