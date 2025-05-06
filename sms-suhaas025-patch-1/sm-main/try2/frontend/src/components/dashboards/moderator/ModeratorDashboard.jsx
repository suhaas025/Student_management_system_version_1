import React, { useState, useEffect } from 'react';
import {
    Grid,
    Typography,
    Box,
    Avatar,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Chip,
    Container,
    Paper,
    Tabs,
    Tab,
    styled,
    alpha,
    Badge,
    Menu,
    MenuItem,
    Divider,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction
} from '@mui/material';
import {
    School as SchoolIcon,
    Grade as GradeIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Assignment as AssignmentIcon,
    Dashboard as DashboardIcon,
    Announcement as AnnouncementIcon,
    Person as PersonIcon,
    ExitToApp as LogoutIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/auth.service';
import courseService from '../../../services/course.service';
import gradeService from '../../../services/grade.service';
import announcementService from '../../../services/announcement.service';

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: alpha('#121212', 0.7),
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: `0 8px 32px 0 ${alpha('#000', 0.37)}`
}));

const StyledCard = styled(Paper)(({ theme }) => ({
    backgroundColor: alpha('#1e1e1e', 0.6),
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    padding: theme.spacing(2),
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 6px 20px 0 ${alpha('#000', 0.3)}`
    }
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
    borderRadius: 8,
    marginBottom: theme.spacing(1),
    backgroundColor: alpha('#2d2d2d', 0.4),
    '&:hover': {
        backgroundColor: alpha('#3d3d3d', 0.6),
    },
    transition: 'background-color 0.2s'
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 50,
    height: 50,
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    '& .MuiTab-root': {
        minHeight: 64,
        padding: '6px 16px',
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-selected': {
            color: '#3f8cff',
        },
        '& .MuiTab-iconWrapper': {
            marginRight: theme.spacing(1),
            marginBottom: '0 !important',
        },
    },
    '& .MuiTabs-indicator': {
        height: 3,
        borderRadius: 3
    },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 3,
        padding: '0 4px',
        background: '#f44336',
        color: '#fff',
        minWidth: '20px',
        height: '20px',
        borderRadius: '10px',
    },
}));

const TabPanel = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
            {...other}
        >
            {value === index && (
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

// User Header Component
const UserHeader = ({ currentUser, handleLogout }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

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

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'white' }}>
                Moderator Dashboard
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleOpenMenu} size="small">
                    <Avatar sx={{ bgcolor: '#3f8cff', width: 38, height: 38 }}>
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
            </Box>
        </Box>
    );
};

// Main Dashboard Component
const ModeratorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        courses: [],
        grades: []
    });
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const user = authService.getCurrentUser();
            setCurrentUser(user);

            const [coursesResponse, gradesResponse, announcementsResponse] = await Promise.all([
                courseService.getAll(),
                gradeService.getAllGrades(),
                announcementService.getAll()
            ]);

            setStats({
                courses: coursesResponse.data || [],
                grades: gradesResponse.data || []
            });
            setAnnouncements(announcementsResponse.data || []);
            setUnreadCount(
                (announcementsResponse.data || [])
                    .filter(a => a.isActive && !a.readBy?.includes(user?.id))
                    .length
            );
            setError(null);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        
        // Refresh data when switching to announcements tab
        if (newValue === 3) {
            loadDashboardData();
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };
    
    const handleManageCourse = (courseId) => {
        navigate(`/moderator/courses/${courseId}/grades`);
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    if (loading && !currentUser) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
        );
    }

    const myCourses = stats.courses.filter(course => course.teacher?.id === currentUser?.id);
    const myGrades = stats.grades.filter(grade => 
        myCourses.some(course => course.id === grade.courseId)
    );

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
        }}>
            <StyledContainer maxWidth="lg" sx={{ height: '100%' }}>
                <StyledPaper>
                    <UserHeader currentUser={currentUser} handleLogout={handleLogout} />
                    
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <StyledTabs 
                            value={tabValue} 
                            onChange={handleTabChange} 
                            variant="fullWidth"
                            textColor="primary"
                            indicatorColor="primary"
                        >
                            <Tab 
                                icon={<DashboardIcon />} 
                                label="Dashboard" 
                                id="tab-0"
                                aria-controls="tabpanel-0" 
                            />
                            <Tab 
                                icon={<SchoolIcon />} 
                                label="Courses" 
                                id="tab-1"
                                aria-controls="tabpanel-1" 
                            />
                            <Tab 
                                icon={<GradeIcon />} 
                                label="Grades" 
                                id="tab-2"
                                aria-controls="tabpanel-2" 
                            />
                            <Tab 
                                icon={
                                    <StyledBadge badgeContent={unreadCount} color="error" max={99}>
                                        <AnnouncementIcon />
                                    </StyledBadge>
                                } 
                                label="Announcements" 
                                id="tab-3"
                                aria-controls="tabpanel-3" 
                            />
                        </StyledTabs>
            </Box>
                    
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        <TabPanel value={tabValue} index={0}>
                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                            
                            <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                                Welcome, {currentUser?.username}!
                            </Typography>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6}>
                                    <StyledCard>
                            <Box display="flex" alignItems="center" mb={2}>
                                            <StyledAvatar sx={{ bgcolor: '#3f8cff' }}>
                                    <SchoolIcon />
                                            </StyledAvatar>
                                            <Box ml={2}>
                                                <Typography variant="body1" color="rgba(255,255,255,0.7)" gutterBottom>
                                                    My Courses
                                                </Typography>
                                                <Typography variant="h4" color="white">
                                                    {myCourses.length}
                                                </Typography>
                                                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                                                    Active: {myCourses.filter(c => c.status === 'ACTIVE').length}
                                    </Typography>
                                </Box>
                            </Box>
                                    </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6}>
                                    <StyledCard>
                            <Box display="flex" alignItems="center" mb={2}>
                                            <StyledAvatar sx={{ bgcolor: '#ff9800' }}>
                                    <GradeIcon />
                                            </StyledAvatar>
                                            <Box ml={2}>
                                                <Typography variant="body1" color="rgba(255,255,255,0.7)" gutterBottom>
                                                    Grades Managed
                                                </Typography>
                                                <Typography variant="h4" color="white">
                                                    {myGrades.length}
                                                </Typography>
                                                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                                                    Pending: {myGrades.filter(g => g.status === 'PENDING').length}
                                    </Typography>
                                </Box>
                            </Box>
                                    </StyledCard>
                </Grid>
            </Grid>

                            <Typography variant="h6" sx={{ color: 'white', mb: 2, mt: 2 }}>
                                Recent Announcements
                            </Typography>
                            
                            {announcements.length > 0 ? (
                                <List sx={{ mb: 4 }}>
                                    {announcements.slice(0, 3).map((announcement) => (
                                        <StyledListItem key={announcement.id}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: announcement.isUrgent ? '#f44336' : '#3f8cff' }}>
                                                    <AnnouncementIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" color="white">
                                                        {announcement.title}
                                                        {announcement.isUrgent && (
                                                            <Chip 
                                                                size="small" 
                                                                label="Urgent" 
                                                                color="error" 
                                                                sx={{ ml: 1, height: 20 }} 
                                                            />
                                                        )}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="rgba(255,255,255,0.6)" noWrap>
                                                        {announcement.message}
                                                    </Typography>
                                                }
                                            />
                                        </StyledListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body1" color="rgba(255,255,255,0.6)" sx={{ mb: 4 }}>
                                    No announcements found.
                                </Typography>
                            )}
                            
                            <Box display="flex" justifyContent="center" mt={2}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    startIcon={<AnnouncementIcon />}
                                    onClick={() => setTabValue(3)}
                                >
                                    Manage Announcements
                                </Button>
                            </Box>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                                My Courses
                            </Typography>
                            
                            {myCourses.length > 0 ? (
                    <List>
                        {myCourses.map(course => (
                                        <StyledListItem key={course.id}>
                                <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: course.status === 'ACTIVE' ? '#4caf50' : '#9e9e9e' }}>
                                        <SchoolIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="subtitle1" color="white">
                                            {course.courseName}
                                                        </Typography>
                                            <Chip
                                                size="small"
                                                label={course.status}
                                                color={course.status === 'ACTIVE' ? 'success' : 'default'}
                                                            sx={{ 
                                                                bgcolor: course.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                                                color: 'white'
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="rgba(255,255,255,0.6)">
                                                        {course.courseCode} - {course.semester || 'No Semester'}
                                                    </Typography>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AssignmentIcon />}
                                                    onClick={() => handleManageCourse(course.id)}
                                                    sx={{ 
                                                        borderColor: 'rgba(255,255,255,0.3)', 
                                                        color: 'white',
                                                        '&:hover': {
                                                            borderColor: 'rgba(255,255,255,0.6)',
                                                            backgroundColor: 'rgba(255,255,255,0.05)'
                                                        }
                                                    }}
                                                >
                                                    Manage
                                                </Button>
                                            </ListItemSecondaryAction>
                                        </StyledListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body1" color="rgba(255,255,255,0.6)" align="center">
                                    No courses found. Courses assigned to you will appear here.
                                </Typography>
                            )}
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                                Grade Management
                            </Typography>
                            
                            <Box display="flex" justifyContent="flex-end" mb={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => navigate('/moderator/grades')}
                                    startIcon={<GradeIcon />}
                                >
                                    Manage All Grades
                                </Button>
                            </Box>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledCard>
                                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                            Pending Review
                                        </Typography>
                                        <Typography variant="h3" sx={{ color: '#ff9800', mb: 1 }}>
                                            {myGrades.filter(g => g.status === 'PENDING').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Grades awaiting review
                                        </Typography>
                                    </StyledCard>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledCard>
                                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                            Approved
                                        </Typography>
                                        <Typography variant="h3" sx={{ color: '#4caf50', mb: 1 }}>
                                            {myGrades.filter(g => g.status === 'APPROVED').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Approved grades
                                        </Typography>
                                    </StyledCard>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={4}>
                                    <StyledCard>
                                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                            Rejected
                                        </Typography>
                                        <Typography variant="h3" sx={{ color: '#f44336', mb: 1 }}>
                                            {myGrades.filter(g => g.status === 'REJECTED').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Rejected grades
                                        </Typography>
                                    </StyledCard>
                                </Grid>
                            </Grid>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={3}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                                Announcements
                            </Typography>
                            
                            <Box display="flex" justifyContent="space-between" mb={3}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={loadDashboardData}
                                    startIcon={<RefreshIcon />}
                                    sx={{ 
                                        borderColor: 'rgba(255,255,255,0.3)', 
                                        color: 'white',
                                        '&:hover': {
                                            borderColor: 'rgba(255,255,255,0.6)',
                                            backgroundColor: 'rgba(255,255,255,0.05)'
                                        }
                                    }}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => navigate('/moderator/announcements')}
                                    startIcon={<AnnouncementIcon />}
                                >
                                    Manage Announcements
                                </Button>
                            </Box>
                            
                            {announcements.length > 0 ? (
                                <List>
                                    {announcements.map((announcement) => (
                                        <StyledListItem key={announcement.id}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: announcement.isUrgent ? '#f44336' : '#3f8cff' }}>
                                                    <AnnouncementIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="subtitle1" color="white">
                                                            {announcement.title}
                                                        </Typography>
                                                        {announcement.isUrgent && (
                                                            <Chip 
                                                                size="small" 
                                                                label="Urgent" 
                                                                color="error" 
                                                                sx={{ height: 20 }} 
                                                            />
                                                        )}
                                                        {!announcement.isActive && (
                                                            <Chip 
                                                                size="small" 
                                                                label="Inactive" 
                                                                sx={{ height: 20, bgcolor: 'rgba(158, 158, 158, 0.2)', color: 'white' }} 
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="rgba(255,255,255,0.6)" sx={{ mb: 1 }}>
                                                            {announcement.message}
                                                        </Typography>
                                                        <Typography variant="caption" color="rgba(255,255,255,0.4)">
                                                            Posted by: {announcement.createdByUsername || 'System'} • 
                                                            {new Date(announcement.createdAt).toLocaleDateString()}
                                                        </Typography>
                                        </Box>
                                    }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton 
                                                    edge="end" 
                                                    aria-label="edit"
                                                    onClick={() => navigate(`/moderator/announcements/${announcement.id}`)}
                                                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </StyledListItem>
                        ))}
                    </List>
                            ) : (
                                <Typography variant="body1" color="rgba(255,255,255,0.6)" align="center">
                                    No announcements found.
                                </Typography>
                            )}
                        </TabPanel>
                    </Box>
                </StyledPaper>
            </StyledContainer>
        </Box>
    );
};

export default ModeratorDashboard; 