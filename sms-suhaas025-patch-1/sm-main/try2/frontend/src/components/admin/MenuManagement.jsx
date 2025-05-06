import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Badge,
  Fade,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Menu as MenuIcon,
  DriveFileRenameOutline as RenameIcon,
  AutoAwesome as AutoAwesomeIcon,
  SwapVert as SwapVertIcon,
  Search as SearchIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import dashboardService from '../../services/dashboard.service';
import userService from '../../services/user.service';

const MenuManagement = () => {
  // State variables
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [roles, setRoles] = useState([]);
  const [currentComponent, setCurrentComponent] = useState({
    title: '',
    description: '',
    icon: '',
    displayOrder: 0,
    visible: true,
    allowedRoles: [],
    frontendRoute: '',
    backendEndpoint: '',
    componentType: 'MENU_ITEM',
    configJson: '',
    parentId: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const theme = useTheme();

  // Fetch dashboard components and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch components
        let componentsData = [];
        try {
          const componentsResponse = await dashboardService.getAllComponents();
          componentsData = componentsResponse.data || [];
        } catch (err) {
          console.error('Error fetching dashboard components:', err);
          // Continue with other fetches, but record the error
          setError('Failed to load menu components. You can still add new items, but existing ones may not show.');
        }
        
        setComponents(componentsData);
        
        // Fetch roles separately to handle potential failures
        try {
          const rolesResponse = await userService.getRoles();
          // Parse roles from the response
          const fetchedRoles = rolesResponse.data || [];
          // Ensure roles have 'ROLE_' prefix
          const formattedRoles = fetchedRoles.map(role => 
            role.startsWith('ROLE_') ? role : `ROLE_${role}`
          );
          setRoles(formattedRoles);
        } catch (err) {
          console.error('Error fetching roles:', err);
          // Set default roles if fetch fails
          setRoles(['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER']);
        }
      } catch (err) {
        console.error('Error in main fetch operation:', err);
        setError('Failed to load menu components. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load all components
  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getAllComponents();
      setComponents(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading components:', err);
      setError('Failed to load menu components');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for creating/editing
  const handleOpenDialog = (component = null) => {
    if (component) {
      // Edit existing component
      setCurrentComponent({
        ...component,
        // Ensure allowedRoles is an array
        allowedRoles: Array.isArray(component.allowedRoles) 
          ? component.allowedRoles 
          : (component.allowedRoles ? [component.allowedRoles] : [])
      });
      setIsEditing(true);
    } else {
      // Create new component
      setCurrentComponent({
        title: '',
        description: '',
        icon: '',
        displayOrder: components.length + 1, // Set to last position by default
        visible: true,
        allowedRoles: [],
        frontendRoute: '',
        backendEndpoint: '',
        componentType: 'MENU_ITEM',
        configJson: '',
        parentId: null
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'visible') {
      setCurrentComponent({ ...currentComponent, [name]: checked });
    } else if (name === 'allowedRoles') {
      setCurrentComponent({ ...currentComponent, [name]: value });
    } else {
      setCurrentComponent({ ...currentComponent, [name]: value });
    }
  };

  // Save component
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare data for API
      const componentData = {
        ...currentComponent,
        // Convert configJson to string if it's an object
        configJson: typeof currentComponent.configJson === 'object'
          ? JSON.stringify(currentComponent.configJson)
          : currentComponent.configJson || '{}',
        // Also make sure other JSON fields are strings
        themeJson: typeof currentComponent.themeJson === 'object'
          ? JSON.stringify(currentComponent.themeJson)
          : currentComponent.themeJson || '{}',
        permissionsJson: typeof currentComponent.permissionsJson === 'object'
          ? JSON.stringify(currentComponent.permissionsJson)
          : currentComponent.permissionsJson || '{}',
        translationsJson: typeof currentComponent.translationsJson === 'object'
          ? JSON.stringify(currentComponent.translationsJson)
          : currentComponent.translationsJson || '{}'
      };
      
      if (isEditing) {
        // Update existing component
        await dashboardService.updateComponent(currentComponent.id, componentData);
      } else {
        // Create new component
        await dashboardService.createComponent(componentData);
      }
      
      handleCloseDialog();
      loadComponents();
    } catch (err) {
      console.error('Error saving component:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} menu component.`);
    } finally {
      setLoading(false);
    }
  };

  // Delete component
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        setLoading(true);
        await dashboardService.deleteComponent(id);
        loadComponents();
      } catch (err) {
        console.error('Error deleting component:', err);
        setError('Failed to delete menu component');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle visibility
  const handleToggleVisibility = async (component) => {
    try {
      setLoading(true);
      const updatedComponent = {
        ...component,
        visible: !component.visible
      };
      await dashboardService.updateComponent(component.id, updatedComponent);
      loadComponents();
    } catch (err) {
      console.error('Error toggling visibility:', err);
      setError('Failed to update menu visibility');
    } finally {
      setLoading(false);
    }
  };

  // Move component up or down in order
  const handleReorder = async (id, direction) => {
    try {
      setLoading(true);
      
      // Find the component and its current position
      const index = components.findIndex(comp => comp.id === id);
      if (index === -1) return;
      
      // Calculate new position
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Validate new position
      if (newIndex < 0 || newIndex >= components.length) {
        setLoading(false);
        return;
      }
      
      // Swap display orders
      const updatedComponents = [...components];
      const temp = updatedComponents[index].displayOrder;
      updatedComponents[index].displayOrder = updatedComponents[newIndex].displayOrder;
      updatedComponents[newIndex].displayOrder = temp;
      
      // Prepare order data for API - just send array of IDs in the desired order
      const orderData = updatedComponents.map(comp => comp.id);
      
      await dashboardService.reorderComponents(orderData);
      loadComponents();
    } catch (err) {
      console.error('Error reordering components:', err);
      setError('Failed to reorder menu items');
    } finally {
      setLoading(false);
    }
  };

  // Handle populating default menu items
  const handlePopulateDefaults = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.populateDefaultMenuItems();
      
      if (result.success) {
        setError(null);
        if (result.data && result.data.length > 0) {
          alert(`Successfully created ${result.data.length} default menu items.`);
        } else {
          alert(result.message);
        }
        loadComponents();
      } else {
        setError(`Failed to populate default menu items: ${result.message}`);
      }
    } catch (err) {
      console.error('Error populating default menu items:', err);
      setError('Failed to populate default menu items. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter components based on search query and role filter
  const getFilteredComponents = () => {
    return components.filter(component => {
      // Search query filter
      const matchesSearch = 
        component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.frontendRoute.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = 
        filterRole === 'all' ||
        (component.allowedRoles && 
         Array.isArray(component.allowedRoles) && 
         component.allowedRoles.includes(filterRole));
      
      return matchesSearch && matchesRole;
    });
  };

  // Get role statistics
  const getRoleStats = () => {
    const stats = {};
    components.forEach(component => {
      if (component.allowedRoles && Array.isArray(component.allowedRoles)) {
        component.allowedRoles.forEach(role => {
          if (!stats[role]) {
            stats[role] = 0;
          }
          stats[role]++;
        });
      }
    });
    return stats;
  };
  
  // Render components table
  const renderComponentsTable = () => {
    const filteredComponents = getFilteredComponents();
    
    return (
      <TableContainer 
        component={Card} 
        elevation={2} 
        sx={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          background: '#101A2B',
          '& .MuiTableCell-head': {
            background: '#153060',
            color: '#fff',
            fontWeight: 'bold',
            borderBottom: '2px solid #223A6A'
          },
          '& .MuiTableCell-root': {
            color: '#fff',
          },
          '& .MuiTypography-root': {
            color: '#fff',
          },
          '& .MuiChip-root': {
            color: '#fff',
          },
        }}
      >
        <Table sx={{ minWidth: 950 }}>
          <TableHead>
            <TableRow>
              <TableCell width="5%">ID</TableCell>
              <TableCell width="20%">Title & Description</TableCell>
              <TableCell width="15%">Route</TableCell>
              <TableCell width="20%">Roles</TableCell>
              <TableCell width="10%">Display Order</TableCell>
              <TableCell width="10%">Status</TableCell>
              <TableCell width="20%" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No menu items found matching your filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredComponents.map((component) => (
                <Zoom in={true} key={component.id} style={{ transitionDelay: '100ms' }}>
                  <TableRow 
                    hover
                    sx={{ 
                      backgroundColor: component.visible ? 'inherit' : alpha(theme.palette.action.hover, 0.15),
                      '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.25) }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">{component.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: component.visible ? theme.palette.primary.main : theme.palette.grey[500],
                            width: 36, 
                            height: 36 
                          }}
                        >
                          {component.icon ? (
                            React.createElement(
                              IconMap[component.icon] || MenuIcon
                            )
                          ) : (
                            <MenuIcon />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{component.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {component.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', color: '#fff' }}>
                        {component.frontendRoute}
                      </Typography>
                      {component.backendEndpoint && (
                        <Typography variant="caption" sx={{ display: 'block', color: '#fff' }}>
                          API: {component.backendEndpoint}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(component.allowedRoles) ? (
                          component.allowedRoles.map((role) => (
                            <Chip 
                              key={role} 
                              label={role.replace('ROLE_', '')} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ fontSize: '0.7rem', color: '#fff', borderColor: '#fff', background: '#153060' }} 
                            />
                          ))
                        ) : (
                          <Chip 
                            label={component.allowedRoles?.toString().replace('ROLE_', '') || 'None'} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ color: '#fff', borderColor: '#fff', background: '#153060' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {component.displayOrder || 0}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleReorder(component.id, 'up')}
                            sx={{ p: 0.5 }}
                            color="primary"
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleReorder(component.id, 'down')}
                            sx={{ p: 0.5 }}
                            color="primary"
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={component.visible ? "Visible" : "Hidden"} 
                        color={component.visible ? "success" : "default"}
                        size="small" 
                        sx={{ fontWeight: 'medium', color: '#fff' }}
                        icon={component.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Toggle Visibility">
                          <IconButton 
                            size="small"
                            color={component.visible ? "success" : "default"} 
                            onClick={() => handleToggleVisibility(component)}
                            sx={{ 
                              backgroundColor: component.visible ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                              '&:hover': {
                                backgroundColor: component.visible ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.grey[500], 0.2)
                              }
                            }}
                          >
                            {component.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Menu Item">
                          <IconButton 
                            size="small"
                            color="primary" 
                            onClick={() => handleOpenDialog(component)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2)
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Menu Item">
                          <IconButton 
                            size="small"
                            color="error" 
                            onClick={() => handleDelete(component.id)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.2)
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </Zoom>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Map for icon components
  const IconMap = {
    'Person': GroupIcon,
    'Menu': MenuIcon,
    'Edit': RenameIcon,
    'Add': AddIcon,
    'Visibility': VisibilityIcon,
    'VisibilityOff': VisibilityOffIcon,
    // Add more icon mappings as needed
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, backgroundColor: '#101A2B', minHeight: '100vh', p: 0, color: '#fff' }}>
      <Fade in={true} timeout={800}>
        <Card 
          elevation={6} 
          sx={{ 
            borderRadius: 3, 
            overflow: 'hidden',
            background: '#101A2B',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45)'
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MenuIcon color="primary" fontSize="large" />
                <Typography variant="h4" component="h1" fontWeight="500" sx={{ color: '#fff' }}>
                  Menu Management
                </Typography>
              </Box>
            }
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handlePopulateDefaults}
                  disabled={loading}
                  sx={{ fontWeight: 'bold', borderColor: theme.palette.primary.main, color: theme.palette.primary.light, background: theme.palette.background.default, '&:hover': { background: theme.palette.primary.dark, color: theme.palette.primary.contrastText } }}
                >
                  Populate Defaults
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  disabled={loading}
                  sx={{ 
                    fontWeight: 'bold',
                    boxShadow: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 60%, ${theme.palette.primary.dark} 100%)`,
                    color: theme.palette.primary.contrastText
                  }}
                >
                  Add Menu Item
                </Button>
              </Box>
            }
            sx={{ pb: 0, background: '#153060', color: '#fff' }}
          />
          
          <CardContent sx={{ pt: 1, background: '#101A2B', color: '#fff' }}>
            <Typography variant="body1" paragraph sx={{ color: '#fff' }}>
              Manage the menu items displayed in your application. Control visibility, order, and role-based access.
            </Typography>
            
            {/* Stats and Filters Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={5}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    background: '#17213A',
                    borderRadius: 2,
                    borderColor: theme.palette.primary.dark,
                    color: '#fff',
                    boxShadow: 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, background: '#101A2B', borderRadius: 1 }}>
                    <TextField
                      placeholder="Search menu items..."
                      size="small"
                      fullWidth
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: theme.palette.primary.light, mr: 1 }} />,
                        style: { color: '#fff', background: '#101A2B' }
                      }}
                      sx={{ background: '#101A2B', borderRadius: 1, input: { color: '#fff' }, color: '#fff' }}
                    />
                  </Box>
                  {/* Role Filter Chips */}
                  <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, background: '#17213A' }}>
                    <Chip 
                      label={`All (${components.length})`}
                      sx={{
                        color: '#fff',
                        background: filterRole === 'all' ? '#153060' : '#223A6A',
                        fontWeight: filterRole === 'all' ? 'bold' : 'normal',
                        boxShadow: filterRole === 'all' ? 2 : 0
                      }}
                      onClick={() => setFilterRole('all')}
                    />
                    {Object.keys(getRoleStats()).map(role => (
                      <Chip 
                        key={role}
                        label={`${role.replace('ROLE_', '')} (${getRoleStats()[role]})`}
                        sx={{
                          color: '#fff',
                          background: filterRole === role ? '#153060' : '#223A6A',
                          fontWeight: filterRole === role ? 'bold' : 'normal',
                          boxShadow: filterRole === role ? 2 : 0
                        }}
                        onClick={() => setFilterRole(role)}
                      />
                    ))}
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ background: '#153060', p: 2, borderRadius: 2, color: '#fff' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff' }}>Total Items</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: '#fff' }}>
                        {components.length}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ background: '#1B3B4B', p: 2, borderRadius: 2, color: '#fff' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff' }}>Visible</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: '#fff' }}>
                        {components.filter(c => c.visible).length}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ background: '#4B2C1B', p: 2, borderRadius: 2, color: '#fff' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff' }}>Hidden</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: '#fff' }}>
                        {components.filter(c => !c.visible).length}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ background: '#15304B', p: 2, borderRadius: 2, color: '#fff' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff' }}>Roles</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: '#fff' }}>
                        {Object.keys(getRoleStats()).length}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2, background: theme.palette.error.dark, color: '#fff' }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              components.length > 0 ? (
                renderComponentsTable()
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2, background: '#17213A', color: '#fff' }}>
                  No menu items found. Click "Add Menu Item" to create your first menu item.
                </Alert>
              )
            )}
          </CardContent>
        </Card>
      </Fade>
      
      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          elevation: 24,
          sx: { borderRadius: 2, background: '#17213A', color: '#fff' }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.dark, 
          color: '#fff',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? <EditIcon /> : <AddIcon />}
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="title"
                label="Title"
                value={currentComponent.title}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="icon"
                label="Icon Name"
                value={currentComponent.icon}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                helperText="MUI icon name, e.g. 'Dashboard' for DashboardIcon"
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={currentComponent.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="frontendRoute"
                label="Frontend Route"
                value={currentComponent.frontendRoute}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                helperText="e.g. /admin/users"
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="backendEndpoint"
                label="Backend Endpoint"
                value={currentComponent.backendEndpoint}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                helperText="e.g. /api/users (optional)"
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" sx={{ background: '#101A2B', borderRadius: 1, color: '#fff' }}>
                <InputLabel id="componentType-label" sx={{ color: '#fff' }}>Component Type</InputLabel>
                <Select
                  labelId="componentType-label"
                  name="componentType"
                  value={currentComponent.componentType}
                  onChange={handleInputChange}
                  label="Component Type"
                  sx={{ color: '#fff' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { background: '#17213A', color: '#fff' }
                    }
                  }}
                >
                  <MenuItem value="MENU_ITEM" sx={{ color: '#fff', background: '#17213A' }}>Menu Item</MenuItem>
                  <MenuItem value="DASHBOARD_WIDGET" sx={{ color: '#fff', background: '#17213A' }}>Dashboard Widget</MenuItem>
                  <MenuItem value="NESTED_MENU" sx={{ color: '#fff', background: '#17213A' }}>Nested Menu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="displayOrder"
                label="Display Order"
                type="number"
                value={currentComponent.displayOrder}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" sx={{ background: '#101A2B', borderRadius: 1, color: '#fff' }}>
                <InputLabel id="roles-label" sx={{ color: '#fff' }}>Allowed Roles</InputLabel>
                <Select
                  labelId="roles-label"
                  name="allowedRoles"
                  multiple
                  value={currentComponent.allowedRoles}
                  onChange={handleInputChange}
                  label="Allowed Roles"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('ROLE_', '')} sx={{ background: '#153060', color: '#fff', borderColor: '#fff' }} />
                      ))}
                    </Box>
                  )}
                  sx={{ color: '#fff' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { background: '#17213A', color: '#fff' }
                    }
                  }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role} sx={{ color: '#fff', background: '#17213A' }}>
                      {role.replace('ROLE_', '')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="configJson"
                label="Configuration (JSON)"
                value={typeof currentComponent.configJson === 'object' 
                  ? JSON.stringify(currentComponent.configJson, null, 2) 
                  : currentComponent.configJson || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                helperText="Optional JSON configuration for advanced features"
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#fff' }
                }}
                sx={{ input: { color: '#fff' }, background: '#101A2B', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: currentComponent.visible 
                    ? theme.palette.success.dark
                    : theme.palette.warning.dark,
                  borderColor: currentComponent.visible 
                    ? theme.palette.success.main 
                    : theme.palette.warning.main,
                  color: '#fff'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ color: '#fff' }}
                >
                  Item Visibility
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentComponent.visible}
                      onChange={handleInputChange}
                      name="visible"
                      color="primary"
                    />
                  }
                  label={currentComponent.visible ? "Visible" : "Hidden"}
                />
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            variant="outlined"
            sx={{ px: 3, borderColor: '#fff', color: '#fff', background: '#101A2B', '&:hover': { background: '#153060', color: '#fff' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={!currentComponent.title || !currentComponent.frontendRoute}
            sx={{ 
              px: 4,
              boxShadow: 3,
              background: `linear-gradient(90deg, #1976d2 60%, #153060 100%)`,
              color: '#fff'
            }}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement; 