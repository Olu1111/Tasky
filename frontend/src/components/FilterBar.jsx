import React from 'react';
import { 
  Box, Paper, TextField, Autocomplete, Select, MenuItem, 
  FormControl, InputLabel, ToggleButtonGroup, ToggleButton, 
  Button, Typography, Chip, Avatar 
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

const getAvatarColor = (id, name) => {
  if (name?.toLowerCase() === 'admin') return '#263238';
  
  let hash = 0;
  const identifier = id || name || ""; 
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const FilterBar = ({ filters, setFilters, users, columns, onClear }) => {
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label="Search tickets..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ minWidth: 200 }}
        />

        <Autocomplete
          multiple
          size="small"
          options={safeUsers}
          getOptionLabel={(option) => option.name || option.email || ""}
          value={safeUsers.filter(u => filters.assignees.includes(u._id))}
          onChange={(event, newValue) => {
            setFilters({ ...filters, assignees: newValue.map(v => v._id) });
          }}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                src={option.profilePic} 
                sx={{ 
                  width: 24, height: 24, fontSize: '0.8rem', 
                  bgcolor: getAvatarColor(option._id, option.name) // Using ID now
                }}
              >
                {option.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{option.name}</Typography>
            </Box>
          )}
          renderInput={(params) => <TextField {...params} label="Assignees" />}
          sx={{ minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filters.statuses}
            label="Status"
            onChange={(e) => setFilters({ ...filters, statuses: e.target.value })}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const col = columns?.find(c => c._id === value);
                  return <Chip key={value} label={col?.title || "Status"} size="small" />;
                })}
              </Box>
            )}
          >
            {columns?.map((col) => (
              <MenuItem key={col._id} value={col._id}>{col.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">Priority:</Typography>
          <ToggleButtonGroup
            size="small"
            value={filters.priorities}
            onChange={(e, val) => setFilters({ ...filters, priorities: val })}
          >
            <ToggleButton value="High" color="error">High</ToggleButton>
            <ToggleButton value="Medium" color="warning">Med</ToggleButton>
            <ToggleButton value="Low" color="success">Low</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Button startIcon={<ClearIcon />} onClick={onClear} size="small" sx={{ ml: 'auto', textTransform: 'none' }}>
          Clear Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterBar;