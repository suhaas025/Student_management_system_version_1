import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip
} from '@mui/material';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import DomainIcon from '@mui/icons-material/Domain';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Services
import gradeService from '../../services/grade.service';
import courseService from '../../services/course.service';
import userService from '../../services/user.service';
import reportService from '../../services/report.service';

// Import recharts components
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

// Import styled components
import {
  StyledPaper,
  PageContainer,
  ContentContainer,
  AdminHeader
} from './styles.jsx';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Custom error boundary component
const ChartErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Reset error state when children change
    setHasError(false);
  }, [children]);
  
  if (hasError) {
    return fallback || (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading chart. Please try refreshing the data.</Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{ width: '100%', height: '100%' }}
      onError={() => setHasError(true)}
    >
      {children}
    </Box>
  );
};

const Reports = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [reportData, setReportData] = useState({
    gradeDistribution: [],
    coursePerformance: [],
    studentPerformance: [],
    yearComparison: [],
    departmentPerformance: [],
    summary: {
      totalGrades: 0,
      averageScore: 0,
      totalStudents: 0,
      totalCourses: 0
    }
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [transposeGradeTable, setTransposeGradeTable] = useState(false);
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const GRADE_COLORS = {
    'A': '#4caf50', // green
    'B': '#2196f3', // blue
    'C': '#ff9800', // orange
    'D': '#f44336', // red
    'F': '#9e9e9e'  // grey
  };

  // Performance color scale
  const getPerformanceColor = (score) => {
    if (score >= 90) return 'rgba(76, 175, 80, 0.8)'; // A - green
    if (score >= 80) return 'rgba(33, 150, 243, 0.8)'; // B - blue
    if (score >= 70) return 'rgba(255, 152, 0, 0.8)'; // C - orange
    if (score >= 60) return 'rgba(255, 87, 34, 0.8)'; // D - orange-red
    return 'rgba(244, 67, 54, 0.8)'; // F - red
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);
  
  // Generate reports when data or filters change
  useEffect(() => {
    if (grades.length > 0) {
      console.log('Generating reports for tab:', tabValue);
      generateReports();
    }
  }, [grades, tabValue]);
  
  // Fetch all data
  const fetchAllData = async () => {
    try {
    setLoading(true);
    
      // Fetch grades
      const gradesResponse = await gradeService.getAllGrades();
      setGrades(gradesResponse.data || []);
      
      // Fetch courses
      const coursesResponse = await courseService.getAllCourses();
      let coursesArray = [];
      if (Array.isArray(coursesResponse.data)) {
        coursesArray = coursesResponse.data;
      } else if (coursesResponse.data && Array.isArray(coursesResponse.data.content)) {
        coursesArray = coursesResponse.data.content;
      } else {
        coursesArray = [];
      }
      setCourses(coursesArray);
      
      // Fetch students
      const studentsResponse = await userService.getAllStudents();
      setStudents(studentsResponse.data || []);
      
      // Extract filter options
      const years = [...new Set(gradesResponse.data.map(g => g.academicYear))].filter(Boolean);
      const semesters = [...new Set(gradesResponse.data.map(g => g.semester))].filter(Boolean);
      const departments = [...new Set(coursesArray.map(c => c.department))].filter(Boolean);
        
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // We don't need to call generateReports here as the tabValue change will trigger useEffect
  };
  
  // Generate reports
  const generateReports = () => {
    try {
    // Get filtered grades
    const filteredGrades = grades;
      
      console.log('Filtered grades:', filteredGrades.length);
    
    // Calculate summary statistics
    const totalGrades = filteredGrades.length;
    const averageScore = totalGrades > 0 
      ? filteredGrades.reduce((acc, grade) => acc + grade.score, 0) / totalGrades 
      : 0;
    
    // Calculate unique students and courses
    const uniqueStudentIds = new Set();
    const uniqueCourseIds = new Set();
    
    filteredGrades.forEach(grade => {
      if (grade.studentId) uniqueStudentIds.add(grade.studentId);
      if (grade.courseCode) uniqueCourseIds.add(grade.courseCode);
    });
    
      // Initialize report data with all existing data to preserve it
    const newReportData = {
        gradeDistribution: [],
        coursePerformance: [],
        studentPerformance: [],
        yearComparison: reportData.yearComparison || [],
        departmentPerformance: reportData.departmentPerformance || [],
      summary: {
        totalGrades,
        averageScore,
        totalStudents: uniqueStudentIds.size,
        totalCourses: uniqueCourseIds.size
      }
    };
    
      // Generate grade distribution data
      const gradeDistribution = {};
      filteredGrades.forEach(grade => {
        if (!gradeDistribution[grade.grade]) {
          gradeDistribution[grade.grade] = 0;
        }
        gradeDistribution[grade.grade]++;
      });
      
      newReportData.gradeDistribution = Object.keys(gradeDistribution).map(grade => ({
        name: grade,
        value: gradeDistribution[grade],
        color: GRADE_COLORS[grade] || '#9e9e9e'
      }));
    
      // Generate course performance data
      const coursePerformance = {};
      filteredGrades.forEach(grade => {
        if (!grade.courseCode) return; // Skip entries without courseCode
        
        if (!coursePerformance[grade.courseCode]) {
          coursePerformance[grade.courseCode] = {
            name: grade.courseName || grade.courseCode,
            code: grade.courseCode,
            scores: [],
            students: new Set()
          };
        }
        // Only add valid score values
        if (typeof grade.score === 'number' && !isNaN(grade.score)) {
        coursePerformance[grade.courseCode].scores.push(grade.score);
        }
        
        if (grade.studentId) {
        coursePerformance[grade.courseCode].students.add(grade.studentId);
        }
      });
      
      // Convert to array format
      newReportData.coursePerformance = Object.keys(coursePerformance).length === 0 ? [] : 
        Object.values(coursePerformance).map(course => ({
        name: course.code,
          courseName: course.name || course.code,
          averageScore: course.scores.length > 0 ? course.scores.reduce((a, b) => a + b, 0) / course.scores.length : 0,
        studentCount: course.students.size,
        scores: course.scores
      })).sort((a, b) => b.averageScore - a.averageScore);
      
      console.log('Generated course performance data:', newReportData.coursePerformance.length);
    
    // Generate student performance data
      const studentPerformance = {};
      filteredGrades.forEach(grade => {
        if (!studentPerformance[grade.studentId]) {
          studentPerformance[grade.studentId] = {
            name: grade.studentName,
            id: grade.studentId,
            scores: [],
            courses: new Set()
          };
        }
        studentPerformance[grade.studentId].scores.push(grade.score);
        studentPerformance[grade.studentId].courses.add(grade.courseCode);
      });
      
      newReportData.studentPerformance = Object.values(studentPerformance).map(student => ({
        name: student.name,
        id: student.id,
        averageScore: student.scores.length > 0 ? student.scores.reduce((a, b) => a + b, 0) / student.scores.length : 0,
        courseCount: student.courses.size
      })).sort((a, b) => b.averageScore - a.averageScore);
      
      // Add placeholder data for yearComparison and departmentPerformance if they're empty
      if (!newReportData.yearComparison || newReportData.yearComparison.length === 0) {
        newReportData.yearComparison = [
          { year: '2020', averageScore: 75 },
          { year: '2021', averageScore: 78 },
          { year: '2022', averageScore: 82 },
          { year: '2023', averageScore: 80 }
        ];
      }
      
      if (!newReportData.departmentPerformance || newReportData.departmentPerformance.length === 0) {
        // Extract departments from courses
        const departments = [...new Set(courses.map(c => c.department))].filter(Boolean);
        
        newReportData.departmentPerformance = departments.map(dept => {
          const deptCourses = courses.filter(c => c.department === dept);
          const deptGrades = filteredGrades.filter(g => {
            const course = courses.find(c => c.courseCode === g.courseCode);
            return course && course.department === dept;
          });
          
          return {
            name: dept,
            courseCount: deptCourses.length,
            studentCount: new Set(deptGrades.map(g => g.studentId)).size,
            averageScore: deptGrades.length > 0 ? 
              deptGrades.reduce((sum, g) => sum + g.score, 0) / deptGrades.length : 0
          };
        });
    }
    
    // Set the updated report data
    setReportData(newReportData);
    } catch (error) {
      console.error('Error generating reports:', error);
      setError('An error occurred while generating reports. Please try again.');
    }
  };
  
  // Export CSV
  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Print report
  const printReport = () => {
    window.print();
  };
  
  // Get data for current tab
  const getCurrentTabData = () => {
    switch (tabValue) {
      case 0:
        return reportData.gradeDistribution;
      case 1:
        return reportData.coursePerformance;
      case 2:
        return reportData.studentPerformance;
      case 3:
        return reportData.yearComparison;
      case 4:
        return reportData.departmentPerformance;
      default:
        return [];
    }
  };

  // Handle profile menu
  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reports & Analytics', 14, 16);

    if (tabValue === 0) {
      doc.setFontSize(14);
      doc.text('Grade Distribution', 14, 28);
      autoTable(doc, {
        head: [['Grade', 'Count']],
        body: reportData.gradeDistribution.map(row => [row.name, row.value]),
        startY: 40,
      });
    } else if (tabValue === 1) {
      doc.setFontSize(14);
      doc.text('Course Performance', 14, 28);
      autoTable(doc, {
        head: [['Course', 'Average Score', 'Pass %']],
        body: reportData.coursePerformance.map(row => {
          const scores = Array.isArray(row.scores) ? row.scores : [];
          let passPercent = '';
          if (scores.length > 0) {
            const passCount = scores.filter(score => score >= 40).length;
            passPercent = ((passCount / scores.length) * 100).toFixed(1);
          } else {
            passPercent = 'N/A';
          }
          return [
            row.courseName || row.name,
            row.averageScore.toFixed(1),
            passPercent
          ];
        }),
        startY: 40,
      });
    } else if (tabValue === 2) {
      doc.setFontSize(14);
      doc.text('Student Performance', 14, 28);
      autoTable(doc, {
        head: [['Student', 'Average Score', 'Number of Courses']],
        body: reportData.studentPerformance.map(row => [
          row.name,
          row.averageScore.toFixed(1),
          row.courseCount
        ]),
        startY: 40,
      });
    } else if (tabValue === 3) {
      doc.setFontSize(14);
      doc.text('Year Comparison', 14, 28);
      autoTable(doc, {
        head: [['Year', 'Average Score']],
        body: reportData.yearComparison.map(row => [
          row.year,
          row.averageScore.toFixed(1)
        ]),
        startY: 40,
      });
    } else if (tabValue === 4) {
      doc.setFontSize(14);
      doc.text('Department Analysis', 14, 28);
      autoTable(doc, {
        head: [['Department', 'Courses', 'Students', 'Average Score']],
        body: reportData.departmentPerformance.map(row => [
          row.name,
          row.courseCount,
          row.studentCount,
          row.averageScore.toFixed(1)
        ]),
        startY: 40,
      });
    }

    doc.save('report.pdf');
  };

  return (
    <PageContainer>
      <AdminHeader onProfileClick={handleProfileClick} />
      <ContentContainer>
        <Container maxWidth="lg">
          <StyledPaper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Reports & Analytics
          </Typography>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchAllData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton onClick={printReport} sx={{ mr: 1 }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportCSV(
                getCurrentTabData(),
                `report-${['grades', 'courses', 'students', 'years', 'departments'][tabValue]}`
              )}
              disabled={loading || getCurrentTabData().length === 0}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                fontWeight: 'bold'
              }}
            >
                  EXPORT
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              sx={{ ml: 1 }}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
        
            <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
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
        
        {error && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#fff' }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
            ) : (
              <>
                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Total Grades
                        </Typography>
                        <Typography variant="h3">{reportData.summary?.totalGrades || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Average Score
                        </Typography>
                        <Typography variant="h3">
                          {reportData.summary?.averageScore ? reportData.summary.averageScore.toFixed(1) : 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Students
                        </Typography>
                        <Typography variant="h3">{reportData.summary?.totalStudents || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Courses
                        </Typography>
                        <Typography variant="h3">{reportData.summary?.totalCourses || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Tab Content - Only render content for the active tab */}
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Grade Distribution
                              </Typography>
                          <Box sx={{ height: 300 }}>
                                <ChartErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={reportData.gradeDistribution}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                  outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={5}
                                      fill="#8884d8"
                                      dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                    >
                                      {reportData.gradeDistribution.map((entry, index) => (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color || COLORS[index % COLORS.length]} 
                                            stroke="rgba(255, 255, 255, 0.1)"
                                            strokeWidth={1}
                                          />
                                      ))}
                                    </Pie>
                                      <Tooltip 
                                        formatter={(value, name) => [`${value} Students`, `Grade ${name}`]}
                                        contentStyle={{ 
                                          backgroundColor: 'rgba(26, 32, 39, 0.95)', 
                                          color: '#fff', 
                                          border: '1px solid rgba(255, 255, 255, 0.2)',
                                          borderRadius: '4px',
                                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                      />
                                      <Legend 
                                        formatter={(value) => `Grade ${value}`} 
                                        layout="horizontal" 
                                        verticalAlign="bottom" 
                                        align="center"
                                        iconSize={10}
                                        iconType="circle"
                                        wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', paddingTop: '10px' }}
                                      />
                                  </PieChart>
                                </ResponsiveContainer>
                                </ChartErrorBoundary>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>

                    <Grid item xs={12} md={6}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6" gutterBottom>
                                Grade Breakdown
                              </Typography>
                                <Button
                                  variant={transposeGradeTable ? 'contained' : 'outlined'}
                                  size="small"
                                  onClick={() => setTransposeGradeTable((prev) => !prev)}
                                  sx={{ ml: 2 }}
                                >
                                  {transposeGradeTable ? 'Normal View' : 'Transpose View'}
                                </Button>
                              </Box>
                              {!transposeGradeTable ? (
                              <TableContainer>
                            <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Grade</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Count</TableCell>
                                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Percentage</TableCell>
                                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Distribution</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {reportData.gradeDistribution.map((grade) => (
                                      <TableRow key={grade.name}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <Box sx={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        bgcolor: grade.color
                                      }}>
                                        {grade.name}
                                      </Box>
                                        </TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{grade.value}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      {((grade.value / reportData.summary.totalGrades) * 100).toFixed(1)}%
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                          <Box sx={{ 
                                            width: '100%', 
                                            height: 10, 
                                            bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                            borderRadius: 5,
                                            overflow: 'hidden'
                                          }}>
                                            <Box sx={{ 
                                              width: `${(grade.value / reportData.summary.totalGrades) * 100}%`, 
                                              height: '100%', 
                                              bgcolor: grade.color,
                                              borderRadius: 5
                                            }} />
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              ) : (
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}></TableCell>
                                        {reportData.gradeDistribution.map((grade) => (
                                          <TableCell key={grade.name} sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                            <Box sx={{ 
                                              display: 'inline-flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'center',
                                              width: 30,
                                              height: 30,
                                              borderRadius: '50%',
                                              bgcolor: grade.color
                                            }}>
                                              {grade.name}
                                            </Box>
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Count</TableCell>
                                        {reportData.gradeDistribution.map((grade) => (
                                          <TableCell key={grade.name} sx={{ color: '#fff' }}>{grade.value}</TableCell>
                                        ))}
                                      </TableRow>
                                      <TableRow>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Percentage</TableCell>
                                        {reportData.gradeDistribution.map((grade) => (
                                          <TableCell key={grade.name} sx={{ color: '#fff' }}>{((grade.value / reportData.summary.totalGrades) * 100).toFixed(1)}%</TableCell>
                                        ))}
                                      </TableRow>
                                      <TableRow>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Distribution</TableCell>
                                        {reportData.gradeDistribution.map((grade) => (
                                          <TableCell key={grade.name}>
                                            <Box sx={{ 
                                              width: '100%', 
                                              height: 10, 
                                              bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                              borderRadius: 5,
                                              overflow: 'hidden'
                                            }}>
                                              <Box sx={{ 
                                                width: `${(grade.value / reportData.summary.totalGrades) * 100}%`, 
                                                height: '100%', 
                                                bgcolor: grade.color,
                                                borderRadius: 5
                                              }} />
                                            </Box>
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                  </Grid>
                )}
                
                {tabValue === 1 && (
                  <Grid container spacing={3}>
                        <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Course Performance {reportData.coursePerformance ? `(${reportData.coursePerformance.length} courses)` : ''}
                                </Typography>
                          {!Array.isArray(reportData.coursePerformance) || reportData.coursePerformance.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <Typography>No course performance data available.</Typography>
                            </Box>
                          ) : (
                              <Box sx={{ height: 400 }}>
                              <ChartErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={reportData.coursePerformance.slice(0, 10)}
                                margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
                                    barGap={8}
                                    barCategoryGap={12}
                                  >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                    <XAxis 
                                      dataKey="name" 
                                      angle={-45}
                                      textAnchor="end"
                                  height={100} 
                                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                                    />
                                    <YAxis 
                                      yAxisId="left"
                                  tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                      domain={[0, 100]} 
                                />
                                    <RechartsTooltip 
                                      formatter={(value, name) => {
                                        if (name === "Average Score") return [`${value.toFixed(1)}`, name];
                                        if (name === "Student Count") return [value, name];
                                        return [value, name];
                                      }}
                                      contentStyle={{ 
                                        backgroundColor: 'rgba(26, 32, 39, 0.95)', 
                                        color: '#fff', 
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px'
                                      }}
                                    />
                                    <Legend />
                                    <ReferenceLine yAxisId="left" y={70} stroke="rgba(255, 152, 0, 0.7)" strokeDasharray="3 3" />
                                <Bar 
                                      dataKey="averageScore" 
                                      name="Average Score" 
                                  fill="#3f8cff" 
                                      yAxisId="left"
                                    >
                                      {reportData.coursePerformance.slice(0, 10).map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`}
                                          fill={getPerformanceColor(entry.averageScore)}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </ChartErrorBoundary>
                              </Box>
                          )}
                            </CardContent>
                          </Card>
                        </Grid>
                    {reportData.coursePerformance.length > 0 && (
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Course Performance Details
                            </Typography>
                            <TableContainer sx={{ maxHeight: '40vh' }}>
                              <Table stickyHeader size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Course</TableCell>
                                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Code</TableCell>
                                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Students</TableCell>
                                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Avg. Score</TableCell>
                                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Performance</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {reportData.coursePerformance.map((course) => (
                                    <TableRow key={course.name}>
                                      <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{course.courseName || 'N/A'}</TableCell>
                                      <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{course.name}</TableCell>
                                      <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{course.studentCount}</TableCell>
                                      <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{course.averageScore.toFixed(1)}</TableCell>
                                      <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <Box sx={{ 
                                          width: '100%', 
                                          height: 10, 
                                          bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                          borderRadius: 5,
                                          overflow: 'hidden'
                                        }}>
                                          <Box sx={{ 
                                            width: `${course.averageScore}%`, 
                                            height: '100%', 
                                            bgcolor: getPerformanceColor(course.averageScore),
                                            borderRadius: 5
                                          }} />
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                )}
                
                {tabValue === 2 && (
                  <Grid container spacing={3}>
                        <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                            Student Performance
                              </Typography>
                          <TableContainer sx={{ maxHeight: '60vh' }}>
                            <Table stickyHeader>
                                  <TableHead>
                                    <TableRow>
                                  <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Student</TableCell>
                                  <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Average Score</TableCell>
                                  <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Courses</TableCell>
                                  <TableCell sx={{ bgcolor: 'rgba(26, 32, 39, 0.95)', color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Performance</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                {reportData.studentPerformance.map((student) => (
                                      <TableRow key={student.id}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{student.name}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{student.averageScore.toFixed(1)}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{student.courseCount}</TableCell>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <Box sx={{ 
                                        width: '100%', 
                                        height: 10, 
                                        bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                        borderRadius: 5,
                                        overflow: 'hidden'
                                      }}>
                                        <Box sx={{ 
                                          width: `${student.averageScore}%`, 
                                          height: '100%', 
                                          bgcolor: getPerformanceColor(student.averageScore),
                                          borderRadius: 5
                                        }} />
                                      </Box>
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
                
                {tabValue === 3 && (
                  <Grid container spacing={3}>
                        <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Year Comparison
                              </Typography>
                              <Box sx={{ height: 400 }}>
                                <ChartErrorBoundary>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                      data={reportData.yearComparison}
                                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                      <XAxis 
                                        dataKey="year" 
                                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                      />
                                      <YAxis 
                                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                        domain={[0, 100]}
                                      />
                                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(26, 32, 39, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                                      <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                      <Line 
                                        type="monotone" 
                                        dataKey="averageScore" 
                                        name="Average Score" 
                                        stroke="#8884d8" 
                                        activeDot={{ r: 8 }}
                                        strokeWidth={2}
                                      />
                                      <ReferenceLine y={70} stroke="rgba(255, 152, 0, 0.7)" strokeDasharray="3 3" label={{ value: 'Passing Grade', fill: 'rgba(255, 152, 0, 0.9)', position: 'insideBottomRight' }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </ChartErrorBoundary>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                  </Grid>
                )}
                
                {tabValue === 4 && (
                  <Grid container spacing={3}>
                        <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'rgba(26, 32, 39, 0.8)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Department Analysis
                              </Typography>
                              <Box sx={{ height: 400 }}>
                                <ChartErrorBoundary>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={reportData.departmentPerformance}
                                      margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                      <XAxis 
                                        dataKey="name" 
                                        angle={-45}
                                        textAnchor="end"
                                        height={100} 
                                        tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                                      />
                                      <YAxis 
                                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                        domain={[0, 100]}
                                      />
                                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(26, 32, 39, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                                      <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                      <Bar 
                                        dataKey="averageScore" 
                                        name="Average Score" 
                                        fill="#00C49F" 
                                        radius={[4, 4, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </ChartErrorBoundary>
                              </Box>
                              <Box sx={{ mt: 3 }}>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Department</TableCell>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Courses</TableCell>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Students</TableCell>
                                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Avg. Score</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {reportData.departmentPerformance.map((dept) => (
                                        <TableRow key={dept.name}>
                                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{dept.name}</TableCell>
                                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{dept.courseCount}</TableCell>
                                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{dept.studentCount}</TableCell>
                                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                            {dept.averageScore.toFixed(1)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        </Grid>
                )}
              </>
            )}
          </StyledPaper>
    </Container>
      </ContentContainer>
    </PageContainer>
  );
};

export default Reports; 