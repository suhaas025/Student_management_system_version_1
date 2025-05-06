import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import authService from '../../services/auth.service';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');
  const isModerator = currentUser?.roles?.includes('ROLE_MODERATOR');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };
  
  const navigateToDashboard = () => {
    console.log('Navigating to dashboard, current user:', currentUser);
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (isAdmin) {
      navigate('/admin');
    } else if (isModerator) {
      navigate('/moderator');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={navigateToDashboard}>
          Student Management System
        </Typography>

        {currentUser ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAdmin && (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin/activity-logs"
                  sx={{ mr: 2 }}
                >
                  Activity Logs
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin/menu-management"
                  sx={{ mr: 2 }}
                >
                  Menu Management
                </Button>
              </>
            )}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {currentUser.avatar ? (
                <Avatar src={currentUser.avatar} alt={currentUser.username} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 