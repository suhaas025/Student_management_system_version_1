import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  Divider,
  InputAdornment,
  Tabs,
  Tab,
  TablePagination,
  Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
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

const Students = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    department: '',
    degree: '',
    yearOfStudy: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState({
    studentId: '',
    name: '',
    email: '',
    department: '',
    status: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    studentId: '',
    studentName: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // New state variables for enhanced functionality
  const [tabValue, setTabValue] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Extract unique departments and statuses for filter dropdowns
  const departments = ['all', ...new Set(students.map(s => s.department).filter(Boolean))];
  const statuses = ['all', ...new Set(students.map(s => s.status).filter(Boolean))];

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Apply filtering, sorting, and search
    let filtered = [...students];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        (student.studentId && student.studentId.toLowerCase().includes(query)) ||
        (student.name && student.name.toLowerCase().includes(query)) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.department && student.department.toLowerCase().includes(query))
      );
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }
    
    // Apply tab filter
    if (tabValue === 1) { // Active students
      filtered = filtered.filter(student => student.status === 'Active');
    } else if (tabValue === 2) { // Inactive students
      filtered = filtered.filter(student => student.status === 'Inactive' || student.status === 'Suspended');
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'department') {
        comparison = (a.department || '').localeCompare(b.department || '');
      } else if (sortBy === 'studentId') {
        comparison = (a.studentId || '').localeCompare(b.studentId || '');
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredStudents(filtered);
  }, [students, searchQuery, departmentFilter, statusFilter, tabValue, sortBy, sortOrder]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load students. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student = null) => {
    setValidationErrors({});
    if (student) {
      setSelectedStudent(student);
      setFormData({
        username: student.username || '',
        email: student.email || '',
        department: student.department || '',
        degree: student.degree || '',
        yearOfStudy: student.yearOfStudy || '',
      });
      setCurrentStudent({
        studentId: student.studentId || '',
        name: student.name || '',
        email: student.email || '',
        department: student.department || '',
        status: student.status || '',
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        username: '',
        email: '',
        department: '',
        degree: '',
        yearOfStudy: '',
      });
      setCurrentStudent({
        studentId: '',
        name: '',
        email: '',
        department: '',
        status: 'Active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setFormData({
      username: '',
      email: '',
      department: '',
      degree: '',
      yearOfStudy: '',
    });
    setCurrentStudent({
      studentId: '',
      name: '',
      email: '',
      department: '',
      status: '',
    });
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!currentStudent.studentId) {
      errors.studentId = "Student ID is required";
    }
    
    if (!currentStudent.name) {
      errors.name = "Name is required";
    }
    
    if (!currentStudent.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(currentStudent.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!currentStudent.department) {
      errors.department = "Department is required";
    }
    
    if (!currentStudent.status) {
      errors.status = "Status is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      if (selectedStudent) {
        await userService.updateUser(selectedStudent.id, {
          ...formData,
          ...currentStudent,
          role: 'ROLE_USER'
        });
        setSnackbar({
          open: true,
          message: 'Student updated successfully!',
          severity: 'success',
        });
      } else {
        await userService.createUser({
          ...formData,
          ...currentStudent,
          role: 'ROLE_USER'
        });
        setSnackbar({
          open: true,
          message: 'Student created successfully!',
          severity: 'success',
        });
      }
      handleCloseDialog();
      loadStudents();
    } catch (err) {
      setError(`Failed to ${selectedStudent ? 'update' : 'create'} student. ${err.message || ''}`);
      setSnackbar({
        open: true,
        message: `Failed to ${selectedStudent ? 'update' : 'create'} student. ${err.message || ''}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (student) => {
    setDeleteDialog({
      open: true,
      studentId: student.id,
      studentName: student.name,
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      open: false,
      studentId: '',
      studentName: '',
    });
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await userService.deleteUser(deleteDialog.studentId);
      loadStudents();
      setSnackbar({
        open: true,
        message: 'Student deleted successfully!',
        severity: 'success',
      });
    } catch (err) {
      setError('Failed to delete student. ' + (err.message || ''));
      setSnackbar({
        open: true,
        message: 'Failed to delete student. ' + (err.message || ''),
        severity: 'error',
      });
    } finally {
      setLoading(false);
      handleDeleteCancel();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      open: false,
      message: '',
      severity: 'success',
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setTabValue(0);
    setSortBy('name');
    setSortOrder('asc');
  };

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const getStatusChip = (status) => {
    const statusColors = {
      'Active': { bg: '#4caf50', color: '#fff' },
      'Inactive': { bg: '#9e9e9e', color: '#fff' },
      'Suspended': { bg: '#ff9800', color: '#fff' }
    };
    
    const chipStyle = statusColors[status] || { bg: '#9e9e9e', color: '#fff' };
    
    return (
      <Chip 
        label={status} 
        size="small" 
        sx={{ 
          bgcolor: chipStyle.bg, 
          color: chipStyle.color,
          fontWeight: 500,
          '& .MuiChip-label': { px: 1 }
        }} 
      />
    );
  };

  return (
    <PageContainer>
      <ContentContainer>
        <Container maxWidth="lg">
          <StyledPaper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: '#3f8cff', fontSize: 32 }} />
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                  Student Management
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Toggle filters">
                  <IconButton 
                    onClick={toggleFilters}
                    sx={{ 
                      color: isFiltersVisible ? '#3f8cff' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { background: 'rgba(63, 140, 255, 0.1)' }
                    }}
                  >
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add new student">
                  <StyledButton
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Student
                  </StyledButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{ 
                mb: 3,
                '& .MuiTabs-indicator': { bgcolor: '#3f8cff' },
                '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .Mui-selected': { color: '#3f8cff' }
              }}
            >
              <Tab label="All Students" icon={<PeopleIcon />} iconPosition="start" />
              <Tab label="Active" icon={<SchoolIcon />} iconPosition="start" />
              <Tab label="Inactive" icon={<PersonAddIcon />} iconPosition="start" />
            </Tabs>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or student ID..."
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchQuery('')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3f8cff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3f8cff',
                    },
                  },
                }}
              />
            </Box>
            
            {/* Advanced filters */}
            <Fade in={isFiltersVisible}>
              <Box sx={{ mb: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>Advanced Filters</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        label="Department"
                      >
                        {departments.map(dept => (
                          <MenuItem key={dept} value={dept}>
                            {dept === 'all' ? 'All Departments' : dept}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                      >
                        {statuses.map(status => (
                          <MenuItem key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label="Sort By"
                      >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="studentId">Student ID</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                        <MenuItem value="status">Status</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={<ClearIcon />}
                        onClick={handleClearFilters}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        Clear Filters
        </Button>
      </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, background: 'rgba(211, 47, 47, 0.1)', color: '#fff' }}>
                {error}
              </Alert>
            )}
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress sx={{ color: '#3f8cff' }} />
              </Box>
            ) : filteredStudents.length > 0 ? (
              <>
                <TableContainer>
        <Table>
                    <StyledTableHead>
            <TableRow>
                        <StyledTableCell 
                          onClick={() => handleSort('studentId')}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Student ID
                            {sortBy === 'studentId' && (
                              <SortIcon 
                                sx={{ 
                                  ml: 0.5, 
                                  fontSize: 16, 
                                  transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none'
                                }} 
                              />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('name')}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Name
                            {sortBy === 'name' && (
                              <SortIcon 
                                sx={{ 
                                  ml: 0.5, 
                                  fontSize: 16, 
                                  transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none'
                                }} 
                              />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>Email</StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('department')}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Department
                            {sortBy === 'department' && (
                              <SortIcon 
                                sx={{ 
                                  ml: 0.5, 
                                  fontSize: 16, 
                                  transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none'
                                }} 
                              />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('status')}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Status
                            {sortBy === 'status' && (
                              <SortIcon 
                                sx={{ 
                                  ml: 0.5, 
                                  fontSize: 16, 
                                  transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none'
                                }} 
                              />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
                    </StyledTableHead>
          <TableBody>
                      {filteredStudents
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((student) => (
                          <TableRow key={student.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}>
                            <StyledTableCell>{student.studentId}</StyledTableCell>
                            <StyledTableCell>{student.name}</StyledTableCell>
                            <StyledTableCell>{student.email}</StyledTableCell>
                            <StyledTableCell>{student.department}</StyledTableCell>
                            <StyledTableCell>
                              {getStatusChip(student.status)}
                            </StyledTableCell>
                            <StyledTableCell>
                              <Tooltip title="Edit student">
                                <IconButton 
                                  onClick={() => handleOpenDialog(student)}
                                  sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' } }}
                                >
                    <EditIcon />
                  </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete student">
                                <IconButton 
                                  onClick={() => handleDeleteClick(student)}
                                  sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' } }}
                                >
                    <DeleteIcon />
                  </IconButton>
                              </Tooltip>
                            </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredStudents.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{
                    color: '#fff',
                    '& .MuiTablePagination-selectIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiTablePagination-actions': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                />
              </>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
                  No students found
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', mb: 3 }}>
                  {searchQuery || departmentFilter !== 'all' || statusFilter !== 'all' || tabValue !== 0 
                    ? 'Try adjusting your filters'
                    : 'Get started by adding students to the system'}
                </Typography>
                {searchQuery || departmentFilter !== 'all' || statusFilter !== 'all' || tabValue !== 0 ? (
                  <Button 
                    variant="outlined" 
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        borderColor: '#3f8cff',
                        background: 'rgba(63, 140, 255, 0.1)',
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <StyledButton
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Student
                  </StyledButton>
                )}
              </Box>
            )}
          </StyledPaper>
          
          <StyledDialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
            <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddIcon />
              {selectedStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
            <TextField
                    fullWidth
                    label="Student ID"
                    name="studentId"
                    value={currentStudent.studentId}
                    onChange={handleInputChange}
              required
                    error={!!validationErrors.studentId}
                    helperText={validationErrors.studentId}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
              fullWidth
                    label="Name"
                    name="name"
                    value={currentStudent.name}
              onChange={handleInputChange}
                    required
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
            />
                </Grid>
                <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
                    value={currentStudent.email}
              onChange={handleInputChange}
                    required
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!validationErrors.department}>
                    <InputLabel>Department</InputLabel>
                    <Select
              name="department"
                      value={currentStudent.department}
              onChange={handleInputChange}
                      label="Department"
                    >
                      <MenuItem value="Computer Science">Computer Science</MenuItem>
                      <MenuItem value="Mathematics">Mathematics</MenuItem>
                      <MenuItem value="Physics">Physics</MenuItem>
                      <MenuItem value="Chemistry">Chemistry</MenuItem>
                      <MenuItem value="Biology">Biology</MenuItem>
                    </Select>
                    {validationErrors.department && (
                      <Typography variant="caption" color="error">
                        {validationErrors.department}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!validationErrors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={currentStudent.status}
              onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Suspended">Suspended</MenuItem>
                    </Select>
                    {validationErrors.status && (
                      <Typography variant="caption" color="error">
                        {validationErrors.status}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <DialogActions>
              <Button 
                onClick={handleCloseDialog}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </Button>
              <StyledButton onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Save'}
              </StyledButton>
            </DialogActions>
          </StyledDialog>
          
          <StyledDialog
            open={deleteDialog.open}
            onClose={handleDeleteCancel}
          >
            <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Confirm Deletion
            </DialogTitle>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <DialogContent>
              <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Are you sure you want to delete the student <strong>{deleteDialog.studentName}</strong>? 
                This action cannot be undone and all related data will be permanently lost.
              </DialogContentText>
        </DialogContent>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <DialogActions>
              <Button 
                onClick={handleDeleteCancel}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                sx={{ 
                  background: '#ff5252',
                  color: '#fff',
                  '&:hover': {
                    background: alpha('#ff5252', 0.8),
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
          </StyledDialog>
          
          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
    </Container>
      </ContentContainer>
    </PageContainer>
  );
};

export default Students; 