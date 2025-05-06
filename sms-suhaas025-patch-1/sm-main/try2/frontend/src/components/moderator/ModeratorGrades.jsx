import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Tooltip,
  Autocomplete,
  TablePagination,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
  School as SchoolIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  PlaylistAdd as PlaylistAddIcon,
  Grade as GradeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import gradeService from '../../services/grade.service';
import courseService from '../../services/course.service';
import authService from '../../services/auth.service';
import { alpha } from '@mui/material/styles';

// Updated styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: alpha('#3f8cff', 0.8),
  color: theme.palette.common.white,
  cursor: 'pointer',
  padding: '12px 16px',
  '&:hover': {
    backgroundColor: alpha('#3f8cff', 0.9),
  },
}));

// Styled component for action header cell (non-sortable)
const ActionTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: alpha('#3f8cff', 0.8),
  color: theme.palette.common.white,
  padding: '12px 16px',
}));

// Add these new styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha('#121212', 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  color: 'white',
  boxShadow: `0 8px 32px 0 ${alpha('#000', 0.37)}`
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(4),
  minHeight: 'calc(100vh - 64px)',
  position: 'relative',
  zIndex: 1
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: 'transparent',
  borderRadius: 12,
  overflow: 'hidden',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: '0 8px'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: alpha('#1e1e1e', 0.6),
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s, background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha('#2d2d2d', 0.8),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`
  },
  '& > .MuiTableCell-root': {
    borderBottom: 'none',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '16px',
    '&:first-of-type': {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8
    },
    '&:last-of-type': {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8
    }
  }
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  '& .MuiToolbar-root': {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& .MuiTablePagination-select': {
    color: 'white'
  },
  '& .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  padding: '6px 16px',
  '&.MuiButton-contained': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
    }
  },
  '&.MuiButton-outlined': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.5)'
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: alpha('#2d2d2d', 0.6),
    borderRadius: 8,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& .MuiInputBase-input': {
    color: 'white',
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1
    }
  }
}));

const GradeChip = styled(Chip)(({ theme, gradeValue }) => {
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return theme.palette.success.main;
      case 'B': return theme.palette.info.main;
      case 'C': return theme.palette.warning.main;
      case 'D': return '#ff9800';
      case 'F': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: alpha(getGradeColor(gradeValue), 0.2),
    color: getGradeColor(gradeValue),
    fontWeight: 600,
    borderRadius: 12,
    minWidth: '36px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
  };
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiSelect-select': {
    color: 'white',
  },
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: alpha('#2d2d2d', 0.6),
    borderRadius: 8,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  }
}));

// Add new styled components for header
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: alpha('#121212', 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'relative',
  zIndex: 3
}));

const ModeratorGrades = () => {
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [formData, setFormData] = useState({
    score: '',
    grade: '',
    comments: ''
  });
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null, 
    direction: 'asc'
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    gradeId: null,
    studentName: '',
    courseName: ''
  });
  const [tabValue, setTabValue] = useState(0);
  const [approvingAll, setApprovingAll] = useState(false);
  const [newGradeData, setNewGradeData] = useState({
    studentId: '',
    courseId: '',
    score: '',
    grade: '',
    comments: ''
  });
  const [openNewGradeDialog, setOpenNewGradeDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalGrades: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    gradeDistribution: {},
    coursePerformance: [],
    statusDistribution: {},
    monthlySubmissions: {}
  });

  // Batch grade entry state
  const [batchEntryDialog, setBatchEntryDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [batchGrades, setBatchGrades] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [showOnlyUngraded, setShowOnlyUngraded] = useState(false);
  const [quickFillScore, setQuickFillScore] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Filter grades when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGrades(filterGrades());
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = grades.filter(grade => 
        (getStudentNameById(grade.studentId)?.toLowerCase() || '').includes(query) ||
        (getCourseNameById(grade.courseId)?.toLowerCase() || '').includes(query) ||
        (grade.grade?.toLowerCase() || '').includes(query) ||
        (grade.comments?.toLowerCase() || '').includes(query)
      );
      setFilteredGrades(filtered);
    }
  }, [searchQuery, grades, courseFilter]);

  // Calculate statistics when grades change
  useEffect(() => {
    if (grades.length > 0) {
      calculateStats();
    }
  }, [grades]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load grades
      const gradesResponse = await gradeService.getModeratorGrades();
      console.log('Grades data:', gradesResponse.data);
      setGrades(gradesResponse.data || []);
      setFilteredGrades(gradesResponse.data || []);
      
      // Load courses for filtering
      const coursesResponse = await courseService.getModeratorCourses();
      console.log('Courses data:', coursesResponse.data);
      setCourses(coursesResponse.data || []);
      
      // Load students for assigning grades
      await loadStudents();
      
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. ' + (err.response?.data?.message || err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await authService.getStudents();
      console.log('Students data:', response.data);
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students. ' + (err.response?.data?.message || err.message || ''));
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // Calculate statistics for the Analytics tab
  const calculateStats = () => {
    if (grades.length === 0) return;

    // Filter grades to only include those from assigned courses
    const assignedCourseIds = courses.map(course => course.id);
    const filteredGrades = grades.filter(grade => 
      assignedCourseIds.includes(grade.courseId)
    );

    if (filteredGrades.length === 0) {
      setStats({
        totalGrades: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        gradeDistribution: {},
        coursePerformance: [],
        monthlySubmissions: {}
      });
      return;
    }

    // Calculate average score
    const scores = filteredGrades.map(grade => grade.score).filter(score => score !== null && score !== undefined);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
    
    // Find highest and lowest scores
    const highestScore = Math.max(...scores, 0);
    const lowestScore = Math.min(...scores.filter(s => s > 0), 100) || 0;
    
    // Calculate grade distribution
    const gradeDistribution = {};
    filteredGrades.forEach(grade => {
      if (grade.grade) {
        if (!gradeDistribution[grade.grade]) {
          gradeDistribution[grade.grade] = 0;
        }
        gradeDistribution[grade.grade]++;
      }
    });
    
    // Calculate course performance
    const courseMap = new Map();
    filteredGrades.forEach(grade => {
      const courseId = grade.courseId;
      if (!courseMap.has(courseId)) {
        const course = courses.find(c => c.id === courseId);
        if (course) { // Only include assigned courses
          courseMap.set(courseId, {
            courseCode: course.courseCode || 'Unknown',
            courseName: course.courseName || 'Unknown Course',
            totalScore: 0,
            numberOfStudents: 0,
            averageScore: 0,
            gradeDistribution: {}
          });
        }
      }
      
      const courseStats = courseMap.get(courseId);
      if (courseStats && grade.score !== null && grade.score !== undefined) {
        courseStats.totalScore += grade.score;
        courseStats.numberOfStudents++;
        courseStats.averageScore = courseStats.totalScore / courseStats.numberOfStudents;
        
        // Update grade distribution for the course
        if (grade.grade) {
          if (!courseStats.gradeDistribution[grade.grade]) {
            courseStats.gradeDistribution[grade.grade] = 0;
          }
          courseStats.gradeDistribution[grade.grade]++;
        }
      }
    });
    
    const coursePerformance = Array.from(courseMap.values());

    // Calculate monthly submissions
    const monthlySubmissions = {};
    filteredGrades.forEach(grade => {
      const date = new Date(grade.createdAt || new Date());
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!monthlySubmissions[monthYear]) {
        monthlySubmissions[monthYear] = 0;
      }
      monthlySubmissions[monthYear]++;
    });
    
    setStats({
      totalGrades: filteredGrades.length,
      averageScore,
      highestScore,
      lowestScore,
      gradeDistribution,
      coursePerformance,
      monthlySubmissions
    });
  };
  
  // Calculate current academic year based on date (e.g., "2023-2024")
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

  // Determine letter grade based on score
  const letterGradeFromScore = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  
  // Filter grades based on filter criteria
  const filterGrades = () => {
    let filteredGrades = [...grades];
    
    // Filter by course
    if (courseFilter) {
      filteredGrades = filteredGrades.filter(grade => grade.courseId === parseInt(courseFilter));
    }
    
    // Apply sort if we have a sort key
    if (sortConfig.key) {
      filteredGrades.sort((a, b) => {
        // Check for null or undefined values
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null cases
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle numeric values differently
        if (sortConfig.key === 'score') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        }
        
        // Handle string values
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        if (aString < bString) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aString > bString) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredGrades;
  };

  const getCourseNameById = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course';
  };

  const getStudentNameById = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.username : 'Unknown Student';
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Open dialog for creating/editing a grade
  const handleDialogOpen = (grade = null) => {
    if (grade) {
      // Edit mode
      setSelectedGrade(grade);
      setFormData({
        score: grade.score || '',
        grade: grade.grade || '',
        comments: grade.comments || ''
      });
      setIsEditing(true);
    } else {
      // Create mode
      setSelectedGrade(null);
      setFormData({
        score: '',
        grade: '',
        comments: ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGrade(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'score') {
      const score = value === '' ? '' : parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
        [name]: score,
        grade: score === '' ? '' : letterGradeFromScore(score)
    }));
    } else {
    setFormData(prev => ({
      ...prev,
        [name]: value
    }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedGrade) return;
    
    try {
      setLoading(true);
      
      // Update the grade
      await gradeService.updateGrade(selectedGrade.id, {
        ...formData,
        // Convert score to number if it's a string
        score: typeof formData.score === 'string' ? parseFloat(formData.score) : formData.score,
        // Make sure to include the version field from the selected grade
        version: selectedGrade.version
      });
      
      setSuccess('Grade updated successfully!');
      handleCloseDialog();
      loadData();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Special handling for version conflict
        setError('This grade was modified by someone else. Please refresh and try again.');
        // Add a button to refresh the grade data
        setShowRefreshButton(true);
      } else {
        setError('Failed to update grade. ' + (err.response?.data?.message || err.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for creating a new grade
  const handleOpenNewGradeDialog = () => {
    setOpenNewGradeDialog(true);
    setNewGradeData({
      studentId: '',
      courseId: '',
      score: '',
      grade: '',
      comments: ''
    });
  };
  
  // Close new grade dialog
  const handleCloseNewGradeDialog = () => {
    setOpenNewGradeDialog(false);
  };
  
  // Handle new grade input change
  const handleNewGradeInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'score') {
      const score = value === '' ? '' : parseInt(value, 10);
      setNewGradeData(prev => ({
        ...prev,
        [name]: score,
        grade: score === '' ? '' : letterGradeFromScore(score)
      }));
    } else {
      setNewGradeData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Create new grade
  const handleCreateGrade = async () => {
    try {
      setLoading(true);
      
      // Validate the inputs
      if (!newGradeData.studentId || !newGradeData.courseId || !newGradeData.score || !newGradeData.grade) {
        setError('Student, course, score, and grade are required');
        setLoading(false);
        return;
      }
      
      // Get the selected course to include courseCode
      const selectedCourse = courses.find(c => c.id === parseInt(newGradeData.courseId));
      if (!selectedCourse) {
        setError('Selected course not found');
        setLoading(false);
        return;
      }
      
      // Format the data with all required fields
      const gradeData = {
        studentId: newGradeData.studentId,
        courseId: newGradeData.courseId,
        courseCode: selectedCourse.courseCode,
        score: parseFloat(newGradeData.score),
        grade: newGradeData.grade,
        comments: newGradeData.comments || '',
        semester: selectedCourse.semester || '',
        academicYear: selectedCourse.academicYear || getCurrentAcademicYear()
      };
      
      console.log('Creating/updating grade with data:', gradeData);
      
      // Check if this student already has a grade for this course
      const existingGrade = grades.find(g => 
        g.studentId === parseInt(newGradeData.studentId) && 
        g.courseId === parseInt(newGradeData.courseId)
      );
      
      if (existingGrade) {
        // Update the existing grade instead of creating a new one
        await gradeService.updateGrade(existingGrade.id, {
          ...gradeData,
          // Include the version to prevent conflicts
          version: existingGrade.version
        });
        setSuccess('Grade updated successfully!');
      } else {
        // Create a new grade
        await gradeService.createGrade(gradeData);
        setSuccess('Grade created successfully!');
      }
      
      handleCloseNewGradeDialog();
      loadData();
    } catch (err) {
      console.error('Error creating/updating grade:', err);
      let errorMessage = 'Failed to create/update grade';
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        errorMessage += `: ${err.response.data.message || err.response.statusText || err.message}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (grade) => {
    setDeleteDialog({
      open: true,
      gradeId: grade.id,
      studentName: getStudentNameById(grade.studentId),
      courseName: getCourseNameById(grade.courseId)
    });
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteDialog({
      open: false,
      gradeId: null,
      studentName: '',
      courseName: ''
    });
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    try {
      await gradeService.deleteGrade(deleteDialog.gradeId);
      setSuccess('Grade deleted successfully!');
      loadData(); // Refresh the list
    } catch (err) {
      console.error('Error deleting grade:', err);
      setError('Failed to delete grade: ' + (err.response?.data?.message || err.message));
    } finally {
      handleDeleteCancel();
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle opening batch entry dialog
  const handleBatchEntryOpen = () => {
    setBatchGrades([]);
    setSelectedCourse(null);
    setBatchEntryDialog(true);
  };

  // Handle closing batch entry dialog
  const handleBatchEntryClose = () => {
    setBatchEntryDialog(false);
  };

  // Handle course selection in batch entry
  const handleBatchCourseSelect = async (event) => {
    const courseId = parseInt(event.target.value);
    if (!courseId) {
      setSelectedCourse(null);
      setBatchGrades([]);
      return;
    }

    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course);

    try {
      // Fetch existing grades for this course to avoid duplicates
      const existingGradesResponse = await gradeService.getGradesByCourseId(course.id);
      const existingGrades = existingGradesResponse.data || [];
      
      // Create map of student IDs with existing grades
      const gradedStudentIds = new Set(
        existingGrades.map(grade => grade.studentId)
      );

      // Reset batch grades and pre-fill with students
      const newBatchGrades = students.map(student => {
        const hasGrade = gradedStudentIds.has(student.id);
        
        return {
          studentId: student.id,
          studentName: student.username,
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          score: '',
          grade: '',
          semester: course.semester || '',
          academicYear: course.academicYear || getCurrentAcademicYear(),
          hasExistingGrade: hasGrade,
          status: 'PENDING'
        };
      });

      setBatchGrades(newBatchGrades);
    } catch (err) {
      console.error('Error fetching existing grades:', err);
      
      // Fall back to simpler implementation if fetching fails
      const newBatchGrades = students.map(student => ({
        studentId: student.id,
        studentName: student.username,
        courseId: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        score: '',
        grade: '',
        semester: course.semester || '',
        academicYear: course.academicYear || getCurrentAcademicYear(),
        hasExistingGrade: false,
        status: 'PENDING'
      }));
      
      setBatchGrades(newBatchGrades);
    }
  };

  // Apply quick fill score to all students
  const handleQuickFill = () => {
    if (!quickFillScore || isNaN(parseInt(quickFillScore, 10))) {
      return;
    }
    
    const score = parseInt(quickFillScore, 10);
    if (score < 0 || score > 100) {
      setError('Quick fill score must be between 0 and 100');
      return;
    }
    
    setBatchGrades(prev => 
      prev.map(entry => {
        // Skip students with existing grades if only showing ungraded
        if (showOnlyUngraded && entry.hasExistingGrade) {
          return entry;
        }
        
        return {
          ...entry,
          score: score,
          grade: letterGradeFromScore(score)
        };
      })
    );
  };

  // Toggle showing only ungraded students
  const handleToggleUngraded = () => {
    setShowOnlyUngraded(!showOnlyUngraded);
  };

  // Handle score change for a student in batch entry
  const handleBatchScoreChange = (studentId, score) => {
    const scoreValue = score === '' ? '' : parseInt(score, 10);
    
    setBatchGrades(prev => 
      prev.map(entry => {
        if (entry.studentId === studentId) {
          return {
            ...entry,
            score: scoreValue,
            grade: scoreValue === '' ? '' : letterGradeFromScore(scoreValue)
          };
        }
        return entry;
      })
    );
  };

  // Handle batch submit
  const handleBatchSubmit = async () => {
    // Validate entries
    const validEntries = batchGrades.filter(entry => 
      entry.score !== '' && entry.score >= 0 && entry.score <= 100
    );

    if (validEntries.length === 0) {
      setError('No valid grades to submit');
      return;
    }

    try {
      setBatchSubmitting(true);
      
      // Create or update each grade one by one
      const promises = validEntries.map(async entry => {
        // Format the data correctly to match backend expectations
        const gradeData = {
          studentId: entry.studentId,
          courseCode: entry.courseCode, 
          courseId: entry.courseId,
          score: entry.score,
          grade: entry.grade,
          semester: entry.semester || selectedCourse.semester || '',
          academicYear: entry.academicYear || selectedCourse.academicYear || getCurrentAcademicYear(),
          comments: ''
        };
        
        // Check if this grade already exists in the system
        if (entry.hasExistingGrade) {
          // Find the existing grade ID
          const existingGrade = grades.find(g => 
            g.studentId === entry.studentId && 
            g.courseId === entry.courseId
          );
          
          if (existingGrade) {
            console.log('Updating existing grade:', existingGrade.id, gradeData);
            return gradeService.updateGrade(existingGrade.id, gradeData);
          }
        }
        
        // If no existing grade was found, create a new one
        console.log('Creating new grade:', gradeData);
        return gradeService.createGrade(gradeData);
      });

      await Promise.all(promises);

      setSuccess(`Successfully processed ${validEntries.length} grades`);

      // Refresh grades list and close dialog
      loadData();
      handleBatchEntryClose();
    } catch (err) {
      console.error('Error submitting batch grades:', err);
      let errorMessage = 'Failed to submit batch grades';
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        errorMessage += `: ${err.response.data.message || err.response.statusText || err.message}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Calculate batch summary statistics
  const calculateBatchSummary = () => {
    const filteredBatchGrades = showOnlyUngraded 
      ? batchGrades.filter(grade => !grade.hasExistingGrade)
      : batchGrades;
      
    if (!filteredBatchGrades || filteredBatchGrades.length === 0) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        empty: 0,
        alreadyGraded: 0,
        gradeDistribution: {}
      };
    }

    const summary = {
      total: filteredBatchGrades.length,
      valid: 0,
      invalid: 0,
      empty: 0,
      alreadyGraded: 0,
      gradeDistribution: {}
    };

    filteredBatchGrades.forEach(entry => {
      if (entry.hasExistingGrade) {
        summary.alreadyGraded++;
      }

      if (entry.score === '') {
        summary.empty++;
      } else if (entry.score < 0 || entry.score > 100) {
        summary.invalid++;
      } else {
        summary.valid++;
        // Count grade distribution
        if (!summary.gradeDistribution[entry.grade]) {
          summary.gradeDistribution[entry.grade] = 0;
        }
        summary.gradeDistribution[entry.grade]++;
      }
    });

    return summary;
  };

  // Filter batch grades based on showOnlyUngraded setting
  const getFilteredBatchGrades = () => {
    return showOnlyUngraded 
      ? batchGrades.filter(grade => !grade.hasExistingGrade)
      : batchGrades;
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [courseFilter, searchQuery]);

  // Get paginated grades
  const getPaginatedGrades = () => {
    const startIndex = page * rowsPerPage;
    return filteredGrades.slice(startIndex, startIndex + rowsPerPage);
  };

  // Add these new handler functions
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    handleCloseMenu();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/moderator');
  };

  // Add a refresh handler for version conflict errors
  const handleRefreshGrade = async () => {
    if (selectedGrade && selectedGrade.id) {
      try {
        setLoading(true);
        setError('');
        setShowRefreshButton(false);
        
        console.log(`Refreshing grade data for ID ${selectedGrade.id}, current version: ${selectedGrade.version}`);
        
        // Get the latest grade data
        const response = await gradeService.getGradeById(selectedGrade.id);
        const freshGrade = response.data;
        
        console.log(`Retrieved fresh grade data with version ${freshGrade.version}`);
        
        // Update state with the fresh data
        setSelectedGrade(freshGrade);
        setFormData({
          score: freshGrade.score || '',
          grade: freshGrade.grade || '',
          comments: freshGrade.comments || ''
        });
        
        setSuccess(`Grade data refreshed successfully. Current version: ${freshGrade.version}`);
      } catch (err) {
        console.error('Error refreshing grade:', err);
        setError('Failed to refresh grade: ' + (err.response?.data?.message || err.message || ''));
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && grades.length === 0) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Add custom header */}
      <StyledAppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={handleBackToDashboard} sx={{ mr: 1 }}>
              <DashboardIcon />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'white' }}>
              Grade Management
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleOpenMenu} size="small">
            <Avatar sx={{ bgcolor: '#3f8cff', width: 40, height: 40 }}>
              {currentUser?.username?.charAt(0)?.toUpperCase() || 'M'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            elevation={3}
            PaperProps={{
              sx: {
                backgroundColor: alpha('#1e1e1e', 0.9),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                minWidth: 200,
                color: 'white'
              }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {currentUser?.username}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {currentUser?.email}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem onClick={handleViewProfile} sx={{ gap: 1.5 }}>
              <PersonIcon fontSize="small" /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5 }}>
              <LogoutIcon fontSize="small" /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      
      <StyledContainer maxWidth="lg">
        <StyledPaper sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GradeIcon sx={{ color: '#3f8cff', fontSize: 42, mr: 2 }} />
          <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                  Grade Management
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Manage and track student grades across all courses.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <StyledButton 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenNewGradeDialog}
            >
              Assign Grade
              </StyledButton>
            
              <StyledButton 
              variant="contained" 
              color="success" 
              startIcon={<PlaylistAddIcon />} 
              onClick={handleBatchEntryOpen}
            >
              Batch Entry
              </StyledButton>
          </Box>
        </Box>
        </StyledPaper>

      {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: alpha('#f44336', 0.15), 
              color: '#f48fb1',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              '& .MuiAlert-icon': {
                color: '#f48fb1'
              }
            }} 
            onClose={() => setError('')}
          >
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
            <Alert 
              severity="success" 
              onClose={() => setSuccess('')}
              sx={{
                backgroundColor: alpha('#4caf50', 0.9),
                color: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
            {success}
          </Alert>
        </Snackbar>
      )}

      {/* Main content with tabs */}
        <StyledPaper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
            sx={{ 
              mb: 3,
              borderBottom: 1, 
              borderColor: 'rgba(255,255,255,0.1)',
              '& .MuiTabs-indicator': {
                backgroundColor: '#3f8cff',
                height: 3,
                borderRadius: 3
              },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                '&.Mui-selected': {
                  color: '#3f8cff',
                },
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500
              }
            }}
          >
            <Tab 
              icon={<SchoolIcon />} 
              label="Grades" 
              iconPosition="start"
              sx={{ minHeight: 48, py: 1 }}
            />
            <Tab 
              icon={<BarChartIcon />} 
              label="Analytics" 
              iconPosition="start"
              sx={{ minHeight: 48, py: 1 }}
            />
        </Tabs>
        
        {tabValue === 0 && (
          <>
      {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <StyledFormControl fullWidth>
              <InputLabel id="course-filter-label">Filter by Course</InputLabel>
              <Select
                labelId="course-filter-label"
                value={courseFilter}
                label="Filter by Course"
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <MenuItem value="">All Courses</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </MenuItem>
                ))}
              </Select>
                  </StyledFormControl>
          </Grid>
                
                <Grid item xs={12} md={6}>
                  <StyledTextField
                  fullWidth
                  placeholder="Search grades..."
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                  }}
                />
        </Grid>
            </Grid>

      {/* Grades Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress sx={{ color: '#3f8cff' }} />
              </Box>
            ) : filteredGrades.length > 0 ? (
              <>
                  <StyledTableContainer>
        <Table>
          <TableHead>
            <TableRow>
                      <StyledTableCell onClick={() => handleSort('studentId')}>
                        <Tooltip title="Click to sort by student" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Student
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              {sortConfig.key === 'studentId' && (
                                sortConfig.direction === 'asc' 
                                  ? <ArrowUpwardIcon fontSize="small" />
                                  : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSort('courseId')}>
                        <Tooltip title="Click to sort by course" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Course
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              {sortConfig.key === 'courseId' && (
                                sortConfig.direction === 'asc' 
                                  ? <ArrowUpwardIcon fontSize="small" />
                                  : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSort('score')}>
                        <Tooltip title="Click to sort by score" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Score
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              {sortConfig.key === 'score' && (
                                sortConfig.direction === 'asc' 
                                  ? <ArrowUpwardIcon fontSize="small" />
                                  : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSort('grade')}>
                        <Tooltip title="Click to sort by grade" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Grade
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              {sortConfig.key === 'grade' && (
                                sortConfig.direction === 'asc' 
                                  ? <ArrowUpwardIcon fontSize="small" />
                                  : <ArrowDownwardIcon fontSize="small" />
                              )}
                            </Box>
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>Comments</StyledTableCell>
                      <ActionTableCell>Actions</ActionTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                    {getPaginatedGrades().map((grade) => (
                          <StyledTableRow key={grade.id}>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {getStudentNameById(grade.studentId)}
                              </Typography>
                            </TableCell>
                        <TableCell>
                          <Chip
                            label={getCourseNameById(grade.courseId)}
                            size="small"
                                sx={{
                                  backgroundColor: alpha('#3f8cff', 0.15),
                                  color: '#3f8cff',
                                  borderRadius: 8,
                                  fontWeight: 500,
                                  border: '1px solid rgba(63, 140, 255, 0.3)'
                                }}
                          />
                        </TableCell>
                        <TableCell>
                              <Typography variant="body1">
                                <Box component="span" sx={{ fontWeight: 600 }}>
                                  {grade.score}
                                </Box>
                                <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  /100
                                </Box>
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <GradeChip
                            label={grade.grade}
                            size="small"
                                gradeValue={grade.grade}
                          />
                        </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 200 }}>
                              <Typography
                                noWrap
                                sx={{
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  maxWidth: '100%'
                                }}
                              >
                                {grade.comments || '-'}
                              </Typography>
                            </TableCell>
                <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit Grade" arrow>
                          <IconButton
                            color="primary"
                            onClick={() => handleDialogOpen(grade)}
                            size="small"
                                    sx={{
                                      backgroundColor: alpha('#3f8cff', 0.1),
                                      '&:hover': {
                                        backgroundColor: alpha('#3f8cff', 0.2),
                                      }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Grade" arrow>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(grade)}
                            size="small"
                                    sx={{
                                      backgroundColor: alpha('#f44336', 0.1),
                                      '&:hover': {
                                        backgroundColor: alpha('#f44336', 0.2),
                                      }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                      </IconButton>
                                </Tooltip>
                              </Box>
                </TableCell>
                          </StyledTableRow>
            ))}
                    {filteredGrades.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography sx={{ py: 2 }}>No grades found matching your filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
                  </StyledTableContainer>
                  <StyledTablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredGrades.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
              </>
            ) : (
                <Alert severity="info" sx={{ 
                  backgroundColor: alpha('#2196f3', 0.15), 
                  color: '#90caf9',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#90caf9'
                  }
                }}>
                  No grades found.
                </Alert>
            )}
          </>
        )}

        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Total Grades
                    </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                        {stats.totalGrades}
                      </Typography>
                  </CardContent>
                </Card>
              </Grid>
                
              <Grid item xs={12} md={3}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Average Score
                    </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                        {stats.averageScore.toFixed(1)}
                      </Typography>
                  </CardContent>
                </Card>
              </Grid>
                
              <Grid item xs={12} md={3}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Highest Score
                    </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                        {stats.highestScore}
                      </Typography>
                  </CardContent>
                </Card>
              </Grid>
                
              <Grid item xs={12} md={3}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Lowest Score
                    </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                        {stats.lowestScore}
                      </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Grade Distribution */}
              <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                      Grade Distribution
                    </Typography>
                      
                      {Object.keys(stats.gradeDistribution).length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                              const count = stats.gradeDistribution[grade] || 0;
                              const percentage = stats.totalGrades ? (count / stats.totalGrades) * 100 : 0;
                              let color;
                              switch(grade) {
                                case 'A': color = '#4caf50'; break;
                                case 'B': color = '#2196f3'; break;
                                case 'C': color = '#ff9800'; break;
                                case 'D': color = '#ff5722'; break;
                                case 'F': color = '#f44336'; break;
                                default: color = '#9e9e9e';
                              }
                              
                              return (
                                <Grid item xs={12} key={grade}>
                                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <Box display="flex" alignItems="center">
                                      <GradeChip
                                        label={grade}
                                        size="small"
                                        gradeValue={grade}
                                        sx={{ mr: 1 }}
                                      />
                                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {count} student{count !== 1 ? 's' : ''}
                            </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                      {percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: '100%',
                                      height: 8, 
                                      bgcolor: alpha(color, 0.1),
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      position: 'relative'
                            }}
                          >
                            <Box
                              sx={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                height: '100%',
                                        width: `${percentage}%`,
                                        bgcolor: alpha(color, 0.6),
                                        borderRadius: 1,
                              }}
                            />
                          </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            No grade data available
                          </Typography>
                    </Box>
                      )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Course Performance */}
              <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}>
                  <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                      Course Performance
                    </Typography>
                      
                      {stats.coursePerformance.length > 0 ? (
                        <Box sx={{ overflowY: 'auto', maxHeight: 300 }}>
                          <StyledTableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Course</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Students</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Avg. Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                                {stats.coursePerformance.map((course, index) => (
                                  <TableRow key={index} sx={{ 
                                    '&:hover': { 
                                      backgroundColor: alpha('#2d2d2d', 0.8),
                                    }
                                  }}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                                        {course.courseCode}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        {course.courseName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                      {course.numberOfStudents}
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 'bold', mr: 1, color: 'white' }}>
                                          {course.averageScore.toFixed(1)}
                                        </Typography>
                                        <GradeChip
                                          label={letterGradeFromScore(course.averageScore)}
                                          size="small"
                                          gradeValue={letterGradeFromScore(course.averageScore)}
                                        />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                          </StyledTableContainer>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            No course performance data available
                          </Typography>
                        </Box>
                      )}
                  </CardContent>
                </Card>
              </Grid>
                
                {/* Replace Grade Status Overview with Enhanced Class Progress Tracking */}
                <Grid item xs={12}>
                  <Card sx={{ 
                    backgroundColor: alpha('#1e1e1e', 0.8),
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                        Class Progress Tracking
                      </Typography>
                      
                      <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: '1px solid rgba(63, 140, 255, 0.3)', 
                            borderRadius: 2,
                            backgroundColor: alpha('#3f8cff', 0.1)
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" sx={{ color: '#3f8cff' }}>
                                Top Students
                              </Typography>
                              <SchoolIcon sx={{ color: '#3f8cff', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h3" sx={{ mt: 2, color: 'white', fontWeight: 700 }}>
                              {grades.filter(g => g.grade === 'A').length}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                              Students earning A grades
                            </Typography>
                            
                            {/* Top students list */}
                            {grades.filter(g => g.grade === 'A').length > 0 && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                  Top performing students:
                                </Typography>
                                <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
                                  {grades
                                    .filter(g => g.grade === 'A')
                                    .slice(0, 5)
                                    .map((grade, index) => (
                                      <Box key={index} sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: index < Math.min(grades.filter(g => g.grade === 'A').length, 4) ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                                      }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#3f8cff', fontSize: '0.8rem', mr: 1 }}>
                                            {getStudentNameById(grade.studentId).charAt(0).toUpperCase()}
                                          </Avatar>
                                          <Typography variant="body2" sx={{ color: 'white' }}>
                                            {getStudentNameById(grade.studentId)}
                                          </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                                          {grade.score}
                                        </Typography>
                                      </Box>
                                    ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: '1px solid rgba(156, 39, 176, 0.3)', 
                            borderRadius: 2,
                            backgroundColor: alpha('#9c27b0', 0.1)
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" sx={{ color: '#9c27b0' }}>
                                Passing Rate
                              </Typography>
                              <BarChartIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h3" sx={{ mt: 2, color: 'white', fontWeight: 700 }}>
                              {grades.length > 0 ? ((grades.filter(g => g.grade !== 'F').length / grades.length) * 100).toFixed(1) : '0.0'}%
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                              Students with passing grades
                            </Typography>
                            
                            {/* Grade distribution */}
                            {grades.length > 0 && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                  Overall grade distribution:
                                </Typography>
                                <Grid container spacing={1}>
                                  {['A', 'B', 'C', 'D', 'F'].map(grade => {
                                    const count = grades.filter(g => g.grade === grade).length;
                                    const percentage = grades.length > 0 ? (count / grades.length) * 100 : 0;
                                    
                                    return (
                                      <Grid item xs={12} key={grade}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <GradeChip
                                              label={grade}
                                              size="small"
                                              gradeValue={grade}
                                              sx={{ mr: 1, minWidth: 32 }}
                                            />
                                            <Typography variant="body2" sx={{ color: 'white' }}>
                                              {count} {count === 1 ? 'student' : 'students'}
                                            </Typography>
                                          </Box>
                                          <Typography variant="body2" sx={{ color: 'white' }}>
                                            {percentage.toFixed(1)}%
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    );
                                  })}
            </Grid>
          </Box>
        )}
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: '1px solid rgba(233, 30, 99, 0.3)', 
                            borderRadius: 2,
                            backgroundColor: alpha('#e91e63', 0.1)
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" sx={{ color: '#e91e63' }}>
                                At Risk
                              </Typography>
                              <SearchIcon sx={{ color: '#e91e63', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h3" sx={{ mt: 2, color: 'white', fontWeight: 700 }}>
                              {grades.filter(g => g.grade === 'F' || g.grade === 'D').length}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                              Students who may need assistance
                            </Typography>
                            
                            {/* At-risk students list */}
                            {grades.filter(g => g.grade === 'F' || g.grade === 'D').length > 0 && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                  Students requiring attention:
                                </Typography>
                                <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
                                  {grades
                                    .filter(g => g.grade === 'F' || g.grade === 'D')
                                    .slice(0, 5)
                                    .map((grade, index) => (
                                      <Box key={index} sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: index < Math.min(grades.filter(g => g.grade === 'F' || g.grade === 'D').length, 4) ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                                      }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Avatar sx={{ 
                                            width: 24, 
                                            height: 24, 
                                            bgcolor: grade.grade === 'F' ? '#f44336' : '#ff9800', 
                                            fontSize: '0.8rem', 
                                            mr: 1 
                                          }}>
                                            {getStudentNameById(grade.studentId).charAt(0).toUpperCase()}
                                          </Avatar>
                                          <Box>
                                            <Typography variant="body2" sx={{ color: 'white' }}>
                                              {getStudentNameById(grade.studentId)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                              {getCourseNameById(grade.courseId)}
                                            </Typography>
                                          </Box>
                                        </Box>
                                        <GradeChip
                                          label={grade.grade}
                                          size="small"
                                          gradeValue={grade.grade}
                                        />
                                      </Box>
                                    ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </StyledPaper>

        {/* Dialog styling updates */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              backgroundImage: 'linear-gradient(to bottom right, rgba(31, 31, 31, 0.8), rgba(25, 25, 25, 0.8))',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>{isEditing ? 'Edit Grade' : 'Add New Grade'}</div>
            {isEditing && (
              <Tooltip title="Refresh grade data">
                <IconButton 
                  onClick={handleRefreshGrade}
                  size="small"
                  sx={{ color: '#3f8cff' }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </DialogTitle>
          <DialogContent>
            {isEditing && selectedGrade && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                mb: 2, 
                p: 1, 
                bgcolor: 'rgba(63, 140, 255, 0.1)', 
                borderRadius: 1
              }}>
                <InfoIcon sx={{ mr: 1, color: '#3f8cff' }} />
                <Typography variant="body2">
                  You are editing version {selectedGrade.version !== undefined ? selectedGrade.version : 'N/A'} of this grade.
                  If someone else updates this grade while you're editing, you'll need to refresh to get the latest version.
                </Typography>
              </Box>
            )}
            {showRefreshButton && (
              <Alert 
                severity="warning" 
                sx={{ mt: 2, mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={handleRefreshGrade}>
                    Refresh
                  </Button>
                }
              >
                This grade was modified by someone else. Please refresh to get the latest version.
              </Alert>
            )}
            <Box component="form" sx={{ mt: 2 }}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Score"
                name="score"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                value={formData.score}
                onChange={handleInputChange}
                helperText="Grade will be automatically assigned based on score"
                sx={{ mb: 3 }}
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Grade"
                name="grade"
                value={formData.grade}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mb: 3 }}
              />
              <StyledTextField
                margin="normal"
                fullWidth
                label="Comments"
                name="comments"
                multiline
                rows={4}
                value={formData.comments}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
              />
              {isEditing && selectedGrade && (
                <StyledTextField
                  margin="normal"
                  fullWidth
                  label="Version"
                  name="version"
                  value={selectedGrade.version}
                  InputProps={{
                    readOnly: true,
                    sx: { 
                      bgcolor: 'rgba(63, 140, 255, 0.05)',
                      '& .MuiInputBase-input': {
                        fontWeight: 'bold',
                        color: '#3f8cff'
                      }
                    }
                  }}
                  helperText="Used for optimistic locking and conflict detection"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <StyledButton 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.score}
          >
            {loading ? 'Saving...' : 'Save'}
            </StyledButton>
        </DialogActions>
      </Dialog>
      
        {/* Add New Grade Dialog */}
        <Dialog
          open={openNewGradeDialog}
          onClose={handleCloseNewGradeDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              backgroundImage: 'linear-gradient(to bottom right, rgba(31, 31, 31, 0.8), rgba(25, 25, 25, 0.8))',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Assign New Grade
          </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
              <StyledFormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="student-select-label">Student</InputLabel>
              <Select
                labelId="student-select-label"
                name="studentId"
                value={newGradeData.studentId}
                onChange={handleNewGradeInputChange}
                  label="Student"
                  required
                >
                  <MenuItem value="">
                    <em>Select a student</em>
                  </MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.username}
                    </MenuItem>
                  ))}
              </Select>
              </StyledFormControl>
            
              <StyledFormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="course-select-label">Course</InputLabel>
              <Select
                labelId="course-select-label"
                name="courseId"
                value={newGradeData.courseId}
                onChange={handleNewGradeInputChange}
                  label="Course"
                  required
              >
                  <MenuItem value="">
                    <em>Select a course</em>
                  </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </MenuItem>
                ))}
              </Select>
              </StyledFormControl>
            
              <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Score"
              name="score"
              type="number"
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              value={newGradeData.score}
              onChange={handleNewGradeInputChange}
              helperText="Grade will be automatically assigned based on score"
                sx={{ mb: 3 }}
            />
            
              <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Grade"
              name="grade"
              value={newGradeData.grade}
              InputProps={{
                readOnly: true,
              }}
                sx={{ mb: 3 }}
            />
            
              <StyledTextField
              margin="normal"
              fullWidth
              label="Comments"
              name="comments"
              multiline
              rows={4}
              value={newGradeData.comments}
              onChange={handleNewGradeInputChange}
            />
          </Box>
        </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button onClick={handleCloseNewGradeDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <StyledButton
            onClick={handleCreateGrade} 
            variant="contained" 
              color="primary"
            disabled={loading || !newGradeData.studentId || !newGradeData.courseId || !newGradeData.score}
          >
              {loading ? 'Saving...' : 'Create Grade'}
            </StyledButton>
        </DialogActions>
      </Dialog>

        {/* Batch Entry Dialog */}
      <Dialog
          open={batchEntryDialog}
          onClose={handleBatchEntryClose}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              backgroundImage: 'linear-gradient(to bottom right, rgba(31, 31, 31, 0.8), rgba(25, 25, 25, 0.8))',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Batch Grade Entry
          </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <StyledFormControl fullWidth>
                    <InputLabel id="batch-course-label">Select Course</InputLabel>
              <Select
                      labelId="batch-course-label"
                      value={selectedCourse?.id || ''}
                onChange={handleBatchCourseSelect}
                      label="Select Course"
              >
                <MenuItem value="">
                  <em>Select a course</em>
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </MenuItem>
                ))}
              </Select>
                  </StyledFormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <StyledTextField
                      label="Quick Fill Score"
                      type="number"
                      value={quickFillScore}
                      onChange={(e) => setQuickFillScore(e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ flex: 1 }}
                    />
                    <StyledButton
                      variant="contained"
                    onClick={handleQuickFill}
                    disabled={!quickFillScore || isNaN(parseInt(quickFillScore, 10))}
                    >
                      Apply to All
                    </StyledButton>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={showOnlyUngraded} 
                          onChange={handleToggleUngraded} 
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#3f8cff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: alpha('#3f8cff', 0.5),
                          }
                        }}
                      />
                    }
                    label={<Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>Show only students without existing grades</Typography>}
                  />
                      </Grid>
                      </Grid>

              {selectedCourse ? (
                <>
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Enter Grades for {selectedCourse.courseCode} - {selectedCourse.courseName}
                        </Typography>
                    
                    <Box sx={{ bgcolor: alpha('#2d2d2d', 0.6), p: 2, borderRadius: 2, mb: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                        Batch Summary: 
                        <Box component="span" sx={{ mx: 1, color: '#90caf9', fontWeight: 600 }}>
                          {calculateBatchSummary().total}
                  </Box>
                        students total,
                        <Box component="span" sx={{ mx: 1, color: '#ce93d8', fontWeight: 600 }}>
                          {calculateBatchSummary().alreadyGraded}
                        </Box> 
                        already graded,
                        <Box component="span" sx={{ mx: 1, color: '#81c784', fontWeight: 600 }}>
                          {calculateBatchSummary().valid}
                        </Box> 
                        valid entries
                      </Typography>
                    </Box>
                  </Box>

                  <StyledTableContainer>
                    <Table size="small">
                    <TableHead>
                      <TableRow>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.95rem' }}>Student</TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.95rem' }}>Score</TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.95rem' }}>Grade</TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '0.95rem' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {getFilteredBatchGrades().map((entry) => (
                          <TableRow key={entry.studentId} sx={{ 
                            backgroundColor: entry.hasExistingGrade ? alpha('#2d2d2d', 0.7) : alpha('#1e1e1e', 0.4),
                            '&:hover': {
                              backgroundColor: alpha('#3d3d3d', 0.5),
                            }
                          }}>
                            <TableCell sx={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                              {entry.studentName}
                            </TableCell>
                          <TableCell>
                              <StyledTextField
                                size="small"
                                type="number"
                                InputProps={{ 
                                  inputProps: { min: 0, max: 100, step: 1 },
                                  sx: { color: 'white', fontSize: '0.95rem' }
                                }}
                                value={entry.score}
                                onChange={(e) => handleBatchScoreChange(entry.studentId, e.target.value)}
                                disabled={entry.hasExistingGrade && showOnlyUngraded}
                                sx={{ 
                                  width: '120px',
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: alpha('#3d3d3d', 0.8),
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {entry.grade ? (
                                <GradeChip
                                  label={entry.grade}
                                  size="small"
                                  gradeValue={entry.grade}
                                  sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                                />
                              ) : (
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                                  Not set
                              </Typography>
                            )}
                          </TableCell>
                            <TableCell>
                              {entry.hasExistingGrade ? (
                                <Chip 
                                  label="Already Graded" 
                              size="small"
                                  sx={{ 
                                    backgroundColor: alpha('#9e9e9e', 0.3),
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontWeight: 500,
                                    border: '1px solid rgba(158, 158, 158, 0.5)'
                                  }}
                                />
                              ) : entry.score ? (
                            <Chip
                                  label="Ready" 
                              size="small"
                                  sx={{ 
                                    backgroundColor: alpha('#4caf50', 0.3),
                                    color: '#81c784',
                                    fontWeight: 500,
                                    border: '1px solid rgba(76, 175, 80, 0.5)'
                                  }}
                                />
                              ) : (
                                <Chip 
                                  label="Needs Score" 
                                  size="small"
                                  sx={{ 
                                    backgroundColor: alpha('#ff9800', 0.3),
                                    color: '#ffb74d',
                                    fontWeight: 500,
                                    border: '1px solid rgba(255, 152, 0, 0.5)'
                                  }}
                                />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </StyledTableContainer>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Please select a course to begin batch grade entry
                  </Typography>
                </Box>
            )}
          </Box>
        </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button onClick={handleBatchEntryClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <StyledButton
            onClick={handleBatchSubmit} 
            variant="contained" 
            color="primary"
            disabled={batchSubmitting || !selectedCourse || calculateBatchSummary().valid === 0}
          >
              {batchSubmitting ? 'Submitting...' : 'Submit Grades'}
            </StyledButton>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              backgroundImage: 'linear-gradient(to bottom right, rgba(31, 31, 31, 0.8), rgba(25, 25, 25, 0.8))',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1">
              Are you sure you want to delete the grade for <b>{deleteDialog.studentName}</b> in <b>{deleteDialog.courseName}</b>?
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleDeleteCancel} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
          </Button>
            <StyledButton onClick={handleDeleteConfirm} variant="contained" color="error">
              Delete
            </StyledButton>
        </DialogActions>
      </Dialog>
      </StyledContainer>
    </Box>
  );
};

export default ModeratorGrades; 