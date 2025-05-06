import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/dashboard.service';
import eventBus from '../../utils/eventBus';
import * as MuiIcons from '@mui/icons-material';
import authService from '../../services/auth.service';

// Dynamic icon renderer
const DynamicIcon = ({ iconName, ...props }) => {
  if (!iconName) return null;
  
  // Convert iconName to the actual component name (e.g., 'dashboard' to 'Dashboard')
  const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  
  // Get the icon component from MUI Icons
  const IconComponent = MuiIcons[`${formattedIconName}Icon`] || MuiIcons.CircleIcon;
  
  return <IconComponent {...props} />;
};

const DynamicDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Create a memoized fetchMenuItems function
  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch menu items for the user's roles
      const response = await dashboardService.getComponentsForRoles();
      
      if (response.data && response.data.length > 0) {
        // Filter only visible items first
        const visibleItems = response.data.filter(item => item.visible === true);
        
        // Sort filtered items by display order
        const sortedItems = [...visibleItems].sort((a, b) => a.displayOrder - b.displayOrder);
        setMenuItems(sortedItems);
      } else {
        // If no menu items exist, try to populate default ones (only if admin)
        if (currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN')) {
          console.log('No menu items found and user is admin. Attempting to create defaults...');
          try {
            await dashboardService.populateDefaultMenuItems();
            // After populating, fetch the menu items again
            const newResponse = await dashboardService.getComponentsForRoles();
            if (newResponse.data && newResponse.data.length > 0) {
              // Filter only visible items first
              const visibleItems = newResponse.data.filter(item => item.visible === true);
              // Sort filtered items by display order
              const sortedItems = [...visibleItems].sort((a, b) => a.displayOrder - b.displayOrder);
              setMenuItems(sortedItems);
            }
          } catch (err) {
            console.error('Error populating default menu items:', err);
          }
        } else {
          console.log('No menu items found. Ask an administrator to set up the menu system.');
          setError('No menu items are available. Please contact an administrator to set up the menu system.');
        }
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load dashboard items. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  // Initial load
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);
  
  // Listen for menu item changes
  useEffect(() => {
    // Subscribe to menu-items-changed events
    const unsubscribe = eventBus.on('menu-items-changed', (data) => {
      console.log('Menu items changed, refreshing menu...', data);
      fetchMenuItems();
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [fetchMenuItems]);

  // Get the user's roles for display
  const getRoleDisplay = () => {
    if (!currentUser?.roles) return 'User';
    
    return Array.isArray(currentUser.roles)
      ? currentUser.roles.map(role => role.replace('ROLE_', '')).join(', ')
      : currentUser.roles.replace('ROLE_', '');
  };

  // Handle menu item click
  const handleMenuItemClick = (route) => {
    navigate(route);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.username || 'User'}!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Role: {getRoleDisplay()}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {menuItems.length === 0 && !loading && !error ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No menu items are available for your role.
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Dashboard Menu
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List component="nav">
                  {menuItems.map((item) => (
                    <ListItem 
                      button 
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.frontendRoute)}
                      sx={{ 
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <DynamicIcon iconName={item.icon} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        secondary={item.description} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" paragraph>
                  Select an option from the menu to get started.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This dashboard is dynamically generated based on your role and permissions.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default DynamicDashboard; 