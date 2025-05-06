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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import courseService from '../../services/course.service';
import userService from '../../services/user.service';
import authService from '../../services/auth.service';
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
import Pagination from '@mui/material/Pagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import axios from 'axios';

const CourseManagement = () => {
  const theme = useTheme();
  // State for courses
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  // Advanced filter states
  const [filterCourseCode, setFilterCourseCode] = useState('');
  const [filterCourseName, setFilterCourseName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  // State for course form
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    id: null,
    courseCode: '',
    courseName: '',
    description: '',
    credits: 0,
    semester: '',
    academicYear: '',
    department: '',
    teacherId: ''
  });
  
  // State for teachers
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  
  // State for feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Add this state for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    courseId: null,
    courseName: ''
  });

  const [departments, setDepartments] = useState([]);
  const [departmentOptionsLoading, setDepartmentOptionsLoading] = useState(true);
  const [departmentOptionsError, setDepartmentOptionsError] = useState(null);

  // Load courses on component mount
  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    // Fetch departments from backend
    setDepartmentOptionsLoading(true);
    const currentUser = authService.getCurrentUser && authService.getCurrentUser();
    const token = currentUser && currentUser.token;
    console.log('Current user for departments:', currentUser);
    console.log('Token for departments:', token);
    if (!token) {
      setDepartmentOptionsError('Not authenticated: Please log in again.');
      setDepartmentOptionsLoading(false);
      return;
    }
    axios.get('/api/departments', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        console.log('Fetched departments:', res.data); // Debug log
        setDepartments(res.data || []);
        setDepartmentOptionsLoading(false);
      })
      .catch(err => {
        setDepartmentOptionsError('Failed to load departments');
        setDepartmentOptionsLoading(false);
      });
  }, [page, size, sortField, sortOrder, filterCourseCode, filterCourseName, filterDepartment, filterTeacherId, filterAcademicYear, filterSemester]);
  
  // Filter courses when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = courses.filter(course =>
        course.courseCode.toLowerCase().includes(query) ||
        course.courseName.toLowerCase().includes(query) ||
        course.department?.toLowerCase().includes(query) ||
        course.semester?.toLowerCase().includes(query) ||
        course.academicYear?.toLowerCase().includes(query)
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sort: `${sortField},${sortOrder}`,
        courseCode: filterCourseCode || undefined,
        courseName: filterCourseName || undefined,
        department: filterDepartment || undefined,
        teacherId: filterTeacherId || undefined,
        academicYear: filterAcademicYear || undefined,
        semester: filterSemester || undefined,
      };
      const response = await courseService.getCoursesPaginated(params);
      setCourses(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      // Fetch all moderators (teachers)
      const response = await userService.getAllModerators();
      setTeachers(response.data);
      console.log('Teachers loaded:', response.data); // Debug log
    } catch (err) {
      console.error('Error fetching teachers:', err);
      // Just log error but don't block the UI
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Calculate current academic year (e.g., "2023-2024")
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // If we're in the second half of the calendar year (Jul-Dec), academic year is currentYear/currentYear+1
    // If we're in the first half (Jan-Jun), academic year is currentYear-1/currentYear
    if (currentMonth >= 6) { // July or later
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Add specific logging for academicYear changes
    if (name === 'academicYear') {
      console.log(`Updating academicYear from '${currentCourse.academicYear}' to '${value}'`);
    }
    
    setCurrentCourse(prev => ({
      ...prev,
      [name]: name === 'credits' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };

  const handleDialogOpen = (course = null) => {
    if (course) {
      // Edit mode - set the current course data
      const teacherId = course.teacher ? course.teacher.id : '';
      console.log('Editing course:', course);
      console.log('Course academicYear before setting in form:', course.academicYear);

      setCurrentCourse({
        id: course.id,
        courseCode: course.courseCode || '',
        courseName: course.courseName || '',
        description: course.description || '',
        credits: course.credits || 0,
        semester: course.semester || '',
        academicYear: course.academicYear || '',
        department: course.department && course.department.name ? course.department.name : '',
        teacherId
      });
      
      console.log('Current course state after setting:', {
        id: course.id,
        courseCode: course.courseCode || '',
        academicYear: course.academicYear || ''
      });
      
      setIsEditing(true);
    } else {
      // Create mode - reset the form
      setCurrentCourse({
        id: null,
        courseCode: '',
        courseName: '',
        description: '',
        credits: 0,
        semester: '',
        academicYear: getCurrentAcademicYear(),
        department: '',
        teacherId: ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const requiredFields = ['courseCode', 'courseName', 'credits', 'semester', 'academicYear', 'department', 'teacherId'];
      const missingFields = requiredFields.filter(field => !currentCourse[field]);
      if (missingFields.length > 0) {
        setSnackbar({
          open: true,
          message: `Please fill in all required fields: ${missingFields.join(', ')}`,
          severity: 'error'
        });
        return;
      }
  
      // Ensure department name matches one from the backend
      const selectedDepartment = departments.find(
        dept => dept.name === currentCourse.department
      );
      if (!selectedDepartment) {
        setSnackbar({
          open: true,
          message: `Selected department does not exist. Please choose a valid department from the list.`,
          severity: 'error'
        });
        return;
      }
  
      // Format the course data for the API
      const courseData = courseService.formatCourseData({
        ...currentCourse,
        department: { name: selectedDepartment.name },
        departmentName: selectedDepartment.name // <-- Add this line for backend update
      });
  
      if (isEditing) {
        await courseService.updateCourse(currentCourse.id, courseData);
        setSnackbar({
          open: true,
          message: 'Course updated successfully!',
          severity: 'success'
        });
      } else {
        await courseService.createCourse(courseData);
        setSnackbar({
          open: true,
          message: 'Course created successfully!',
          severity: 'success'
        });
      }
      fetchCourses();
      handleDialogClose();
    } catch (err) {
      const errorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
      const validationErrors = err.response?.data?.errors || [];
      const errorMessage = validationErrors.length > 0 
        ? `Validation errors: ${validationErrors.map(e => e.defaultMessage).join(', ')}`
        : `Failed to ${isEditing ? 'update' : 'create'} course: ${errorDetail}`;
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (course) => {
    setDeleteDialog({
      open: true,
      courseId: course.id,
      courseName: course.courseName
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      open: false,
      courseId: null,
      courseName: ''
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await courseService.deleteCourse(deleteDialog.courseId);
      setSnackbar({
        open: true,
        message: 'Course deleted successfully!',
        severity: 'success'
      });
      fetchCourses(); // Refresh the list
    } catch (err) {
      console.error('Error deleting course:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete course: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    } finally {
      // Close the dialog
      handleDeleteCancel();
    }
  };

  // Replace the old handleDelete function with this new implementation
  const handleDelete = (course) => {
    handleDeleteClick(course);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Add this helper for formatting dates
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Before rendering the Select for department filter and dialog:
  console.log('Rendering department dropdown, departments:', departments);

  // Add direct test method
  const testDirectCourseSubmit = async () => {
    try {
      console.log('Testing direct course submission');
      
      // Get auth token
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token;
      
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication token missing',
          severity: 'error'
        });
        return;
      }

      // Check if department is selected
      if (!currentCourse.department) {
        setSnackbar({
          open: true,
          message: 'Please select a department before submitting',
          severity: 'error'
        });
        return;
      }

      // Create minimal test payload
      const testCourse = {
        courseCode: currentCourse.courseCode || 'TEST101',
        courseName: currentCourse.courseName || 'Test Course',
        credits: currentCourse.credits || 3,
        semester: currentCourse.semester || '1',
        academicYear: currentCourse.academicYear || '2024-2025',
        teacher: { id: currentCourse.teacherId || 1 }
      };
      
      // Only add department if valid
      // Department is now required
      testCourse.department = { 
        name: currentCourse.department
      };
      
      console.log('Sending direct test payload:', JSON.stringify(testCourse, null, 2));
      
      // Send direct request
      const response = await axios.post('http://localhost:8080/api/courses', testCourse, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct test successful:', response.data);
      setSnackbar({
        open: true,
        message: 'Direct course test successful!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Direct test failed:', err);
      console.error('Error details:', err.response?.data);
      setSnackbar({
        open: true,
        message: `Direct test failed: ${err.response?.data || err.response?.status || err.message}`,
        severity: 'error'
      });
    }
  };

  return (
    <PageContainer>
      <ContentContainer>
        <Container maxWidth="lg">
          <StyledPaper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                Course Management
              </Typography>
              <StyledButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleDialogOpen()}
              >
                Add Course
              </StyledButton>
            </Box>
            
            {/* Search Box */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2}>
                  <TextField label="Course Code" value={filterCourseCode} onChange={e => setFilterCourseCode(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField label="Course Name" value={filterCourseName} onChange={e => setFilterCourseName(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filterDepartment}
                      onChange={e => setFilterDepartment(e.target.value)}
                      label="Department"
                      disabled={!!departmentOptionsError}
                    >
                      <MenuItem value="">All</MenuItem>
                      {departments.length === 0 && <MenuItem value="" disabled>No departments found</MenuItem>}
                      {departments.map(dept => (
                        <MenuItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Teacher</InputLabel>
                    <Select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)} label="Teacher">
                      <MenuItem value="">All</MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>{teacher.username} ({teacher.email})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField label="Academic Year" value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Semester</InputLabel>
                    <Select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} label="Semester">
                      <MenuItem value="">All</MenuItem>
                      {[...Array(8)].map((_, i) => (
                        <MenuItem key={i + 1} value={String(i + 1)}>{i + 1}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, background: 'rgba(211, 47, 47, 0.1)', color: '#fff' }}>
                {error}
              </Alert>
            )}
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress sx={{ color: '#3f8cff' }} />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <StyledTableHead>
                    <TableRow>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'courseCode'} direction={sortField === 'courseCode' ? sortOrder : 'asc'} onClick={() => handleSort('courseCode')}>Course Code</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'courseName'} direction={sortField === 'courseName' ? sortOrder : 'asc'} onClick={() => handleSort('courseName')}>Course Name</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'department'} direction={sortField === 'department' ? sortOrder : 'asc'} onClick={() => handleSort('department')}>Department</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'semester'} direction={sortField === 'semester' ? sortOrder : 'asc'} onClick={() => handleSort('semester')}>Semester</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'academicYear'} direction={sortField === 'academicYear' ? sortOrder : 'asc'} onClick={() => handleSort('academicYear')}>Academic Year</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>Created By</StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'createdAt'} direction={sortField === 'createdAt' ? sortOrder : 'asc'} onClick={() => handleSort('createdAt')}>Created At</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>Updated By</StyledTableCell>
                      <StyledTableCell>
                        <TableSortLabel active={sortField === 'updatedAt'} direction={sortField === 'updatedAt' ? sortOrder : 'asc'} onClick={() => handleSort('updatedAt')}>Updated At</TableSortLabel>
                      </StyledTableCell>
                      <StyledTableCell>Actions</StyledTableCell>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}>
                        <StyledTableCell>{course.courseCode}</StyledTableCell>
                        <StyledTableCell>{course.courseName}</StyledTableCell>
                        <StyledTableCell>{course.departmentName || ''}</StyledTableCell>
                        <StyledTableCell>{course.semester}</StyledTableCell>
                        <StyledTableCell>{course.academicYear}</StyledTableCell>
                        <StyledTableCell>{course.createdByUsername || course.createdById || 'N/A'}</StyledTableCell>
                        <StyledTableCell>{formatDate(course.createdAt)}</StyledTableCell>
                        <StyledTableCell>{course.updatedByUsername || course.updatedById || 'N/A'}</StyledTableCell>
                        <StyledTableCell>{formatDate(course.updatedAt)}</StyledTableCell>
                        <StyledTableCell>
                          <IconButton 
                            onClick={() => handleDialogOpen(course)}
                            sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' } }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDeleteClick(course)}
                            sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </StyledTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </StyledPaper>
          
          <StyledDialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ color: '#fff' }}>
              {isEditing ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course Code"
                    name="courseCode"
                    value={currentCourse.courseCode}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course Name"
                    name="courseName"
                    value={currentCourse.courseName}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={currentCourse.description}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Credits"
                    name="credits"
                    type="number"
                    value={currentCourse.credits}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!currentCourse.department}>
                    <InputLabel id="department-dialog-label">Department</InputLabel>
                    <Select
                      labelId="department-dialog-label"
                      name="department"
                      value={currentCourse.department || ''}
                      onChange={e => setCurrentCourse(prev => ({ ...prev, department: e.target.value }))}
                      label="Department"
                    >
                      <MenuItem value="">Select a department</MenuItem>
                      {departments.map(dept => (
                        <MenuItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {!currentCourse.department && (
                      <div style={{ color: '#f44336', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                        Department is required
                      </div>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={currentCourse.semester}
                      onChange={handleInputChange}
                      label="Semester"
                    >
                      {[...Array(8)].map((_, i) => (
                        <MenuItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    name="academicYear"
                    value={currentCourse.academicYear}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!currentCourse.teacherId} disabled={loadingTeachers}>
                    <InputLabel>Teacher</InputLabel>
                    <Select
                      name="teacherId"
                      value={currentCourse.teacherId}
                      onChange={handleInputChange}
                      label="Teacher"
                    >
                      <MenuItem value="">
                        {loadingTeachers ? 'Loading teachers...' : 'Select a teacher'}
                      </MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.username} ({teacher.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleDialogClose}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={testDirectCourseSubmit}
                sx={{ color: '#FFC107' }}
              >
                Test Submit
              </Button>
              <StyledButton onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
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
            <DialogContent>
              <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Are you sure you want to delete the course <strong>{deleteDialog.courseName}</strong>? 
                This action cannot be undone and all related data will be permanently lost.
              </DialogContentText>
            </DialogContent>
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
                Delete
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
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(e, value) => setPage(value - 1)}
              color="primary"
              showFirstButton
              showLastButton
            />
            <Typography sx={{ ml: 2, alignSelf: 'center' }}>
              {`Total: ${totalElements} courses`}
            </Typography>
          </Box>
        </Container>
      </ContentContainer>
    </PageContainer>
  );
};

export default CourseManagement; 