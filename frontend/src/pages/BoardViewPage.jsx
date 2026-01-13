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

const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }
};

const BoardViewPage = () => {
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // Modals & Feedback State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const navigate = useNavigate();
  const { id } = useParams();

  // ADMIN-ONLY CHECK: Set to true for development; replace with Auth context later
  const isAdmin = true; 

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchBoardAndColumns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        };

        const boardRes = await fetch(`http://localhost:4000/api/boards/${id}`, { headers });
        const boardJson = await boardRes.json();
        if (boardJson.ok) setBoardTitle(boardJson.data.board.title);

        const colRes = await fetch(`http://localhost:4000/api/boards/${id}/columns`, { headers });
        if (!colRes.ok) throw new Error("Failed to fetch columns");
        
        const colData = await colRes.json();
        setColumns(colData); 

      } catch (error) {
        console.error("Error loading board data:", error);
      } finally {
        setLoading(false); 
      }
    };

    if (id) fetchBoardAndColumns();
  }, [id]);

  // --- ADMIN: ADD COLUMN ---
  const handleAddColumn = async () => {
    try {
      const title = prompt("Enter column title:");
      if (!title) return;

      const token = localStorage.getItem('token');
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
      }
    } catch (error) {
      console.error("Column creation failed:", error);
    }
  };

  // --- ADMIN: RENAME COLUMN ---
  const handleRenameColumn = async (columnId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setColumns(columns.map(col => col._id === columnId ? { ...col, title: newTitle } : col));
        setSnackbar({ open: true, message: 'Column renamed!', severity: 'success' });
      }
    } catch (error) {
      console.error("Rename failed:", error);
    }
  };

  // --- ADMIN: DELETE COLUMN ---
  const openDeleteConfirm = (column) => {
    setColumnToDelete(column);
    setIsDeleteModalOpen(true);
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
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // --- DRAG AND DROP LOGIC ---
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId: destination.droppableId, index: destination.index }),
      });
    } catch (err) {
      console.error("Sync failed:", err);
      window.location.reload(); 
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
        <Box display="flex" gap={3}>
          {[1, 2, 3].map((item) => <Skeleton key={item} variant="rectangular" width={320} height={500} sx={{ borderRadius: 3 }} />)}
        </Box>
      </Container>
    );
  }

  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 8, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box mb={4}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/boards')} sx={{ color: 'text.secondary', textTransform: 'none', mb: 1 }}>
          Back to Boards
        </Button>
        <Typography variant="h4" fontWeight="800">{boardTitle || "Untitled Board"}</Typography>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, height: '100%', alignItems: 'flex-start' }}>
          {columns.map((column) => (
            <Box key={column._id} sx={{ minWidth: '320px', maxWidth: '320px', bgcolor: '#f4f5f7', borderRadius: '12px', p: 2 }}>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                 {isAdmin ? (
                   <input
                     defaultValue={column.title}
                     onBlur={(e) => handleRenameColumn(column._id, e.target.value)}
                     style={{ background: 'transparent', border: 'none', fontWeight: '700', color: '#172b4d', fontSize: '1rem', width: '100%', outline: 'none', padding: '4px' }}
                   />
                 ) : (
                   <Typography fontWeight="700" sx={{ color: '#172b4d' }}>{column.title}</Typography>
                 )}
                 <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label={column.items?.length || 0} size="small" sx={{ bgcolor: '#ebecf0' }} />
                    {isAdmin && (
                      <IconButton size="small" onClick={() => openDeleteConfirm(column)}>
                        <DeleteIcon fontSize="small" sx={{ color: '#5e6c84' }} />
                      </IconButton>
                    )}
                 </Box>
              </Box>

              <Droppable droppableId={column._id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: '10px' }}>
                    {column.items?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                           <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ mb: 1.5, boxShadow: '0 1px 0 rgba(9,30,66,.25)', borderRadius: '8px' }}>
                             <CardContent sx={{ p: '12px !important' }}>
                               <Typography variant="body2" color="#172b4d">{task.title}</Typography>
                               {task.priority && <Chip label={task.priority} size="small" sx={{ mt: 1, height: '20px', fontSize: '0.7rem', ...PRIORITY_STYLES[task.priority] }} />}
                             </CardContent>
                           </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
              <Button fullWidth sx={{ justifyContent: 'flex-start', color: '#5e6c84', textTransform: 'none', mt: 1, '&:hover': { bgcolor: '#ebecf0' } }}>+ Add a task</Button>
            </Box>
          ))}

          {isAdmin && (
            <Box sx={{ minWidth: '320px' }}>
              <Button onClick={handleAddColumn} sx={{ width: '100%', height: '48px', bgcolor: 'rgba(255,255,255,0.24)', border: '1px dashed #ccc', color: '#172b4d', fontWeight: 600, textTransform: 'none' }}>+ Add another column</Button>
            </Box>
          )}
        </Box>
      </DragDropContext>

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteColumn} itemName={columnToDelete?.title} 
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '8px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );


export default BoardViewPage;