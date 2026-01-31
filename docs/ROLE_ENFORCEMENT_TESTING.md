# 🔐 Role Enforcement UI/UX - Testing Guide

## Overview

Role-based access control (RBAC) now enforces permissions at the UI level. Users see/interact with features based on their role.

---

## 🎯 Role Levels & Permissions

### Admin
```
✅ Create/Edit/Delete boards
✅ Create/Edit/Delete tickets
✅ Create/Edit/Delete comments
✅ Create/Edit/Delete columns
✅ Assign tickets
✅ Manage users
```

### Member
```
✅ Create/Edit tickets (own)
✅ Create/Edit comments (own)
✅ Assign tickets
✅ Create boards
❌ Delete boards
❌ Delete other's tickets
❌ Manage users
```

### Viewer
```
✅ View boards
✅ View tickets
✅ View comments
❌ Create anything
❌ Edit anything
❌ Delete anything
```

---

## 📝 Test Cases

### Test 1: Admin User - Full Access
```
1. Login as admin user
   Email: admin@example.com
   Password: admin123

2. Verify actions available:
   ✅ Can create board (button visible)
   ✅ Can create ticket (button visible, no warning)
   ✅ Can edit/delete (options shown)
   ✅ Can assign members (dropdown enabled)
   ✅ Can create column (visible)
```

### Test 2: Member User - Limited Access
```
1. Login as member
   Email: member@example.com
   Password: member123

2. Verify:
   ✅ Can create ticket (button visible)
   ✅ Can edit own ticket (enabled)
   ✅ Can assign ticket (enabled)
   ❌ Cannot delete board (button hidden)
   ❌ Cannot see user management (missing)
```

### Test 3: Viewer User - Read-Only
```
1. Login as viewer
   Email: viewer@example.com
   Password: viewer123

2. Verify:
   ❌ Cannot see create ticket button (hidden)
   ❌ Cannot see edit button (hidden)
   ❌ Cannot assign ticket (disabled/hidden)
   ✅ Can view board (read-only display)
   ✅ Can view tickets (read-only display)
```

### Test 4: Permission Boundary - Viewer Creates Ticket
```
1. Login as viewer
2. Try to open TicketModal
   ✅ Dialog opens but shows warning:
      "🔒 You don't have permission to create tickets..."
   ✅ "Create Ticket" button is disabled
   ✅ Cannot submit form
```

### Test 5: Permission Boundary - API Enforcement
```
Test that backend ALSO enforces permissions

1. Login as viewer
2. Open browser console:
   ```javascript
   // Try to create ticket directly via API
   fetch('http://localhost:4000/api/tickets', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       title: 'Hacked Ticket',
       boardId: '123',
       columnId: '456'
     })
   })
   ```
   ✅ Should return 403 Forbidden (backend check)
```

### Test 6: Role Hierarchy - Member ≥ Viewer
```
1. Login as member
2. Member should have ALL viewer permissions PLUS:
   ✅ Can create ticket
   ✅ Can create comment
   ✅ Can assign
3. Verify nothing is hidden/disabled that viewer has access to
```

### Test 7: Token Contains Role
```
1. Login as any user
2. Open browser console:
   ```javascript
   const token = localStorage.getItem('token');
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log(decoded.role); // Should show: 'admin', 'member', or 'viewer'
   ```
   ✅ Token contains role claim
```

---

## 🧪 Code Testing Examples

### Test useRole Hook
```javascript
import { useRole } from '@/hooks/useRole';

function TestComponent() {
  const { canPerform, hasRole, isAdmin, isMember, getRole } = useRole();

  return (
    <div>
      {/* Test canPerform */}
      {canPerform('create_ticket') ? '✅ Can create' : '❌ Cannot create'}
      
      {/* Test hasRole */}
      {hasRole('admin') ? '✅ Is admin' : '❌ Not admin'}
      
      {/* Test hierarchy */}
      {isMember() ? '✅ Member or admin' : '❌ Viewer only'}
      
      {/* Test current role */}
      Current role: {getRole()}
    </div>
  );
}
```

### Test ProtectedFeature Component
```javascript
import { ProtectedFeature } from '@/hooks/useRole';

function BoardActions() {
  return (
    <>
      {/* Only show delete if has permission */}
      <ProtectedFeature requires="delete_board">
        <Button>Delete Board</Button>
      </ProtectedFeature>

      {/* Fallback for denied access */}
      <ProtectedFeature 
        requires="delete_board"
        fallback={<Typography color="error">Insufficient permissions</Typography>}
      >
        <Button>Delete Board</Button>
      </ProtectedFeature>

      {/* Role-based instead of permission */}
      <ProtectedFeature requireRole="admin">
        <Button>Admin Settings</Button>
      </ProtectedFeature>
    </>
  );
}
```

### Test Permission Matrix
```javascript
import { getPermissionMatrix } from '@/hooks/useRole';

const matrix = getPermissionMatrix();
console.log(matrix.admin);     // All permissions
console.log(matrix.member);    // Limited permissions
console.log(matrix.viewer);    // Read-only permissions
```

---

## 🔍 Manual Testing Checklist

### Setup
- [ ] Have 3 test accounts: admin, member, viewer
- [ ] Each user created with correct role in database
- [ ] Backend `/api/users/me` returns role + permissions

### Admin Tests
- [ ] Can create board
- [ ] Can create column
- [ ] Can create ticket
- [ ] Can edit any ticket
- [ ] Can delete any ticket
- [ ] Can assign tickets
- [ ] Can see user management (if exists)

### Member Tests
- [ ] Can create ticket (dialog opens no warning)
- [ ] Can edit own ticket
- [ ] Can assign ticket
- [ ] Cannot delete board (button missing/disabled)
- [ ] Cannot access admin features
- [ ] Cannot see user management

### Viewer Tests
- [ ] Cannot see "Create Ticket" button
- [ ] Cannot see "Edit" option
- [ ] Cannot see "Delete" option
- [ ] Can see boards/tickets (read-only)
- [ ] Dialog closes if tries to force-open
- [ ] Permission warning shows if modal opened

### API Enforcement
- [ ] Viewer POST /api/tickets → 403
- [ ] Viewer PUT /api/tickets/:id → 403
- [ ] Viewer DELETE /api/boards/:id → 403
- [ ] Member POST /api/tickets → 201 (success)

---

## 🐛 Debug Features

### Check User Role
```javascript
// In browser console
const token = localStorage.getItem('token');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('User role:', decoded.role);
```

### Check Permissions
```javascript
// Fetch /api/users/me to see full permissions
fetch('http://localhost:4000/api/users/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
  .then(r => r.json())
  .then(json => console.log('Permissions:', json.data.permissions))
```

### Test Permission Check
```javascript
// In any React component with useRole hook
const { canPerform } = useRole();
console.log('Can create ticket:', canPerform('create_ticket'));
console.log('Can delete board:', canPerform('delete_board'));
```

---

## 📊 Test Data

### Create Test Users

```javascript
// In MongoDB or via registration API
db.users.insertMany([
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'hashed_password_here',
    role: 'admin'
  },
  {
    name: 'Regular Member',
    email: 'member@example.com',
    password: 'hashed_password_here',
    role: 'member'
  },
  {
    name: 'Viewer Only',
    email: 'viewer@example.com',
    password: 'hashed_password_here',
    role: 'viewer'
  }
])
```

---

## ✅ Verification Checklist

- [ ] Backend endpoint `/api/users/me` returns role + permissions
- [ ] Frontend `useRole` hook works correctly
- [ ] `ProtectedFeature` component hides/shows based on permissions
- [ ] TicketModal shows warning for viewers
- [ ] Create button disabled for viewers
- [ ] Permission boundaries work at API level
- [ ] Role hierarchy (admin > member > viewer) enforced
- [ ] UI shows appropriate role badge/indicator

---

## 🚀 Deployment

```bash
# Backend
npm run dev

# Frontend  
npm run dev

# Test with three accounts:
# 1. admin@example.com (role: admin)
# 2. member@example.com (role: member)
# 3. viewer@example.com (role: viewer)
```

---

## 📈 Future Enhancements

- [ ] Add role badge to navbar showing current user's role
- [ ] Implement granular column-level permissions
- [ ] Add board sharing with specific role assignments
- [ ] Audit log for permission-denied actions
- [ ] Role management UI for admins
- [ ] Team-based permissions (team admin, etc.)

