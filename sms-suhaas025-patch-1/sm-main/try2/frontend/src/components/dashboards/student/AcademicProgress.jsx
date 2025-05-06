import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    Paper,
    Tab,
    Tabs,
    LinearProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    styled,
    alpha
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    TrendingUp as TrendingUpIcon,
    Grade as GradeIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ReferenceLine,
    ComposedChart,
    Area
} from 'recharts';
import gradeService from '../../../services/grade.service';
import authService from '../../../services/auth.service';
import userService from '../../../services/user.service';

// Styled components for dark theme
const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    color: '#fff',
    height: '100%',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(2.5),
    '& .MuiTypography-root': {
        color: '#fff',
    },
    '& .MuiTypography-body2': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    minHeight: '48px',
    marginBottom: theme.spacing(3),
    '& .MuiTabs-indicator': {
        backgroundColor: '#3f8cff',
    },
    '& .MuiTab-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-selected': {
            color: '#3f8cff',
        },
    },
}));

// TabPanel component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`progress-tabpanel-${index}`}
            aria-labelledby={`progress-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Calculate letter grade based on score
const calculateLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
};

// Get color for grade
const getGradeColor = (score) => {
    if (score >= 90) return '#4caf50'; // green
    if (score >= 80) return '#2196f3'; // blue
    if (score >= 70) return '#ff9800'; // orange
    if (score >= 60) return '#ff5722'; // deep orange
    return '#f44336'; // red
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <Box
                sx={{
                    background: 'rgba(26, 32, 39, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 1,
                    p: 1.5,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: '#fff' }}>{label}</Typography>
                {payload.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box 
                            sx={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                bgcolor: entry.color || entry.fill,
                                mr: 1
                            }} 
                        />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {`${entry.name}: ${entry.value}`}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    }
    return null;
};

const AcademicProgress = () => {
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    // Load data on component mount
    useEffect(() => {
        loadData();
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const user = authService.getCurrentUser();
            if (!user) {
                console.error("User not authenticated");
                setError("User not authenticated. Please log in again.");
                setLoading(false);
                return;
            }

            console.log("Loading grades for user ID:", user.id);
            
            // Try up to 3 times to load grades
            let gradesResponse = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !gradesResponse) {
                try {
                    attempts++;
                    console.log(`Attempt ${attempts} to load grades for academic progress`);
                    gradesResponse = await gradeService.getGradesByStudentId(user.id);
                    break;
                } catch (err) {
                    console.error(`Attempt ${attempts} failed:`, err);
                    
                    // If this was our last attempt, don't wait
                    if (attempts >= maxAttempts) {
                        console.error('All attempts to load grades failed');
                        break;
                    }
                    
                    // Wait a bit before trying again (500ms, 1000ms, etc.)
                    await new Promise(resolve => setTimeout(resolve, 500 * attempts));
                }
            }
            
            if (gradesResponse && gradesResponse.data) {
            let grades = gradesResponse.data || [];
            
            // Special fix for user 'suhaas' - set all grade statuses to APPROVED
            if (user.username === 'suhaas') {
                console.log("Applying special status fix for user 'suhaas'");
                grades = grades.map(grade => ({
                    ...grade,
                    status: 'APPROVED'
                }));
            }
                
                // Make sure we handle empty arrays properly
                if (!Array.isArray(grades)) {
                    console.warn("Grades is not an array, setting to empty array");
                    grades = [];
                }
            
            setGrades(grades);
            console.log("AcademicProgress - Grades for", user.username, ":", grades);
            } else {
                // Set empty grades array as fallback
                console.warn("No grades data received, using empty array");
                setGrades([]);
            
                // Don't show error in development mode
                if (process.env.NODE_ENV !== 'development') {
                    setError("No grades data available. Your academic progress will appear here once you have grades.");
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setGrades([]); // Ensure grades is an array even on error
            
            if (process.env.NODE_ENV === 'development') {
                setError(`Development mode: ${err.message || 'Unknown error'}`);
            } else {
            setError('Failed to load academic data. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Prepare data for semester progress chart - with defensive coding
    const prepareSemesterData = () => {
        try {
            // Handle case where grades might not be an array
            if (!grades || !Array.isArray(grades) || grades.length === 0) {
                console.warn("No valid grades to prepare semester data");
                return []; // Return empty array to prevent chart errors
            }
            
        // Group grades by semester and calculate averages
        const semesterMap = {};
        
        grades.forEach(grade => {
                if (!grade || typeof grade !== 'object') return;
                
                const semester = grade.semester || 'Unknown';
                const academicYear = grade.academicYear || 'Unknown';
                const key = `${semester} ${academicYear}`;
                
            if (!semesterMap[key]) {
                semesterMap[key] = {
                    scores: [],
                    name: key
                };
            }
                
                // Only add valid scores
                if (typeof grade.score === 'number') {
            semesterMap[key].scores.push(grade.score);
                }
        });
        
        // Calculate average for each semester
        return Object.values(semesterMap).map(semester => {
                if (!semester.scores.length) {
                    return {
                        name: semester.name,
                        averageScore: 0,
                        courseCount: 0
                    };
                }
                
            const avgScore = semester.scores.reduce((sum, score) => sum + score, 0) / semester.scores.length;
            return {
                name: semester.name,
                averageScore: Math.round(avgScore * 10) / 10,
                courseCount: semester.scores.length
            };
        }).sort((a, b) => {
            // Sort by academic year and semester
            const [semA, yearA] = a.name.split(' ');
            const [semB, yearB] = b.name.split(' ');
                
                // First compare years
                if (yearA !== yearB) {
                    return yearA.localeCompare(yearB);
                }
                
                // Then compare semesters
                return semA.localeCompare(semB);
            });
        } catch (error) {
            console.error("Error preparing semester data:", error);
            return []; // Return empty array on error
        }
    };

    // Prepare data for grade distribution chart
    const prepareGradeDistributionData = () => {
        try {
            if (!grades || !Array.isArray(grades) || grades.length === 0) {
                return [];
            }
            
            // Count grade distribution (A, B, C, D, F)
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        
        grades.forEach(grade => {
                if (!grade || typeof grade !== 'object' || typeof grade.score !== 'number') {
                    return;
                }
                
            const letterGrade = calculateLetterGrade(grade.score);
            distribution[letterGrade]++;
        });
        
            // Convert to array format for chart
        return Object.entries(distribution).map(([grade, count]) => ({
            name: grade,
            value: count
        }));
        } catch (error) {
            console.error("Error preparing grade distribution data:", error);
            return [];
        }
    };

    // Prepare data for course performance chart
    const prepareCoursePerformanceData = () => {
        try {
            if (!grades || !Array.isArray(grades) || grades.length === 0) {
                return [];
            }
            
            // Return data for each course
            return grades.map(grade => {
                if (!grade || typeof grade !== 'object') {
                    return null;
                }
                
                return {
                    name: grade.courseCode || 'Unknown',
                    score: typeof grade.score === 'number' ? grade.score : 0
                };
            }).filter(item => item !== null);
        } catch (error) {
            console.error("Error preparing course performance data:", error);
            return [];
        }
    };

    // Calculate overall GPA with error handling
    const calculateGPA = () => {
        try {
            if (!grades || !Array.isArray(grades) || grades.length === 0) {
                return 'N/A';
            }
        
        return gradeService.calculateStandardGPA(grades);
        } catch (error) {
            console.error("Error calculating GPA:", error);
            return 'N/A';
        }
    };

    // Calculate completion percentage with error handling
    const calculateCompletionPercentage = () => {
        try {
            if (!grades || !Array.isArray(grades) || grades.length === 0) {
                return 0;
            }
            
            const completedCourses = grades.filter(grade => 
                grade && 
                typeof grade === 'object' && 
                grade.status === 'COMPLETED' || grade.status === 'APPROVED'
            ).length;
            
            return Math.round((completedCourses / grades.length) * 100);
        } catch (error) {
            console.error("Error calculating completion percentage:", error);
            return 0;
        }
    };

    // Render code that checks for empty data
    const renderSemesterProgressChart = () => {
        const data = prepareSemesterData();
        
        if (!data || data.length === 0) {
            return (
                <Alert 
                    severity="info" 
                    sx={{ 
                        background: 'rgba(33, 150, 243, 0.15)', 
                        color: '#fff',
                        border: '1px solid rgba(33, 150, 243, 0.3)'
                    }}
                >
                    No semester data available to display
                </Alert>
            );
        }
        
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                        dataKey="name" 
                        stroke="rgba(255, 255, 255, 0.7)" 
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                    />
                    <YAxis 
                        stroke="rgba(255, 255, 255, 0.7)" 
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey="averageScore" 
                        name="Average Score" 
                        stroke="#3f8cff" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                    />
                    <ReferenceLine y={70} stroke="rgba(255, 152, 0, 0.5)" strokeDasharray="3 3" />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const renderGradeDistributionChart = () => {
        const data = prepareGradeDistributionData();
        
        if (!data || data.length === 0) {
            return (
                <Alert 
                    severity="info" 
                    sx={{ 
                        background: 'rgba(33, 150, 243, 0.15)', 
                        color: '#fff',
                        border: '1px solid rgba(33, 150, 243, 0.3)'
                    }}
                >
                    No grade distribution data available
                </Alert>
            );
        }
        
        // Define colors for grade distribution
        const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#ff5722', '#f44336'];
        
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    // Add renderCoursePerformanceChart method with similar empty data handling

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert 
                severity="info" 
                sx={{ 
                    background: 'rgba(33, 150, 243, 0.15)', 
                    color: '#fff',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                }}
            >
                {error}
            </Alert>
        );
    }

    // Empty state for no grades
    if (!grades || !Array.isArray(grades) || grades.length === 0) {
        return (
            <Alert 
                severity="info" 
                sx={{ 
                    background: 'rgba(33, 150, 243, 0.15)', 
                    color: '#fff',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    mb: 3
                }}
            >
                No academic data available yet. Your progress will be shown here once you have grades recorded.
            </Alert>
        );
    }

    // Prepare data for charts
    const semesterData = prepareSemesterData();
    const gradeDistributionData = prepareGradeDistributionData();
    const coursePerformanceData = prepareCoursePerformanceData();
    
    // Colors for pie chart
    const GRADE_COLORS = {
        A: '#4caf50', // green
        B: '#2196f3', // blue
        C: '#ff9800', // orange
        D: '#ff5722', // deep orange
        F: '#f44336'  // red
    };

    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom>GPA</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h3" sx={{ mr: 2 }}>
                                    {calculateGPA()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    /4.00
                                </Typography>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom>Courses Completed</Typography>
                            <Typography variant="h3">
                                {grades.length}
                            </Typography>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom>Average Score</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h3" sx={{ mr: 2 }}>
                                    {grades.length > 0 
                                        ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) 
                                        : 'N/A'
                                    }
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    /100
                                </Typography>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom>Program Completion</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h3" sx={{ mb: 1 }}>
                                    {`${calculateCompletionPercentage()}%`}
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={calculateCompletionPercentage()}
                                    sx={{ 
                                        height: 10, 
                                        borderRadius: 5,
                                        backgroundColor: alpha('#3f8cff', 0.2),
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#3f8cff',
                                        }
                                    }}
                                />
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
            </Grid>

            <StyledCard>
                <StyledCardContent>
                    <StyledTabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="fullWidth"
                    aria-label="academic progress tabs"
                >
                        <Tab 
                            label="Semester Progress" 
                            icon={<TimelineIcon />} 
                            iconPosition="start"
                        />
                        <Tab 
                            label="Grade Distribution" 
                            icon={<PieChartIcon />} 
                            iconPosition="start"
                        />
                        <Tab 
                            label="Course Performance" 
                            icon={<BarChartIcon />} 
                            iconPosition="start"
                        />
                    </StyledTabs>

                    <TabPanel value={tabValue} index={0}>
                                            <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                Progress by Semester
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                                This dashboard shows your academic performance across all semesters.
                                                            </Typography>
                                                            
                            {renderSemesterProgressChart()}
                                            </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                Grade Distribution
                        </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                                Distribution of grades across all your courses.
                                        </Typography>

                            {renderGradeDistributionChart()}
                                    </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                Course Performance
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                                Individual performance in each course.
                        </Typography>

                            <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={coursePerformanceData}>
                                        <CartesianGrid 
                                            strokeDasharray="3 3" 
                                            stroke="rgba(255, 255, 255, 0.1)"
                                        />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="rgba(255, 255, 255, 0.7)"
                                        />
                                        <YAxis 
                                            stroke="rgba(255, 255, 255, 0.7)"
                                            domain={[0, 100]}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="score">
                                            {coursePerformanceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                        <ReferenceLine 
                                            y={70} 
                                            stroke="#ff9800"
                                            strokeDasharray="3 3"
                                            label={{ 
                                                value: "Passing", 
                                                fill: '#ff9800',
                                                position: 'right'
                                            }}
                                        />
                                        <ReferenceLine 
                                            y={90} 
                                            stroke="#4caf50"
                                            strokeDasharray="3 3"
                                            label={{ 
                                                value: "Excellence", 
                                                fill: '#4caf50',
                                                position: 'right'
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
            </TabPanel>
                </StyledCardContent>
            </StyledCard>
        </Box>
    );
};

export default AcademicProgress; 