# Role Enforcement UI/UX - Visual Changes Guide

## Overview
This document provides visual descriptions of the UI changes implemented for role-based access control.

## 1. Navbar - Role Badge

### Before:
```
[Tasky] [Search] [Notifications] [My Tickets] [Boards] [Logout]
```

### After:
```
[Tasky] [Search] [ADMIN] [Notifications] [My Tickets] [Boards] [Logout]
                 ^^^^^^
              Role Badge
```

**Role Badge Styling:**
- **ADMIN**: Red background (#d32f2f), white text
- **MEMBER**: Blue background (#1976d2), white text
- **VIEWER**: Gray background (#757575), white text

**Location:** Between search bar and notifications icon

---

## 2. Boards List Page

### Admin/Member View:
```
┌─────────────────────────────────────────────┐
│ My Boards                    [+ Create Board] │
│ Select a project to start working.           │
└─────────────────────────────────────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐
│ Board 1  [×]│  │ Board 2  [×]│  │ Board 3  [×]│
│            │  │            │  │            │
│ Description│  │ Description│  │ Description│
└────────────┘  └────────────┘  └────────────┘
```
- "Create Board" button is VISIBLE
- Delete icons ([×]) are VISIBLE (only for admins)

### Viewer View:
```
┌─────────────────────────────────────────────┐
│ My Boards                                    │
│ Select a project to start working.           │
└─────────────────────────────────────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐
│ Board 1    │  │ Board 2    │  │ Board 3    │
│            │  │            │  │            │
│ Description│  │ Description│  │ Description│
└────────────┘  └────────────┘  └────────────┘
```
- "Create Board" button is HIDDEN
- Delete icons ([×]) are HIDDEN

---

## 3. Board View Page

### Admin/Member View:
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Board Name        [Filter] [Search] [+ Add Column] │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Todo    [×] │  │ Doing   [×] │  │ Done    [×] │
│─────────────│  │─────────────│  │─────────────│
│ Task 1      │  │ Task 3      │  │ Task 5      │
│ Task 2      │  │ Task 4      │  │ Task 6      │
│ [+ Add card]│  │ [+ Add card]│  │ [+ Add card]│
└─────────────┘  └─────────────┘  └─────────────┘
```
- "Add Column" button is VISIBLE
- Column delete icons ([×]) are VISIBLE (admins only)
- "Add a card" buttons are VISIBLE

### Viewer View:
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Board Name        [Filter] [Search]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Todo        │  │ Doing       │  │ Done        │
│─────────────│  │─────────────│  │─────────────│
│ Task 1      │  │ Task 3      │  │ Task 5      │
│ Task 2      │  │ Task 4      │  │ Task 6      │
│             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```
- "Add Column" button is HIDDEN
- Column delete icons ([×]) are HIDDEN
- "Add a card" buttons are HIDDEN

---

## 4. Edit Ticket Modal

### Admin/Member View:
```
┌───────────────────────────────────────────┐
│ Edit Task                              [×]│
├───────────────────────────────────────────┤
│ Title:      [Fix login bug           ]   │
│ Description:[The login button...      ]   │
│ Priority:   [High ▼]  Status: [Todo ▼]   │
│ Assignee:   [John Doe ▼              ]   │
│                                           │
│ Comments (3)                              │
│ ┌─────────────────────────────────────┐  │
│ │ [Write a comment...              ]  │  │
│ │                           [Send]    │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ [Delete Task]    [Cancel] [Save Changes] │
└───────────────────────────────────────────┘
```
- All fields are EDITABLE
- Comment input is VISIBLE
- "Delete Task" button is VISIBLE
- "Save Changes" button is VISIBLE

### Viewer View:
```
┌───────────────────────────────────────────┐
│ Edit Task                              [×]│
├───────────────────────────────────────────┤
│ Title:      [Fix login bug           ]🔒  │
│ Description:[The login button...      ]🔒  │
│ Priority:   [High ▼]🔒 Status: [Todo ▼]🔒 │
│ Assignee:   [John Doe ▼              ]🔒  │
│                                           │
│ Comments (3)                              │
│ (No input field - viewers cannot comment) │
│                                           │
│                              [Cancel]     │
└───────────────────────────────────────────┘
```
- All fields are DISABLED (🔒 indicates disabled state)
- Comment input is HIDDEN
- "Delete Task" button is HIDDEN
- "Save Changes" button is HIDDEN
- Only "Cancel" button is available

---

## 5. Comments Section

### For Comment Author or Admin:
```
Comments (3)
┌──────────────────────────────────────┐
│ [Write a comment...               ] │
│                          [Send]     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 👤 John Doe  12:34 PM          [×]  │
│ Great work on this!                  │
└──────────────────────────────────────┘
```
- Comment input is VISIBLE (members/admins only)
- Delete button ([×]) is VISIBLE for own comments or all comments (admins)

### For Viewer:
```
Comments (3)
(No input field - viewers cannot comment)

┌──────────────────────────────────────┐
│ 👤 John Doe  12:34 PM               │
│ Great work on this!                  │
└──────────────────────────────────────┘
```
- Comment input is HIDDEN
- Delete buttons are HIDDEN

---

## Summary of Visual Changes

### Elements Added:
1. ✅ Role badge in navbar (color-coded by role)

### Elements Hidden/Shown Based on Role:
1. ✅ "Create Board" button (members+ only)
2. ✅ "Delete Board" icon (admins only)
3. ✅ "Add Column" button (members+ only)
4. ✅ "Delete Column" icon (admins only)
5. ✅ "Add a card" buttons (members+ only)
6. ✅ Comment input field (members+ only)
7. ✅ "Delete Task" button (members+ only)
8. ✅ "Save Changes" button (members+ only)

### Elements Disabled Based on Role:
1. ✅ All ticket form fields (disabled for viewers)
2. ✅ Assignee dropdown (disabled for viewers)

---

## Testing the Visual Changes

To see these changes in action:

1. **Create test users** (if not already created):
   ```bash
   cd backend
   npm run seed:test-users
   ```

2. **Login as different roles**:
   - Admin: admin@tasky.local / password
   - Member: member@tasky.local / password
   - Viewer: viewer@tasky.local / password

3. **Navigate through the app** and observe:
   - Navbar role badge changes color
   - Buttons appear/disappear based on permissions
   - Form fields become disabled for viewers
   - Comment input hidden for viewers

4. **Try to perform restricted actions**:
   - As viewer, you won't see create/delete buttons
   - As member, you can create but not delete boards/columns
   - As admin, you can do everything

---

## Color Reference

| Role | Badge Color | Hex Code |
|------|-------------|----------|
| Admin | Red | #d32f2f |
| Member | Blue | #1976d2 |
| Viewer | Gray | #757575 |

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary Action Buttons | Charcoal Grey | #263238 |
| Delete Buttons | Red | #d32f2f |
| Disabled State | Light Gray | - (MUI default) |
