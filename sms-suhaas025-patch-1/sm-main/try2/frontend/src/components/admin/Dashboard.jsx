import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  Avatar,
  CardContent,
  CardActions,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CssBaseline
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import BarChartIcon from '@mui/icons-material/BarChart';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import authService from '../../services/auth.service';

// Add debugging logs
// console.log('Loading NEW Admin Dashboard component from /components/admin/Dashboard.jsx');

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1200,
  background: 'rgba(26, 32, 39, 0.95)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  height: 64,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    borderColor: '#3f8cff',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  '& .MuiTypography-root': {
    color: '#fff',
  },
  '& .MuiTypography-body2': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  backgroundColor: alpha(color, 0.15),
  color: color,
  width: 60,
  height: 60,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '& svg': {
    fontSize: 32,
  },
}));

// Move FeatureCard outside Dashboard to avoid recreation on every render
const FeatureCard = ({ title, description, icon, path, color, theme }) => {
  return (
    <StyledCard>
      <CardActionArea component={Link} to={path} sx={{ height: '100%' }}>
        <StyledCardContent>
          <IconWrapper color={color}>
            {icon}
          </IconWrapper>
          <Typography 
            variant="h5" 
            component="div" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              minHeight: '3em',
            }}
          >
            {description}
          </Typography>
        </StyledCardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            size="small" 
            color="primary" 
            sx={{ 
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.5px',
            }}
          >
            Open
          </Button>
        </CardActions>
      </CardActionArea>
    </StyledCard>
  );
};

const Dashboard = () => {
  // console.log('Rendering NEW Admin Dashboard component');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remove log
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleProfileMenuOpen = (event) => {
    console.log('Profile menu clicked');
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    authService.logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <StyledAppBar>
        <Toolbar sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3 }}>
          {/* Left side - Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/admin')}>
            <DashboardIcon sx={{ color: '#3f8cff', fontSize: 32 }} />
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, letterSpacing: '0.5px' }}>
              Admin Portal
            </Typography>
          </Box>
          {/* Right side - Profile Icon and Auth Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              size="large"
              edge="end"
              aria-label="account"
              aria-haspopup="true"
              sx={{ color: '#fff', ml: 1 }}
            >
              <AccountCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  background: 'rgba(26, 32, 39, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonIcon sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
            <Button
              color="secondary"
              variant="outlined"
              sx={{ ml: 2, color: '#fff', borderColor: '#fff' }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </StyledAppBar>
      {/* Toolbar placeholder to push content below AppBar */}
      <Toolbar />
      {/* Main content - ensure no fixed/absolute positioning */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="white">Loading...</Typography>
        </Box>
      ) : (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          px: 2,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          minHeight: 'calc(100vh - 64px)',
          position: 'relative', // Ensure normal flow
          zIndex: 1 // Lower than AppBar
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              background: 'rgba(26, 32, 39, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    color: '#fff',
                    mb: 1,
                  }}
                >
                  Admin Dashboard
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    maxWidth: '600px',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Welcome to the admin dashboard. Manage users, courses, grades, and more from this centralized interface.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  color="primary"
                  variant="outlined"
                  sx={{ color: '#fff', borderColor: '#fff', height: 'fit-content' }}
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Button>
                <Button
                  color="secondary"
                  variant="outlined"
                  sx={{ color: '#fff', borderColor: '#fff', height: 'fit-content' }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="User Management" 
                  description="Create, edit, and manage user accounts and permissions."
                  icon={<PersonIcon />}
                  path="/admin/users"
                  color="#3f8cff"
                  theme={theme}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Course Management" 
                  description="Create and manage courses, assignments, and materials."
                  icon={<MenuBookIcon />}
                  path="/admin/courses"
                  color="#00C49F"
                  theme={theme}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Grade Management" 
                  description="View and manage grades for all students."
                  icon={<GradeIcon />}
                  path="/admin/grades"
                  color="#4caf50"
                  theme={theme}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Reports & Analytics" 
                  description="Generate reports and view analytics on student performance."
                  icon={<BarChartIcon />}
                  path="/admin/reports"
                  color="#00c6ff"
                  theme={theme}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Enrollment Management" 
                  description="Approve, reject, and manage student course enrollments."
                  icon={<SchoolIcon />}
                  path="/admin/enrollments"
                  color="#FFBB28"
                  theme={theme}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Announcements" 
                  description="Create and manage system-wide announcements and notifications."
                  icon={<AnnouncementIcon />}
                  path="/admin/announcements"
                  color="#ff4081"
                  theme={theme}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Menu Management" 
                  description="Control menu visibility and access for different roles."
                  icon={<ListAltIcon />} 
                  path="/admin/menu-management"
                  color="#9c27b0"
                  theme={theme}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Department Management" 
                  description="Manage academic departments and their details."
                  icon={<BusinessIcon />}
                  path="/admin/departments"
                  color="#00bcd4"
                  theme={theme}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Account Management" 
                  description="Manage account status, block/unblock accounts, and control account expiration."
                  icon={<SettingsIcon />}
                  path="/admin/account-management"
                  color="#ff9800"
                  theme={theme}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="Activity Logs" 
                  description="View and audit user and system activity logs."
                  icon={<ListAltIcon />}
                  path="/admin/activity-logs"
                  color="#b388ff"
                  theme={theme}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard 
                  title="DB Connection Pooling" 
                  description="Demonstrate and monitor the database connection pool in real time." 
                  icon={<span role="img" aria-label="connection-pool">🔗</span>} 
                  path="/admin/db-connection-pooling" 
                  color="#607d8b" 
                  theme={theme}
                />
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
      )}
    </Box>
  );
};

export default Dashboard; 