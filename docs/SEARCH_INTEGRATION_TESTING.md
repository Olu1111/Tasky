# Search Integration Testing Guide

## Quick Start Testing

### 1. Verify Search Functionality
```
1. Open the application
2. Click search bar or press "/" 
3. Type a partial ticket title (e.g., "bug", "login")
4. Verify results appear within 500ms
5. Check that results show relevance % badge
6. Verify board chip and column info display
```

### 2. Test Keyboard Navigation
```
1. Focus search bar (/)
2. Type a query showing 3+ results
3. Press ↓ arrow key → first result highlights
4. Press ↓ again → second result highlights
5. Press ↑ arrow key → goes back to first result
6. Press Enter → navigates to selected board
7. Press Esc → closes search dropdown
```

### 3. Test Fuzzy Matching
```
Search Tests:
- Type "login" → should find "login", "logging in", "logon"
- Type "bug" → should find "bug", "buggy", "debug"
- Type "tst" → should find "test", "latest", "testing"
- Type "bugg" → should find "bug", "buggy", "debugging"
```

### 4. Test Performance Tracking
```javascript
// In browser console
import { performanceTracker } from '/src/utils/searchUtils.js'

// After performing 5 searches
performanceTracker.getStats()

// Expected output:
{
  totalSearches: 5,
  avgResponseTime: "248.45ms",
  successRate: "80.0%",
  lastSearch: {
    query: "bug",
    resultCount: 3,
    duration: 165.23,
    timestamp: Date,
    statusCode: "found"
  }
}
```

## Performance Testing

### Measure Response Time
```
Scenario 1: Typical Query
- Query: "bug" (3 letters)
- Expected Response: 150-300ms
- Includes: Backend search + ranking + UI render

Scenario 2: Long Query
- Query: "authentication error in login modal" (8 words)
- Expected Response: 200-400ms
- Longer ranking calculation

Scenario 3: No Results
- Query: "xyzabc123" (non-existent)
- Expected Response: 100-150ms
- Faster due to regex not matching
```

### Load Test (Many Tickets)
1. Create 500+ tickets across multiple boards
2. Perform searches with:
   - Very common terms ("the", "bug", "task")
   - Specific terms ("login", "payment")
   - Uncommon terms ("cryptocurrency")
3. Verify response time stays <500ms

### Accuracy Testing

#### Test Case 1: Exact Title Match
```
Setup:
- Create ticket with title: "Login Button Bug"
- Other tickets: "Debug Tools", "User Login", "Critical Issue"

Search: "Login Button Bug"
Expected Result:
- Position 1: "Login Button Bug" (score: 100, exact match)
```

#### Test Case 2: Partial Title Match
```
Setup:
- Create tickets: "Fix login page", "Login validation", "Login flow", "Sign in page"

Search: "login"
Expected Results (in order):
1. "Fix login page" (score: ~80, prefix match)
2. "Login validation" (score: ~80, prefix match)
3. "Login flow" (score: ~80, prefix match)
4. "Sign in page" (lower score, description match if any)
```

#### Test Case 3: Description Matching
```
Setup:
- Title: "User Registration"
- Description: "Need to fix the login bug in registration flow"

Search: "login"
Expected:
- Appears in results with lower relevance
- Relevance score: ~10-15 (description match only)
```

#### Test Case 4: Fuzzy Matching
```
Setup:
- Tickets with titles: "Payment", "Performance", "Perfect"

Search: "payent" (misspelled)
Expected:
- "Payment" appears with ~60% relevance (fuzzy match)
- Other "P" words also fuzzy match

Search: "perfomance" (misspelled)
Expected:
- "Performance" appears with ~70% relevance (fuzzy match)
```

#### Test Case 5: Word Boundaries
```
Setup:
- Tickets: "Test Suite", "Testing Framework", "Latest Updates", "Contest"

Search: "test"
Expected Order:
1. "Test Suite" (exact word match: +60)
2. "Testing Framework" (word prefix: +30)
3. "Latest Updates" (substring in "Latest": +40)
4. "Contest" (substring in "Contest": +40)
```

## Relevance Scoring Validation

### Check Scoring Calculation
Create these test scenarios and verify scores:

```javascript
// Test 1: Exact title match
const ticket1 = { title: "Bug", description: "" };
scoreRelevance("Bug", ticket1); // Expected: 100

// Test 2: Prefix match
const ticket2 = { title: "Bug fix for login", description: "" };
scoreRelevance("Bug", ticket2); // Expected: 80+

// Test 3: Word match
const ticket3 = { title: "Critical Bug Report", description: "" };
scoreRelevance("Bug", ticket3); // Expected: 60+

// Test 4: Substring match
const ticket4 = { title: "Debug mode issue", description: "" };
scoreRelevance("bug", ticket4); // Expected: 40

// Test 5: Description match only
const ticket5 = { title: "User Registration", description: "Fix bug in auth" };
scoreRelevance("bug", ticket5); // Expected: 10-15

// Test 6: Fuzzy match
const ticket6 = { title: "Bogue component", description: "" };
scoreRelevance("bug", ticket6); // Expected: 20+ (fuzzy)
```

## UI/UX Validation

### Check Result Display
```
For each result, verify:
✓ Title displays correctly
✓ Relevance % badge shows (color-coded)
✓ Board chip displays with correct board name
✓ Column info shows with "in {columnName}"
✓ Context snippet shows (if description > 0 chars)
✓ Result is clickable
✓ Hovering shows active state
✓ Selected result highlights properly
```

### Check Color Coding
```
Relevance Badges:
- Green (80%+): Click on multiple results with 80%+ scores
- Orange (50-79%): Click on fuzzy matches or low-weight matches
- Red (<50%): Click on very low relevance matches (rare)
```

### Check Context Snippet
```
Search: "login"
For ticket description: "User cannot login to their account after password reset"

Expected snippet: "...cannot login to their account after password..."
(showing query in context with surrounding words)
```

## Browser Console Tests

### Test 1: Performance Tracker
```javascript
// Open Developer Tools (F12) → Console tab
// Paste this code:

import { performanceTracker } from '/src/utils/searchUtils.js'

// Perform 10 searches in UI, then run:
const stats = performanceTracker.getStats();
console.log('=== Search Performance ===');
console.log('Total Searches:', stats.totalSearches);
console.log('Avg Response:', stats.avgResponseTime);
console.log('Success Rate:', stats.successRate);
console.log('Last Search:', stats.lastSearch);
```

### Test 2: Relevance Scoring
```javascript
import { scoreRelevance } from '/src/utils/searchUtils.js'

// Test scoring with actual ticket data
const testTicket = {
  title: "Fix login bug",
  description: "User cannot login to account"
};

const scores = {
  "fix": scoreRelevance("fix", testTicket),
  "login": scoreRelevance("login", testTicket),
  "bug": scoreRelevance("bug", testTicket),
  "account": scoreRelevance("account", testTicket),
  "xyz": scoreRelevance("xyz", testTicket)
};

console.table(scores);
```

### Test 3: Fuzzy Matching
```javascript
import { stringSimilarity, levenshteinDistance } from '/src/utils/searchUtils.js'

const tests = [
  { q: "test", t: "test" },
  { q: "test", t: "best" },
  { q: "login", t: "logon" },
  { q: "bug", t: "bugg" },
  { q: "test", t: "xyz" }
];

tests.forEach(test => {
  const distance = levenshteinDistance(test.q, test.t);
  const similarity = stringSimilarity(test.q, test.t);
  console.log(`"${test.q}" vs "${test.t}": distance=${distance}, similarity=${similarity.toFixed(2)}`);
});
```

### Test 4: Context Snippet
```javascript
import { getContextSnippet } from '/src/utils/searchUtils.js'

const descriptions = [
  "This is a simple test of the search system",
  "We need to fix the authentication module for security",
  "Bug in the payment processing that needs urgent fixing"
];

descriptions.forEach(desc => {
  const snippet = getContextSnippet(desc, "test", 80);
  console.log(`Input: "${desc}"`);
  console.log(`Snippet: "${snippet}"`);
  console.log('---');
});
```

## Automated Testing (Unit Tests)

### Test Suite Structure
```javascript
// frontend/src/__tests__/searchUtils.test.js

import { 
  scoreRelevance, 
  rankResults,
  stringSimilarity,
  levenshteinDistance,
  getContextSnippet
} from '../utils/searchUtils';

describe('searchUtils', () => {
  describe('levenshteinDistance', () => {
    test('exact match returns 0', () => {
      expect(levenshteinDistance('test', 'test')).toBe(0);
    });

    test('single character difference', () => {
      expect(levenshteinDistance('test', 'best')).toBe(1);
    });
  });

  describe('stringSimilarity', () => {
    test('exact match returns 1.0', () => {
      expect(stringSimilarity('test', 'test')).toBe(1);
    });

    test('returns value between 0 and 1', () => {
      const sim = stringSimilarity('test', 'best');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });
  });

  describe('scoreRelevance', () => {
    test('exact title match scores highest', () => {
      const score = scoreRelevance('bug', {
        title: 'bug',
        description: 'other text'
      });
      expect(score).toBeGreaterThan(50);
    });

    test('no match returns 0', () => {
      const score = scoreRelevance('xyz', {
        title: 'bug report',
        description: 'something else'
      });
      expect(score).toBe(0);
    });
  });

  describe('rankResults', () => {
    test('orders by relevance score descending', () => {
      const results = [
        { title: 'Debug issue', description: '' },
        { title: 'Bug fix', description: '' },
        { title: 'Critical bug', description: '' }
      ];
      
      const ranked = rankResults('bug', results);
      expect(ranked[0].relevanceScore).toBeGreaterThanOrEqual(ranked[1].relevanceScore);
    });
  });
});
```

## Regression Testing Checklist

After any code changes to search:
- [ ] Basic search returns results (< 500ms)
- [ ] Keyboard navigation still works
- [ ] Relevance ranking still applies
- [ ] No results message displays
- [ ] Loading spinner shows
- [ ] Performance tracking works
- [ ] Clicking result navigates to board
- [ ] Debounce still prevents API spam
- [ ] Empty search closes dropdown
- [ ] Esc key closes dropdown

## Performance Benchmarks

### Expected Results
| Operation | Target | Acceptable | Slow |
|-----------|--------|-----------|------|
| Search API call | <150ms | <250ms | >500ms |
| Ranking 10 results | <15ms | <30ms | >50ms |
| UI render | <30ms | <50ms | >100ms |
| **Total response** | **<200ms** | **<300ms** | **>500ms** |

### Sample Results
```
Query: "login"
- Backend: 120ms
- Ranking: 8ms
- Render: 22ms
- Total: 150ms ✅ GOOD

Query: "urgent fix payment module immediately"
- Backend: 180ms
- Ranking: 35ms
- Render: 25ms
- Total: 240ms ✅ GOOD

Query: "test" (very common, 500+ results)
- Backend: 200ms
- Ranking: 60ms
- Render: 40ms
- Total: 300ms ⚠️ AT LIMIT
```

## Debugging Tips

### Enable verbose logging
```javascript
// In GlobalSearch.jsx, add before handleSearch:
console.log(`[Search] Query: "${query}", Starting search...`);
console.time(`search-${query}`);

// At the end of handleSearch:
console.timeEnd(`search-${query}`);
console.log(`[Search] Results: ${rankedResults.length}, Performance tracked`);
```

### Monitor performance tracker
```javascript
// Add to console regularly during testing:
setInterval(() => {
  const stats = performanceTracker.getStats();
  console.log('[Stats]', stats);
}, 10000);
```

### Check network requests
1. Open DevTools → Network tab
2. Filter for "search" requests
3. Click each request to see:
   - Response time
   - Query parameter
   - Response body (results)
   - Status code

### Verify relevance calculation
```javascript
// If results seem incorrectly ordered:
import { scoreRelevance } from '/src/utils/searchUtils.js'

// Get actual ticket from results
const ticket = results[0];
const scores = [
  scoreRelevance("yourquery", ticket),
  // ... test different queries
];
console.table(scores);
```
