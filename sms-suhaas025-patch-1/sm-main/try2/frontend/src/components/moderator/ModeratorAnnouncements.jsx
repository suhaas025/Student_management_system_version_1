import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
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
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as UrgentIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import announcementService from '../../services/announcement.service';
import authService from '../../services/auth.service';

// Utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "Not specified";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
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

const ModeratorAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAnnouncement, setCurrentAnnouncement] = useState({
    id: null,
    title: '',
    message: '',
    targetRole: 'ROLE_USER', // Moderators can only target students
    isUrgent: false,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week from now
    isActive: true
  });

  useEffect(() => {
    loadData();
    
    // Check API availability
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      const isAvailable = await announcementService.checkApiAvailability();
      if (!isAvailable) {
        setSuccess('Announcement system is running in offline mode. Changes will be saved locally.');
      }
    } catch (error) {
      console.error('Error checking API availability:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // Load announcements from backend
      console.log("Loading announcements from backend for moderator");
      const response = await announcementService.getAllAnnouncements();
      
      // Filter to show announcements:
      // 1. Created by the current user
      // 2. Targeting their exact role (e.g., ROLE_MODERATOR)
      // 3. Targeting teacher/moderator roles if the user is a teacher
      // 4. Targeting all users (empty targetRole)
      let filteredAnnouncements = response.data;
      if (user) {
        const isTeacher = user.roles.includes('ROLE_MODERATOR');
        
        filteredAnnouncements = response.data.filter(announcement => 
          // Announcements created by this user
          announcement.createdById === user.id || 
          // Announcements targeting this user's role specifically
          announcement.targetRole === user.roles[0] ||
          // Announcements for teachers/moderators
          (isTeacher && (
            announcement.targetRole === 'ROLE_MODERATOR' || 
            announcement.targetRole === 'ROLE_TEACHER' || 
            announcement.targetRole === 'TEACHER'
          )) ||
          // Announcements for all users
          announcement.targetRole === ''
        );
      }
      
      console.log("Filtered announcements for moderator:", filteredAnnouncements.length);
      setAnnouncements(filteredAnnouncements || []);
    } catch (error) {
      console.error('Error loading announcements from backend:', error);
      setError('Failed to load announcements from the server. Please try again later.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setCurrentAnnouncement({
        ...announcement,
        startDate: announcement.startDate ? new Date(announcement.startDate) : new Date(),
        endDate: announcement.endDate ? new Date(announcement.endDate) : new Date(new Date().setDate(new Date().getDate() + 7))
      });
      setIsEditing(true);
    } else {
      setCurrentAnnouncement({
        id: null,
        title: '',
        message: '',
        targetRole: 'ROLE_USER', // Moderators can only target students
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        isActive: true
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setCurrentAnnouncement(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (field, dateStr) => {
    setCurrentAnnouncement(prev => ({
      ...prev,
      [field]: new Date(dateStr)
    }));
  };

  const handleSaveAnnouncement = async () => {
    // Validate required fields
    if (!currentAnnouncement.title.trim() || !currentAnnouncement.message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare announcement data for backend
      const announcementData = {
        ...currentAnnouncement,
        targetRole: 'ROLE_USER', // Moderators can only target students
        isUrgent: Boolean(currentAnnouncement.isUrgent),
        isActive: Boolean(currentAnnouncement.isActive),
        createdById: currentUser?.id,
        createdByUsername: currentUser?.username || 'Moderator'
      };
      
      console.log("Creating announcement to send to backend:", announcementData);
      
      let response;
      let usedFallback = false;
      
      try {
        if (isEditing) {
          // Try to update existing announcement in backend
          response = await announcementService.updateAnnouncement(
            announcementData.id, 
            announcementData
          );
        } else {
          // Try to create new announcement in backend
          response = await announcementService.createAnnouncement(announcementData);
        }
        console.log("Announcement operation successful:", response.data);
      } catch (apiError) {
        console.error("API error, using fallback storage:", apiError);
        // If API fails, use fallback method
        if (isEditing) {
          response = await announcementService.updateAnnouncementFallback(
            announcementData.id, 
            announcementData
          );
        } else {
          response = await announcementService.createAnnouncementFallback(announcementData);
        }
        usedFallback = true;
        console.log("Fallback storage successful:", response.data);
      }
      
      // Update announcements list immediately
      if (isEditing) {
        setAnnouncements(prev => prev.map(a => 
          a.id === announcementData.id ? response.data : a
        ));
        setSuccess(usedFallback 
          ? 'Announcement updated in local storage (offline mode)' 
          : 'Announcement updated successfully!');
      } else {
        setAnnouncements(prev => [...prev, response.data]);
        setSuccess(usedFallback 
          ? 'Announcement created in local storage (offline mode)' 
          : 'Announcement created successfully!');
      }
      
      handleCloseDialog();
      
      // Force a complete reload of announcements to ensure accuracy
      // Use a small delay to allow the success message to be seen
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError(error.message || 'Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canEditAnnouncement = (announcement) => {
    // Moderators can only edit their own announcements
    return announcement.createdById === currentUser?.id;
  };

  if (loading && announcements.length === 0) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 4, backgroundColor: 'rgba(26, 32, 39, 0.95)', color: '#fff', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>Announcements Management</Typography>
        <Typography variant="body1">
          Create and manage announcements for students. You can set announcements as urgent and specify start and end dates.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          sx={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          Refresh Announcements
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Announcement
        </Button>
      </Box>

      {announcements.length > 0 ? (
        <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(26, 32, 39, 0.95)', color: '#fff' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Title</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Message</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Target</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Date Range</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {announcement.isUrgent && (
                        <UrgentIcon sx={{ mr: 1, color: '#f44336' }} />
                      )}
                      {announcement.title}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {announcement.message.length > 50
                      ? `${announcement.message.substring(0, 50)}...`
                      : announcement.message}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Chip 
                      label={announcement.targetRole || 'All Users'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Chip 
                      label={(announcement.isActive || announcement.active) ? 'Active' : 'Inactive'} 
                      color={(announcement.isActive || announcement.active) ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        backgroundColor: (announcement.isActive || announcement.active) ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                        color: '#fff'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                      <span>
                        <CalendarIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                        From: {formatDate(announcement.startDate)}
                      </span>
                      <span>
                        <CalendarIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                        To: {formatDate(announcement.endDate)}
                      </span>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {canEditAnnouncement(announcement) ? (
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(announcement)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(announcement)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">No announcements found.</Alert>
      )}

      {/* Announcement Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 32, 39, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {isEditing 
            ? (canEditAnnouncement(currentAnnouncement) ? 'Edit Announcement' : 'View Announcement') 
            : 'Create Announcement'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            {isEditing && !canEditAnnouncement(currentAnnouncement)
              ? 'View the announcement details below.'
              : 'Fill in the details to create or edit an announcement.'}
          </DialogContentText>

          <TextField
            margin="normal"
            required
            fullWidth
            label="Title"
            name="title"
            value={currentAnnouncement.title}
            onChange={handleInputChange}
            disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ 
              sx: { 
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3f8cff'
                }
              } 
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Message"
            name="message"
            multiline
            rows={4}
            value={currentAnnouncement.message}
            onChange={handleInputChange}
            disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
            InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{ 
              sx: { 
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3f8cff'
                }
              } 
            }}
          />

          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Target Role</InputLabel>
              <Select
                name="targetRole"
                value={currentAnnouncement.targetRole}
                onChange={handleInputChange}
                label="Target Role"
                inputProps={{ readOnly: true }}
                sx={{ 
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3f8cff'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(26, 32, 39, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: '#fff',
                        '&:hover': {
                          bgcolor: 'rgba(63, 140, 255, 0.1)'
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(63, 140, 255, 0.2)',
                          color: '#fff'
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem 
                  value="ROLE_USER"
                  sx={{
                    color: '#fff',
                    fontWeight: 500,
                    padding: '10px 16px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box 
                    component="span" 
                    sx={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#4caf50',
                      mr: 1
                    }}
                  />
                  Students Only
                </MenuItem>
              </Select>
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  ml: 1.5, 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    mr: 0.5, 
                    fontSize: '0.9rem',
                    lineHeight: 1
                  }}
                >
                  ℹ️
                </Box>
                As a moderator, you can only target students with announcements
              </Typography>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentAnnouncement.isUrgent}
                    onChange={handleInputChange}
                    name="isUrgent"
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#f44336',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#f44336',
                      }
                    }}
                    disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
                  />
                }
                label="Mark as Urgent"
                sx={{ color: '#fff' }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={currentAnnouncement.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="success"
                    disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
                  />
                }
                label="Active"
                sx={{ color: '#fff' }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Start Date"
              type="datetime-local"
              value={toDateTimeLocalString(currentAnnouncement.startDate)}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              InputLabelProps={{ 
                shrink: true,
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
              fullWidth
              disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
              InputProps={{ 
                sx: { 
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3f8cff'
                  }
                } 
              }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={toDateTimeLocalString(currentAnnouncement.endDate)}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              InputLabelProps={{ 
                shrink: true,
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
              fullWidth
              disabled={isEditing && !canEditAnnouncement(currentAnnouncement)}
              InputProps={{ 
                sx: { 
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3f8cff'
                  }
                } 
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cancel</Button>
          {(!isEditing || canEditAnnouncement(currentAnnouncement)) && (
            <Button 
              onClick={handleSaveAnnouncement}
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModeratorAnnouncements; 