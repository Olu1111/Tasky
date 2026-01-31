# Search Integration Guide

## Overview
The Tasky search system combines **fuzzy matching** with **relevance scoring** to provide fast, accurate ticket search across boards. The implementation includes both backend and frontend optimization for search accuracy and performance.

## Architecture

### Frontend (GlobalSearch.jsx)
- **Debounce**: 300ms delay to prevent excessive API calls
- **Ranking**: Results ranked by relevance score (0-100)
- **Performance Tracking**: Automatic tracking of search speed and accuracy
- **Keyboard Navigation**: Arrow keys (↑/↓), Enter to select, Esc to close
- **Context Display**: Shows matching text in context with "..." ellipsis

### Backend (searchTickets - ticket.controller.js)
- **Query**: GET `/api/tickets/search?q={query}&page=1&limit=10`
- **Regex Matching**: Case-insensitive search on title AND description
- **Auth**: Filters by user's accessible boards (owner or member)
- **Sorting**: Results sorted by creation date (newest first)
- **Pagination**: Page 1-indexed, 10 results per page default

## Relevance Scoring Algorithm

The ranking system prioritizes matches in this order:

### Scoring Tiers

| Match Type | Score | Example |
|-----------|-------|---------|
| Exact title match | +100 | Query: "Bug" → Title: "Bug" |
| Title prefix match | +80 | Query: "Bug" → Title: "Bug fix for..." |
| Word match in title | +60 | Query: "Bug" → Title: "Critical Bug Report" |
| Substring in title | +40 | Query: "Bug" → Title: "Debug mode issue" |
| Word prefix in title | +30 | Query: "Bug" → Title: "Buggy component" |
| Fuzzy match title | +20 | Scaled by 0-1 similarity (Levenshtein) |
| Substring in description | +10 | Query match in description field |
| Fuzzy match description | +5 | Scaled by 0-1 similarity |

### Relevance Badges
- **80%+**: Green badge (highly relevant)
- **50-79%**: Orange badge (moderately relevant)
- **<50%**: Red badge (low relevance)

## Fuzzy Matching (Levenshtein Distance)

### What is Levenshtein Distance?
Measures the minimum number of edits (insertions, deletions, substitutions) needed to transform one string into another.

**Examples:**
```
"test" → "rest"  = 1 edit (substitute 't' with 'r')
"test" → "tests" = 1 edit (insert 's')
"hello" → "hallo" = 1 edit (substitute 'e' with 'a')
```

### Similarity Scoring
```
Similarity = (max_length - distance) / max_length
Similarity = 0.0 (completely different)
Similarity = 1.0 (exact match)
```

**Examples:**
```
"ticket" vs "ticket" = 1.0   (100%)
"ticket" vs "ticket" = 0.85  (85%)
"ticket" vs "ticked"  = 0.83 (83%)
```

## Performance Metrics

### Automatic Tracking
All searches are automatically tracked. Access stats via:
```javascript
import { performanceTracker } from '@/utils/searchUtils';

// Get performance statistics
console.log(performanceTracker.getStats());
// Output:
// {
//   totalSearches: 42,
//   avgResponseTime: "245.32ms",
//   successRate: "92.8%",
//   lastSearch: { query, resultCount, duration, timestamp, statusCode }
// }
```

### Performance Targets
| Metric | Target | Details |
|--------|--------|---------|
| Response Time | <500ms | 95th percentile for typical queries |
| Cold Start | <800ms | First search after app load |
| Subsequent Searches | <300ms | With 300ms debounce |
| Accuracy (Results Found) | >85% | For relevant queries |

### Example Measurements
```
Query: "bug"
- Backend search: 120ms
- Ranking calculation: 15ms
- Rendering: 30ms
- Total: ~165ms

Query: "authentication error in login modal"
- Backend search: 180ms
- Ranking calculation: 45ms (longer query)
- Rendering: 35ms
- Total: ~260ms

Measurement: performanceTracker.getAverageResponseTime() = 247.5ms
```

## Testing Search Accuracy

### Test Cases

#### 1. Exact Title Match
```javascript
// Query: "Login Error"
// Expected: Title "Login Error" ranks #1 with 100% relevance
```

#### 2. Fuzzy Matching
```javascript
// Query: "logn"
// Expected: "Login", "Logging in" match via fuzzy matching
// Relevant results appear even with typos
```

#### 3. Multi-word Queries
```javascript
// Query: "authentication error"
// Expected: Results matching both words rank higher
// Results matching one word rank lower
```

#### 4. Description Matching
```javascript
// Query: "database"
// If title doesn't contain "database" but description does:
// Expected: Still appears in results but lower relevance (10-15 points)
```

#### 5. Word Boundary Matching
```javascript
// Query: "test"
// Expected Order:
// 1. "Test Suite Setup" (word match: +60)
// 2. "Testing framework" (prefix match: +30)
// 3. "Latest updates" (substring: +40, but less prioritized)
```

### Running Performance Tests

#### Test 1: Response Time Baseline
```javascript
import { performanceTracker } from '@/utils/searchUtils';

// Perform 10 searches
// Check: performanceTracker.getAverageResponseTime()
// Target: < 300ms average
```

#### Test 2: Accuracy Measurement
```javascript
// Create test scenarios:
// 1. Search known ticket title → Should find it
// 2. Search partial title → Should find it
// 3. Search term in description → Should find it
// 4. Deliberately misspell → Should use fuzzy matching

// Measure success rate: performanceTracker.getSuccessRate()
// Target: > 85%
```

#### Test 3: Large Dataset
```javascript
// With 1000+ tickets:
// Measure response time with complex query
// Verify pagination works correctly
// Expected: Still < 500ms response
```

#### Test 4: Empty Results
```javascript
// Search for non-existent query: "xyzabc123"
// Expected: No results shown, < 100ms response
// UI shows: "No results for 'xyzabc123'"
```

### Manual Testing Checklist
- [ ] Exact match returns result
- [ ] Fuzzy matching works (typo tolerant)
- [ ] Relevance scoring orders results correctly
- [ ] Keyboard navigation works (↑↓ Enter Esc)
- [ ] Search debounce prevents excessive calls (300ms)
- [ ] Results show relevance % badge
- [ ] Context snippet displays correctly
- [ ] Board chip and column info display
- [ ] No results message appears when empty
- [ ] Loading spinner shows during search
- [ ] Performance under 300ms for typical query

## Search Utilities API

### scoreRelevance(query, ticket)
Calculate relevance score for a single ticket.
```javascript
import { scoreRelevance } from '@/utils/searchUtils';

const score = scoreRelevance("bug", ticket);
// Returns: 0-195 (various score tiers)
```

### rankResults(query, results)
Sort results by relevance, filter out zero-score matches.
```javascript
import { rankResults } from '@/utils/searchUtils';

const ranked = rankResults("bug", tickets);
// Returns: sorted array with .relevanceScore property added
```

### getContextSnippet(text, query, maxLength)
Extract relevant text context showing where match occurred.
```javascript
import { getContextSnippet } from '@/utils/searchUtils';

const snippet = getContextSnippet(
  "There is a critical bug in the authentication module",
  "bug",
  100
);
// Returns: "...critical bug in the authentication..."
```

### levenshteinDistance(str1, str2)
Calculate edit distance for fuzzy matching.
```javascript
import { levenshteinDistance } from '@/utils/searchUtils';

const distance = levenshteinDistance("test", "best");
// Returns: 1 (one substitution needed)
```

### stringSimilarity(str1, str2)
Calculate similarity score (0-1) based on Levenshtein distance.
```javascript
import { stringSimilarity } from '@/utils/searchUtils';

const similarity = stringSimilarity("test", "test");
// Returns: 1.0 (exact match)

const similarity = stringSimilarity("test", "best");
// Returns: 0.75 (75% similar)
```

### performanceTracker
Global performance tracking instance.
```javascript
import { performanceTracker } from '@/utils/searchUtils';

// Manually record a search
performanceTracker.recordSearch("bug", 5, 250);

// Get stats
console.log(performanceTracker.getStats());
// {
//   totalSearches: 42,
//   avgResponseTime: "247.32ms",
//   successRate: "88.5%",
//   lastSearch: { query, resultCount, duration, timestamp, statusCode }
// }

// Get average response time
const avgTime = performanceTracker.getAverageResponseTime(); // ms

// Get success rate
const successRate = performanceTracker.getSuccessRate(); // 0-100%
```

## Keyboard Shortcuts
- **/** - Focus search input
- **↑/↓** - Navigate search results
- **Enter** - Navigate to selected ticket's board
- **Esc** - Close search results

## Integration with GlobalSearch Component

The GlobalSearch component automatically:
1. Fetches from backend search endpoint
2. Applies relevance ranking to results
3. Tracks performance metrics
4. Displays relevance badges (% score)
5. Shows context snippets
6. Handles keyboard navigation
7. Displays loading state

### Usage
```jsx
import GlobalSearch from '@/components/GlobalSearch';

// In App.jsx navbar
<GlobalSearch searchInputRef={searchInputRef} />
```

## Future Improvements

1. **Backend Ranking**: Move relevance scoring to backend for faster responses
2. **Advanced Filters**: Filter by board, assignee, column, status
3. **Search History**: Save recent searches for quick access
4. **Saved Searches**: Allow users to save and rerun searches
5. **Search Analytics**: Track popular search queries
6. **Auto-complete**: Suggest queries based on history
7. **Synonym Support**: Expand searches with synonyms (e.g., "bug" = "issue")
8. **Full-text Index**: Use database full-text search for speed (MongoDB text indexes)

## Troubleshooting

### Searches return no results
- Check query length (minimum 2 characters)
- Verify user has access to boards containing tickets
- Check backend is running and /api/tickets/search endpoint responds
- Review browser console for error messages

### Search is slow (>500ms)
- Check browser network tab for API latency
- Large dataset may need pagination tuning
- Consider backend full-text index optimization
- Use performanceTracker.getStats() to identify bottleneck

### Typo tolerance not working
- Fuzzy matching only applies after exact/prefix/substring fails
- Levenshtein distance calculation is expensive; check performance
- Very short queries may not trigger fuzzy matching tier

### Keyboard navigation not working
- Verify Esc key isn't captured by other handlers
- Check that search results dropdown is open
- Ensure focus is on search input when using arrows
- Test with Alt+Tab to confirm focus state

## Code Examples

### Track all searches in development
```javascript
// In GlobalSearch.jsx or development console
import { performanceTracker } from '@/utils/searchUtils';

// After each search, view stats
setInterval(() => {
  const stats = performanceTracker.getStats();
  if (stats.totalSearches > 0) {
    console.log(`[Search Stats] Avg: ${stats.avgResponseTime}, Success: ${stats.successRate}`);
  }
}, 5000);
```

### Custom ranking strategy
```javascript
// Override ranking in GlobalSearch.jsx
const rankedResults = results
  .map(r => ({
    ...r,
    relevanceScore: customScoringFn(query, r)
  }))
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
```

### Test search with console
```javascript
// In browser console
fetch('/api/tickets/search?q=bug', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d.data.tickets));
```
