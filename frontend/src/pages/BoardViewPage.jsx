import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, 
  Skeleton, Chip, IconButton, Snackbar, Alert, Avatar,
  Checkbox, Paper, Fade, Stack 
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../utils/apiClient';

import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TicketModal from '../components/TicketModal'; 
import EditTicketModal from '../components/EditTicketModal'; 
import ColumnModal from '../components/ColumnModal';
import FilterBar from '../components/FilterBar';

const EmptyColumnState = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.4 }}>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
    <Typography variant="caption" sx={{ mt: 1, fontWeight: 700 }}>No tasks yet</Typography>
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
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); 
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  
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
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isAdmin = true;

  const triggerNotificationSync = useCallback(() => {
    window.dispatchEvent(new Event('refreshNotifications'));
  }, []);

  const getAssigneeDetails = useCallback((assigneeData) => {
    if (!assigneeData) return null;
    const assigneeId = assigneeData._id || assigneeData;
    return users.find(u => u._id === assigneeId) || (typeof assigneeData === 'object' ? assigneeData : null);
  }, [users]);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true); 

      // APICLIENT AUTOMATION: Headers and Token handled internally
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
        const cleanColumns = rawColumns.map(col => ({
          ...col,
          items: (col.items || []).filter(item => !item.deletedAt)
        }));
        setColumns(cleanColumns);
      }

      if (userRes?.ok) {
        const userJson = await userRes.json();
        setUsers(userJson.data?.users || []);
      }
    } catch (error) { 
      console.error("Load error:", error); 
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
        const matchesSearch = 
          ticket.title.toLowerCase().includes(searchLower) ||
          (ticket.description || "").toLowerCase().includes(searchLower);

        const ticketAssigneeId = ticket.assignee?._id || ticket.assignee;
        const matchesAssignee = 
          filters.assignees.length === 0 || filters.assignees.includes(ticketAssigneeId);

        const matchesStatus = 
          filters.statuses.length === 0 || filters.statuses.includes(column._id);

        const matchesPriority = 
          filters.priorities.length === 0 || filters.priorities.includes(ticket.priority);

        return matchesSearch && matchesAssignee && matchesStatus && matchesPriority;
      })
    }));
  }, [columns, filters, debouncedSearch]);

  const isBoardCompletelyEmpty = useMemo(() => {
    return columns.every(col => !col.items || col.items.length === 0);
  }, [columns]);

  const hasFilterResults = useMemo(() => {
    return filteredColumns.some(col => col.items && col.items.length > 0);
  }, [filteredColumns]);

  const handleToggleSelect = (e, ticketId) => {
    e.stopPropagation(); 
    setSelectedTicketIds(prev => 
      prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTicketIds.length} tasks?`)) return;
    
    try {
      await Promise.all(selectedTicketIds.map(ticketId => 
        apiClient.delete(`/tickets/${ticketId}`) // Automated error handling
      ));
      
      setSnackbar({ open: true, message: `Successfully deleted tasks`, severity: 'success' });
      setSelectedTicketIds([]);
      fetchData(true);
      triggerNotificationSync();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleUpdateTicket = async (ticketId, updatedData) => {
    if (updatedData.isDeleted) {
      setColumns(prev => prev.map(col => ({
        ...col,
        items: col.items.filter(item => item._id !== ticketId)
      })));
      setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
      triggerNotificationSync();
      return;
    }

    try {
      const response = await apiClient.patch(`/tickets/${ticketId}`, updatedData);
      if (response?.ok) {
        fetchData(true);
        triggerNotificationSync();
      }
    } catch (error) { 
      console.error("Update failed:", error); 
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const updatedColumns = [...columns];
    const sourceColIndex = updatedColumns.findIndex(c => c._id === source.droppableId);
    const destColIndex = updatedColumns.findIndex(c => c._id === destination.droppableId);

    const sourceCol = { ...updatedColumns[sourceColIndex], items: [...updatedColumns[sourceColIndex].items] };
    const destCol = { ...updatedColumns[destColIndex], items: [...updatedColumns[destColIndex].items] };

    const [movedTask] = sourceCol.items.splice(source.index, 1);
    
    if (sourceColIndex === destColIndex) {
      sourceCol.items.splice(destination.index, 0, movedTask);
      updatedColumns[sourceColIndex] = sourceCol;
    } else {
      destCol.items.splice(destination.index, 0, movedTask);
      updatedColumns[sourceColIndex] = sourceCol;
      updatedColumns[destColIndex] = destCol;
    }

    setColumns(updatedColumns);

    try {
      const response = await apiClient.patch(`/tickets/${draggableId}/move`, { 
        columnId: destination.droppableId, 
        index: destination.index 
      });
      if (response?.ok) triggerNotificationSync();
    } catch (error) {
      console.error("Move sync failed:", error);
      fetchData(true);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await apiClient.post(`/tickets`, { 
        ...ticketData, 
        boardId: id, 
        columnId: activeColumn._id 
      });

      if (response?.ok) {
        fetchData(true); 
        setIsTicketModalOpen(false);
        setSnackbar({ open: true, message: 'Ticket created successfully!', severity: 'success' });
        triggerNotificationSync();
      }
    } catch (error) { 
      console.error("Creation failed:", error); 
    }
  };

  const handleAddColumn = async (title) => {
    try {
      const response = await apiClient.post(`/boards/${id}/columns`, { title });
      if (response?.ok) {
        fetchData(true); 
        setIsColumnModalOpen(false);
        triggerNotificationSync();
      }
    } catch (error) { 
      console.error("Column add failed:", error); 
    }
  };

  const handleRenameColumn = async (colId, title) => {
    try {
      const response = await apiClient.patch(`/columns/${colId}`, { title });
      if (response?.ok) {
        fetchData(true);
        triggerNotificationSync();
      }
    } catch (error) { 
      console.error("Rename failed:", error); 
    }
  };

  const handleDeleteColumn = async () => {
    try {
      const response = await apiClient.delete(`/columns/${columnToDelete._id}`);
      if (response?.ok) {
        setIsDeleteModalOpen(false); 
        fetchData(true);
        triggerNotificationSync();
      }
    } catch (error) { 
      console.error("Delete failed:", error); 
    }
  };

  if (loading && columns.length === 0) return (
    <Box sx={{ p: 4 }}><Skeleton variant="rectangular" height={400} /></Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: '#fff',
      position: 'relative'
    }}>

      <Box sx={{ px: 4, pt: 2, pb: 1, flexShrink: 0 }}>
        <Box mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/boards')} size="small">Back</Button>
          <Typography variant="h4" fontWeight="800">{boardTitle || "Untitled Board"}</Typography>
        </Box>

        {!loading && columns.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <FilterBar 
              filters={filters} setFilters={setFilters} 
              users={users} columns={columns} 
              onClear={() => setFilters(initialFilters)} 
            />
          </Box>
        )}
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          flexGrow: 1, 
          px: 4,
          pb: 2, 
          alignItems: 'flex-start' 
        }}>
          {filteredColumns.map((column) => (
            <Box key={column._id} sx={{ 
              minWidth: '320px', 
              bgcolor: '#f4f5f7', 
              borderRadius: '12px', 
              p: 2, 
              maxHeight: 'calc(100% - 20px)', 
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box display="flex" justifyContent="space-between" mb={2} sx={{ flexShrink: 0 }}>
                  <input 
                    defaultValue={column.title} 
                    onBlur={(e) => handleRenameColumn(column._id, e.target.value)} 
                    style={{ background: 'transparent', border: 'none', fontWeight: '700', outline: 'none', width: '70%' }}
                  />
                  {isAdmin && (
                    <IconButton size="small" onClick={() => { setColumnToDelete(column); setIsDeleteModalOpen(true); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
              </Box>

              <Droppable droppableId={column._id}>
                {(provided) => (
                  <Box 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    sx={{ flexGrow: 1, overflowY: 'visible', minHeight: '10px', pr: 0.5 }}
                  >
                    {column.items && column.items.length === 0 && (
                      <EmptyColumnState />
                    )}

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
                                mb: 1.5, 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                position: 'relative',
                                border: isSelected ? '2px solid #263238' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.3)' : undefined,
                                '&:hover .drag-handle': { opacity: 1 },
                                '&:hover .selection-checkbox': { opacity: 1 }
                              }}
                            >
                              <CardContent sx={{ p: '12px !important' }}>
                                <Checkbox 
                                  className="selection-checkbox"
                                  size="small"
                                  checked={isSelected}
                                  onClick={(e) => handleToggleSelect(e, task._id)}
                                  sx={{ position: 'absolute', right: 2, bottom: 2, opacity: isSelected ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10 }} 
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1, pr: 2 }}>
                                    {task.title}
                                  </Typography>
                                  
                                  {assigneeDetails && (
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: getAvatarColor(assigneeDetails._id, assigneeDetails.name) }}>
                                      {assigneeDetails.name?.trim().charAt(0).toUpperCase()}
                                    </Avatar>
                                  )}
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                  {task.priority && <Chip label={task.priority} size="small" sx={{ height: '20px', fontSize: '0.7rem', ...PRIORITY_STYLES[task.priority] }} />}
                                  {task.comments?.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mr: 3 }}>
                                      <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                                      <Typography variant="caption" fontWeight="600">{task.comments.length}</Typography>
                                    </Box>
                                  )}
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
              <Button fullWidth onClick={() => { setActiveColumn(column); setIsTicketModalOpen(true); }} sx={{ textTransform: 'none', mt: 1, flexShrink: 0 }}>+ Add task</Button>
            </Box>
          ))}
          <Box sx={{ minWidth: '320px', pt: 1 }}>
            <Button onClick={() => setIsColumnModalOpen(true)} sx={{ width: '100%', height: '48px', border: '1px dashed #ccc', textTransform: 'none' }}>+ Add column</Button>
          </Box>
        </Box>
      </DragDropContext>

      {!hasFilterResults && !isBoardCompletelyEmpty && !loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '60%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          textAlign: 'center', 
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <SearchOffIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>No tickets match your filters</Typography>
          <Button 
            onClick={() => setFilters(initialFilters)} 
            sx={{ mt: 1, textTransform: 'none', pointerEvents: 'auto', fontWeight: 600 }}
          >
            Clear all filters
          </Button>
        </Box>
      )}

      <Fade in={selectedTicketIds.length > 0}>
        <Paper elevation={6} sx={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', bgcolor: '#263238', color: 'white', px: 3, py: 1.5, borderRadius: '50px', display: 'flex', alignItems: 'center', gap: 3, zIndex: 1000 }}>
          <Typography variant="body2" fontWeight="700">{selectedTicketIds.length} tasks selected</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete} sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}>Bulk Delete</Button>
            <IconButton size="small" onClick={() => setSelectedTicketIds([])} sx={{ color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </Paper>
      </Fade>

      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onCreate={handleCreateTicket} columnTitle={activeColumn?.title} />
      <ColumnModal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} onCreate={handleAddColumn} />
      <EditTicketModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateTicket} ticket={selectedTicket} columns={columns} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteColumn} itemName={columnToDelete?.title} />
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BoardViewPage;