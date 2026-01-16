import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Container, 
  Skeleton, Chip, IconButton, Snackbar, Alert 
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import { useNavigate, useParams } from 'react-router-dom';

import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TicketModal from '../components/TicketModal'; 
import EditTicketModal from '../components/EditTicketModal'; 
import ColumnModal from '../components/ColumnModal';
import FilterBar from '../components/FilterBar';

const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }
};

const BoardViewPage = () => {
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); 
  
  const initialFilters = { search: '', assignees: [], statuses: [], priorities: [] };
  const [filters, setFilters] = useState(initialFilters);

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

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true); 
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [boardRes, colRes, userRes] = await Promise.all([
        fetch(`http://localhost:4000/api/boards/${id}`, { headers }),
        fetch(`http://localhost:4000/api/boards/${id}/columns`, { headers }),
        fetch(`http://localhost:4000/api/users`, { headers })
      ]);

      const boardJson = await boardRes.json();
      if (boardJson.ok) setBoardTitle(boardJson.data.board.title);
      if (colRes.ok) setColumns(await colRes.json());
      
      if (userRes.ok) {
        const userJson = await userRes.json();
        setUsers(userJson.data?.users || []);
      }
    } catch (error) { 
      console.error("Load error:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  // Handlers for Board Actions
  const handleUpdateTicket = async (ticketId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) { fetchData(true); setSnackbar({ open: true, message: 'Updated!', severity: 'success' }); }
    } catch (err) { console.error(err); }
  };

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/tickets/${draggableId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ columnId: destination.droppableId, index: destination.index }),
      });
      fetchData(true);
    } catch (err) { console.error(err); }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...ticketData, boardId: id, columnId: activeColumn._id }),
      });
      fetchData(true); setIsTicketModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleAddColumn = async (title) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/boards/${id}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title }),
      });
      fetchData(true); setIsColumnModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleRenameColumn = async (colId, title) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/columns/${colId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title }),
      });
      fetchData(true);
    } catch (err) { console.error(err); }
  };

  const handleDeleteColumn = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/columns/${columnToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsDeleteModalOpen(false); fetchData(true);
    } catch (err) { console.error(err); }
  };

  if (loading && columns.length === 0) return (
    <Container sx={{ mt: 4 }}><Skeleton variant="rectangular" height={400} /></Container>
  );

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 8, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/boards')}>Back</Button>
        <Typography variant="h4" fontWeight="800">{boardTitle || "Untitled Board"}</Typography>
      </Box>

      {!loading && columns.length > 0 && (
        <FilterBar 
          filters={filters} setFilters={setFilters} 
          users={users} columns={columns} 
          onClear={() => setFilters(initialFilters)} 
        />
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, height: '100%', alignItems: 'flex-start' }}>
          {columns.map((column) => (
            <Box key={column._id} sx={{ minWidth: '320px', bgcolor: '#f4f5f7', borderRadius: '12px', p: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
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
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: '10px' }}>
                    {column.items?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                            onClick={() => { setSelectedTicket(task); setIsEditModalOpen(true); }}
                            sx={{ mb: 1.5, borderRadius: '8px', cursor: 'pointer' }}>
                            <CardContent sx={{ p: '12px !important' }}>
                              <Typography variant="body2">{task.title}</Typography>
                              {task.priority && <Chip label={task.priority} size="small" sx={{ mt: 1, ...PRIORITY_STYLES[task.priority] }} />}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
              <Button fullWidth onClick={() => { setActiveColumn(column); setIsTicketModalOpen(true); }}>+ Add task</Button>
            </Box>
          ))}
          <Box sx={{ minWidth: '320px' }}>
            <Button onClick={() => setIsColumnModalOpen(true)} sx={{ width: '100%', height: '48px', border: '1px dashed #ccc', textTransform: 'none' }}>+ Add column</Button>
          </Box>
        </Box>
      </DragDropContext>

      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onCreate={handleCreateTicket} columnTitle={activeColumn?.title} />
      <ColumnModal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} onCreate={handleAddColumn} />
      <EditTicketModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateTicket} ticket={selectedTicket} columns={columns} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteColumn} itemName={columnToDelete?.title} />
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default BoardViewPage;