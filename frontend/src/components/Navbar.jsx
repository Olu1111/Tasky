import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Tasky
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate('/boards')}>Boards</Button>
          <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}