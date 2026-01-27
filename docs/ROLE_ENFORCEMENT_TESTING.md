# Role Enforcement Testing Guide

This document describes how to test the role-based UI/UX features implemented in Tasky.

## Overview

The application has three user roles with hierarchical permissions:
- **Admin** (highest level) - Full access to all features
- **Member** (mid level) - Can create and manage content but cannot delete boards/columns
- **Viewer** (lowest level) - Read-only access, cannot create or modify content

## Test Users

To properly test role enforcement, you need to create three test users with different roles:

### 1. Admin User (created by seed)
- Email: `admin@tasky.local`
- Password: `password`
- Role: `admin`

### 2. Member User (create manually)
You can register a new user and manually update their role in the database:
```javascript
// In MongoDB shell or using a script:
db.users.updateOne(
  { email: "member@tasky.local" },
  { $set: { role: "member" } }
);
```

### 3. Viewer User (create manually)
```javascript
db.users.updateOne(
  { email: "viewer@tasky.local" },
  { $set: { role: "viewer" } }
);
```

## Permission Boundary Tests

### Test Case 1: Navbar Role Badge
**Objective:** Verify that the user's role is displayed in the navbar

**Steps:**
1. Log in as each user type (admin, member, viewer)
2. Check the navbar for the role badge

**Expected Results:**
- Admin: Red badge with "ADMIN" text
- Member: Blue badge with "MEMBER" text  
- Viewer: Gray badge with "VIEWER" text

---

### Test Case 2: Board Creation (Members Only)
**Objective:** Verify that only members and admins can create boards

**Steps:**
1. Log in as **viewer**
2. Navigate to Boards List page (`/boards`)
3. Look for "Create Board" button

**Expected Results:**
- **Viewer:** Button is NOT visible
- **Member:** Button IS visible and functional
- **Admin:** Button IS visible and functional

---

### Test Case 3: Board Deletion (Admin Only)
**Objective:** Verify that only admins can delete boards

**Steps:**
1. Log in as each user type
2. Navigate to Boards List page
3. Hover over a board card
4. Look for delete icon

**Expected Results:**
- **Viewer:** Delete icon NOT visible
- **Member:** Delete icon NOT visible
- **Admin:** Delete icon IS visible and functional

---

### Test Case 4: Column Creation (Members Only)
**Objective:** Verify that only members and admins can create columns

**Steps:**
1. Log in as **viewer**
2. Navigate to a board view page (`/boards/:id`)
3. Look for "Add Column" button

**Expected Results:**
- **Viewer:** Button is NOT visible
- **Member:** Button IS visible and functional
- **Admin:** Button IS visible and functional

---

### Test Case 5: Column Deletion (Admin Only)
**Objective:** Verify that only admins can delete columns

**Steps:**
1. Log in as each user type
2. Navigate to a board with columns
3. Look for delete icon on column headers

**Expected Results:**
- **Viewer:** Delete icon NOT visible
- **Member:** Delete icon NOT visible
- **Admin:** Delete icon IS visible and functional

---

### Test Case 6: Ticket/Card Creation (Members Only)
**Objective:** Verify that only members and admins can create tickets

**Steps:**
1. Log in as **viewer**
2. Navigate to a board with columns
3. Look for "Add a card" button at the bottom of each column

**Expected Results:**
- **Viewer:** Button is NOT visible (display: none)
- **Member:** Button IS visible and functional
- **Admin:** Button IS visible and functional

---

### Test Case 7: Ticket/Task Editing (Members Only)
**Objective:** Verify that only members and admins can edit tickets

**Steps:**
1. Log in as **viewer**
2. Navigate to a board and click on a ticket to open the edit modal
3. Check if form fields are disabled
4. Look for "Save Changes" button

**Expected Results:**
- **Viewer:** All form fields are DISABLED (title, description, priority, status, assignee), Save button is NOT visible
- **Member:** All form fields are ENABLED, Save button IS visible and functional
- **Admin:** All form fields are ENABLED, Save button IS visible and functional

---

### Test Case 8: Ticket/Task Deletion (Members Only)
**Objective:** Verify that only members and admins can delete tickets

**Steps:**
1. Log in as each user type
2. Open a ticket edit modal
3. Look for "Delete Task" button

**Expected Results:**
- **Viewer:** Delete button is NOT visible
- **Member:** Delete button IS visible and functional
- **Admin:** Delete button IS visible and functional

---

### Test Case 9: Comment Creation (Members Only)
**Objective:** Verify that only members and admins can create comments

**Steps:**
1. Log in as **viewer**
2. Open a ticket edit modal
3. Scroll to the comments section
4. Look for comment input field and Send button

**Expected Results:**
- **Viewer:** Comment input field and Send button are NOT visible
- **Member:** Comment input and Send button ARE visible and functional
- **Admin:** Comment input and Send button ARE visible and functional

---

### Test Case 10: Comment Deletion (Author or Admin Only)
**Objective:** Verify that only comment authors and admins can delete comments

**Steps:**
1. Create a comment as User A
2. Log in as different users and try to delete the comment

**Expected Results:**
- **Comment Author:** Delete button IS visible
- **Admin:** Delete button IS visible (even if not the author)
- **Other Users:** Delete button NOT visible

---

### Test Case 11: Backend Permission Enforcement
**Objective:** Verify that backend enforces permissions even if frontend restrictions are bypassed

**Steps:**
1. As a **viewer**, attempt to create a board using curl/Postman:
```bash
curl -X POST http://localhost:4000/api/boards \
  -H "Authorization: Bearer <viewer_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Unauthorized Board"}'
```

**Expected Results:**
- Request should return 403 Forbidden error
- Board should NOT be created
- Backend middleware `requireMember` prevents the action

---

## Role Hierarchy Verification

The role hierarchy should work as follows:

| Feature | Viewer | Member | Admin |
|---------|--------|--------|-------|
| View Boards | ✅ | ✅ | ✅ |
| View Tickets | ✅ | ✅ | ✅ |
| Create Boards | ❌ | ✅ | ✅ |
| Create Columns | ❌ | ✅ | ✅ |
| Create Tickets | ❌ | ✅ | ✅ |
| Edit Own Tickets | ❌ | ✅ | ✅ |
| Edit Any Ticket | ❌ | ✅ | ✅ |
| Delete Tickets | ❌ | ✅ | ✅ |
| Add Comments | ❌ | ✅ | ✅ |
| Delete Columns | ❌ | ❌ | ✅ |
| Delete Any Comment | ❌ | ❌ | ✅ |
| Delete Own Comment | ❌ | ✅ | ✅ |

## Automated Test Script (Optional)

You can use this script to programmatically test permissions:

```javascript
// test-permissions.js
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function login(email, password) {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data.data.token;
}

async function testPermission(token, method, endpoint, data = null) {
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let response;
    
    if (method === 'GET') response = await axios.get(`${BASE_URL}${endpoint}`, config);
    else if (method === 'POST') response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
    else if (method === 'DELETE') response = await axios.delete(`${BASE_URL}${endpoint}`, config);
    
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, status: error.response?.status, error: error.response?.data };
  }
}

async function runTests() {
  const viewerToken = await login('viewer@tasky.local', 'password');
  const memberToken = await login('member@tasky.local', 'password');
  const adminToken = await login('admin@tasky.local', 'password');
  
  console.log('Testing Viewer permissions...');
  const viewerCreateBoard = await testPermission(viewerToken, 'POST', '/boards', { title: 'Test' });
  console.log('Viewer create board:', viewerCreateBoard.status === 403 ? 'PASS ✅' : 'FAIL ❌');
  
  console.log('\nTesting Member permissions...');
  const memberCreateBoard = await testPermission(memberToken, 'POST', '/boards', { title: 'Test' });
  console.log('Member create board:', memberCreateBoard.status === 201 ? 'PASS ✅' : 'FAIL ❌');
  
  console.log('\nTesting Admin permissions...');
  const adminCreateBoard = await testPermission(adminToken, 'POST', '/boards', { title: 'Test' });
  console.log('Admin create board:', adminCreateBoard.status === 201 ? 'PASS ✅' : 'FAIL ❌');
}

runTests().catch(console.error);
```

## Notes

1. **Client-Side Security**: The UI restrictions are for user experience only. True security is enforced by backend middleware (`requireAuth`, `requireMember`, `requireAdmin`).

2. **Role Update**: If a user's role is changed in the database, they must log out and log back in to see the new permissions (since role is stored in the JWT token).

3. **Token Expiry**: JWT tokens expire after 7 days by default. After expiry, users must re-login.

4. **LocalStorage**: User role is available via `localStorage.getItem('user')` and parsed from JWT token payload.

## Implementation Details

### Frontend Changes
- Created `/frontend/src/utils/auth.js` with role checking utilities:
  - `getCurrentUser()` - Get user from localStorage
  - `getUserRole()` - Get current user's role
  - `isAdmin()` - Check if user is admin
  - `isMember()` - Check if user is member or higher
  - `hasRole(role)` - Check hierarchical role permission

### Backend (Existing)
- User model has `role` field with enum: `['admin', 'member', 'viewer']`
- Middleware functions enforce permissions:
  - `requireAuth` - Require authentication
  - `requireMember` - Require member or admin role
  - `requireAdmin` - Require admin role only

### UI Changes
- **Navbar**: Added role badge (colored by role)
- **BoardsList**: Hide create/delete buttons based on role
- **BoardViewPage**: Hide column creation, deletion, and card creation based on role
- **EditTicketModal**: Disable all form fields and hide Save/Delete buttons for viewers
- **CommentThread**: Hide comment input for viewers, delete visible to author or admin
