<<<<<<< Updated upstream
import { Box, Typography } from '@mui/material';
=======
import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Container, 
  Skeleton, Chip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
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
>>>>>>> Stashed changes

export default function BoardViewPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Kanban Board View</Typography>
      <Typography>Columns and drag-and-drop will go here.</Typography>
    </Box>
  );
}