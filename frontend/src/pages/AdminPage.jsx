import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, MenuItem, Select, Alert, CircularProgress, Tabs, Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole.jsx';
import { apiClient } from '../utils/apiClient';

const AdminPage = () => {
  const { getRole } = useRole();
  const navigate = useNavigate();
  
  // Check if admin
  useEffect(() => {
    if (getRole() !== 'admin') {
      navigate('/boards');
    }
  }, [getRole, navigate]);

  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedUserForBoard, setSelectedUserForBoard] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users');
      if (response?.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch boards
  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/boards');
      if (response?.ok) {
        const data = await response.json();
        setBoards(data.data.boards);
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchUsers();
    } else {
      fetchBoards();
    }
  }, [tabValue]);

  // Update user role
  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      const response = await apiClient.put(`/users/${selectedUser._id}/role`, { role: newRole });
      if (response?.ok) {
        const data = await response.json();
        setUsers(users.map(u => u._id === selectedUser._id ? data.data.user : u));
        setEditDialog(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  // Assign user to board
  const handleAssignBoard = async () => {
    if (!selectedBoard || !selectedUserForBoard) return;
    
    try {
      const response = await apiClient.post(`/boards/${selectedBoard._id}/members/${selectedUserForBoard}`);
      if (response?.ok) {
        const data = await response.json();
        setBoards(boards.map(b => b._id === selectedBoard._id ? data.data.board : b));
        setAssignDialog(false);
        setSelectedBoard(null);
        setSelectedUserForBoard('');
      }
    } catch (err) {
      console.error('Failed to assign board member:', err);
    }
  };

  // Remove user from board
  const handleRemoveBoardMember = async (boardId, userId) => {
    try {
      const response = await apiClient.delete(`/boards/${boardId}/members/${userId}`);
      if (response?.ok) {
        const data = await response.json();
        setBoards(boards.map(b => b._id === boardId ? data.data.board : b));
      }
    } catch (err) {
      console.error('Failed to remove board member:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <AdminPanelSettingsIcon sx={{ fontSize: 40, color: '#263238' }} />
        <Typography variant="h4" fontWeight="bold">
          Admin Dashboard
        </Typography>
      </Box>

      <Paper elevation={3}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="User Management" />
          <Tab label="Board Assignment" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>All Users</Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user._id} hover>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box sx={{ 
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            bgcolor: user.role === 'admin' ? '#ff5252' : user.role === 'member' ? '#42a5f5' : '#78909c',
                            color: 'white',
                            borderRadius: 1,
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {user.role.toUpperCase()}
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setEditDialog(true);
                            }}
                            variant="outlined"
                          >
                            Edit Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Assign Users to Boards</Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Board Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Owner</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Members</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {boards.map(board => (
                      <TableRow key={board._id} hover>
                        <TableCell>{board.title}</TableCell>
                        <TableCell>{board.owner?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {board.members && board.members.map(member => (
                              <Box 
                                key={member._id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  px: 1,
                                  py: 0.5,
                                  bgcolor: '#e3f2fd',
                                  borderRadius: 1,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {member.name}
                                <DeleteIcon
                                  sx={{ 
                                    fontSize: '1rem', 
                                    cursor: 'pointer',
                                    '&:hover': { color: 'red' }
                                  }}
                                  onClick={() => handleRemoveBoardMember(board._id, member._id)}
                                />
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedBoard(board);
                              setSelectedUserForBoard('');
                              setAssignDialog(true);
                            }}
                            variant="outlined"
                          >
                            Add Member
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Edit Role Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedUser?.name} ({selectedUser?.email})
          </Typography>
          <Select
            fullWidth
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            sx={{ mt: 1 }}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" sx={{ bgcolor: '#263238' }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Board Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Board</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Board: {selectedBoard?.title}
          </Typography>
          <Select
            fullWidth
            value={selectedUserForBoard}
            onChange={(e) => setSelectedUserForBoard(e.target.value)}
            sx={{ mt: 1 }}
          >
            <MenuItem value="">Select User</MenuItem>
            {users.map(user => (
              <MenuItem key={user._id} value={user._id}>
                {user.name} ({user.email})
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignBoard} variant="contained" sx={{ bgcolor: '#263238' }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
