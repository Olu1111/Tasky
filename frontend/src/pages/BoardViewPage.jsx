import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Container, 
  Skeleton, Chip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import { useNavigate, useParams } from 'react-router-dom';

const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }
};

const BoardViewPage = () => {
  const [columns, setColumns] = useState([]);
  const [boardTitle, setBoardTitle] = useState(""); // Dynamic Title
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  // --- FETCH DYNAMIC DATA  ---
  useEffect(() => {
    const fetchBoardAndColumns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        };

        // Fetch Board Details (Title)
        const boardRes = await fetch(`http://localhost:4000/api/boards/${id}`, { headers });
        const boardJson = await boardRes.json();
        if (boardJson.ok) setBoardTitle(boardJson.data.board.title);

        // Fetch Columns with nested Tickets
        const colRes = await fetch(`http://localhost:4000/api/boards/${id}/columns`, { headers });
        if (!colRes.ok) throw new Error("Failed to fetch columns");
        
        const colData = await colRes.json();
        setColumns(colData); // The combinedData array from controller

      } catch (error) {
        console.error("Error loading board data:", error);
      } finally {
        setLoading(false); 
      }
    };

    if (id) fetchBoardAndColumns();
  }, [id]);

  // --- ADD NEW COLUMN ---
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

      if (!response.ok) throw new Error('Failed to add column');
      const result = await response.json();
      
      // Add the new column to state with an empty items array
      setColumns([...columns, { ...result.data.column, items: [] }]);

} catch (error) {
  console.error("Column creation failed:", error); // Uses the 'error' variable
  alert("Error adding column.");
}
  };

  // --- DRAG AND DROP ---
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
        body: JSON.stringify({
          columnId: destination.droppableId,
          index: destination.index
        }),
      });
} catch (err) {
  console.error("Movement sync failed:", err); // Uses the 'err' variable
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

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 8, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box mb={4}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/boards')} sx={{ color: 'text.secondary', textTransform: 'none', mb: 1 }}>
          Back to Boards
        </Button>
        <Typography variant="h4" fontWeight="800">
          {boardTitle || "Untitled Board"}
        </Typography>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, height: '100%', alignItems: 'flex-start' }}>
          
          {columns.map((column) => (
            <Box key={column._id} sx={{ minWidth: '320px', maxWidth: '320px', bgcolor: '#f4f5f7', borderRadius: '12px', p: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                 <Typography fontWeight="700" sx={{ color: '#172b4d' }}>{column.title}</Typography>
                 <Chip label={column.items?.length || 0} size="small" sx={{ bgcolor: '#ebecf0' }} />
              </Box>

              <Droppable droppableId={column._id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: '10px' }}>
                    {column.items?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                           <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                             sx={{ mb: 1.5, boxShadow: '0 1px 0 rgba(9,30,66,.25)', borderRadius: '8px' }}>
                             <CardContent sx={{ p: '12px !important' }}>
                               <Typography variant="body2" color="#172b4d">{task.title}</Typography>
                               {task.priority && (
                                 <Chip label={task.priority} size="small" sx={{ mt: 1, height: '20px', fontSize: '0.7rem', ...PRIORITY_STYLES[task.priority] }} />
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

              <Button fullWidth sx={{ justifyContent: 'flex-start', color: '#5e6c84', textTransform: 'none', mt: 1, '&:hover': { bgcolor: '#ebecf0' } }}>
                 + Add a task
              </Button>
            </Box>
          ))}

          <Box sx={{ minWidth: '320px' }}>
            <Button 
              onClick={handleAddColumn}
              sx={{ width: '100%', height: '48px', bgcolor: 'rgba(255,255,255,0.24)', border: '1px dashed #ccc', color: '#172b4d', fontWeight: 600, textTransform: 'none' }}
            >
              + Add another column
            </Button>
          </Box>
        </Box>
      </DragDropContext>
    </Container>
  );
};

export default BoardViewPage;