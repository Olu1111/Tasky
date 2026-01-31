import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, InputBase, Paper, List, ListItem, ListItemText, 
  Typography, CircularProgress, Fade, IconButton, Chip, LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { rankResults, getContextSnippet, performanceTracker } from '../utils/searchUtils';
import { API_BASE_URL } from '../utils/apiBase';

const GlobalSearch = React.forwardRef(({ searchInputRef }, ref) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const localSearchRef = useRef(null);

  const handleSearch = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (!query.trim()) return;
    
    const startTime = performance.now();
    setLoading(true);
    setOpen(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleClear();
        return;
      }

      const json = await response.json();
      if (json.ok) {
        const results = json.data.results || [];
        // Separate boards and tickets, prioritize boards, then rank tickets
        const boards = results.filter(r => r.type === 'board').map(r => r.data);
        const tickets = results.filter(r => r.type === 'ticket').map(r => r.data);
        const rankedTickets = rankResults(query, tickets);
        
        // Combine: boards first, then ranked tickets
        const combinedResults = [
          ...boards.map(b => ({ ...b, type: 'board' })),
          ...rankedTickets.map(t => ({ ...t, type: 'ticket' }))
        ];
        
        setResults(combinedResults);
        
        // Track performance
        const endTime = performance.now();
        const duration = endTime - startTime;
        performanceTracker.recordSearch(query, combinedResults.length, duration);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        handleSearch();
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleSelectResult = (result) => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    
    if (result.type === 'board') {
      navigate(`/boards/${result._id}`);
    } else {
      // ticket
      navigate(`/boards/${result.board._id}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open || results.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const searchInput = localSearchRef.current?.querySelector('input');
    searchInput?.addEventListener('keydown', handleKeyDown);
    return () => searchInput?.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: '600px', mx: 'auto' }} ref={localSearchRef}>
      <Paper
        elevation={0}
        sx={{
          p: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          '&:focus-within': { 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 20 }} />
        <InputBase
          inputRef={searchInputRef}
          sx={{ ml: 1.5, flex: 1, color: 'white', fontSize: '0.95rem' }}
          placeholder="Search for tasks... (Press / to focus)"
          aria-label="Search tasks"
          aria-expanded={open}
          aria-controls="search-results"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length > 1 && setOpen(true)}
        />
        {query && (
          <IconButton 
            size="small" 
            onClick={handleClear} 
            sx={{ color: 'white' }}
            aria-label="Clear search"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      <Fade in={open && (loading || results.length > 0 || query.length > 1)}>
        <Paper
          id="search-results"
          role="listbox"
          elevation={8}
          sx={{
            position: 'absolute',
            top: '120%',
            left: 0,
            right: 0,
            zIndex: 2000,
            maxHeight: '450px',
            overflowY: 'auto',
            borderRadius: '12px',
            p: 1,
            border: '1px solid #e0e0e0'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : results.length > 0 ? (
            <>
              <LinearProgress 
                variant="determinate" 
                value={(results.length / 10) * 100} 
                sx={{ mb: 1.5 }}
                aria-label={`Showing ${results.length} results`}
              />
              <List sx={{ p: 0 }} role="presentation">
                {results.map((result, idx) => {
                  const isBoard = result.type === 'board';
                  
                  if (isBoard) {
                    return (
                      <ListItem 
                        key={result._id} 
                        component="div"
                        role="option"
                        aria-selected={selectedIndex === idx}
                        onClick={() => handleSelectResult(result)}
                        sx={{ 
                          borderRadius: '8px', 
                          mb: 0.5, 
                          cursor: 'pointer',
                          bgcolor: selectedIndex === idx ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderLeft: '3px solid #2196F3'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight="600">
                                📋 {result.title}
                              </Typography>
                              <Chip 
                                label="Board" 
                                size="small" 
                                sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700, bgcolor: '#2196F3', color: 'white' }} 
                              />
                            </Box>
                          }
                          secondary={result.description || 'No description'}
                        />
                      </ListItem>
                    );
                  }
                  
                  // Ticket result
                  const relevancePercent = Math.round((result.relevanceScore / 100) * 100);
                  const contextSnippet = getContextSnippet(
                    result.description || result.title, 
                    query, 
                    80
                  );
                  
                  return (
                    <ListItem 
                      key={result._id} 
                      component="div"
                      role="option"
                      aria-selected={selectedIndex === idx}
                      onClick={() => handleSelectResult(result)}
                      sx={{ 
                        borderRadius: '8px', 
                        mb: 0.5, 
                        cursor: 'pointer',
                        bgcolor: selectedIndex === idx ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderLeft: `3px solid ${
                          relevancePercent >= 80 ? '#4caf50' :
                          relevancePercent >= 50 ? '#ff9800' :
                          '#f44336'
                        }`
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                              🎫 {result.title}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'white',
                                bgcolor: relevancePercent >= 80 ? '#4caf50' : relevancePercent >= 50 ? '#ff9800' : '#f44336',
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {relevancePercent}%
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.75 }}>
                            <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={result.board?.title} 
                                size="small" 
                                sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700 }} 
                              />
                              <Typography variant="caption" color="text.secondary" component="span">
                                in {result.column?.title}
                              </Typography>
                            </Box>
                            {contextSnippet && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: 'block',
                                  fontStyle: 'italic',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                "{contextSnippet}"
                              </Typography>
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          ) : query.length > 1 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results for "{query}"
              </Typography>
            </Box>
          ) : null}
        </Paper>
      </Fade>
    </Box>
  );
});

GlobalSearch.displayName = 'GlobalSearch';

export default GlobalSearch;