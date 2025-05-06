import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Chip,
    LinearProgress,
    Divider,
    styled,
    alpha,
    Paper
} from '@mui/material';
import {
    School as SchoolIcon,
    Grade as GradeIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Refresh as RefreshIcon,
    Notifications as NotificationsIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import authService from '../../../services/auth.service';
import gradeService from '../../../services/grade.service';

// Styled components for dark theme
const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease-in-out',
    height: '100%',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        borderColor: '#3f8cff',
    },
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

const IconWrapper = styled(Avatar)(({ theme, bgcolor }) => ({
    backgroundColor: alpha(bgcolor || '#3f8cff', 0.2),
    color: bgcolor || '#3f8cff',
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: theme.spacing(2),
    '& .MuiSvgIcon-root': {
        fontSize: 28,
    },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    '&:last-child': {
        borderBottom: 'none',
    },
    '& .MuiListItemText-primary': {
        color: '#fff',
        fontWeight: 500,
    },
    '& .MuiListItemText-secondary': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 6,
    borderRadius: 3,
    marginTop: theme.spacing(1),
}));

const DashboardHome = ({ onTabChange, announcements }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grades, setGrades] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const user = authService.getCurrentUser();
            setCurrentUser(user);
            
            if (!user || !user.id) {
                console.error('Invalid user data:', user);
                setError('User data is missing or invalid. Please try logging in again.');
                setLoading(false);
                return;
            }
            
            console.log('Loading grades for user ID:', user.id);

            // Try up to 3 times to load grades
            let gradesResponse = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !gradesResponse) {
                try {
                    attempts++;
                    console.log(`Attempt ${attempts} to load grades`);
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
                console.log('Successfully loaded grades:', gradesResponse.data);
                setGrades(gradesResponse.data || []);
                setError(null);
            } else {
                console.warn('No grades data available after attempts');
                setGrades([]);
                // In development mode, don't show error to user
                if (process.env.NODE_ENV === 'development') {
                    setError(null);
                } else {
                    setError('Unable to load grades. Please try again later.');
                }
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            // In development mode, show more details
            if (process.env.NODE_ENV === 'development') {
                setError(`Failed to load data: ${err.message || 'Unknown error'}`);
            } else {
                setError('Failed to load dashboard data. Please try again later.');
            }
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Calculate GPA and other metrics
    const calculateGPA = () => {
        if (!grades || !Array.isArray(grades) || grades.length === 0) return 'N/A';
        
        try {
            const validGrades = grades.filter(grade => 
                grade && typeof grade === 'object' && 
                typeof grade.score === 'number'
            );
            
            if (validGrades.length === 0) return 'N/A';
            
            const totalScore = validGrades.reduce((sum, grade) => sum + grade.score, 0);
            return (totalScore / validGrades.length).toFixed(2);
        } catch (error) {
            console.error('Error calculating GPA:', error);
            return 'N/A';
        }
    };

    // Get the most recent semester
    const getCurrentSemester = () => {
        if (!grades || !Array.isArray(grades) || grades.length === 0) return 'N/A';
        
        try {
            // Sort grades by academic year (most recent first)
            const sortedGrades = [...grades].sort((a, b) => {
                if (!a || !b) return 0;
                
                // First compare by academic year
                const yearA = a.academicYear ? a.academicYear.split('-')[0] : '0';
                const yearB = b.academicYear ? b.academicYear.split('-')[0] : '0';
                
                if (yearB !== yearA) {
                    return parseInt(yearB) - parseInt(yearA);
                }
                
                // If same year, compare by semester number
                return parseInt(b.semester || 0) - parseInt(a.semester || 0);
            });
            
            // Return the semester from the most recent grade
            return sortedGrades[0]?.semester || 'N/A';
        } catch (error) {
            console.error('Error getting current semester:', error);
            return 'N/A';
        }
    };

    const getGradeColor = (score) => {
        if (!score && score !== 0) return 'primary';
        
        const numericScore = Number(score);
        if (isNaN(numericScore)) return 'primary';
        
        if (numericScore >= 90) return 'success';
        if (numericScore >= 70) return 'primary';
        if (numericScore >= 60) return 'warning';
        return 'error';
    };

    // Count unread announcements
    const unreadAnnouncementCount = () => {
        try {
            if (!announcements || !Array.isArray(announcements)) return 0;
            
            const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
            
            return announcements.filter(a => 
                a && 
                typeof a === 'object' &&
                !readAnnouncements.includes(a.id) && 
                (a.isActive === true || a.isActive === 'true' || a.isActive === undefined)
            ).length;
        } catch (error) {
            console.error('Error counting unread announcements:', error);
            return 0;
        }
    };

    // Get urgent announcements - handle both boolean and string values
    const getUrgentAnnouncements = () => {
        try {
            if (!announcements || !Array.isArray(announcements)) return [];
            
            return announcements.filter(a => 
                a && 
                typeof a === 'object' &&
                (a.isUrgent === true || a.isUrgent === 'true') && 
                (a.isActive === true || a.isActive === 'true' || a.isActive === undefined)
            );
        } catch (error) {
            console.error('Error filtering urgent announcements:', error);
            return [];
        }
    };
    
    const urgentAnnouncements = getUrgentAnnouncements();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end">
                <Tooltip title="Refresh Data">
                    <IconButton onClick={loadDashboardData} sx={{ color: '#3f8cff' }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Box display="flex" alignItems="center">
                                <IconWrapper bgcolor="#3f8cff">
                                    <SchoolIcon />
                                </IconWrapper>
                                <Box>
                                    <Typography variant="body1" sx={{ opacity: 0.8, mb: 0.5 }}>
                                        Total Courses
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                        {grades.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Box display="flex" alignItems="center">
                                <IconWrapper bgcolor="#4caf50">
                                    <GradeIcon />
                                </IconWrapper>
                                <Box>
                                    <Typography variant="body1" sx={{ opacity: 0.8, mb: 0.5 }}>
                                        Average Score
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                        {calculateGPA()}
                                    </Typography>
                                </Box>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent>
                            <Box display="flex" alignItems="center">
                                <IconWrapper bgcolor="#2196f3">
                                    <CalendarIcon />
                                </IconWrapper>
                                <Box>
                                    <Typography variant="body1" sx={{ opacity: 0.8, mb: 0.5 }}>
                                        Current Semester
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                        {getCurrentSemester()}
                                    </Typography>
                                </Box>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StyledCard>
                        <StyledCardContent 
                            component={Box} 
                            onClick={() => onTabChange(3)} 
                            sx={{ cursor: 'pointer', height: '100%', transition: 'all 0.2s' }}
                        >
                            <Box display="flex" alignItems="center">
                                <IconWrapper bgcolor="#ff9800">
                                    <NotificationsIcon />
                                </IconWrapper>
                                <Box>
                                    <Typography variant="body1" sx={{ opacity: 0.8, mb: 0.5 }}>
                                        Announcements
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                        {unreadAnnouncementCount()} new
                                    </Typography>
                                </Box>
                            </Box>
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={7}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                Course Grades
                            </Typography>
                            {grades.length === 0 ? (
                                <Alert 
                                    severity="info" 
                                    sx={{ 
                                        background: 'rgba(33, 150, 243, 0.15)', 
                                        color: '#fff',
                                        border: '1px solid rgba(33, 150, 243, 0.3)'
                                    }}
                                >
                                    No grade data available
                                </Alert>
                            ) : (
                                <>
                                    <List sx={{ pt: 0 }}>
                                        {Array.isArray(grades) && grades.slice(0, 5).map(grade => 
                                            grade && typeof grade === 'object' ? (
                                            <StyledListItem key={grade.id || Math.random().toString()}>
                                                <ListItemAvatar>
                                                    <Avatar 
                                                        sx={{ 
                                                            bgcolor: alpha('#3f8cff', 0.2), 
                                                            color: '#3f8cff' 
                                                        }}
                                                    >
                                                        {grade.courseCode?.[0] || <SchoolIcon />}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {grade.courseName || 'Unnamed Course'}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" component="div" sx={{ mt: 0.5, mb: 0.5 }}>
                                                                {grade.courseCode || 'N/A'} - Score: {grade.score || 'N/A'}
                                                            </Typography>
                                                            <StyledLinearProgress
                                                                variant="determinate"
                                                                value={typeof grade.score === 'number' ? Math.min(100, Math.max(0, grade.score)) : 0}
                                                                color={getGradeColor(grade.score)}
                                                            />
                                                        </>
                                                    }
                                                />
                                            </StyledListItem>
                                            ) : null
                                        )}
                                    </List>
                                </>
                            )}
                        </StyledCardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={5}>
                    <StyledCard>
                        <StyledCardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                Recent Announcements
                                {urgentAnnouncements.length > 0 && (
                                    <Chip 
                                        label={`${urgentAnnouncements.length} Urgent`} 
                                        size="small" 
                                        sx={{ 
                                            ml: 1,
                                            backgroundColor: alpha('#f44336', 0.2),
                                            color: '#f44336',
                                            fontWeight: 500,
                                            borderRadius: '4px'
                                        }}
                                    />
                                )}
                            </Typography>
                            
                            {!announcements || !Array.isArray(announcements) || announcements.length === 0 ? (
                                <Alert 
                                    severity="info"
                                    sx={{ 
                                        background: 'rgba(33, 150, 243, 0.15)', 
                                        color: '#fff',
                                        border: '1px solid rgba(33, 150, 243, 0.3)'
                                    }}
                                >
                                    No announcements available
                                </Alert>
                            ) : (
                                <>
                                    <List sx={{ pt: 0 }}>
                                        {announcements.slice(0, 3).map(announcement => 
                                            announcement && typeof announcement === 'object' ? (
                                            <StyledListItem 
                                                key={announcement.id || Math.random().toString()}
                                                sx={{ 
                                                    bgcolor: announcement.isUrgent ? alpha('#f44336', 0.1) : 'inherit',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        backgroundColor: alpha('#3f8cff', 0.1),
                                                    }
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar 
                                                        sx={{ 
                                                            bgcolor: announcement.isUrgent 
                                                                ? alpha('#f44336', 0.2) 
                                                                : alpha('#3f8cff', 0.2),
                                                            color: announcement.isUrgent ? '#f44336' : '#3f8cff',
                                                            width: 40,
                                                            height: 40
                                                        }}
                                                    >
                                                        {announcement.isUrgent ? '!' : 'A'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                            {announcement.title || 'Unnamed Announcement'}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box component="div">
                                                            <Typography 
                                                                component="div" 
                                                                variant="body2"
                                                                sx={{ 
                                                                    display: 'block',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    maxWidth: '100%',
                                                                    color: 'rgba(255, 255, 255, 0.7)'
                                                                }}
                                                            >
                                                                {announcement.message || 'No details available'}
                                                            </Typography>
                                                            <Typography 
                                                                component="div" 
                                                                variant="caption" 
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.5)',
                                                                    mt: 0.5
                                                                }}
                                                            >
                                                                {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown date'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </StyledListItem>
                                            ) : null
                                        )}
                                    </List>
                                    {Array.isArray(announcements) && announcements.length > 3 && (
                                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                                            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                                            <Tooltip title="View all announcements">
                                                <IconButton 
                                                    onClick={() => onTabChange(3)}
                                                    sx={{ 
                                                        color: '#3f8cff',
                                                        backgroundColor: alpha('#3f8cff', 0.1),
                                                        '&:hover': {
                                                            backgroundColor: alpha('#3f8cff', 0.2),
                                                        }
                                                    }}
                                                >
                                                    <NotificationsIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </>
                            )}
                        </StyledCardContent>
                    </StyledCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardHome; 