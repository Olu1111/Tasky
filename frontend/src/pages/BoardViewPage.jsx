import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Container, 
  Skeleton, Chip, IconButton, Snackbar, Alert 
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import { useNavigate, useParams } from 'react-router-dom';

// Custom Components
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TicketModal from '../components/TicketModal'; 
import ColumnModal from '../components/ColumnModal';

const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }
};

const BoardViewPage = () => {
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false); 
  const [activeColumn, setActiveColumn] = useState(null); 
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Feedback State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const navigate = useNavigate();
  const { id } = useParams();

  // Requirement: Admin status logic
  const isAdmin = true; 

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchBoardAndColumns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Board Details
        const boardRes = await fetch(`http://localhost:4000/api/boards/${id}`, { headers });
        const boardJson = await boardRes.json();
        if (boardJson.ok) setBoardTitle(boardJson.data.board.title);

        // Fetch Columns and their nested Tickets
        const colRes = await fetch(`http://localhost:4000/api/boards/${id}/columns`, { headers });
        if (colRes.ok) {
          const colData = await colRes.json();
          setColumns(colData); 
        }
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setLoading(false); 
      }
    };
    if (id) fetchBoardAndColumns();
  }, [id]);

  // --- 2. TICKET ACTIONS ---
  const handleCreateTicket = async (ticketData) => {
  try {
    const token = localStorage.getItem('token');
    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      boardId: id,         
      columnId: activeColumn._id, 
      assignee: ticketData.assigneeId 
    };

    const response = await fetch(`http://localhost:4000/api/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (json.ok) {
      // Update UI state with the returned ticket
      setColumns(columns.map(col => 
        col._id === activeColumn._id 
          ? { ...col, items: [...(col.items || []), json.data.ticket] } 
          : col
      ));
      setSnackbar({ open: true, message: 'Task added!', severity: 'success' });
      setIsTicketModalOpen(false);
    } else {
      console.error("Server validation failed:", json.error);
    }
  } catch (error) { 
    console.error("Ticket creation error:", error); 
  }
};
  // --- 3. COLUMN ACTIONS ---
const handleAddColumn = async (title) => {
  try {
    const token = localStorage.getItem('token');
    //'id' (from useParams) is being passed correctly here
    const response = await fetch(`http://localhost:4000/api/boards/${id}/columns`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ title }),
    });

    if (response.ok) {
      const result = await response.json();
      setColumns([...columns, { ...result.data.column, items: [] }]);
      setSnackbar({ open: true, message: 'Column added!', severity: 'success' });
    } else {
      console.error("Column save failed on server");
    }
  } catch (error) { 
    console.error("Network error saving column:", error); 
  }
};

  const handleDeleteColumn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/columns/${columnToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setColumns(columns.filter(col => col._id !== columnToDelete._id));
        setIsDeleteModalOpen(false);
        setSnackbar({ open: true, message: 'Column deleted!', severity: 'success' });
      }
    } catch (error) { console.error("Delete error:", error); }
  };

  const handleRenameColumn = async (columnId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle }),
      });
      if (response.ok) {
        setColumns(columns.map(col => col._id === columnId ? { ...col, title: newTitle } : col));
      }
    } catch (error) { console.error("Rename error:", error); }
  };

  // --- 4. DRAG AND DROP ---
  const onDragEnd = async (result) => {
    if (!result.destination) return; 
    const { source, destination } = result;
    const sourceColIndex = columns.findIndex(col => col._id === source.droppableId);
    const destColIndex = columns.findIndex(col => col._id === destination.droppableId);
    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];
    const sourceItems = [...(sourceCol.items || [])];
    const destItems = [...(destCol.items || [])];
    const [removed] = sourceItems.splice(source.index, 1);

    let updatedColumns = [...columns];
    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, removed);
      updatedColumns[sourceColIndex] = { ...sourceCol, items: sourceItems };
    } else {
      destItems.splice(destination.index, 0, removed);
      updatedColumns[sourceColIndex] = { ...sourceCol, items: sourceItems };
      updatedColumns[destColIndex] = { ...destCol, items: destItems };
    }
    setColumns(updatedColumns);

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/tickets/${removed._id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ columnId: destination.droppableId, index: destination.index }),
      });
    } catch { window.location.reload(); }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
        <Box display="flex" gap={3}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} variant="rectangular" width={320} height={500} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 8, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box mb={4}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/boards')} 
          sx={{ color: 'text.secondary', textTransform: 'none', mb: 1 }}
        >
          Back to Boards
        </Button>
        <Typography variant="h4" fontWeight="800">{boardTitle || "Untitled Board"}</Typography>
      </Box>

      {/* Kanban Board Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, height: '100%', alignItems: 'flex-start' }}>
          {columns.map((column) => (
            <Box 
              key={column._id} 
              sx={{ minWidth: '320px', maxWidth: '320px', bgcolor: '#f4f5f7', borderRadius: '12px', p: 2 }}
            >
              {/* Column Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                 <input
                   defaultValue={column.title}
                   onBlur={(e) => handleRenameColumn(column._id, e.target.value)}
                   readOnly={!isAdmin}
                   style={{ 
                     background: 'transparent', 
                     border: 'none', 
                     fontWeight: '700', 
                     color: '#172b4d', 
                     fontSize: '1rem', 
                     width: '100%', 
                     outline: 'none', 
                     padding: '4px' 
                   }}
                 />
                 <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label={column.items?.length || 0} size="small" sx={{ bgcolor: '#ebecf0' }} />
                    {isAdmin && (
                      <IconButton 
                        size="small" 
                        onClick={() => { setColumnToDelete(column); setIsDeleteModalOpen(true); }}
                      >
                        <DeleteIcon fontSize="small" sx={{ color: '#5e6c84' }} />
                      </IconButton>
                    )}
                 </Box>
              </Box>

              {/* Droppable Area for Tickets */}
              <Droppable droppableId={column._id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: '10px' }}>
                    {column.items?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                           <Card 
                             ref={provided.innerRef} 
                             {...provided.draggableProps} 
                             {...provided.dragHandleProps} 
                             sx={{ mb: 1.5, boxShadow: '0 1px 0 rgba(9,30,66,.25)', borderRadius: '8px' }}
                           >
                             <CardContent sx={{ p: '12px !important' }}>
                               <Typography variant="body2" color="#172b4d">{task.title}</Typography>
                               {task.priority && (
                                 <Chip 
                                   label={task.priority} 
                                   size="small" 
                                   sx={{ mt: 1, height: '20px', fontSize: '0.7rem', ...PRIORITY_STYLES[task.priority] }} 
                                 />
                               )}
                             </CardContent>
                           </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
              {/* Add Task Button */}
              <Button 
                fullWidth 
                onClick={() => { setActiveColumn(column); setIsTicketModalOpen(true); }}
                sx={{ 
                  justifyContent: 'flex-start', 
                  color: '#5e6c84', 
                  textTransform: 'none', 
                  mt: 1, 
                  '&:hover': { bgcolor: '#ebecf0' } 
                }}
              >
                  + Add a task
              </Button>
            </Box>
          ))}

          {/* Add Column Button (Admin Only) */}
          {isAdmin && (
            <Box sx={{ minWidth: '320px' }}>
              <Button 
                onClick={() => setIsColumnModalOpen(true)}
                sx={{ 
                  width: '100%', 
                  height: '48px', 
                  bgcolor: 'rgba(255,255,255,0.24)', 
                  border: '1px dashed #ccc', 
                  color: '#172b4d', 
                  fontWeight: 600, 
                  textTransform: 'none' 
                }}
              >
                + Add another column
              </Button>
            </Box>
          )}
        </Box>
      </DragDropContext>

      {/* --- MODALS --- */}
      <ColumnModal 
        isOpen={isColumnModalOpen} 
        onClose={() => setIsColumnModalOpen(false)} 
        onCreate={handleAddColumn} 
      />

      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        onCreate={handleCreateTicket} 
        columnTitle={activeColumn?.title} 
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteColumn} 
        itemName={columnToDelete?.title} 
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BoardViewPage;