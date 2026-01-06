import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Container, 
  Skeleton, 
  Chip, 
  IconButton, 
  Stack 
} from '@mui/material';
// We use the library you just installed
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; 
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Added Back Icon
import { useNavigate, useParams } from 'react-router-dom';

// --- MOCK DATA (Restored from your GitHub) ---
const MOCK_DATA = [
  { 
    id: 'board-1', 
    title: 'Marketing Campaign', 
    status: 'Planning', 
    color: '#00b0ff',
    items: [
      { id: 'task-1', content: 'Draft social media copy', priority: 'High', due: '2 days' },
      { id: 'task-2', content: 'Select stock images', priority: 'Medium', due: '4 days' }
    ]
  },
  { 
    id: 'board-2', 
    title: 'Design System', 
    status: 'In Progress', 
    color: '#00c853',
    items: [
      { id: 'task-3', content: 'Update button components', priority: 'High', due: 'Today' },
      { id: 'task-4', content: 'Review typography scale', priority: 'Low', due: '1 week' },
      { id: 'task-5', content: 'Fix mobile responsiveness', priority: 'High', due: 'Tomorrow' }
    ]
  },
  { 
    id: 'board-3', 
    title: 'Done', 
    status: 'Active', 
    color: '#6200ea',
    items: [] 
  },
];

// --- PRIORITY COLOR MAP (Restored) ---
const PRIORITY_STYLES = {
  High: { color: '#d32f2f', bgcolor: '#ffebee' },    // Red
  Medium: { color: '#ed6c02', bgcolor: '#fff3e0' },  // Orange
  Low: { color: '#2e7d32', bgcolor: '#e8f5e9' }      // Green
};

const BoardViewPage = () => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams(); // Using the ID just to be safe

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setColumns(MOCK_DATA); 
      setLoading(false);
    }, 1000); 
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return; 

    const { source, destination } = result;

    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId);

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];

    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];

    const [removed] = sourceItems.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Same column move
      sourceItems.splice(destination.index, 0, removed);
      const newColumns = [...columns];
      newColumns[sourceColIndex] = { ...sourceCol, items: sourceItems };
      setColumns(newColumns);
    } else {
      // Different column move
      destItems.splice(destination.index, 0, removed);
      const newColumns = [...columns];
      newColumns[sourceColIndex] = { ...sourceCol, items: sourceItems };
      newColumns[destColIndex] = { ...destCol, items: destItems };
      setColumns(newColumns);
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
        <Box mb={4}><Skeleton variant="rectangular" width={200} height={40} /></Box>
        <Box display="flex" gap={3} overflow="hidden">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} variant="rectangular" width={320} height={400} sx={{ borderRadius: 3, flexShrink: 0 }} />
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 8, height: '85vh', display: 'flex', flexDirection: 'column' }}>

{/* --- HEADER WITH BACK BUTTON --- */}
      <Box mb={4}>
        {/* The Back Button sits above the title now */}
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/boards')}
          sx={{ 
            mb: 1,                 // Add space below the button
            color: 'text.secondary', 
            textTransform: 'none', 
            px: 0,                 // Remove extra padding on the left so it aligns perfectly
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
          }}
        >
          Back to Boards
        </Button>

        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-1px' }}>
          My Board ({id || 'Alpha'})
        </Typography>
      </Box>

      {/* --- BOARD COLUMNS --- */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 3, 
            overflowX: 'auto', 
            pb: 2, 
            height: '100%',
            alignItems: 'flex-start',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' },
          }}
        >
          {columns.map((column) => (
            <Box 
              key={column.id}
              sx={{ 
                minWidth: '320px', 
                maxWidth: '320px', 
                bgcolor: '#f4f5f7', 
                borderRadius: '12px', 
                p: 2,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight="bold" variant="subtitle1">{column.title}</Typography>
                  <Chip 
                    label={column.items.length} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold', bgcolor: 'rgba(0,0,0,0.08)' }} 
                  />
                </Box>
                <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
              </Box>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ 
                      flexGrow: 1, 
                      minHeight: '100px',
                      transition: 'background-color 0.2s ease',
                      bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
                      borderRadius: '8px'
                    }}
                  >
                    {column.items.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ 
                              mb: 2, 
                              borderRadius: '8px', 
                              boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.12)',
                              cursor: 'grab',
                              transition: 'transform 0.2s',
                              transform: snapshot.isDragging ? 'rotate(3deg)' : 'none',
                              '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }
                            }}
                          >
                            <CardContent sx={{ p: '16px !important' }}>
                              <Typography variant="body2" fontWeight="600" gutterBottom>
                                {task.content}
                              </Typography>

                              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                                <Chip 
                                  label={task.priority} 
                                  size="small" 
                                  sx={{ 
                                    height: '20px', 
                                    fontSize: '0.65rem', 
                                    fontWeight: 'bold',
                                    color: PRIORITY_STYLES[task.priority]?.color || 'grey',
                                    bgcolor: PRIORITY_STYLES[task.priority]?.bgcolor || '#f5f5f5'
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                  <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                  {task.due}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>

              <Button 
                startIcon={<AddIcon />} 
                fullWidth
                sx={{ 
                  justifyContent: 'flex-start', 
                  color: 'text.secondary', 
                  textTransform: 'none',
                  mt: 1,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: 'black' } 
                }}
              >
                Add a task
              </Button>
            </Box>
          ))}
          
          <Box sx={{ minWidth: '320px', flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                width: '100%',
                bgcolor: 'rgba(255,255,255,0.5)',
                color: 'black',
                border: '2px dashed #ccc',
                borderRadius: '12px',
                p: 2,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#fff', borderColor: 'black' }
              }}
            >
              Add New Column
            </Button>
          </Box>

        </Box>
      </DragDropContext>
    </Container>
  );
};

export default BoardViewPage;