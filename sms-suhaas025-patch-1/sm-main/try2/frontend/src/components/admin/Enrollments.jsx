import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Tooltip,
  Checkbox,
  Toolbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BlockIcon from '@mui/icons-material/Block';
import enrollmentService from '../../services/enrollment.service';
import courseService from '../../services/course.service';
import userService from '../../services/user.service';
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

const getStatusChipColor = (status) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'WITHDRAWN': return 'default';
    case 'COMPLETED': return 'info';
    default: return 'default';
  }
};

const EnrollmentManagement = () => {
  // State for enrollments
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for detailed view dialog
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    enrollment: null
  });
  
  // State for status update dialog
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    enrollmentId: null,
    currentStatus: '',
    newStatus: '',
    notes: '',
    studentName: '',
    courseName: '',
    isStatusChange: false
  });
  
  // State for feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  
  // New state for multi-select functionality
  const [selected, setSelected] = useState([]);
  const [bulkDialog, setBulkDialog] = useState({
    open: false,
    status: '',
    notes: ''
  });

  // State for profile menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Load enrollments on component mount
  useEffect(() => {
    fetchAllEnrollments();
  }, []);
  
  // Filter enrollments when search term or status filter changes
  useEffect(() => {
    if (enrollments.length === 0) {
      setFilteredEnrollments([]);
      return;
    }
    
    let filtered = [...enrollments];
    
    // Apply status filter if selected
    if (statusFilter) {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }
    
    // Apply search term if entered
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment => 
        enrollment.studentName.toLowerCase().includes(term) ||
        enrollment.courseCode.toLowerCase().includes(term) ||
        enrollment.courseName.toLowerCase().includes(term)
      );
    }
    
    setFilteredEnrollments(filtered);
  }, [searchTerm, statusFilter, enrollments]);

  const fetchAllEnrollments = async () => {
    setLoading(true);
    try {
      // For a real implementation, you'd want to fetch all enrollments or filter by status
      // We'll get course enrollments for each course
      const coursesResponse = await courseService.getAllCourses();
      let courses = [];
      if (Array.isArray(coursesResponse.data)) {
        courses = coursesResponse.data;
      } else if (coursesResponse.data && Array.isArray(coursesResponse.data.content)) {
        courses = coursesResponse.data.content;
      } else {
        courses = [];
      }
      
      let allEnrollments = [];
      
      // For each course, get its enrollments
      for (const course of courses) {
        try {
          const response = await enrollmentService.getCourseEnrollments(course.id);
          if (response.data && response.data.length > 0) {
            allEnrollments = [...allEnrollments, ...response.data];
          }
        } catch (err) {
          console.error(`Error fetching enrollments for course ${course.id}:`, err);
        }
      }
      
      console.log('Fetched enrollments:', allEnrollments);
      setEnrollments(allEnrollments);
      setFilteredEnrollments(allEnrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load enrollments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleDetailOpen = (enrollment) => {
    setDetailDialog({
      open: true,
      enrollment
    });
  };

  const handleDetailClose = () => {
    setDetailDialog({
      open: false,
      enrollment: null
    });
  };

  const handleStatusDialogOpen = (enrollment, newStatus) => {
    const isStatusChange = enrollment.status !== 'PENDING';
    
    setStatusDialog({
      open: true,
      enrollmentId: enrollment.id,
      currentStatus: enrollment.status,
      newStatus: newStatus,
      notes: '',
      studentName: enrollment.studentName,
      courseName: enrollment.courseName,
      isStatusChange: isStatusChange
    });
  };

  const handleStatusDialogClose = () => {
    setStatusDialog({
      open: false,
      enrollmentId: null,
      currentStatus: '',
      newStatus: '',
      notes: '',
      studentName: '',
      courseName: '',
      isStatusChange: false
    });
  };

  const handleNotesChange = (event) => {
    setStatusDialog(prev => ({
      ...prev,
      notes: event.target.value
    }));
  };

  const handleStatusUpdate = async () => {
    try {
      const { enrollmentId, newStatus, notes, currentStatus, isStatusChange } = statusDialog;
      
      console.log(`${isStatusChange ? 'Changing' : 'Setting'} enrollment ${enrollmentId} status to ${newStatus}`);
      
      const requestData = {
        status: newStatus,
        notes: notes || ''
      };
      
      // Log the actual request for debugging
      console.log('Sending request data:', JSON.stringify(requestData));
      
      const response = await enrollmentService.updateEnrollmentStatus(enrollmentId, requestData);
      console.log('Update response:', response.data);
      
      // Update local state
      setEnrollments(prevEnrollments => {
        return prevEnrollments.map(enrollment => {
          if (enrollment.id === enrollmentId) {
            return { ...enrollment, status: newStatus };
          }
          return enrollment;
        });
      });
      
      handleStatusDialogClose();
      
      let successMessage = '';
      if (isStatusChange) {
        successMessage = `Enrollment status changed from ${currentStatus} to ${newStatus} successfully!`;
      } else {
        successMessage = `Enrollment ${newStatus === 'APPROVED' ? 'approved' : 'rejected'} successfully!`;
      }
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });
      
      // Refresh enrollments
      fetchAllEnrollments();
    } catch (err) {
      console.error('Error updating enrollment status:', err);
      
      // Extract detailed error message if available
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        console.log('Error response data:', err.response.data);
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSnackbar({
        open: true,
        message: `Failed to update enrollment status: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Handle row selection
  const handleSelectRow = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(itemId => itemId !== id);
    }

    setSelected(newSelected);
  };

  // Handle select all click
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      // Only select pending enrollments
      const pendingIds = filteredEnrollments
        .filter(enrollment => enrollment.status === 'PENDING')
        .map(enrollment => enrollment.id);
      setSelected(pendingIds);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Open bulk action dialog
  const handleBulkActionOpen = (status) => {
    setBulkDialog({
      open: true,
      status: status,
      notes: ''
    });
  };

  // Close bulk action dialog
  const handleBulkDialogClose = () => {
    setBulkDialog({
      open: false,
      status: '',
      notes: ''
    });
  };

  // Handle notes change in bulk dialog
  const handleBulkNotesChange = (event) => {
    setBulkDialog(prev => ({
      ...prev,
      notes: event.target.value
    }));
  };

  // Process bulk status update
  const handleBulkStatusUpdate = async () => {
    try {
      const { status, notes } = bulkDialog;
      
      console.log(`Updating ${selected.length} enrollments to ${status}`);
      
      // Track success and failures
      let successCount = 0;
      let failureCount = 0;
      
      // Process each selected enrollment sequentially
      for (const enrollmentId of selected) {
        try {
          const requestData = {
            status: status,
            notes: notes || ''
          };
          
          await enrollmentService.updateEnrollmentStatus(enrollmentId, requestData);
          successCount++;
        } catch (err) {
          console.error(`Error updating enrollment ${enrollmentId}:`, err);
          failureCount++;
        }
      }
      
      // Close dialog and clear selection
      handleBulkDialogClose();
      setSelected([]);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully ${status.toLowerCase()}d ${successCount} enrollments${failureCount > 0 ? `, failed to update ${failureCount}` : ''}`,
        severity: failureCount > 0 ? 'warning' : 'success'
      });
      
      // Refresh enrollments
      fetchAllEnrollments();
    } catch (err) {
      console.error('Error processing bulk update:', err);
      
      setSnackbar({
        open: true,
        message: `Failed to process bulk update: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Count pending enrollments
  const pendingCount = filteredEnrollments.filter(e => e.status === 'PENDING').length;

  // Add this helper for formatting dates
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  if (loading) {
    return (
      <PageContainer>
        <AdminHeader 
          onProfileClick={() => setProfileMenuOpen(!profileMenuOpen)}
        />
        <ContentContainer>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AdminHeader 
        onProfileClick={() => setProfileMenuOpen(!profileMenuOpen)}
      />
      <ContentContainer>
        <StyledPaper elevation={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Enrollment Management
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by student name or course..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      id="status-filter"
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      label="Filter by Status"
                      startAdornment={<FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="APPROVED">Approved</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                      <MenuItem value="WITHDRAWN">Withdrawn</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <StyledButton 
                    fullWidth 
                    variant="contained" 
                    onClick={fetchAllEnrollments}
                    sx={{ height: '56px' }}
                  >
                    Refresh
                  </StyledButton>
                </Grid>
              </Grid>
            </Box>
            
            {/* Bulk Action Toolbar */}
            {selected.length > 0 && (
              <Toolbar
                sx={{
                  pl: { sm: 2 },
                  pr: { xs: 1, sm: 1 },
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                  {selected.length} pending enrollment{selected.length !== 1 ? 's' : ''} selected
                </Typography>
                <Tooltip title="Approve Selected">
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<DoneAllIcon />}
                    onClick={() => handleBulkActionOpen('APPROVED')}
                    sx={{ mr: 1 }}
                  >
                    Approve All
                  </Button>
                </Tooltip>
                <Tooltip title="Reject Selected">
                  <Button
                    color="error"
                    variant="contained"
                    startIcon={<BlockIcon />}
                    onClick={() => handleBulkActionOpen('REJECTED')}
                  >
                    Reject All
                  </Button>
                </Tooltip>
              </Toolbar>
            )}
            
            <TableContainer component={Box} sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              <Table stickyHeader>
                <StyledTableHead>
                  <TableRow>
                    <StyledTableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < pendingCount}
                        checked={pendingCount > 0 && selected.length === pendingCount}
                        onChange={handleSelectAllClick}
                        disabled={pendingCount === 0}
                      />
                    </StyledTableCell>
                    <StyledTableCell>Student</StyledTableCell>
                    <StyledTableCell>Course</StyledTableCell>
                    <StyledTableCell>Semester</StyledTableCell>
                    <StyledTableCell>Academic Year</StyledTableCell>
                    <StyledTableCell>Enrolled On</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell>Created By</StyledTableCell>
                    <StyledTableCell>Created At</StyledTableCell>
                    <StyledTableCell>Updated By</StyledTableCell>
                    <StyledTableCell>Updated At</StyledTableCell>
                    <StyledTableCell align="center">Actions</StyledTableCell>
                  </TableRow>
                </StyledTableHead>
                <TableBody>
                  {filteredEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" sx={{ py: 2, color: '#fff' }}>
                          No enrollments found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEnrollments.map((enrollment) => {
                      const isItemSelected = isSelected(enrollment.id);
                      const isPending = enrollment.status === 'PENDING';
                      
                      return (
                        <TableRow 
                          key={enrollment.id}
                          hover
                          role="checkbox"
                          aria-checked={isItemSelected}
                          selected={isItemSelected}
                          sx={{ 
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(63, 140, 255, 0.1) !important',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
                            }
                          }}
                        >
                          <StyledTableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onClick={(event) => handleSelectRow(event, enrollment.id)}
                              disabled={!isPending}
                            />
                          </StyledTableCell>
                          <StyledTableCell>{enrollment.studentName}</StyledTableCell>
                          <StyledTableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                              {enrollment.courseCode}
                            </Typography>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              {enrollment.courseName}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell>{enrollment.semester || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{enrollment.academicYear || 'N/A'}</StyledTableCell>
                          <StyledTableCell>
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Chip 
                              label={enrollment.status} 
                              color={getStatusChipColor(enrollment.status)}
                              size="small" 
                            />
                          </StyledTableCell>
                          <StyledTableCell>{enrollment.createdByUsername || enrollment.createdById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(enrollment.createdAt)}</StyledTableCell>
                          <StyledTableCell>{enrollment.updatedByUsername || enrollment.updatedById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(enrollment.updatedAt)}</StyledTableCell>
                          <StyledTableCell align="center">
                            <Box>
                              {enrollment.status === 'PENDING' && (
                                <>
                                  <Tooltip title="Approve Enrollment">
                                    <IconButton 
                                      color="success" 
                                      onClick={() => handleStatusDialogOpen(enrollment, 'APPROVED')}
                                    >
                                      <CheckCircleIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Enrollment">
                                    <IconButton 
                                      color="error" 
                                      onClick={() => handleStatusDialogOpen(enrollment, 'REJECTED')}
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {enrollment.status === 'REJECTED' && (
                                <Tooltip title="Change to Approved">
                                  <IconButton 
                                    color="success" 
                                    onClick={() => handleStatusDialogOpen(enrollment, 'APPROVED')}
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {enrollment.status === 'APPROVED' && (
                                <Tooltip title="Change to Rejected">
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleStatusDialogOpen(enrollment, 'REJECTED')}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="View Details">
                                <IconButton 
                                  color="primary"
                                  onClick={() => handleDetailOpen(enrollment)}
                                >
                                  <InfoIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </StyledTableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </StyledPaper>
      </ContentContainer>
      
      {/* Bulk Action Dialog */}
      <StyledDialog 
        open={bulkDialog.open} 
        onClose={handleBulkDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {bulkDialog.status === 'APPROVED' ? 'Approve Selected Enrollments' : 'Reject Selected Enrollments'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            {bulkDialog.status === 'APPROVED' 
              ? `Are you sure you want to approve ${selected.length} selected enrollment${selected.length !== 1 ? 's' : ''}?` 
              : `Are you sure you want to reject ${selected.length} selected enrollment${selected.length !== 1 ? 's' : ''}?`
            }
          </DialogContentText>
          
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={bulkDialog.notes}
            onChange={handleBulkNotesChange}
            variant="outlined"
            placeholder="Add notes to apply to all selected enrollments..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDialogClose} color="inherit">Cancel</Button>
          <Button 
            onClick={handleBulkStatusUpdate} 
            color={bulkDialog.status === 'APPROVED' ? 'success' : 'error'}
            variant="contained"
          >
            {bulkDialog.status === 'APPROVED' ? 'Approve All' : 'Reject All'}
          </Button>
        </DialogActions>
      </StyledDialog>
      
      {/* Enrollment Details Dialog */}
      <StyledDialog 
        open={detailDialog.open} 
        onClose={handleDetailClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Enrollment Details
        </DialogTitle>
        <DialogContent>
          {detailDialog.enrollment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="#fff">Student Information</Typography>
                <Typography variant="body1" color="#fff">{detailDialog.enrollment.studentName}</Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">ID: {detailDialog.enrollment.studentId}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="#fff">Course Information</Typography>
                <Typography variant="body1" color="#fff">{detailDialog.enrollment.courseName}</Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">Code: {detailDialog.enrollment.courseCode}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.9)">Semester</Typography>
                <Typography color="#fff">{detailDialog.enrollment.semester || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.9)">Academic Year</Typography>
                <Typography color="#fff">{detailDialog.enrollment.academicYear || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.9)">Enrolled On</Typography>
                <Typography color="#fff">
                  {new Date(detailDialog.enrollment.enrolledAt).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.9)">Status</Typography>
                <Chip 
                  label={detailDialog.enrollment.status} 
                  color={getStatusChipColor(detailDialog.enrollment.status)}
                  size="small" 
                />
              </Grid>
              
              {detailDialog.enrollment.updatedAt && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.9)">Last Updated</Typography>
                  <Typography color="#fff">
                    {new Date(detailDialog.enrollment.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailClose} color="inherit">Close</Button>
        </DialogActions>
      </StyledDialog>
      
      {/* Status Update Dialog */}
      <StyledDialog 
        open={statusDialog.open} 
        onClose={handleStatusDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {statusDialog.isStatusChange 
            ? `Change Enrollment Status to ${statusDialog.newStatus}` 
            : (statusDialog.newStatus === 'APPROVED' ? 'Approve Enrollment' : 'Reject Enrollment')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            {statusDialog.isStatusChange 
              ? `Are you sure you want to change ${statusDialog.studentName}'s enrollment in ${statusDialog.courseName} from ${statusDialog.currentStatus} to ${statusDialog.newStatus}?`
              : (statusDialog.newStatus === 'APPROVED' 
                ? `Are you sure you want to approve ${statusDialog.studentName}'s enrollment in ${statusDialog.courseName}?` 
                : `Are you sure you want to reject ${statusDialog.studentName}'s enrollment in ${statusDialog.courseName}?`
              )
            }
          </DialogContentText>
          
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={statusDialog.notes}
            onChange={handleNotesChange}
            variant="outlined"
            placeholder="Add any notes regarding this decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} color="inherit">Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            color={statusDialog.newStatus === 'APPROVED' ? 'success' : 'error'}
            variant="contained"
          >
            {statusDialog.isStatusChange ? 'Change Status' : (statusDialog.newStatus === 'APPROVED' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </StyledDialog>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default EnrollmentManagement; 