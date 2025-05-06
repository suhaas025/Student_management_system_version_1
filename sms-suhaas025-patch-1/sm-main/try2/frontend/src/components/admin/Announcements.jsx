import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  AlertTitle,
  Snackbar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import announcementService from '../../services/announcement.service';
import { format } from 'date-fns';
import { 
  StyledPaper, 
  StyledTableCell, 
  StyledTableHead, 
  StyledButton, 
  StyledDialog,
  PageContainer,
  ContentContainer,
  AdminHeader
} from './styles.jsx';

// Improved date formatter that also returns ISO strings for comparison
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
};

// Add a function to check if a date is in the future
const isDateInFuture = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time components for consistent comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return compareDate > today;
  } catch (e) {
    console.error('Error comparing dates:', e);
    return false;
  }
};

// Convert Date to datetime-local input format
const toDateTimeLocalString = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // Format to YYYY-MM-DDThh:mm
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const Announcements = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState({
    id: null,
    title: '',
    message: '',
    targetRole: '',
    isUrgent: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    isActive: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    announcementId: null,
    title: ''
  });
  const [connectionStatus, setConnectionStatus] = useState({
    checked: false,
    connected: false,
    message: ''
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Load announcements on component mount
  useEffect(() => {
    checkBackendConnection().then(connected => {
      fetchAnnouncements();
    });
  }, []);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await announcementService.getAllAnnouncements();
      const announcements = response.data || [];
      setAnnouncements(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Try fallback if API fails
      try {
        console.log('Trying fallback for announcements...');
        const fallbackResponse = await announcementService.getAllAnnouncementsFallback();
        setAnnouncements(fallbackResponse.data || []);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setError('Failed to load announcements. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter announcements based on search query
  const getFilteredAnnouncements = () => {
    if (!searchQuery.trim()) return processAnnouncements(announcements);
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = announcements.filter(announcement => 
      announcement.title.toLowerCase().includes(lowercaseQuery) || 
      announcement.message.toLowerCase().includes(lowercaseQuery) ||
      announcement.targetRole?.toLowerCase().includes(lowercaseQuery)
    );
    
    return processAnnouncements(filtered);
  };

  // Add a separate function to process date logic for announcements
  const processAnnouncements = (anns) => {
    return anns.map(announcement => {
      const now = new Date();
      
      // Parse dates more robustly
      let startDate = null;
      try {
        if (announcement.startDate) {
          startDate = new Date(announcement.startDate);
        }
      } catch (err) {
        // Silent error handling
      }
      
      let endDate = null;
      try {
        if (announcement.endDate) {
          endDate = new Date(announcement.endDate);
        }
      } catch (err) {
        // Silent error handling
      }
      
      // Force date comparison with timestamps to avoid timezone issues
      const nowTime = now.getTime();
      const startTime = startDate ? startDate.getTime() : 0;
      const endTime = endDate ? endDate.getTime() : Number.MAX_SAFE_INTEGER;
      
      // Step 1: Check if it's scheduled (start date is in the future)
      const isScheduled = startDate && startTime > nowTime;
      
      // Step 2: Check if it's expired (end date is in the past)
      const isExpired = endDate && endTime < nowTime;
      
      // Step 3: Check if it's active (both by flag and by not being scheduled/expired)
      // First check if the active flag is set (could be stored as isActive or active)
      const activeFlag = Boolean(announcement.isActive || announcement.active);
      
      // An announcement is considered active if:
      // 1. It's not scheduled for the future
      // 2. It's not expired
      // 3. Its active flag is set to true
      const isActive = !isScheduled && !isExpired && activeFlag;
      
      return {
        ...announcement,
        isScheduled,
        isExpired,
        isActive
      };
    });
  };

  // Handle dialog open for create/edit
  const handleDialogOpen = (announcement = null) => {
    if (announcement) {
      setCurrentAnnouncement({
        ...announcement,
        startDate: announcement.startDate ? new Date(announcement.startDate) : new Date(),
        endDate: announcement.endDate ? new Date(announcement.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      setIsEditing(true);
    } else {
      setCurrentAnnouncement({
        id: null,
        title: '',
        message: '',
        targetRole: '',
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Map isActive → active and isUrgent → urgent when saving
    if (name === 'isActive') {
      setCurrentAnnouncement(prev => ({
        ...prev,
        isActive: checked,
        active: checked
      }));
      return;
    }
    
    if (name === 'isUrgent') {
      setCurrentAnnouncement(prev => ({
        ...prev,
        isUrgent: checked,
        urgent: checked
      }));
      return;
    }
    
    // Handle other inputs
    setCurrentAnnouncement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setCurrentAnnouncement(prev => ({
      ...prev,
      [name]: date instanceof Date ? date : new Date(date)
    }));
  };

  // Handle save announcement
  const handleSaveAnnouncement = async () => {
    // Validate required fields
    if (!currentAnnouncement.title.trim() || !currentAnnouncement.message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Make isUrgent a direct boolean value to ensure it's stored correctly
      const isUrgentValue = Boolean(currentAnnouncement.isUrgent);
      console.log("Setting announcement urgent status:", isUrgentValue);
      
      // Ensure both property names are set correctly (for compatibility)
      const announcementData = {
        ...currentAnnouncement,
        isUrgent: isUrgentValue,
        urgent: isUrgentValue, // Set both properties to the same value
        isActive: Boolean(currentAnnouncement.isActive || currentAnnouncement.active),
        active: Boolean(currentAnnouncement.isActive || currentAnnouncement.active)
      };
      
      console.log("Final announcement data:", announcementData);
      
      let response;
      if (isEditing) {
        // Update existing announcement
        try {
          response = await announcementService.updateAnnouncement(
            announcementData.id, 
            announcementData
          );
        } catch (error) {
          console.error('API update failed, trying fallback:', error);
          response = await announcementService.updateAnnouncementFallback(
            announcementData.id, 
            announcementData
          );
        }
        
        // Update announcements list with the response data
        setAnnouncements(prev => prev.map(a => 
          a.id === announcementData.id ? response.data : a
        ));
        
        setSnackbar({
          open: true,
          message: 'Announcement updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new announcement
        try {
          response = await announcementService.createAnnouncement(announcementData);
        } catch (error) {
          console.error('API create failed, trying fallback:', error);
          response = await announcementService.createAnnouncementFallback(announcementData);
        }
        
        // Log the response data to verify
        console.log("Created announcement response:", response.data);
        
        // Add new announcement to list
        setAnnouncements(prev => [...prev, response.data]);
        
        setSnackbar({
          open: true,
          message: 'Announcement created successfully!',
          severity: 'success'
        });
      }
      
      // Close dialog
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError('Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation dialog open
  const handleDeleteDialogOpen = (announcement) => {
    setDeleteDialog({
      open: true,
      announcementId: announcement.id,
      title: announcement.title
    });
  };

  // Handle delete confirmation dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialog({
      ...deleteDialog,
      open: false
    });
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Delete announcement
      try {
        await announcementService.deleteAnnouncement(deleteDialog.announcementId);
      } catch (error) {
        console.error('API delete failed, trying fallback:', error);
        await announcementService.deleteAnnouncementFallback(deleteDialog.announcementId);
      }
      
      // Remove from announcements list
      setAnnouncements(prev => prev.filter(a => a.id !== deleteDialog.announcementId));
      
      setSnackbar({
        open: true,
        message: 'Announcement deleted successfully!',
        severity: 'success'
      });
      
      // Close dialog
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Failed to delete announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Add a function to check connection near fetchAnnouncements
  const checkBackendConnection = async () => {
    try {
      const result = await announcementService.testBackendConnection();
      setConnectionStatus({
        checked: true,
        connected: result.connected,
        message: result.connected 
          ? 'Connected to backend successfully' 
          : 'Failed to connect to backend'
      });
      return result.connected;
    } catch (err) {
      setConnectionStatus({
        checked: true,
        connected: false,
        message: 'Error checking connection: ' + (err.message || 'Unknown error')
      });
      return false;
    }
  };

  // Update filteredAnnouncements definition
  const filteredAnnouncements = getFilteredAnnouncements();
  
  return (
    <PageContainer>
      <AdminHeader 
        onProfileClick={() => setProfileMenuOpen(!profileMenuOpen)}
      />
      <ContentContainer>
        <StyledPaper elevation={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Announcement Management
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                label="Search Announcements"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ 
                  flexGrow: 1,
                  maxWidth: '500px',
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3f8cff',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                }}
              />
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleDialogOpen()}
                disabled={loading}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  fontWeight: 'bold',
                  color: '#fff',
                  px: 3,
                  py: 1
                }}
              >
                NEW ANNOUNCEMENT
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : getFilteredAnnouncements().length > 0 ? (
              <TableContainer component={Box} sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                <Table stickyHeader>
                  <StyledTableHead>
                    <TableRow>
                      <StyledTableCell>Title</StyledTableCell>
                      <StyledTableCell>Target Role</StyledTableCell>
                      <StyledTableCell>Start Date</StyledTableCell>
                      <StyledTableCell>End Date</StyledTableCell>
                      <StyledTableCell>Status</StyledTableCell>
                      <StyledTableCell>Created By</StyledTableCell>
                      <StyledTableCell>Created At</StyledTableCell>
                      <StyledTableCell>Updated By</StyledTableCell>
                      <StyledTableCell>Updated At</StyledTableCell>
                      <StyledTableCell align="right">Actions</StyledTableCell>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {filteredAnnouncements.length === 0 ? (
                      <TableRow>
                        <StyledTableCell colSpan={6} align="center">
                          <Typography variant="body1" sx={{ py: 2 }}>
                            No announcements found matching your search.
                          </Typography>
                        </StyledTableCell>
                      </TableRow>
                    ) : (
                      filteredAnnouncements.map((announcement) => (
                        <TableRow key={announcement.id}
                          sx={{ 
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
                            }
                          }}
                        >
                          <StyledTableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {announcement.isUrgent && (
                                <Tooltip title="Urgent">
                                  <NotificationsIcon color="error" sx={{ mr: 1 }} />
                                </Tooltip>
                              )}
                              <Typography variant="body1" fontWeight={announcement.isUrgent ? 'bold' : 'normal'}>
                                {announcement.title}
                              </Typography>
                            </Box>
                          </StyledTableCell>
                          <StyledTableCell>{announcement.targetRole || 'All Roles'}</StyledTableCell>
                          <StyledTableCell>{formatDate(announcement.startDate)}</StyledTableCell>
                          <StyledTableCell>{formatDate(announcement.endDate)}</StyledTableCell>
                          <StyledTableCell>
                            {announcement.isScheduled ? (
                              <Chip 
                                icon={<CalendarTodayIcon />} 
                                label="Scheduled" 
                                color="info" 
                                size="small"
                                sx={{ 
                                  color: '#fff',
                                  bgcolor: 'rgba(33, 150, 243, 0.2)',
                                  '& .MuiChip-icon': { color: '#90caf9' }
                                }}
                              />
                            ) : announcement.isExpired ? (
                              <Chip 
                                label="Expired" 
                                color="error" 
                                size="small"
                                sx={{ 
                                  color: '#fff',
                                  bgcolor: 'rgba(244, 67, 54, 0.2)',
                                  borderColor: 'rgba(244, 67, 54, 0.5)'
                                }}
                              />
                            ) : announcement.isActive ? (
                              <Chip 
                                icon={<CheckCircleIcon />} 
                                label="Active" 
                                color="success" 
                                size="small"
                                sx={{ 
                                  color: '#fff',
                                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                                  '& .MuiChip-icon': { color: '#81c784' }
                                }}
                              />
                            ) : (
                              <Chip 
                                label="Inactive" 
                                color="default" 
                                size="small" 
                                sx={{ 
                                  color: '#fff', 
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                                }}
                              />
                            )}
                          </StyledTableCell>
                          <StyledTableCell>{announcement.createdByUsername || announcement.createdById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(announcement.createdAt)}</StyledTableCell>
                          <StyledTableCell>{announcement.updatedByUsername || announcement.updatedById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(announcement.updatedAt)}</StyledTableCell>
                          <StyledTableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleDialogOpen(announcement)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteDialogOpen(announcement)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </StyledTableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="#fff">
                  No announcements found. Create a new announcement to get started.
                </Typography>
              </Box>
            )}
          </Box>
        </StyledPaper>
      </ContentContainer>

      {/* Create/Edit Dialog */}
      <StyledDialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  name="title"
                  value={currentAnnouncement.title}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!currentAnnouncement.title}
                  helperText={!currentAnnouncement.title ? 'Title is required' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Message"
                  name="message"
                  value={currentAnnouncement.message}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  error={!currentAnnouncement.message}
                  helperText={!currentAnnouncement.message ? 'Message is required' : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Role (Optional)</InputLabel>
                  <Select
                    name="targetRole"
                    value={currentAnnouncement.targetRole || ''}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="student">Students</MenuItem>
                    <MenuItem value="teacher">Teachers</MenuItem>
                    <MenuItem value="admin">Admins</MenuItem>
                    <MenuItem value="moderator">Moderators</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentAnnouncement.isUrgent)}
                      onChange={(e) => {
                        setCurrentAnnouncement(prev => ({
                          ...prev,
                          isUrgent: e.target.checked,
                          urgent: e.target.checked
                        }));
                      }}
                      color="error"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#f44336'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(244, 67, 54, 0.5)'
                        }
                      }}
                    />
                  }
                  label="Mark as Urgent"
                  sx={{ 
                    color: '#fff',
                    '& .MuiFormControlLabel-label': { 
                      color: '#fff' 
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="datetime-local"
                  value={currentAnnouncement.startDate instanceof Date 
                    ? toDateTimeLocalString(currentAnnouncement.startDate) 
                    : toDateTimeLocalString(new Date())}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date"
                  type="datetime-local"
                  value={currentAnnouncement.endDate instanceof Date 
                    ? toDateTimeLocalString(currentAnnouncement.endDate) 
                    : toDateTimeLocalString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentAnnouncement.active || currentAnnouncement.isActive)}
                      onChange={(e) => {
                        setCurrentAnnouncement(prev => ({
                          ...prev,
                          active: e.target.checked,
                          isActive: e.target.checked
                        }));
                      }}
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#3f51b5'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(63, 81, 181, 0.5)'
                        }
                      }}
                    />
                  }
                  label="Active"
                  sx={{ 
                    color: '#fff',
                    '& .MuiFormControlLabel-label': { 
                      color: '#fff' 
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <StyledButton onClick={handleSaveAnnouncement} disabled={!currentAnnouncement.title || !currentAnnouncement.message}>
            {isEditing ? 'Update' : 'Create'}
          </StyledButton>
        </DialogActions>
      </StyledDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the announcement "{deleteDialog.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteAnnouncement} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default Announcements; 