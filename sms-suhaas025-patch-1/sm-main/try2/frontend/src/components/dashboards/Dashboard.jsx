import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardActionArea,
  Avatar,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import authService from '../../services/auth.service';
import dashboardService from '../../services/dashboard.service';

// Import Dashboards
import StudentDashboard from './student/StudentDashboard';
import ModeratorDashboard from './moderator/ModeratorDashboard';
import AdminDashboard from './admin/AdminDashboard';
import DynamicDashboard from './DynamicDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [useDynamicDashboard, setUseDynamicDashboard] = useState(false);
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // Check if dynamic dashboard should be used
      try {
        // Check if any menu items exist
        const response = await dashboardService.getComponentsForRoles();
        
        if (response.data && response.data.length > 0) {
          console.log('Menu items found. Using dynamic dashboard.');
          setUseDynamicDashboard(true);
        } else {
          console.log('No menu items found.');
          // If user is admin, suggest populating default menu items
          if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
            setMessage({
              severity: 'info',
              text: 'No menu items found. You can populate default menu items in the Menu Management section or create custom ones.'
            });
            // Default to the static dashboard for admins
            setUseDynamicDashboard(false);
          } else {
            setMessage({
              severity: 'warning',
              text: 'No menu items are configured. Please contact an administrator to set up the menu system.'
            });
            // For non-admins, still try to use the dynamic dashboard as it has a message for this case
            setUseDynamicDashboard(true);
          }
        }
      } catch (err) {
        console.error('Error checking menu items:', err);
        // On error, default to static dashboard
        setUseDynamicDashboard(false);
      }
      
      setLoading(false);
    };
    
    initializeDashboard();
  }, []);

  const handlePopulateMenus = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.populateDefaultMenuItems();
      
      if (result.success) {
        if (result.data && result.data.length > 0) {
          setMessage({
            severity: 'success',
            text: `Successfully created ${result.data.length} default menu items.`
          });
          setUseDynamicDashboard(true);
        } else {
          setMessage({
            severity: 'info',
            text: result.message
          });
        }
      } else {
        setMessage({
          severity: 'error',
          text: `Failed to populate menu items: ${result.message}`
        });
      }
    } catch (err) {
      console.error('Error populating default menu items:', err);
      setMessage({
        severity: 'error',
        text: 'An error occurred while creating default menu items.'
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');
  const isModerator = currentUser?.roles?.includes('ROLE_MODERATOR');
  const isStudent = currentUser?.roles?.includes('ROLE_USER') || currentUser?.roles?.includes('ROLE_STUDENT');

  const FeatureCard = ({ title, icon: Icon, color, onClick }) => (
    <Card 
      sx={{ 
        width: '250px',
        height: '200px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        }
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: color, 
            width: 80, 
            height: 80,
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" component="div" align="center">
          {title}
        </Typography>
      </CardActionArea>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If dynamic dashboard is enabled, use it for all user types
  if (useDynamicDashboard) {
    return <DynamicDashboard />;
  }
  
  // Otherwise fall back to role-specific dashboards
  if (isStudent) {
    return <StudentDashboard />;
  }
  
  if (isModerator) {
    return <ModeratorDashboard />;
  }
  
  if (isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {message && (
          <Alert severity={message.severity} sx={{ mb: 3 }}>
            {message.text}
            {isAdmin && message.severity !== 'success' && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<MenuIcon />} 
                  onClick={handlePopulateMenus}
                  sx={{ mr: 2 }}
                >
                  Populate Default Menus
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => navigate('/admin/menu-management')}
                >
                  Go to Menu Management
                </Button>
              </Box>
            )}
          </Alert>
        )}
        <AdminDashboard />
      </Container>
    );
  }

  // Fallback for users with no specific role
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom>
          Welcome, {currentUser?.username}!
        </Typography>
        
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Your Role: {currentUser?.roles ? (
            Array.isArray(currentUser.roles) 
              ? (currentUser.roles[0]?.replace?.('ROLE_', '') || currentUser.roles[0])
              : (typeof currentUser.roles === 'string' 
                  ? currentUser.roles.replace('ROLE_', '') 
                  : JSON.stringify(currentUser.roles))
          ) : 'User'}
        </Typography>

        {message && (
          <Alert severity={message.severity} sx={{ my: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Features
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FeatureCard
              title="Profile"
              icon={PeopleIcon}
              color="#1976d2"
              onClick={() => navigate('/profile')}
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard; 