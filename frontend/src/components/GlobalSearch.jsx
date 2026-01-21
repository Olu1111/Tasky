import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, InputBase, Paper, List, ListItem, ListItemText, 
  Typography, CircularProgress, Fade, IconButton, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const handleSearch = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    // Security check: only search if logged in
    if (!token) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (!query.trim()) return;
    
    setLoading(true);
    setOpen(true);
    try {
      // Hits the Regex-powered endpoint for partial word matching
      const response = await fetch(`http://localhost:4000/api/tickets/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleClear();
        return;
      }

      const json = await response.json();
      if (json.ok) {
        setResults(json.data.tickets || []);
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
    }, 300); // 300ms debounce as per Task #54

    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleSelectTicket = (boardId) => {
    setOpen(false);
    setQuery('');
    navigate(`/boards/${boardId}`);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: '600px', mx: 'auto' }} ref={searchRef}>
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
          sx={{ ml: 1.5, flex: 1, color: 'white', fontSize: '0.95rem' }}
          placeholder="Search for tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setOpen(true)}
        />
        {query && (
          <IconButton size="small" onClick={handleClear} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      <Fade in={open && (loading || results.length > 0 || query.length > 1)}>
        <Paper
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
            <List sx={{ p: 0 }}>
              {results.map((ticket) => (
                <ListItem 
                  key={ticket._id} 
                  // 🎯 FIX: Changed component to 'div' to resolve boolean attribute error
                  component="div"
                  onClick={() => handleSelectTicket(ticket.board._id)}
                  sx={{ 
                    borderRadius: '8px', 
                    mb: 0.5, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight="600">
                        {ticket.title}
                      </Typography>
                    }
                    // 🎯 FIX: Wrapped secondary content and changed container to 'div' 
                    // to resolve hydration/nesting errors
                    secondary={
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={ticket.board?.title} 
                          size="small" 
                          sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700 }} 
                        />
                        <Typography variant="caption" color="text.secondary" component="span">
                          in {ticket.column?.title}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
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
};

export default GlobalSearch;