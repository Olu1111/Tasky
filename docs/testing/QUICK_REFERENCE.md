# Testing Quick Reference

## Run All Tests

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

### Both
```bash
# From root directory
cd backend && npm test && cd ../frontend && npm test && cd ..
```

## Watch Mode (for development)

### Backend
```bash
cd backend
npm run test:watch
```

### Frontend
```bash
cd frontend
npm run test:watch
```

## Test Coverage

To see how much of the codebase is covered by tests:

### Backend
```bash
cd backend
npm test -- --coverage
```

### Frontend
```bash
cd frontend
npm test -- --coverage
```

## Run Specific Tests

### Backend - Run specific test file
```bash
cd backend
npm test -- empty-null-inputs.test.js
```

### Frontend - Run specific test file
```bash
cd frontend
npm test -- empty-null-inputs.test.jsx
```

### Run tests matching pattern
```bash
cd frontend
npm test -- -t "should disable create button"
```

## Debugging Tests

### Backend with verbose output
```bash
cd backend
npm test -- --verbose
```

### Frontend with UI (if vitest ui is installed)
```bash
cd frontend
npm run test:ui
```

## Test Results Location

- Backend test results: Console output only
- Frontend test results: Console output only
- Coverage reports: `/coverage` directory (after running with --coverage flag)

## Continuous Integration

Add to your CI pipeline:
```yaml
# Example GitHub Actions
- name: Backend Tests
  run: cd backend && npm test
  
- name: Frontend Tests
  run: cd frontend && npm test
```

## Tips

1. **Run tests before committing**: `npm test` in both directories
2. **Use watch mode during development**: Makes testing faster
3. **Check coverage regularly**: Aim for >80% code coverage
4. **Fix failing tests immediately**: Don't let them accumulate
5. **Update tests when changing functionality**: Keep tests in sync with code
