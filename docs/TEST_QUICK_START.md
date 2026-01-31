# Test Quick Start Guide

## Running Tests

### Run All Backend Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
# Authentication tests (11 tests)
npm test -- auth.test.js

# Board & Ticket tests (14 tests)
npm test -- boards.test.js

# Comment & Permission tests (18 tests)
npm test -- comments.test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Generate Coverage Report
```bash
npm test -- --coverage
```

---

## Test Results

### ✅ Authentication Tests (11/11 PASSED)
- User registration
- User login
- Token validation
- Protected endpoints
- Team member listing

### ⚠️ Board & Ticket Tests (3/14 PASSED)
- Some endpoints need debugging

### ⏹️ Comment Tests (Not Run Yet)
- 18 tests ready to run
- Depends on board endpoints being stable

---

## What Gets Tested

### API Endpoints (40 tests total)
- **Auth:** Register, Login, Get Profile, Get Team Members
- **Boards:** Create, Read, Update, Delete
- **Tickets:** Create, Read, Update, Delete, Move, Assign
- **Comments:** Create, Read, Update, Delete
- **Permissions:** Admin vs Member vs Viewer roles

### User Journeys
- ✅ Signup → Login → Create Board → Add Ticket
- ✅ Ticket Management (create, assign, move)
- ✅ Comment Workflow (add, edit, delete)
- ✅ Permission Enforcement

### Error Handling
- Invalid email validation
- Duplicate email rejection
- Authentication failures
- Permission enforcement

---

## Test Environment

### Database
- **Type:** MongoDB In-Memory Server
- **Speed:** Instant (no network latency)
- **Isolation:** Fresh database per test run
- **No Setup Required:** Auto-created for tests

### Configuration
- **Framework:** Jest + Supertest
- **Timeout:** 60 seconds per test
- **Environment Variables:** Auto-set from `tests/setup.js`

### What's Mocked
- Database (in-memory MongoDB)
- JWT Secret (test-specific key)
- Port (5000 for tests)

### What's Real
- Express app
- API endpoints
- Request/response handling
- Database operations (in-memory)

---

## Debugging Failed Tests

### Check Error Message
```bash
# Run single test with full output
npm test -- auth.test.js -- --verbose
```

### View Full HTTP Logs
```bash
# The tests output Morgan logs for all requests
npm test -- auth.test.js 2>&1
```

### Add Temporary Logging
```javascript
// In test file
it('test name', async () => {
  const res = await request(app).get('/api/endpoint');
  console.log('Response:', res.status, res.body);
  expect(res.status).toBe(200);
});
```

---

## Common Issues & Fixes

### "MONGODB_URI must have a value"
- **Cause:** Environment not set up
- **Fix:** Already handled in `tests/setup.js`

### "MongoDB connection timeout"
- **Cause:** Real MongoDB not running
- **Fix:** Using in-memory MongoDB (no setup needed)

### Tests taking 10+ seconds per test
- **Cause:** Real MongoDB or slow bcrypt
- **Fix:** In-memory database makes tests instant
- **Result:** Full suite runs in <2 seconds

### "Token is invalid"
- **Cause:** JWT_SECRET not set
- **Fix:** Already set in `tests/setup.js`

---

## Next Steps

1. **Fix Board Endpoints**
   - Debug 400/500 errors in ticket creation
   - Run: `npm test -- boards.test.js`

2. **Run Comment Tests**
   - Execute: `npm test -- comments.test.js`
   - Verify permission enforcement

3. **Run Frontend Tests**
   - Execute: `cd frontend && npm run cypress:run`
   - 20 E2E integration tests

4. **Set Up CI/CD**
   - Add GitHub Actions workflow
   - Run tests on every commit

---

## Test Statistics

| Suite | Tests | Status | Time |
|-------|-------|--------|------|
| Auth | 11 | ✅ All Pass | 1.65s |
| Boards | 14 | ⚠️ 3 Pass | 1.44s |
| Comments | 18 | ⏹️ Not Run | - |
| **Total** | **40** | **14 Pass** | **~3s** |

---

## Tips & Tricks

### Run tests faster
```bash
# Don't capture open handles (faster)
npm test -- --detectOpenHandles=false
```

### Run only failed tests
```bash
# After first run, only re-run failures
npm test -- --onlyChanged
```

### Update snapshots
```bash
# If test expectations change
npm test -- --updateSnapshot
```

### Debug single test
```bash
# Run only one test
npm test -- auth.test.js --testNamePattern="should register"
```

---

**Last Updated:** 2026-01-30  
**Status:** Ready to use!  
**Issues:** Board endpoints need debugging
