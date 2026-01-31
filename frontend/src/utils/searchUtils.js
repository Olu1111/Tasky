// Search utilities for fuzzy matching and relevance scoring
// Based on Levenshtein distance and character similarity

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy matching similarity
 */
export const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[len2][len1];
};

/**
 * Calculate string similarity score (0-1)
 * 1 = exact match, 0 = no similarity
 */
export const stringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Score search result relevance
 * Considers: exact match, prefix match, word match, edit distance
 */
export const scoreRelevance = (query, ticket) => {
  const q = query.toLowerCase();
  const title = ticket.title?.toLowerCase() || '';
  const description = ticket.description?.toLowerCase() || '';
  
  let score = 0;

  // Exact title match: +100
  if (title === q) score += 100;

  // Prefix match in title: +80
  if (title.startsWith(q)) score += 80;

  // Exact word match in title: +60
  if (title.split(/\s+/).some(word => word === q)) score += 60;

  // Substring match in title: +40
  if (title.includes(q)) score += 40;

  // Word prefix match in title: +30
  if (title.split(/\s+/).some(word => word.startsWith(q))) score += 30;

  // Fuzzy similarity in title: +20 (scaled by similarity 0-20)
  const titleSimilarity = stringSimilarity(q, title);
  score += titleSimilarity * 20;

  // Substring match in description: +10
  if (description.includes(q)) score += 10;

  // Fuzzy similarity in description: +5 (scaled by similarity 0-5)
  const descriptionSimilarity = stringSimilarity(q, description);
  score += descriptionSimilarity * 5;

  return score;
};

/**
 * Highlight matching text in string
 * Returns string with <mark> tags around matches
 */
export const highlightMatches = (text, query) => {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Sort and filter search results by relevance
 */
export const rankResults = (query, results) => {
  return results
    .map(result => ({
      ...result,
      relevanceScore: scoreRelevance(query, result)
    }))
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * Extract context snippet from text
 * Shows query in context with surrounding words
 */
export const getContextSnippet = (text, query, maxLength = 100) => {
  if (!text || !query) return '';
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text.substring(0, maxLength) + '...';
  
  const startContext = Math.max(0, index - 20);
  const endContext = Math.min(text.length, index + query.length + 30);
  
  let snippet = text.substring(startContext, endContext);
  if (startContext > 0) snippet = '...' + snippet;
  if (endContext < text.length) snippet = snippet + '...';
  
  return snippet;
};

/**
 * Measure search performance
 */
export class SearchPerformanceTracker {
  constructor() {
    this.searches = [];
  }

  recordSearch(query, resultCount, duration) {
    this.searches.push({
      query,
      resultCount,
      duration,
      timestamp: new Date(),
      statusCode: resultCount > 0 ? 'found' : 'not_found'
    });

    // Keep only last 100 searches
    if (this.searches.length > 100) {
      this.searches = this.searches.slice(-100);
    }
  }

  getAverageResponseTime() {
    if (this.searches.length === 0) return 0;
    const sum = this.searches.reduce((acc, s) => acc + s.duration, 0);
    return sum / this.searches.length;
  }

  getSuccessRate() {
    if (this.searches.length === 0) return 0;
    const successful = this.searches.filter(s => s.statusCode === 'found').length;
    return (successful / this.searches.length) * 100;
  }

  getStats() {
    return {
      totalSearches: this.searches.length,
      avgResponseTime: this.getAverageResponseTime().toFixed(2) + 'ms',
      successRate: this.getSuccessRate().toFixed(1) + '%',
      lastSearch: this.searches[this.searches.length - 1]
    };
  }
}

// Global performance tracker
export const performanceTracker = new SearchPerformanceTracker();
