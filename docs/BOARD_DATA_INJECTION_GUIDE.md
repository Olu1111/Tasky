# 🎯 Board Data Injection - Quick Guide

## Overview

Inject 100 randomly generated tickets into each board recursively with realistic data.

---

## Backend Setup

### Files Created
- `backend/src/seed/ticketSeeder.js` - Core seeding logic
- `backend/src/seed/seedRunner.js` - CLI runner script

### Run Seeding

#### Option 1: Inject into Existing Boards (Default)
```bash
cd backend
node src/seed/seedRunner.js inject
# or just: node src/seed/seedRunner.js
```

**What it does:**
- Finds all existing boards
- For each board: creates 100 random tickets
- Distributes across columns (To Do, In Progress, In Review, Done)
- Assigns random priorities (High, Medium, Low)
- Randomly assigns to team members (70% assigned, 30% unassigned)

#### Option 2: Clear & Inject Fresh Data
```bash
cd backend
node src/seed/seedRunner.js clear
```

**What it does:**
- Deletes all existing tickets
- Injects 100 fresh tickets per board

---

## What Gets Generated

### Per Board: 100 Tickets

**Random Titles:**
```
Fix login
Implement authentication
Add password reset
Update user profile
Improve dashboard
Refactor payment processing
Optimize email notifications
Debug search functionality
... (24 adjectives × 30 features)
```

**Random Properties:**
- **Priority:** High, Medium, Low (random distribution)
- **Status:** To Do, In Progress, In Review, Done (matches column)
- **Assignee:** 70% assigned to random team member, 30% unassigned
- **Description:** Realistic task descriptions
- **Created Date:** Random date in past 30 days

**Distribution:**
- Spread across all columns
- Realistic assignment pattern
- Various priorities

---

## Frontend Display

### Files Created
- `frontend/src/utils/boardDataUtils.js` - Data utilities

### Usage in Console

#### View Board Statistics
```javascript
import { logBoardStats } from '@/utils/boardDataUtils'

logBoardStats('board_id_here')
// Output:
// 📊 Board Statistics
// ==================================================
// Board: Development
// Total Tickets: 100
// 
// Column Breakdown:
//   • To Do: 25 tickets
//   • In Progress: 25 tickets
//   • In Review: 25 tickets
//   • Done: 25 tickets
```

#### View All Boards Statistics
```javascript
import { logAllBoardsStats } from '@/utils/boardDataUtils'

logAllBoardsStats()
// Output:
// 📊 All Boards Statistics
// ==================================================
// Total Boards: 3
// Total Tickets: 300
// Average per Board: 100
//
// Per Board Breakdown:
//
//   📋 Development: 100 tickets
//      • To Do: 25
//      • In Progress: 25
//      • In Review: 25
//      • Done: 25
//
//   📋 Design: 100 tickets
//      • To Do: 30
//      • In Progress: 20
//      ...
```

#### Get Ticket Statistics
```javascript
import { getTicketStats } from '@/utils/boardDataUtils'

getTicketStats('board_id_here')
// Returns:
// {
//   byPriority: { High: 33, Medium: 33, Low: 34 },
//   byStatus: { "To Do": 25, "In Progress": 25, "In Review": 25, "Done": 25 },
//   byAssignment: { assigned: 70, unassigned: 30 }
// }
```

#### Display Sample Tickets
```javascript
import { displaySampleData } from '@/utils/boardDataUtils'

displaySampleData('board_id_here')
// Shows 3 sample tickets from each column
```

#### Export Board Data
```javascript
import { exportBoardDataAsJSON } from '@/utils/boardDataUtils'

const json = await exportBoardDataAsJSON('board_id_here')
console.log(json) // Full board data as JSON
```

---

## Step-by-Step Usage

### 1. Run Backend Seeder
```bash
cd backend
node src/seed/seedRunner.js inject
```

**Output:**
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

This will inject 100 tickets into each existing board.

🚀 Starting ticket injection into 3 board(s)

📋 Injecting tickets into board: "Development"
   ✓ 10/100 tickets created
   ✓ 20/100 tickets created
   ...
   ✓ 100/100 tickets created
   ✅ Successfully injected 100 tickets

📋 Injecting tickets into board: "Design"
   ...
   ✅ Successfully injected 100 tickets

📋 Injecting tickets into board: "Testing"
   ...
   ✅ Successfully injected 100 tickets

✨ Injection complete!
📊 Total tickets created: 300
📈 Average per board: 100

🔌 Disconnected from MongoDB
```

### 2. View Data in Frontend

**Option A: Browser Console**
```javascript
// Copy-paste in browser console (Dev Tools > Console)

import { logAllBoardsStats, getTicketStats } from '/src/utils/boardDataUtils.js'

logAllBoardsStats()
```

**Option B: View in App**
1. Navigate to any board
2. Should see 100 tickets distributed across columns
3. Click into tickets to view details

---

## Data Structure

### Generated Ticket Object
```javascript
{
  _id: ObjectId,
  boardId: ObjectId,
  columnId: ObjectId,
  title: "Fix authentication",          // Random
  description: "This needs to be...",   // Realistic
  priority: "High",                     // Random: High/Medium/Low
  status: "In Progress",                // Matches column name
  assignee: ObjectId or null,           // 70% assigned
  order: 0-99,
  createdAt: "2024-01-10T...",         // Random date in past 30 days
}
```

---

## Customization

### Edit Seeder (Advanced)

**Modify random titles:**
```javascript
// In ticketSeeder.js, edit ADJECTIVES and FEATURES arrays
const ADJECTIVES = [
  'Fix', 'Implement', 'Add', // ... add your own
];

const FEATURES = [
  'login', 'authentication', // ... add your own
];
```

**Change ticket count per board:**
```javascript
// Change this line (currently 100):
for (let i = 0; i < 100; i++) {
  // to:
for (let i = 0; i < 50; i++) { // For 50 tickets instead
```

**Change assignment probability:**
```javascript
// Currently: 70% assigned, 30% unassigned
const assigneeId = Math.random() < 0.7 ? /* assigned */ : null;

// Change 0.7 to different value:
Math.random() < 0.5  // 50% assigned
Math.random() < 0.9  // 90% assigned
```

---

## Verification Checklist

- [ ] Ran `node src/seed/seedRunner.js inject`
- [ ] Backend output shows "✅ Successfully injected 100 tickets" per board
- [ ] No errors in console
- [ ] App shows 100 tickets when viewing boards
- [ ] Can expand/collapse columns to see all tickets
- [ ] Tickets have realistic names and priorities
- [ ] Some tickets are assigned, some are not

---

## Troubleshooting

**Error: "Cannot find module"**
- Make sure you're in the `backend` directory
- Check that `ticketSeeder.js` file exists

**Error: "MongoDB connection failed"**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify connection string is correct

**Tickets not appearing in app**
- Refresh the page
- Check browser console for errors
- Verify seeder ran successfully

**Slow seeding process**
- This is normal - 100 tickets per board takes ~10-30 seconds
- Watch the progress counter to see it's working

---

## Cleanup (Optional)

### Delete All Injected Tickets

```bash
# Option 1: Clear and re-inject
node src/seed/seedRunner.js clear

# Option 2: Delete tickets directly
mongo
use tasky
db.tickets.deleteMany({})
```

---

## Performance

**Seeding time:**
- 1 board (100 tickets): ~10-15 seconds
- 3 boards (300 tickets): ~30-45 seconds
- 10 boards (1000 tickets): ~2-3 minutes

**Load time after seeding:**
- App loads boards: ~2-3 seconds
- Board view with 100 tickets: ~1-2 seconds
- Click on ticket: Instant
- Drag & drop: Smooth

---

## Summary

✅ **Generates:** 100 realistic random tickets per board
✅ **Distributes:** Across all columns randomly
✅ **Assigns:** 70% to team members, 30% unassigned
✅ **Includes:** Random priorities, descriptions, dates
✅ **Displays:** Full statistics and sample data in console

**Ready to test with realistic data!** 🚀
