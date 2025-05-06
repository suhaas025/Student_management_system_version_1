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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  FormControlLabel,
  Switch,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PieChartIcon from '@mui/icons-material/PieChart';
import DomainIcon from '@mui/icons-material/Domain';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import gradeService from '../../services/grade.service';
import userService from '../../services/user.service';
import courseService from '../../services/course.service';
import {
  StyledPaper, 
  StyledTableCell, 
  StyledTableHead, 
  StyledButton, 
  StyledDialog,
  PageContainer,
  ContentContainer,
  AdminHeader,
  darkDropdownStyles
} from './styles.jsx';

// Import recharts components
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Styled component for action header cell (non-sortable)
const ActionTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
}));

const GradeManagement = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null, 
    direction: 'asc'
  });
  const [currentGrade, setCurrentGrade] = useState({
    id: null,
    studentId: '',
    courseCode: '',
    score: 0,
    grade: '',
    semester: '',
    academicYear: '',
    version: undefined
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    gradeId: null,
    studentName: '',
    courseName: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [tabValue, setTabValue] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalGrades: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    gradeDistribution: {},
    coursePerformance: []
  });

  // Add new state for batch grade entry
  const [batchEntryDialog, setBatchEntryDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [batchGrades, setBatchGrades] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [showOnlyUngraded, setShowOnlyUngraded] = useState(false);
  const [quickFillScore, setQuickFillScore] = useState('');

  // Add new state for analytics tab
  const [analyticsTabValue, setAnalyticsTabValue] = useState(0);

  // Add new state for import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  // Load data on component mount
  useEffect(() => {
    fetchGrades();
    fetchStudents();
    fetchCourses();
  }, []);

  // Filter grades when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGrades(grades);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = grades.filter(grade => 
        grade.studentName.toLowerCase().includes(query) ||
        grade.courseName.toLowerCase().includes(query) ||
        grade.courseCode.toLowerCase().includes(query) ||
        grade.grade.toLowerCase().includes(query) ||
        grade.semester.toLowerCase().includes(query) ||
        grade.academicYear.toLowerCase().includes(query)
      );
      setFilteredGrades(filtered);
    }
  }, [searchQuery, grades]);

  // Calculate statistics when grades change
  useEffect(() => {
    if (grades.length > 0) {
      calculateStats();
    }
  }, [grades]);

  // Fetch all grades
  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await gradeService.getAllGrades();
      setGrades(response.data);
      setFilteredGrades(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Failed to load grades. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all students
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      console.log('Fetching students from API...');
      const students = await userService.getAllStudents();
      console.log('Student API response:', students);
      setStudents(students);
      console.log(`Loaded ${students.length} students`);
    } catch (err) {
      console.error('Error fetching students:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await courseService.getAllCourses();
      const coursesArray = Array.isArray(response.data) ? response.data : response.data.content;
      setCourses(coursesArray);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Calculate statistics from grades data
  const calculateStats = () => {
    const scores = grades.map(grade => grade.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    // Create grade distribution
    const gradeDistribution = {};
    grades.forEach(grade => {
      if (gradeDistribution[grade.grade]) {
        gradeDistribution[grade.grade]++;
      } else {
        gradeDistribution[grade.grade] = 1;
      }
    });
    
    // Calculate course performance
    const courseGroups = {};
    grades.forEach(grade => {
      if (!courseGroups[grade.courseCode]) {
        courseGroups[grade.courseCode] = {
          courseName: grade.courseName,
          scores: []
        };
      }
      courseGroups[grade.courseCode].scores.push(grade.score);
    });
    
    const coursePerformance = Object.keys(courseGroups).map(code => {
      const scores = courseGroups[code].scores;
      return {
        courseCode: code,
        courseName: courseGroups[code].courseName,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        numberOfStudents: scores.length
      };
    });
    
    setStats({
      totalGrades: grades.length,
      averageScore,
      highestScore,
      lowestScore,
      gradeDistribution,
      coursePerformance
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

  // Handle input change for grade form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for course selection to auto-fill semester and academic year
    if (name === 'courseCode' && value) {
      // Find the selected course
      const selectedCourse = courses.find(course => course.courseCode === value);
      
      // Update the form with course details
      if (selectedCourse) {
        console.log(`Auto-filling from course: ${selectedCourse.semester}`);
        
        // Determine academic year - use course data or current academic year
        const academicYear = selectedCourse.academicYear || getCurrentAcademicYear();
        
        setCurrentGrade(prev => ({
          ...prev,
          [name]: value,
          semester: selectedCourse.semester || prev.semester,
          academicYear: academicYear
        }));
        return;
      }
    }
    
    // Normal handling for other fields
    setCurrentGrade(prev => ({
      ...prev,
      [name]: name === 'score' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };

  // Open dialog for creating/editing a grade
  const handleDialogOpen = (grade = null) => {
    if (grade) {
      // Edit mode
      setCurrentGrade({
        id: grade.id,
        studentId: grade.studentId,
        courseCode: grade.courseCode,
        score: grade.score,
        grade: grade.grade,
        semester: grade.semester,
        academicYear: grade.academicYear,
        version: grade.version
      });
      setIsEditing(true);
    } else {
      // Create mode
      setCurrentGrade({
        id: null,
        studentId: '',
        courseCode: '',
        score: 0,
        grade: '',
        semester: '',
        academicYear: '',
        version: undefined
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Submit form for creating/editing a grade
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!currentGrade.studentId || !currentGrade.courseCode || 
          !currentGrade.grade || !currentGrade.semester || !currentGrade.academicYear) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        return;
      }
      
      // Validate score
      if (currentGrade.score < 0 || currentGrade.score > 100) {
        setSnackbar({
          open: true,
          message: 'Score must be between 0 and 100',
          severity: 'error'
        });
        return;
      }
      
      // Format the grade data for the API
      const gradeData = {
        studentId: currentGrade.studentId,
        courseCode: currentGrade.courseCode,
        score: currentGrade.score,
        grade: currentGrade.grade,
        semester: currentGrade.semester,
        academicYear: currentGrade.academicYear,
        version: currentGrade.version
      };
      
      if (isEditing) {
        // Update existing grade
        try {
          // Log version information for debugging
          console.log(`Submitting update for grade ID ${currentGrade.id} with version ${currentGrade.version}`);
          
          // Before updating, fetch the latest version to ensure we're current
          const currentVersionResponse = await gradeService.getGradeById(currentGrade.id);
          const serverVersion = currentVersionResponse.data.version;
          
          // Check if our version is stale
          if (gradeData.version !== serverVersion) {
            console.log(`Version mismatch: Form has version ${gradeData.version}, server has ${serverVersion}`);
            setSnackbar({
              open: true,
              message: 'This grade was modified by someone else. Please refresh and try again.',
              severity: 'error',
              refresh: true
            });
            return;
          }
          
          // Version matches, proceed with update
          console.log(`Version check passed. Updating with version ${gradeData.version}`);
          await gradeService.updateGrade(currentGrade.id, gradeData);
          
          setSnackbar({
            open: true,
            message: 'Grade updated successfully!',
            severity: 'success'
          });
        } catch (err) {
          if (err.response && err.response.status === 409) {
            console.error('Version conflict during update:', err);
            setSnackbar({
              open: true,
              message: 'This grade was modified by someone else. Please refresh and try again.',
              severity: 'error',
              refresh: true
            });
            return;
          } else {
            throw err;
          }
        }
      } else {
        // Create new grade
        await gradeService.createGrade(gradeData);
        setSnackbar({
          open: true,
          message: 'Grade created successfully!',
          severity: 'success'
        });
      }
      
      // Refresh the grades list
      fetchGrades();
      handleDialogClose();
    } catch (err) {
      console.error('Error saving grade:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} grade: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Add a refresh handler for conflict errors
  const handleRefreshGrade = async () => {
    if (currentGrade && currentGrade.id) {
      try {
        setSnackbar({ open: true, message: 'Refreshing grade data...', severity: 'info' });
        console.log(`Fetching latest version for grade ID ${currentGrade.id}. Current version: ${currentGrade.version}`);
        
        const response = await gradeService.getGradeById(currentGrade.id);
        const freshGrade = response.data;
        
        console.log(`Retrieved grade with version ${freshGrade.version}`);
        
        // Completely close dialog and clear state
        setOpenDialog(false);
        
        // Add extra small delay to allow React to fully update component state
        setTimeout(() => {
          // Create a completely fresh grade object to avoid any state inconsistencies
          const refreshedGrade = {
            id: freshGrade.id,
            studentId: freshGrade.studentId,
            courseCode: freshGrade.courseCode,
            score: freshGrade.score,
            grade: freshGrade.grade,
            semester: freshGrade.semester,
            academicYear: freshGrade.academicYear,
            version: freshGrade.version
          };
          
          // First set the current grade directly
          setCurrentGrade(refreshedGrade);
          
          // Then reopen the dialog with fresh data
          setIsEditing(true);
          setOpenDialog(true);
          
          setSnackbar({ 
            open: true, 
            message: `Grade successfully refreshed. Version updated from ${currentGrade.version} to ${freshGrade.version}`, 
            severity: 'success' 
          });
          
          console.log(`Grade refresh complete. New version: ${freshGrade.version}`);
        }, 500); // Increased delay to ensure state updates
      } catch (err) {
        console.error('Error refreshing grade:', err);
        
        // Show more detailed error message
        let errorMessage = 'Failed to refresh grade';
        if (err.response) {
          errorMessage += `: ${err.response.data?.message || err.response.statusText}`;
        } else if (err.message) {
          errorMessage += `: ${err.message}`;
        }
        
        setSnackbar({ 
          open: true, 
          message: errorMessage,
          severity: 'error' 
        });
      }
    }
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (grade) => {
    setDeleteDialog({
      open: true,
      gradeId: grade.id,
      studentName: grade.studentName,
      courseName: grade.courseName
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
      setSnackbar({
        open: true,
        message: 'Grade deleted successfully!',
        severity: 'success'
      });
      fetchGrades(); // Refresh the list
    } catch (err) {
      console.error('Error deleting grade:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete grade: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    } finally {
      handleDeleteCancel();
    }
  };

  // Shorthand for delete
  const handleDelete = (grade) => {
    handleDeleteClick(grade);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Determine letter grade based on score
  const letterGradeFromScore = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Helper to suggest letter grade as user enters score
  const handleScoreChange = (e) => {
    const score = parseInt(e.target.value, 10);
    setCurrentGrade(prev => ({
      ...prev,
      score,
      grade: letterGradeFromScore(score)
    }));
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort grades when search query, grades array, or sortConfig changes
  useEffect(() => {
    if (!grades.length) return;
    
    let result = [...grades];
    
    // Apply filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(grade => 
        (grade.studentName?.toLowerCase() || '').includes(query) ||
        (grade.courseName?.toLowerCase() || '').includes(query) ||
        (grade.courseCode?.toLowerCase() || '').includes(query) ||
        (grade.grade?.toLowerCase() || '').includes(query) ||
        (grade.semester?.toLowerCase() || '').includes(query) ||
        (grade.academicYear?.toLowerCase() || '').includes(query)
      );
    }
    
    // Apply sort if we have a sort key
    if (sortConfig.key) {
      result.sort((a, b) => {
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
    
    setFilteredGrades(result);
  }, [searchQuery, grades, sortConfig]);

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
    const courseCode = event.target.value;
    if (!courseCode) {
      setSelectedCourse(null);
      setBatchGrades([]);
      return;
    }

    const course = courses.find(c => c.courseCode === courseCode);
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
          courseCode: course.courseCode,
          courseName: course.courseName,
          score: '',
          grade: '',
          semester: course.semester || '',
          academicYear: course.academicYear || getCurrentAcademicYear(),
          hasExistingGrade: hasGrade
        };
      });

      setBatchGrades(newBatchGrades);
    } catch (err) {
      console.error('Error fetching existing grades:', err);
      
      // Fall back to simpler implementation if fetching fails
      const newBatchGrades = students.map(student => ({
        studentId: student.id,
        studentName: student.username,
        courseCode: course.courseCode,
        courseName: course.courseName,
        score: '',
        grade: '',
        semester: course.semester || '',
        academicYear: course.academicYear || getCurrentAcademicYear(),
        hasExistingGrade: false
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
      setSnackbar({
        open: true,
        message: 'Quick fill score must be between 0 and 100',
        severity: 'error'
      });
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

  // Filter batch grades based on showOnlyUngraded setting
  const filteredBatchGrades = showOnlyUngraded 
    ? batchGrades.filter(grade => !grade.hasExistingGrade)
    : batchGrades;

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
      setSnackbar({
        open: true,
        message: 'No valid grades to submit',
        severity: 'error'
      });
      return;
    }

    try {
      setBatchSubmitting(true);
      // Use the new batch API
      await gradeService.createGradesBatch(validEntries.map(entry => ({
        studentId: entry.studentId,
        courseCode: entry.courseCode,
        score: entry.score,
        grade: entry.grade,
        semester: entry.semester,
        academicYear: entry.academicYear
      })));
      setSnackbar({
        open: true,
        message: `Successfully added ${validEntries.length} grades`,
        severity: 'success'
      });
      fetchGrades();
      handleBatchEntryClose();
    } catch (err) {
      console.error('Error submitting batch grades:', err);
      setSnackbar({
        open: true,
        message: `Failed to submit batch grades: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Calculate batch summary statistics
  const calculateBatchSummary = () => {
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

  // Update the table body styling to ensure first row is visible
  const getFilteredGrades = () => {
    // Return all grades since we removed the status filters
    return [...filteredGrades];
  };

  // Calculate batch summary before return so it is always defined
  const batchSummary = calculateBatchSummary();

  // Add this helper for formatting dates
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  // Handle opening import dialog
  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setImportFile(null);
    setImportFeedback(null);
  };

  // Handle closing import dialog
  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportFeedback(null);
  };

  // Handle import file change
  const handleImportFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportFeedback(null);
  };

  // Handle import grades
  const handleImportGrades = async () => {
    if (!importFile) {
      setImportFeedback({ type: 'error', message: 'Please select a CSV file.' });
      return;
    }
    setImportLoading(true);
    setImportFeedback(null);
    try {
      const result = await gradeService.importGradesCsv(importFile);
      setImportFeedback({ type: 'success', message: result.data.message || 'Import successful.' });
      fetchGrades();
    } catch (err) {
      setImportFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    }
    setImportLoading(false);
  };

  // Add handler for downloading the import template
  const handleDownloadTemplate = async () => {
    try {
      const response = await gradeService.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'grades_template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  // Defensive checks for analytics data
  const safeStats = {
    totalGrades: stats?.totalGrades ?? 0,
    averageScore: stats?.averageScore ?? 0,
    highestScore: stats?.highestScore ?? 0,
    lowestScore: stats?.lowestScore ?? 0,
    gradeDistribution: stats?.gradeDistribution && typeof stats.gradeDistribution === 'object' ? stats.gradeDistribution : {},
    coursePerformance: Array.isArray(stats?.coursePerformance) ? stats.coursePerformance : [],
  };

  return (
    <PageContainer>
      <AdminHeader onProfileClick={() => setProfileMenuOpen(!profileMenuOpen)} />
      <ContentContainer>
        <StyledPaper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
            Grade Management
          </Typography>
            <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              View and manage all student grades. Track academic performance and generate reports.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <StyledButton 
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleDialogOpen()}
                >
                  Add Grade
                </StyledButton>
                
                <StyledButton 
                  variant="contained" 
                  startIcon={<PlaylistAddIcon />} 
                  onClick={handleBatchEntryOpen}
                >
                  Batch Entry
                </StyledButton>
                <StyledButton
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  onClick={handleImportDialogOpen}
                >
                  Import Grades (CSV)
                </StyledButton>
              </Box>
              
              <TextField
                placeholder="Search grades..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                }}
                sx={{ 
                  minWidth: { xs: '100%', sm: 250 },
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3f8cff',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            </Box>
          </Box>
        </StyledPaper>
        
        <StyledPaper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ 
                mb: 3,
                '& .MuiTabs-indicator': { 
                  bgcolor: '#3f8cff' 
                },
                '& .MuiTab-root': { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#3f8cff',
                  }
                }
              }}
            >
              <Tab label="All Grades" />
            </Tabs>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#fff' }}>
                {error}
              </Alert>
            )}
            
            {tabValue === 1 ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" component="h1">
                    Reports & Analytics
                  </Typography>
                  <Box>
                    <Tooltip title="Refresh Data">
                      <IconButton onClick={fetchGrades} sx={{ mr: 1 }}>
                        <RefreshIcon />
                      </IconButton>
                        </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadIcon />}
                      sx={{ ml: 1 }}
                    >
                      EXPORT
                    </Button>
                            </Box>
                          </Box>

                {/* Analytics Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs 
                    value={analyticsTabValue || 0} 
                    onChange={(e, newValue) => setAnalyticsTabValue(newValue)}
                    sx={{ 
                      '& .MuiTab-root': {
                        minWidth: 'auto',
                        px: 2,
                        py: 1.5,
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-selected': {
                          color: 'primary.main',
                        }
                      }
                    }}
                  >
                    <Tab 
                      icon={<PieChartIcon />} 
                      label="GRADE DISTRIBUTION" 
                      iconPosition="start" 
                    />
                    <Tab 
                      icon={<BarChartIcon />} 
                      label="COURSE PERFORMANCE" 
                      iconPosition="start" 
                    />
                    <Tab 
                      icon={<PersonIcon />} 
                      label="STUDENT PERFORMANCE" 
                      iconPosition="start" 
                    />
                    <Tab 
                      icon={<LinearScaleIcon />} 
                      label="YEAR COMPARISON" 
                      iconPosition="start" 
                    />
                    <Tab 
                      icon={<DomainIcon />} 
                      label="DEPARTMENT ANALYSIS" 
                      iconPosition="start" 
                    />
                  </Tabs>
                </Box>

              {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Grades
                    </Typography>
                        <Typography variant="h3" sx={{ color: '#3f8cff' }}>
                          {safeStats.totalGrades}
                        </Typography>
                  </CardContent>
                </Card>
              </Grid>
                  
              <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Average Score
                    </Typography>
                        <Typography variant="h3" sx={{ color: '#3f8cff' }}>
                          {safeStats.averageScore.toFixed(1)}
                        </Typography>
                  </CardContent>
                </Card>
              </Grid>
                  
              <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                          Students
                    </Typography>
                        <Typography variant="h3" sx={{ color: '#3f8cff' }}>
                          {students.length}
                        </Typography>
                  </CardContent>
                </Card>
              </Grid>
                  
              <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                          Courses
                    </Typography>
                        <Typography variant="h3" sx={{ color: '#3f8cff' }}>
                          {courses.length}
                        </Typography>
                  </CardContent>
                </Card>
                  </Grid>
              </Grid>

                {/* Tab Content based on analyticsTabValue */}
                {(analyticsTabValue === 0 || analyticsTabValue === undefined) && (
                  <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Grade Distribution
                    </Typography>
                          <Box sx={{ height: 300, mt: 2 }}>
                            {safeStats.gradeDistribution && safeStats.gradeDistribution.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(safeStats.gradeDistribution).map(([grade, count]) => ({
                                      name: grade,
                                      value: count,
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {Object.entries(safeStats.gradeDistribution).map(([grade, _], index) => (
                                      <Cell key={`cell-${index}`} fill={
                                        grade === 'A' ? 'rgba(76, 175, 80, 0.8)' :
                                        grade === 'B' ? 'rgba(33, 150, 243, 0.8)' :
                                        grade === 'C' ? 'rgba(255, 152, 0, 0.8)' :
                                        grade === 'D' ? 'rgba(255, 87, 34, 0.8)' :
                                        'rgba(244, 67, 54, 0.8)'
                                      } />
                                    ))}
                                  </Pie>
                                  <Legend formatter={(value) => `Grade ${value}`} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <Typography color="textSecondary">No grade distribution data available.</Typography>
                            )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                            Grade Breakdown
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Grade</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Count</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                                {Object.entries(safeStats.gradeDistribution).map(([grade, count]) => (
                                  <TableRow key={grade}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <Box sx={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        bgcolor: 
                                          grade === 'A' ? 'rgba(76, 175, 80, 0.8)' :
                                          grade === 'B' ? 'rgba(33, 150, 243, 0.8)' :
                                          grade === 'C' ? 'rgba(255, 152, 0, 0.8)' :
                                          grade === 'D' ? 'rgba(255, 87, 34, 0.8)' :
                                          'rgba(244, 67, 54, 0.8)'
                                      }}>
                                        {grade}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{count}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      {((count / safeStats.totalGrades) * 100).toFixed(1)}%
                                    </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
                )}

                {analyticsTabValue === 1 && (
                  <Grid container spacing={3}>
                    {/* Course Performance Content */}
                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Course Performance
                          </Typography>
                          <Box sx={{ height: 400, mt: 2 }}>
                            {safeStats.coursePerformance.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={safeStats.coursePerformance.slice(0, 10)}
                                  margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 100
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                  <XAxis 
                                    dataKey="courseName" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={100} 
                                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                                  />
                                  <YAxis 
                                    tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                    domain={[0, 100]}
                                    label={{ 
                                      value: 'Average Score', 
                                      angle: -90, 
                                      position: 'insideLeft',
                                      style: { fill: 'rgba(255, 255, 255, 0.7)' }
                                    }}
                                  />
                                  <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                  <Bar 
                                    dataKey="averageScore" 
                                    name="Average Score" 
                                    fill="#3f8cff" 
                                    radius={[4, 4, 0, 0]} 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <Typography color="textSecondary">No course performance data available.</Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Placeholder content for other analytics tabs */}
                {analyticsTabValue === 2 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', p: 3 }}>
                        <Typography variant="h6" gutterBottom>Student Performance Analytics</Typography>
                        <Typography>Detailed student performance metrics will be shown here.</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {analyticsTabValue === 3 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', p: 3 }}>
                        <Typography variant="h6" gutterBottom>Year Comparison Analytics</Typography>
                        <Typography>Year-over-year performance comparisons will be shown here.</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {analyticsTabValue === 4 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', p: 3 }}>
                        <Typography variant="h6" gutterBottom>Department Analysis</Typography>
                        <Typography>Department-level performance analytics will be shown here.</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Box>
            ) : (
              // Grades Table
              loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress sx={{ color: '#3f8cff' }} />
                </Box>
              ) : getFilteredGrades().length > 0 ? (
                <TableContainer component={Box} sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                  <Table stickyHeader sx={{ minWidth: 650 }}>
                    <StyledTableHead>
                      <TableRow>
                        <StyledTableCell 
                          onClick={() => handleSort('studentName')}
                          sx={{ 
                            backgroundColor: '#3f8cff', 
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Student
                            {sortConfig.key === 'studentName' && (
                              sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('courseName')}
                          sx={{ 
                            backgroundColor: '#3f8cff', 
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Course
                            {sortConfig.key === 'courseName' && (
                              sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('score')}
                          sx={{ 
                            backgroundColor: '#3f8cff', 
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Score
                            {sortConfig.key === 'score' && (
                              sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('grade')}
                          sx={{ 
                            backgroundColor: '#3f8cff', 
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Grade
                            {sortConfig.key === 'grade' && (
                              sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell 
                          onClick={() => handleSort('semester')}
                          sx={{ 
                            backgroundColor: '#3f8cff', 
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Semester
                            {sortConfig.key === 'semester' && (
                              sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>Version</StyledTableCell>
                        <StyledTableCell>Created By</StyledTableCell>
                        <StyledTableCell>Created At</StyledTableCell>
                        <StyledTableCell>Updated By</StyledTableCell>
                        <StyledTableCell>Updated At</StyledTableCell>
                        <StyledTableCell sx={{ backgroundColor: '#3f8cff', color: 'white' }}>Actions</StyledTableCell>
                      </TableRow>
                    </StyledTableHead>
                    <TableBody>
                      {getFilteredGrades().map((grade, index) => (
                        <TableRow 
                          key={grade.id} 
                          sx={{ 
                            '&:hover': { background: 'rgba(255, 255, 255, 0.05)' },
                            backgroundColor: index % 2 === 0 ? 'rgba(26, 32, 39, 0.4)' : 'rgba(26, 32, 39, 0.2)',
                          }}
                        >
                          <StyledTableCell>{grade.studentName}</StyledTableCell>
                          <StyledTableCell>{grade.courseName}</StyledTableCell>
                          <StyledTableCell>{grade.score}</StyledTableCell>
                          <StyledTableCell>
                            <Chip 
                              label={grade.grade}
                              size="small"
                              sx={{
                                bgcolor: 
                                  grade.grade === 'A' ? 'rgba(76, 175, 80, 0.3)' :
                                  grade.grade === 'B' ? 'rgba(33, 150, 243, 0.3)' :
                                  grade.grade === 'C' ? 'rgba(255, 152, 0, 0.3)' :
                                  grade.grade === 'D' ? 'rgba(255, 87, 34, 0.3)' :
                                  'rgba(244, 67, 54, 0.3)',
                                color: '#fff',
                                fontWeight: 'bold'
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell>{grade.semester}</StyledTableCell>
                          <StyledTableCell>{grade.version !== undefined ? grade.version : 'N/A'}</StyledTableCell>
                          <StyledTableCell>{grade.createdByUsername || grade.createdById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(grade.createdAt)}</StyledTableCell>
                          <StyledTableCell>{grade.updatedByUsername || grade.updatedById || 'N/A'}</StyledTableCell>
                          <StyledTableCell>{formatDate(grade.updatedAt)}</StyledTableCell>
                          <StyledTableCell>
                            <Tooltip title="Edit Grade">
                              <IconButton 
                                onClick={() => handleDialogOpen(grade)}
                                sx={{ color: '#3f8cff' }}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Grade">
                              <IconButton 
                                onClick={() => handleDelete(grade)}
                                sx={{ color: '#ff5252' }}
                                size="small"
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
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No grades found. Add grades using the "Add Grade" button above.
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </StyledPaper>
      </ContentContainer>
      
      {/* Grade Form Dialog */}
      <StyledDialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{isEditing ? 'Edit Grade' : 'Add New Grade'}</span>
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
          {isEditing && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2, 
              p: 1, 
              bgcolor: 'rgba(63, 140, 255, 0.1)', 
              borderRadius: 1
            }}>
              <InfoIcon sx={{ mr: 1, color: '#3f8cff' }} />
              <Typography variant="body2">
                You are editing version {currentGrade.version !== undefined ? currentGrade.version : 'N/A'} of this grade.
                If someone else updates this grade while you're editing, you'll need to refresh to get the latest version.
              </Typography>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  name="studentId"
                  value={currentGrade.studentId}
                  onChange={handleInputChange}
                  label="Student"
                  MenuProps={darkDropdownStyles}
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
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  name="courseCode"
                  value={currentGrade.courseCode}
                  onChange={handleInputChange}
                  label="Course"
                  MenuProps={darkDropdownStyles}
                >
                  <MenuItem value="">
                    <em>Select a course</em>
                  </MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.courseCode} value={course.courseCode}>
                      {course.courseCode}: {course.courseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="score"
                label="Score (0-100)"
                type="number"
                fullWidth
                value={currentGrade.score}
                onChange={handleScoreChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                  name="grade"
                label="Letter Grade"
                fullWidth
                  value={currentGrade.grade}
                  onChange={handleInputChange}
                inputProps={{ maxLength: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  name="semester"
                  value={currentGrade.semester}
                  onChange={handleInputChange}
                  label="Semester"
                  MenuProps={darkDropdownStyles}
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
                name="academicYear"
                label="Academic Year"
                fullWidth
                value={currentGrade.academicYear}
                onChange={handleInputChange}
                placeholder="e.g. 2023-2024"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="version"
                label="Version"
                fullWidth
                value={currentGrade.version !== undefined ? currentGrade.version : ''}
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
                helperText="This is used for optimistic locking and conflict detection."
              />
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
          <StyledButton 
            onClick={handleSubmit}
            disabled={loading || !currentGrade.studentId || !currentGrade.courseCode || currentGrade.score < 0 || currentGrade.score > 100}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : isEditing ? 'Update' : 'Save'}
          </StyledButton>
        </DialogActions>
      </StyledDialog>
      
      {/* Delete Confirmation Dialog */}
      <StyledDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
      >
        <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Are you sure you want to delete the grade for student <strong>{deleteDialog.studentName}</strong> in course <strong>{deleteDialog.courseName}</strong>?
              This action cannot be undone.
            </Typography>
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
              bgcolor: 'rgba(244, 67, 54, 0.8)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.9)' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </StyledDialog>
      
      {/* Batch Entry Dialog */}
      <StyledDialog
        open={batchEntryDialog} 
        onClose={handleBatchEntryClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Batch Grade Entry
        </DialogTitle>
        <DialogContent>
          {!selectedCourse ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                Select a course to enter grades for multiple students at once.
              </Typography>
            <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
              <Select
                  value=""
                onChange={handleBatchCourseSelect}
                  label="Course"
                  MenuProps={darkDropdownStyles}
              >
                <MenuItem value="">
                  <em>Select a course</em>
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.courseCode} value={course.courseCode}>
                    {course.courseCode}: {course.courseName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          ) : loadingCourses || loadingStudents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {selectedCourse.courseCode}: {selectedCourse.courseName}
              </Typography>
              
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOnlyUngraded}
                        onChange={(e) => setShowOnlyUngraded(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Show only ungraded students"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="Quick Fill Score"
                    type="number"
                    value={quickFillScore}
                    onChange={(e) => setQuickFillScore(e.target.value)}
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                      size="small"
                      sx={{ width: 150 }}
                  />
                <Button 
                  variant="outlined" 
                  onClick={handleQuickFill}
                      disabled={quickFillScore === ''}
                      sx={{ 
                        color: '#3f8cff',
                        borderColor: '#3f8cff',
                        '&:hover': { 
                          borderColor: '#3f8cff',
                          bgcolor: 'rgba(63, 140, 255, 0.1)'
                        }
                      }}
                    >
                      Apply to All
                </Button>
              </Box>
                    </Box>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredBatchGrades && filteredBatchGrades.length > 0 ? (
                  <TableContainer>
                  <Table stickyHeader size="small">
                      <StyledTableHead>
                      <TableRow>
                          <StyledTableCell>Student Name</StyledTableCell>
                          <StyledTableCell>Score (0-100)</StyledTableCell>
                          <StyledTableCell>Letter Grade</StyledTableCell>
                          <StyledTableCell>Status</StyledTableCell>
                      </TableRow>
                      </StyledTableHead>
                    <TableBody>
                        {filteredBatchGrades.map((entry, index) => (
                          <TableRow 
                            key={entry.studentId}
                            sx={{ 
                              bgcolor: entry.hasExistingGrade ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                            }}
                          >
                            <StyledTableCell>{entry.studentName}</StyledTableCell>
                            <StyledTableCell>
                            <TextField
                              type="number"
                              value={entry.score}
                              onChange={(e) => handleBatchScoreChange(entry.studentId, e.target.value)}
                              size="small"
                              fullWidth
                              InputProps={{ 
                                inputProps: { min: 0, max: 100 },
                                sx: { color: '#fff' }
                              }}
                              error={entry.score !== '' && (entry.score < 0 || entry.score > 100)}
                              disabled={entry.hasExistingGrade}
                            />
                            </StyledTableCell>
                            <StyledTableCell>{entry.grade}</StyledTableCell>
                            <StyledTableCell>
                              {entry.hasExistingGrade ? (
                              <Chip
                                  label="Already Graded"
                                size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              ) : entry.score === '' ? (
                              <Chip 
                                  label="No Score"
                                size="small" 
                                  color="default"
                                  variant="outlined"
                                />
                              ) : entry.score < 0 || entry.score > 100 ? (
                                <Chip 
                                  label="Invalid Score"
                                  size="small"
                                  color="error"
                                variant="outlined" 
                              />
                            ) : (
                              <Chip 
                                  label="Ready"
                                size="small" 
                                  color="success"
                                variant="outlined" 
                              />
                            )}
                            </StyledTableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                  <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#fff' }}>
                  {showOnlyUngraded 
                    ? "All students in this course already have grades. Switch off the filter to see all students."
                    : "No students available. Add students in the User Management section first."}
                </Alert>
                )}
              </Box>
              
              {filteredBatchGrades && filteredBatchGrades.length > 0 && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <Box sx={{ p: 2, bgcolor: 'rgba(26, 32, 39, 0.8)', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
                      Batch Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Total Students: {batchSummary.total}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Ready to Submit: {batchSummary.valid}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Already Graded: {batchSummary.alreadyGraded}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleBatchEntryClose}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <StyledButton
            onClick={handleBatchSubmit}
            disabled={!selectedCourse || filteredBatchGrades?.length === 0 || batchSubmitting || batchSummary?.valid === 0}
          >
            {batchSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit All Grades'}
          </StyledButton>
        </DialogActions>
      </StyledDialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleImportDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Import Grades from CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Upload a CSV file with the following columns (header required):<br />
            <b>studentId,courseId,score,grade,semester,academicYear,status,comments</b>
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Example: <br />
            1,101,85,A,1,2024-2025,PENDING,Good performance
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ mt: 2, mb: 2 }}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFileChange}
            style={{ marginTop: 16 }}
          />
          {importLoading && <LinearProgress sx={{ mt: 2 }} />}
          {importFeedback && (
            <Alert severity={importFeedback.type} sx={{ mt: 2, whiteSpace: 'pre-line' }}>
              {importFeedback.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose} disabled={importLoading}>Cancel</Button>
          <Button
            onClick={handleImportGrades}
            variant="contained"
            startIcon={<UploadFileIcon />}
            disabled={importLoading}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Feedback Snackbar */}
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
          {snackbar.refresh && <Button color="secondary" onClick={handleRefreshGrade}>Refresh</Button>}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default GradeManagement; 