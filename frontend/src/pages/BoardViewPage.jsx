import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, 
  Chip, IconButton, Snackbar, Alert, Avatar,
  Checkbox, Paper, Fade, Stack, Tooltip, useMediaQuery, useTheme
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../utils/apiClient';
import BoardSkeleton from '../components/BoardSkeleton';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TicketModal from '../components/TicketModal'; 
import EditTicketModal from '../components/EditTicketModal'; 
import ColumnModal from '../components/ColumnModal';
import FilterBar from '../components/FilterBar';
import ActivityDrawer from '../components/ActivityDrawer';

const EmptyColumnState = () => (
  <Box sx={{ 
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    py: 6, opacity: 0.3, border: '2px dashed #ccc', borderRadius: '8px', m: 1
  }}>
    <SearchOffIcon sx={{ fontSize: 40, mb: 1 }} />
    <Typography variant="caption" sx={{ fontWeight: 700 }}>No tasks</Typography>
  </Box>
);

const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }
};

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

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const BoardViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [users, setUsers] = useState([]); 
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [expandedColumns, setExpandedColumns] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  
  const initialFilters = { search: '', assignees: [], statuses: [], priorities: [] };
  const [filters, setFilters] = useState(initialFilters);
  const debouncedSearch = useDebounce(filters.search, 300);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [selectedTicket, setSelectedTicket] = useState(null); 
  const [activeColumn, setActiveColumn] = useState(null); 
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const isAdmin = true;

  const triggerNotificationSync = useCallback(() => {
    window.dispatchEvent(new Event('refreshNotifications'));
  }, []);

  const getAssigneeDetails = useCallback((assigneeData) => {
    if (!assigneeData) return null;
    const assigneeId = assigneeData._id || assigneeData;
    return users.find(u => u._id === assigneeId) || (typeof assigneeData === 'object' ? assigneeData : null);
  }, [users]);

  const toggleColumnExpanded = (columnId) => {
    setExpandedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (columnId) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe || isRightSwipe) {
      toggleColumnExpanded(columnId);
    }
  };

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true); 
      const [boardRes, colRes, userRes] = await Promise.all([
        apiClient.get(`/boards/${id}`),
        apiClient.get(`/boards/${id}/columns`),
        apiClient.get(`/users`)
      ]);
      if (boardRes?.ok) {
        const boardJson = await boardRes.json();
        setBoardTitle(boardJson.data.board.title);
      }
      if (colRes?.ok) {
        const rawColumns = await colRes.json();
        setColumns(rawColumns.map(col => ({
          ...col,
          items: (col.items || []).filter(item => !item.deletedAt)
        })));
      }
      if (userRes?.ok) {
        const userJson = await userRes.json();
        setUsers(userJson.data?.users || []);
      }
    } catch (error) { 
      console.error(error); 
      setSnackbar({ open: true, message: 'Failed to load board data', severity: 'error' });
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { 
    if (id) fetchData(); 
  }, [id, fetchData]);

  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      items: (column.items || []).filter(ticket => {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = ticket.title.toLowerCase().includes(searchLower) || (ticket.description || "").toLowerCase().includes(searchLower);
        const ticketAssigneeId = ticket.assignee?._id || ticket.assignee;
        const matchesAssignee = filters.assignees.length === 0 || filters.assignees.includes(ticketAssigneeId);
        const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(column._id);
        const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(ticket.priority);
        return matchesSearch && matchesAssignee && matchesStatus && matchesPriority;
      })
    }));
  }, [columns, filters, debouncedSearch]);

  const isBoardCompletelyEmpty = useMemo(() => columns.every(col => !col.items || col.items.length === 0), [columns]);
  const hasFilterResults = useMemo(() => filteredColumns.some(col => col.items && col.items.length > 0), [filteredColumns]);

  const handleToggleSelect = (e, ticketId) => {
    e.stopPropagation(); 
    setSelectedTicketIds(prev => prev.includes(ticketId) ? prev.filter(tid => tid !== ticketId) : [...prev, ticketId]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTicketIds.length} tasks?`)) return;
    setIsSyncing(true);
    try {
      await Promise.all(selectedTicketIds.map(ticketId => apiClient.delete(`/tickets/${ticketId}`)));
      setSnackbar({ open: true, message: `Successfully deleted ${selectedTicketIds.length} tasks`, severity: 'success' });
      setSelectedTicketIds([]);
      fetchData(true);
      triggerNotificationSync();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTicket = async (ticketId, updatedData) => {
    if (updatedData.isDeleted) {
      setColumns(prev => prev.map(col => ({ ...col, items: col.items.filter(item => item._id !== ticketId) })));
      setSnackbar({ open: true, message: 'Task deleted', severity: 'success' });
      triggerNotificationSync();
      return;
    }
    try {
      const response = await apiClient.patch(`/tickets/${ticketId}`, updatedData);
      if (response?.ok) { fetchData(true); triggerNotificationSync(); }
    } catch (error) { console.error(error); }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const previousColumns = [...columns];
    const updatedColumns = JSON.parse(JSON.stringify(columns));
    const sourceCol = updatedColumns.find(c => c._id === source.droppableId);
    const destCol = updatedColumns.find(c => c._id === destination.droppableId);
    const [movedTask] = sourceCol.items.splice(source.index, 1);
    destCol.items.splice(destination.index, 0, movedTask);

    setColumns(updatedColumns);

    try {
      const response = await apiClient.patch(`/tickets/${draggableId}/move`, { columnId: destination.droppableId, index: destination.index });
      if (response?.ok) {
        triggerNotificationSync();
      } else {
        setColumns(previousColumns);
        setSnackbar({ open: true, message: 'Sync failed. Reverting...', severity: 'error' });
      }
    } catch (error) {
      console.error(error);
      setColumns(previousColumns);
      setSnackbar({ open: true, message: 'Network error. Reverting...', severity: 'error' });
    }
  };

  const handleCreateTicket = async (ticketData) => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post(`/tickets`, { ...ticketData, boardId: id, columnId: activeColumn._id });
      if (response?.ok) {
        fetchData(true); 
        setIsTicketModalOpen(false);
        setSnackbar({ open: true, message: 'Ticket created!', severity: 'success' });
        triggerNotificationSync();
      }
    } catch (error) {
      console.error(error);
    } finally { setIsSyncing(false); }
  };

  const handleAddColumn = async (title) => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post(`/boards/${id}/columns`, { title });
      if (response?.ok) { fetchData(true); setIsColumnModalOpen(false); triggerNotificationSync(); }
    } catch (error) {
      console.error(error);
    } finally { setIsSyncing(false); }
  };

  const handleRenameColumn = async (colId, title) => {
    try {
      const response = await apiClient.patch(`/columns/${colId}`, { title });
      if (response?.ok) { fetchData(true); triggerNotificationSync(); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteColumn = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.delete(`/columns/${columnToDelete._id}`);
      if (response?.ok) { setIsDeleteModalOpen(false); fetchData(true); triggerNotificationSync(); }
    } catch (error) {
      console.error(error);
    } finally { setIsSyncing(false); }
  };

  if (loading) return <BoardSkeleton />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', width: '100%', overflow: 'hidden', bgcolor: '#fff' }}>
      <Box sx={{ 
        px: { xs: 2, sm: 3, md: 4 }, 
        pt: { xs: 1.5, sm: 2 }, 
        pb: 1, 
        flexShrink: 0, 
        borderBottom: '1px solid #eee' 
      }}>
        <Box mb={1} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Tooltip title="Back to Boards">
              <IconButton 
                onClick={() => navigate('/boards')} 
                size="small" 
                sx={{ 
                  bgcolor: '#f4f5f7',
                  '@media (max-width: 768px)': {
                    width: 44,
                    height: 44
                  }
                }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Typography 
              variant="h5" 
              fontWeight="800"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
              {boardTitle || "Untitled Board"}
              {isSyncing && <Typography variant="caption" sx={{ ml: 2, color: '#263238', fontWeight: 600, display: { xs: 'none', sm: 'inline' } }}>Updating...</Typography>}
            </Typography>
          </Box>
          
          {/* Activity & Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Activity Feed">
              <IconButton 
                onClick={() => setIsActivityDrawerOpen(true)}
                size="small" 
                sx={{ 
                  bgcolor: '#f4f5f7',
                  '@media (max-width: 768px)': {
                    width: 44,
                    height: 44
                  }
                }}>
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* COLOR FIX: Using Charcoal Grey #263238 */}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setIsColumnModalOpen(true)} 
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontWeight: 700, 
              bgcolor: '#263238',
              px: 3,
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#37474f', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
              '&:active': { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
              '&:focus-visible': { outline: '2px solid #fff', outlineOffset: '2px' },
              '@media (max-width: 768px)': {
                py: 1.5,
                px: 2.5,
                minWidth: '120px'
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Column</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          </Button>
        </Box>
        {columns.length > 0 && <Box sx={{ mb: 1 }}><FilterBar filters={filters} setFilters={setFilters} users={users} columns={columns} onClear={() => setFilters(initialFilters)} /></Box>}
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          overflowX: 'auto', 
          flexGrow: 1, 
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 2, sm: 3 }, 
          alignItems: 'flex-start', 
          bgcolor: '#fafbfc',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            gap: 2,
            overflowX: 'visible'
          }
        }}>
          {filteredColumns.map((column) => {
            const isExpanded = expandedColumns[column._id] !== false;
            return (
            <Box 
              key={column._id} 
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => onTouchEnd(column._id)}
              sx={{ 
                minWidth: { xs: '100%', sm: '300px' },
                width: { xs: '100%', sm: '300px' },
                bgcolor: '#ebedf0', 
                borderRadius: '12px', 
                p: 1.5, 
                maxHeight: { xs: 'auto', sm: '100%' },
                display: 'flex', 
                flexDirection: 'column', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '@media (max-width: 768px)': {
                  transition: 'all 0.3s ease'
                }
              }}>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={1} 
                px={1}
                onClick={() => window.innerWidth <= 768 && toggleColumnExpanded(column._id)}
                sx={{ 
                  cursor: { xs: 'pointer', sm: 'default' },
                  '@media (max-width: 768px)': {
                    py: 1,
                    '&:active': { bgcolor: 'rgba(0,0,0,0.05)' }
                  }
                }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, cursor: 'text', flexGrow: 1 }} component="div">
                  <input 
                    defaultValue={column.title} 
                    onBlur={(e) => handleRenameColumn(column._id, e.target.value)} 
                    onClick={(e) => window.innerWidth <= 768 && e.stopPropagation()}
                    style={{ background: 'transparent', border: 'none', fontWeight: 'inherit', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: 'inherit' }} 
                  />
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={column.items?.length || 0} 
                    size="small" 
                    sx={{ 
                      height: '22px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      bgcolor: '#263238',
                      color: 'white'
                    }} 
                  />
                  {isAdmin && <IconButton size="small" onClick={(e) => { e.stopPropagation(); setColumnToDelete(column); setIsDeleteModalOpen(true); }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>}
                </Box>
              </Box>

              <Droppable droppableId={column._id}>
                {(provided, snapshot) => (
                  <Box 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    sx={{ 
                      flexGrow: 1, 
                      overflowY: 'auto', 
                      minHeight: '50px', 
                      borderRadius: '8px', 
                      bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent', 
                      transition: 'all 0.3s ease',
                      '@media (max-width: 768px)': {
                        display: isExpanded ? 'block' : 'none',
                        maxHeight: isExpanded ? '1000px' : '0',
                        opacity: isExpanded ? 1 : 0
                      }
                    }}>
                    {column.items?.length === 0 && <EmptyColumnState />}
                    {column.items?.map((task, index) => {
                      const assigneeDetails = getAssigneeDetails(task.assignee);
                      const isSelected = selectedTicketIds.includes(task._id);
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps} 
                              onClick={() => { setSelectedTicket(task); setIsEditModalOpen(true); }} 
                              sx={{ 
                                mb: 1, 
                                borderRadius: '8px', 
                                border: isSelected ? '2px solid #263238' : '2px solid transparent', 
                                boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.1)', 
                                transform: snapshot.isDragging ? 'rotate(2deg)' : 'none', 
                                transition: 'border 0.2s ease', 
                                '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
                                '@media (max-width: 768px)': {
                                  '&:active': { bgcolor: 'rgba(0,0,0,0.02)' }
                                }
                              }}>
                              <CardContent sx={{ 
                                p: { xs: '14px !important', sm: '12px !important' },
                                position: 'relative',
                                '@media (max-width: 768px)': {
                                  minHeight: '60px'
                                }
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#172b4d' }}>{task.title}</Typography>
                                  <Checkbox size="small" checked={isSelected} onClick={(e) => handleToggleSelect(e, task._id)} sx={{ p: 0, ml: 1, color: '#263238', '&.Mui-checked': { color: '#263238' } }} />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    {task.priority && <Chip label={task.priority} size="small" sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700, ...PRIORITY_STYLES[task.priority] }} />}
                                    {task.comments?.length > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}><ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /><Typography variant="caption" sx={{ fontWeight: 700 }}>{task.comments.length}</Typography></Box>}
                                  </Box>
                                  {assigneeDetails && <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 800, bgcolor: getAvatarColor(assigneeDetails._id, assigneeDetails.name) }}>{assigneeDetails.name?.charAt(0).toUpperCase()}</Avatar>}
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
              <Button 
                fullWidth 
                startIcon={<AddIcon />} 
                onClick={(e) => { 
                  e.stopPropagation();
                  setActiveColumn(column); 
                  setIsTicketModalOpen(true); 
                }} 
                sx={{ 
                  textTransform: 'none', 
                  mt: 1, 
                  color: '#5e6c84', 
                  fontWeight: 600, 
                  justifyContent: 'flex-start',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  '&:focus-visible': { outline: '2px solid #263238', outlineOffset: '2px' },
                  '@media (max-width: 768px)': {
                    py: 1.5,
                    fontSize: '1rem',
                    display: isExpanded ? 'flex' : 'none'
                  }
                }}>Add a card</Button>
            </Box>
          );})}
        </Box>
      </DragDropContext>

      {!hasFilterResults && !isBoardCompletelyEmpty && <Box sx={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}><SearchOffIcon sx={{ fontSize: 64, color: '#dfe1e6', mb: 2 }} /><Typography variant="h6" sx={{ color: '#5e6c84', fontWeight: 700 }}>No results found</Typography><Button variant="outlined" onClick={() => setFilters(initialFilters)} sx={{ mt: 2, color: '#263238', borderColor: '#263238' }}>Clear all filters</Button></Box>}

      <Fade in={selectedTicketIds.length > 0}>
        <Paper 
          elevation={10} 
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 20, sm: 40 }, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            bgcolor: '#263238', 
            color: 'white', 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 1.5, sm: 1 }, 
            borderRadius: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 2, sm: 3 }, 
            zIndex: 1100,
            maxWidth: { xs: 'calc(100% - 32px)', sm: 'auto' },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: 'center'
          }}>
          <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {selectedTicketIds.length} cards selected
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button 
              size="small" 
              variant="contained" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleBulkDelete} 
              sx={{ 
                borderRadius: '20px', 
                fontWeight: 800,
                '@media (max-width: 768px)': {
                  py: 1.5,
                  px: 2
                }
              }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Bulk Delete</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Delete</Box>
            </Button>
            <IconButton 
              size="small" 
              onClick={() => setSelectedTicketIds([])} 
              sx={{ 
                color: 'white',
                '@media (max-width: 768px)': {
                  width: 44,
                  height: 44
                }
              }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Paper>
      </Fade>

      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onCreate={handleCreateTicket} columnTitle={activeColumn?.title} />
      <ColumnModal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} onCreate={handleAddColumn} />
      <EditTicketModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateTicket} ticket={selectedTicket} columns={columns} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteColumn} itemName={columnToDelete?.title} />
      
      {/* Activity Feed Drawer */}
      <ActivityDrawer 
        boardId={id} 
        open={isActivityDrawerOpen} 
        onClose={() => setIsActivityDrawerOpen(false)} 
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 600
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BoardViewPage;