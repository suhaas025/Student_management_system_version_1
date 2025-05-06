import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CardActions, 
    Button,
    Paper,
    styled,
    alpha,
    Avatar,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    CircularProgress,
    AppBar,
    Toolbar,
    Badge,
    Tooltip,
    ListItemText,
    Chip,
    List,
    ListItem,
    Skeleton,
    Fab,
    Zoom,
    ButtonGroup,
    Snackbar,
    Alert as MuiAlert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
    School as SchoolIcon,
    Grade as GradeIcon,
    People as PeopleIcon,
    Announcement as AnnouncementIcon,
    Person as PersonIcon,
    ExitToApp as LogoutIcon,
    Settings as SettingsIcon,
    Dashboard as DashboardIcon,
    SwapHoriz as SwapHorizIcon,
    Check as CheckIcon,
    ErrorOutline as ErrorIcon,
    AccessTime as PendingIcon,
    TrendingUp as TrendingUpIcon,
    Notifications as NotificationsIcon,
    DateRange as DateRangeIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Description as DocumentIcon,
    Event as EventIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import authService from '../../services/auth.service';
import userService from '../../services/user.service';
import courseService from '../../services/course.service';
import gradeService from '../../services/grade.service';
import announcementService from '../../services/announcement.service';
import CourseManagement from './CourseManagement';
import ModeratorGrades from './ModeratorGrades';
import UserManagement from './UserManagement';
import ModeratorAnnouncements from './ModeratorAnnouncements';

// Enhanced styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    padding: theme.spacing(3),
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    color: 'white',
    marginBottom: theme.spacing(3),
    border: '1px solid #374151',
    backdropFilter: 'blur(10px)'
}));

const StatsCard = styled(Card)(({ theme, color = 'primary' }) => ({
    height: '100%',
    backgroundColor: alpha(theme.palette[color].main, 0.15),
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
    boxShadow: `0 8px 24px ${alpha('#000', 0.25)}`,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 12px 28px ${alpha('#000', 0.3)}`
    }
}));

const StatsCardContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
}));

const StatsIcon = styled(Box)(({ theme, color = 'primary' }) => ({
    backgroundColor: alpha(theme.palette[color].main, 0.2),
    color: theme.palette[color].main,
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    width: 54,
    height: 54
}));

const StatValue = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: theme.spacing(1)
}));

const StatLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
}));

const StatChip = styled(Chip)(({ theme, color = 'primary' }) => ({
    backgroundColor: alpha(theme.palette[color].main, 0.2),
    color: theme.palette[color].main,
    fontWeight: 600,
    marginTop: 'auto',
    alignSelf: 'flex-start'
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(63, 140, 255, 0.2) 0%, rgba(63, 140, 255, 0.1) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(63, 140, 255, 0.2)'
}));

const DateChip = styled(Chip)(({ theme }) => ({
    backgroundColor: alpha('#fff', 0.1),
    color: '#fff',
    fontWeight: 600,
    padding: theme.spacing(0.5, 1),
    '& .MuiChip-icon': {
        color: alpha('#fff', 0.7)
    }
}));

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: alpha('#121212', 0.8),
    backdropFilter: 'blur(10px)',
    boxShadow: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    zIndex: 3
}));

const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(4),
    minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
    position: 'relative',
    zIndex: 1
}));

const StyledCard = styled(Card)(({ theme, color }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: alpha('#1e1e1e', 0.8),
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-10px)',
        boxShadow: `0 10px 25px ${alpha(theme.palette[color].main, 0.15)}`
    },
    overflow: 'hidden'
}));

const CardIconBox = styled(Box)(({ theme, color }) => ({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
}));

const StyledAvatar = styled(Avatar)(({ theme, bgcolor }) => ({
    width: 70,
    height: 70,
    backgroundColor: bgcolor,
    color: '#fff',
    boxShadow: `0 4px 12px ${alpha(bgcolor, 0.4)}`,
    marginBottom: theme.spacing(2)
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(3)
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
    justifyContent: 'center',
    padding: theme.spacing(2),
    paddingTop: 0
}));

const StyledButton = styled(Button)(({ theme, color }) => ({
    backgroundColor: alpha(theme.palette[color].main, 0.15),
    color: theme.palette[color].main,
    fontWeight: 600,
    padding: '8px 24px',
    borderRadius: 8,
    '&:hover': {
        backgroundColor: alpha(theme.palette[color].main, 0.25),
    },
    textTransform: 'none',
    fontSize: '0.95rem'
}));

// Add a direct role switcher button style 
const RoleSwitcherButton = styled(Button)(({ theme }) => ({
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '6px 12px',
    textTransform: 'none',
    fontWeight: 'bold',
    marginRight: theme.spacing(2),
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
}));

// Role Badge style
const RoleBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#f44336',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        minWidth: '18px',
        height: '18px',
        padding: '0 6px',
    },
}));

// Add styled menu component
const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: 'rgba(26, 32, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        marginTop: 8,
        minWidth: 200,
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            padding: '10px 16px',
            transition: 'all 0.2s ease',
            '& .MuiSvgIcon-root': {
                fontSize: 20,
                color: 'rgba(255, 255, 255, 0.7)',
                marginRight: theme.spacing(2),
            },
            '&:active': {
                backgroundColor: alpha('#3f8cff', 0.3),
            },
            '&:hover': {
                backgroundColor: alpha('#3f8cff', 0.1),
            },
        },
    },
}));

// Activity item component
const ActivityItem = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    backgroundColor: alpha('#1e1e1e', 0.4),
    borderRadius: 12,
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'translateX(5px)',
        backgroundColor: alpha('#1e1e1e', 0.6),
    }
}));

const ActivityAvatar = styled(Avatar)(({ theme, bgcolor = '#3f8cff' }) => ({
    backgroundColor: bgcolor,
    color: '#fff',
    width: 40,
    height: 40
}));

const ActivityContent = styled(Box)(({ theme }) => ({
    marginLeft: theme.spacing(2),
    flex: 1
}));

const ActivityTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    color: '#fff',
    fontSize: '0.95rem'
}));

const ActivityTime = styled(Typography)(({ theme }) => ({
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5)
}));

const ActivityChip = styled(Chip)(({ theme, color = 'primary' }) => ({
    height: 24,
    fontSize: '0.75rem',
    backgroundColor: alpha(theme.palette[color].main, 0.2),
    color: theme.palette[color].main,
    fontWeight: 600,
    marginLeft: 'auto'
}));

// Quick action fab button
const ActionFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    background: 'linear-gradient(45deg, #3f8cff 30%, #00c6ff 90%)',
    '&:hover': {
        background: 'linear-gradient(45deg, #357abd 30%, #00a6d6 90%)',
    },
    zIndex: 1000
}));

// Quick action buttons
const QuickActionButton = styled(Button)(({ theme, color = 'primary' }) => ({
    backgroundColor: alpha(theme.palette[color].main, 0.15),
    color: theme.palette[color].main,
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: 8,
    '&:hover': {
        backgroundColor: alpha(theme.palette[color].main, 0.25),
    },
    textTransform: 'none',
    fontSize: '0.875rem',
    marginRight: theme.spacing(2)
}));

// Alert with styling
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Feature card component
const FeatureCard = ({ title, description, icon, path, color }) => {
    const navigate = useNavigate();
    
    const bgColor = {
        'primary.main': '#3f8cff',
        'success.main': '#4caf50',
        'warning.main': '#ff9800',
        'info.main': '#03a9f4'
    }[color];
    
    return (
        <StyledCard color={color.split('.')[0]}>
            <StyledCardContent>
                <CardIconBox>
                    <StyledAvatar bgcolor={bgColor}>
                        {icon}
                    </StyledAvatar>
                </CardIconBox>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{ color: 'white', fontWeight: 600 }}
                >
                    {title}
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
                >
                    {description}
                </Typography>
            </StyledCardContent>
            <StyledCardActions>
                <StyledButton 
                    onClick={() => navigate(path)}
                    color={color.split('.')[0]}
                >
                    Access
                </StyledButton>
            </StyledCardActions>
        </StyledCard>
    );
};

// Feature module card
const ModuleCard = styled(Card)(({ theme, bgcolor = '#3f8cff' }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: alpha('#1e1e1e', 0.7),
    backdropFilter: 'blur(5px)',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 12px 20px ${alpha('#000', 0.25)}`
    }
}));

const ModuleIconWrapper = styled(Box)(({ theme, bgcolor = '#3f8cff' }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3)
}));

const ModuleIcon = styled(Avatar)(({ theme, bgcolor = '#3f8cff' }) => ({
    width: 80,
    height: 80,
    backgroundColor: bgcolor,
    color: '#fff',
    boxShadow: `0 8px 16px ${alpha(bgcolor, 0.4)}`
}));

const ModuleContent = styled(CardContent)(({ theme }) => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(2)
}));

const ModuleTitle = styled(Typography)(({ theme }) => ({
    color: '#fff',
    fontWeight: 600,
    fontSize: '1.25rem',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1)
}));

const ModuleDescription = styled(Typography)(({ theme }) => ({
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
    marginBottom: theme.spacing(2)
}));

const ModuleActions = styled(CardActions)(({ theme }) => ({
    justifyContent: 'center',
    padding: theme.spacing(2),
    paddingTop: 0
}));

const AccessButton = styled(Button)(({ theme, color = 'primary' }) => ({
    backgroundColor: alpha(theme.palette[color].main, 0.15),
    color: theme.palette[color].main,
    fontWeight: 500,
    textTransform: 'none',
    borderRadius: 8,
    padding: '8px 24px',
    '&:hover': {
        backgroundColor: alpha(theme.palette[color].main, 0.25),
    }
}));

const ModeratorDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState({
        courses: true,
        grades: true,
        students: true,
        announcements: true
    });
    const [currentUser, setCurrentUser] = useState(null);
    const [content, setContent] = useState("");
    const [error, setError] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
    const roleMenuOpen = Boolean(roleMenuAnchor);
    const [quickActionMenu, setQuickActionMenu] = useState(null);
    const [stats, setStats] = useState({
        totalCourses: 0,
        pendingGrades: 0,
        activeStudents: 0,
        unreadAnnouncements: 0
    });
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [availableDashboards, setAvailableDashboards] = useState([]);
    
    console.log("ModeratorDashboard component is initializing");

    // Function to handle scroll events
    const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Function to fetch all dashboard data
    const fetchDashboardData = async () => {
        try {
            // Fetch courses data
            setDataLoading(prev => ({ ...prev, courses: true }));
            courseService.getAllCourses()
                .then(response => {
                    const activeCourses = response.data?.length || 0;
                    setStats(prev => ({ ...prev, totalCourses: activeCourses }));
                })
                .catch(error => {
                    console.error("Error fetching courses:", error);
                })
                .finally(() => {
                    setDataLoading(prev => ({ ...prev, courses: false }));
                });

            // Fetch pending grades
            setDataLoading(prev => ({ ...prev, grades: true }));
            gradeService.getGradesByStatus("PENDING")
                .then(response => {
                    const pendingCount = response.data?.length || 0;
                    setStats(prev => ({ ...prev, pendingGrades: pendingCount }));
                })
                .catch(error => {
                    console.error("Error fetching pending grades:", error);
                })
                .finally(() => {
                    setDataLoading(prev => ({ ...prev, grades: false }));
                });

            // Fetch active students
            setDataLoading(prev => ({ ...prev, students: true }));
            userService.getModeratorStudents()
                .then(response => {
                    const studentCount = response.data?.length || 0;
                    setStats(prev => ({ ...prev, activeStudents: studentCount }));
                })
                .catch(error => {
                    console.error("Error fetching students:", error);
                })
                .finally(() => {
                    setDataLoading(prev => ({ ...prev, students: false }));
                });

            // Fetch unread announcements
            setDataLoading(prev => ({ ...prev, announcements: true }));
            announcementService.getUnreadAnnouncementsCount()
                .then(response => {
                    const unreadCount = response.data || 0;
                    setStats(prev => ({ ...prev, unreadAnnouncements: unreadCount }));
                })
                .catch(error => {
                    console.error("Error fetching unread announcements:", error);
                    // Try alternate method if direct method fails
                    announcementService.getAllAnnouncements()
                        .then(response => {
                            // Calculate unread based on local storage
                            const announcements = response.data || [];
                            const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
                            const unreadCount = announcements.filter(a => 
                                !readAnnouncements.includes(a.id) && a.isActive
                            ).length;
                            setStats(prev => ({ ...prev, unreadAnnouncements: unreadCount }));
                        })
                        .catch(e => console.error("Alternative announcements fetch failed:", e));
                })
                .finally(() => {
                    setDataLoading(prev => ({ ...prev, announcements: false }));
                });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    useEffect(() => {
        console.log("ModeratorDashboard useEffect running");
        try {
            const user = authService.getCurrentUser();
            console.log("Dashboard detected user:", user);
            setCurrentUser(user);
            
            // Debug logs
            console.log("Current user:", user);
            if (user) {
                console.log("User roles:", user.roles);
                try {
                    const dashboards = authService.getAvailableDashboards();
                    setAvailableDashboards(dashboards);
                    console.log("Available dashboards:", dashboards);
                } catch (err) {
                    console.error("Error getting available dashboards:", err);
                }
            }

            // Fetch real data instead of using dummy values
            fetchDashboardData();

            userService.getModeratorBoard().then(
                (response) => {
                    console.log("ModeratorBoard API response:", response);
                    setContent(response.data);
                    setLoading(false);
                },
                (error) => {
                    console.error("ModeratorBoard API error:", error);
                    const _content =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString();

                    setContent(_content);
                    setError(error);
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error("Error in ModeratorDashboard useEffect:", error);
            setError(error);
            setLoading(false);
        }
    }, []);

    const handleProfileClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileClose = () => {
        setAnchorEl(null);
    };

    const handleProfileRedirect = () => {
        handleProfileClose();
        navigate('/profile');
    };

    const handleLogout = () => {
        handleProfileClose();
        authService.logout();
        navigate('/login');
    };

    // Role switcher handlers
    const handleRoleMenuOpen = (event) => {
        setRoleMenuAnchor(event.currentTarget);
    };

    const handleRoleMenuClose = () => {
        setRoleMenuAnchor(null);
    };

    const switchToStudentDashboard = () => {
        handleRoleMenuClose();
        navigate('/dashboard');
    };

    // Refresh all dashboard data
    const refreshData = () => {
        setSnackbar({
            open: true,
            message: 'Refreshing dashboard data...',
            severity: 'info'
        });
        
        fetchDashboardData();
        
        setTimeout(() => {
            setSnackbar({
                open: true,
                message: 'Dashboard data refreshed!',
                severity: 'success'
            });
        }, 1500);
    };

    // Quick action handlers
    const handleQuickActionClick = (event) => {
        setQuickActionMenu(event.currentTarget);
    };

    const handleQuickActionClose = () => {
        setQuickActionMenu(null);
    };

    const handleCreateAnnouncement = () => {
        handleQuickActionClose();
        navigate('/moderator/announcements/create');
    };

    const handleCreateCourse = () => {
        handleQuickActionClose();
        navigate('/moderator/courses/create');
    };

    const handleGradeEntry = () => {
        handleQuickActionClose();
        navigate('/moderator/grades/batch');
    };

    // Snackbar close
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
        );
    }

    // Format current date for display
    const currentDate = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(currentDate);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto'
            }}
        >
            <Container 
                maxWidth="lg" 
                sx={{ 
                    py: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%' 
                }}
            >
                <StyledPaper 
                    sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column' 
                    }}
                >
                    {/* Header */}
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 2,
                            mb: 2,
                            borderBottom: '1px solid #374151',
                        }}
                    >
                        <Box display="flex" alignItems="center">
                            <DashboardIcon sx={{ color: '#3f8cff', fontSize: 32, mr: 1.5 }} />
                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                                Moderator Portal
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                            {/* Refresh button */}
                            <Tooltip title="Refresh Dashboard Data">
                                <IconButton
                                    onClick={refreshData}
                                    sx={{ 
                                        mr: 2, 
                                        color: 'white',
                                        backgroundColor: alpha('#4caf50', 0.1),
                                        '&:hover': {
                                            backgroundColor: alpha('#4caf50', 0.2),
                                        }
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            
                            {/* Notification badge for unread announcements */}
                            <IconButton
                                sx={{ 
                                    mr: 2, 
                                    color: 'white',
                                    backgroundColor: alpha('#3f8cff', 0.1),
                                    '&:hover': {
                                        backgroundColor: alpha('#3f8cff', 0.2),
                                    }
                                }}
                            >
                                <Badge badgeContent={stats.unreadAnnouncements} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                            
                            {/* Only show role switcher if user has multiple roles (dashboards) */}
                            {currentUser && availableDashboards.length > 1 && (
                                <RoleSwitcherButton 
                                    startIcon={<SwapHorizIcon />}
                                    onClick={handleRoleMenuOpen}
                                >
                                    Switch Dashboard
                                </RoleSwitcherButton>
                            )}
                            
                            <Avatar 
                                onClick={handleProfileClick}
                                sx={{ 
                                    bgcolor: alpha('#3f8cff', 0.8),
                                    width: 40, 
                                    height: 40,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: alpha('#3f8cff', 0.9),
                                    }
                                }}
                            >
                                <PersonIcon />
                            </Avatar>
                            
                            {/* Role Switch Menu */}
                            <Menu
                                anchorEl={roleMenuAnchor}
                                open={roleMenuOpen}
                                onClose={handleRoleMenuClose}
                                PaperProps={{
                                    sx: {
                                        backgroundColor: alpha('#1e1e1e', 0.9),
                                        backdropFilter: 'blur(10px)', 
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        minWidth: '200px',
                                        color: 'white',
                                        mt: 1
                                    }
                                }}
                            >
                                <MenuItem 
                                    disabled 
                                    sx={{ opacity: 0.6 }}
                                >
                                    <ListItemIcon sx={{ color: 'white' }}>
                                        <PersonIcon />
                                    </ListItemIcon>
                                    <Typography>Moderator Dashboard</Typography>
                                </MenuItem>
                                {availableDashboards.includes('ROLE_STUDENT') && (
                                    <MenuItem onClick={switchToStudentDashboard}>
                                        <ListItemIcon sx={{ color: 'white' }}>
                                            <SchoolIcon />
                                        </ListItemIcon>
                                        <Typography>Student Dashboard</Typography>
                                    </MenuItem>
                                )}
                            </Menu>
                            
                            <StyledMenu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleProfileClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={handleProfileRedirect}>
                                    <ListItemIcon sx={{ color: 'white' }}>
                                        <PersonIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Profile</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon sx={{ color: 'white' }}>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Logout</ListItemText>
                                </MenuItem>
                            </StyledMenu>
                        </Box>
                    </Box>

                    {/* Main content container */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 2 }}>
                        {/* Welcome Section */}
                        <WelcomeSection>
                            <Box>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                    Welcome back, {currentUser?.username}!
                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    You have {stats.pendingGrades} pending grades to review and {stats.unreadAnnouncements} unread announcements.
                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                                {/* Remove Quick Action Buttons and keep only the date */}
                                <DateChip 
                                    icon={<DateRangeIcon />} 
                                    label={formattedDate} 
                                    sx={{ height: 36 }}
                                />
                            </Box>
                        </WelcomeSection>
                        
                        {/* Feature Module Cards */}
                        <Grid container spacing={3} sx={{ mb: 6 }}>
                            {/* Course Management Card */}
                <Grid item xs={12} sm={6} md={3}>
                                <ModuleCard>
                                    <ModuleIconWrapper>
                                        <ModuleIcon bgcolor="#3f8cff">
                                            <SchoolIcon sx={{ fontSize: 40 }} />
                                        </ModuleIcon>
                                    </ModuleIconWrapper>
                                    <ModuleContent>
                                        <ModuleTitle>Course Management</ModuleTitle>
                                        <ModuleDescription>
                                            View and manage courses. Update course details and materials.
                                        </ModuleDescription>
                                    </ModuleContent>
                                    <ModuleActions>
                                        <AccessButton 
                                            color="primary"
                                            onClick={() => navigate('/moderator/courses')}
                                        >
                                            Access
                                        </AccessButton>
                                    </ModuleActions>
                                </ModuleCard>
                </Grid>
                
                            {/* Grade Management Card */}
                <Grid item xs={12} sm={6} md={3}>
                                <ModuleCard>
                                    <ModuleIconWrapper>
                                        <ModuleIcon bgcolor="#4caf50">
                                            <GradeIcon sx={{ fontSize: 40 }} />
                                        </ModuleIcon>
                                    </ModuleIconWrapper>
                                    <ModuleContent>
                                        <ModuleTitle>Grade Management</ModuleTitle>
                                        <ModuleDescription>
                                            Review and approve grades. Handle grade disputes and corrections.
                                        </ModuleDescription>
                                    </ModuleContent>
                                    <ModuleActions>
                                        <AccessButton 
                                            color="success"
                                            onClick={() => navigate('/moderator/grades')}
                                        >
                                            Access
                                        </AccessButton>
                                    </ModuleActions>
                                </ModuleCard>
                </Grid>
                
                            {/* Student Management Card */}
                <Grid item xs={12} sm={6} md={3}>
                                <ModuleCard>
                                    <ModuleIconWrapper>
                                        <ModuleIcon bgcolor="#ff9800">
                                            <PeopleIcon sx={{ fontSize: 40 }} />
                                        </ModuleIcon>
                                    </ModuleIconWrapper>
                                    <ModuleContent>
                                        <ModuleTitle>Student Management</ModuleTitle>
                                        <ModuleDescription>
                                            View student profiles and academic records. Handle student requests.
                                        </ModuleDescription>
                                    </ModuleContent>
                                    <ModuleActions>
                                        <AccessButton 
                                            color="warning"
                                            onClick={() => navigate('/moderator/students')}
                                        >
                                            Access
                                        </AccessButton>
                                    </ModuleActions>
                                </ModuleCard>
                </Grid>
                
                            {/* Announcements Card */}
                <Grid item xs={12} sm={6} md={3}>
                                <ModuleCard>
                                    <ModuleIconWrapper>
                                        <ModuleIcon bgcolor="#e53935">
                                            <AnnouncementIcon sx={{ fontSize: 40 }} />
                                        </ModuleIcon>
                                    </ModuleIconWrapper>
                                    <ModuleContent>
                                        <ModuleTitle>Announcements</ModuleTitle>
                                        <ModuleDescription>
                                            Create and manage announcements for students and courses.
                                        </ModuleDescription>
                                    </ModuleContent>
                                    <ModuleActions>
                                        <AccessButton 
                                            color="error"
                                            onClick={() => navigate('/moderator/announcements')}
                                        >
                                            Access
                                        </AccessButton>
                                    </ModuleActions>
                                </ModuleCard>
                </Grid>
            </Grid>
                    </Box>
                </StyledPaper>
        </Container>
            
            {/* Quick action menu */}
            <Menu
                anchorEl={quickActionMenu}
                open={Boolean(quickActionMenu)}
                onClose={handleQuickActionClose}
                PaperProps={{
                    sx: {
                        backgroundColor: alpha('#1e1e1e', 0.9),
                        backdropFilter: 'blur(10px)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        minWidth: '200px',
                        color: 'white',
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={handleCreateAnnouncement}>
                    <ListItemIcon sx={{ color: '#e53935' }}>
                        <AnnouncementIcon />
                    </ListItemIcon>
                    <Typography>New Announcement</Typography>
                </MenuItem>
                <MenuItem onClick={handleCreateCourse}>
                    <ListItemIcon sx={{ color: '#3f8cff' }}>
                        <SchoolIcon />
                    </ListItemIcon>
                    <Typography>Create Course</Typography>
                </MenuItem>
                <MenuItem onClick={handleGradeEntry}>
                    <ListItemIcon sx={{ color: '#f57c00' }}>
                        <GradeIcon />
                    </ListItemIcon>
                    <Typography>Grade Entry</Typography>
                </MenuItem>
                <MenuItem onClick={() => {
                    handleQuickActionClose();
                    navigate('/moderator/compose');
                }}>
                    <ListItemIcon sx={{ color: '#4caf50' }}>
                        <EmailIcon />
                    </ListItemIcon>
                    <Typography>Compose Message</Typography>
                </MenuItem>
            </Menu>
            
            {/* Scroll to top button */}
            <Zoom in={showScrollTop}>
                <Fab
                    color="primary"
                    size="small"
                    aria-label="scroll back to top"
                    sx={{
                        position: 'fixed',
                        bottom: 90,
                        right: 20,
                        backgroundColor: alpha('#fff', 0.2),
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: alpha('#fff', 0.3)
                        }
                    }}
                    onClick={scrollToTop}
                >
                    <KeyboardArrowUpIcon />
                </Fab>
            </Zoom>
            
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ModeratorDashboard; 