import React, { useState, useEffect } from 'react';
import {
    Box,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Badge,
    Typography,
    Container,
    Avatar,
    styled,
    alpha,
    Paper,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Timeline as TimelineIcon,
    Notifications as NotificationsIcon,
    Book as BookIcon,
    Person as PersonIcon,
    AccountCircle as AccountCircleIcon,
    ExitToApp as LogoutIcon,
    SwapHoriz as SwapHorizIcon,
    School as SchoolIcon,
    SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/auth.service';
import announcementService from '../../../services/announcement.service';

// Import new components
import DashboardHome from './DashboardHome';
import AcademicProgress from './AcademicProgress';
import CourseRegistration from './CourseRegistration';
import AnnouncementCenter from './AnnouncementCenter';

// Styled components for dark theme
const StyledPaper = styled(Paper)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    color: '#fff',
}));

// Add a styled header component for user portal navigation
const UserHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(3),
}));

const UserNavigation = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    '& .MuiTab-root': {
        minHeight: '48px',
        borderRadius: 8,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 500,
        textTransform: 'none',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            backgroundColor: 'rgba(63, 140, 255, 0.1)',
            color: '#fff',
        },
        '&.Mui-selected': {
            backgroundColor: '#3f8cff',
            color: '#fff',
            '&:hover': {
                backgroundColor: 'rgba(63, 140, 255, 0.8)',
            },
        },
    }
}));

// Add new styled component for the badge with fixed positioning
const NotificationBadge = styled(Badge)(({ theme }) => ({
    position: 'relative',
    display: 'inline-flex',
    '& .MuiBadge-badge': {
        position: 'absolute',
        top: -8,
        right: -12,
        padding: '0 6px',
        backgroundColor: '#f44336',
        color: '#fff',
        minWidth: '20px',
        height: '20px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        borderRadius: '10px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(26, 32, 39, 0.95)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
}));

// Update the StyledTabs component
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
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
        },
    },
    '& .MuiTabs-indicator': {
        backgroundColor: '#3f8cff',
    },
}));

// TabPanel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`student-tabpanel-${index}`}
            aria-labelledby={`student-tab-${index}`}
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

const StudentDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
    const roleMenuOpen = Boolean(roleMenuAnchor);
    const [currentUser, setCurrentUser] = useState(null);
    const [availableDashboards, setAvailableDashboards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // First check if user is authenticated
        const user = authService.getCurrentUser();
        if (!user) {
            console.error("No authenticated user found");
            navigate('/login');
            return;
        }
        
        console.log("StudentDashboard - Loading data for user:", user.username);
        setCurrentUser(user);
        
        // Debug logging
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
        
        // Load announcements and other required data
        loadAnnouncements();
    }, [navigate]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const user = authService.getCurrentUser();
            if (!user) {
                throw new Error("User not authenticated");
            }

            console.log("StudentDashboard - Fetching announcements...");
            
            // Try up to 3 times to load announcements
            let response = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !response) {
                try {
                    attempts++;
                    console.log(`Attempt ${attempts} to load announcements`);
                    // Get all announcements instead of filtering by role
                    response = await announcementService.getAllAnnouncements();
                    break;
                } catch (err) {
                    console.error(`Attempt ${attempts} failed:`, err);
                    
                    // If this was our last attempt, don't wait
                    if (attempts >= maxAttempts) {
                        console.error('All attempts to load announcements failed');
                        break;
                    }
                    
                    // Wait a bit before trying again (500ms, 1000ms, etc.)
                    await new Promise(resolve => setTimeout(resolve, 500 * attempts));
                }
            }
            
            if (response && response.data && Array.isArray(response.data)) {
                console.log(`StudentDashboard - Loaded ${response.data.length} announcements`);
                setAnnouncements(response.data);
            } else {
                console.warn("StudentDashboard - No announcements returned from service");
                setAnnouncements([]);
            }
            setError(null);
        } catch (err) {
            console.error('StudentDashboard - Failed to load announcements:', err);
            setError('Failed to load announcements');
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const unreadAnnouncementCount = () => {
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        return announcements.filter(a => 
            !readAnnouncements.includes(a.id) && 
            (a.isActive === true || a.isActive === 'true' || a.isActive === undefined)
        ).length;
    };

    const handleProfileClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
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

    const switchToModeratorDashboard = () => {
        handleRoleMenuClose();
        navigate('/moderator');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

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
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <StyledPaper 
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* User Portal Header */}
                    <UserHeader>
                        <Box display="flex" alignItems="center">
                            <DashboardIcon sx={{ color: '#3f8cff', fontSize: 32, mr: 1.5 }} />
                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                                Student Portal
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
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
                                        <SchoolIcon />
                                    </ListItemIcon>
                                    <Typography>Student Dashboard</Typography>
                                </MenuItem>
                                {availableDashboards.includes('ROLE_MODERATOR') && (
                                    <MenuItem onClick={switchToModeratorDashboard}>
                                        <ListItemIcon sx={{ color: 'white' }}>
                                            <SupervisorAccountIcon />
                                        </ListItemIcon>
                                        <Typography>Moderator Dashboard</Typography>
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
                                <MenuItem onClick={handleProfile}>
                                    <ListItemIcon>
                                        <AccountCircleIcon sx={{ color: '#fff' }} />
                                    </ListItemIcon>
                                    <ListItemText>Profile</ListItemText>
                                </MenuItem>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon sx={{ color: '#fff' }} />
                                    </ListItemIcon>
                                    <ListItemText>Logout</ListItemText>
                                </MenuItem>
                            </StyledMenu>
                        </Box>
                    </UserHeader>

                    <Box sx={{ 
                        borderBottom: 1, 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        mb: 2
                    }}>
                        <StyledTabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                            variant="fullWidth"
                    aria-label="student dashboard tabs"
                            sx={{ minHeight: 64 }}
                >
                    <Tab 
                        label="Dashboard" 
                        icon={<DashboardIcon />} 
                        iconPosition="start" 
                                sx={{ minHeight: 64 }}
                    />
                    <Tab 
                        label="Academic Progress" 
                        icon={<TimelineIcon />} 
                        iconPosition="start" 
                                sx={{ minHeight: 64 }}
                    />
                    <Tab 
                        label="Course Registration" 
                        icon={<BookIcon />} 
                        iconPosition="start" 
                                sx={{ minHeight: 64 }}
                    />
                    <Tab 
                        label="Announcements" 
                        icon={
                            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
                                <NotificationBadge 
                                badgeContent={unreadAnnouncementCount()} 
                                color="error"
                                invisible={unreadAnnouncementCount() === 0}
                                    max={99}
                            >
                                <NotificationsIcon />
                                </NotificationBadge>
                            </Box>
                        } 
                        iconPosition="start" 
                        sx={{ 
                            minHeight: 64,
                            '& .MuiTab-iconWrapper': {
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: 1
                            }
                        }}
                    />
                        </StyledTabs>
            </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3, pt: 1 }}>
            <TabPanel value={tabValue} index={0}>
                <DashboardHome 
                    onTabChange={setTabValue} 
                    announcements={announcements} 
                />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <AcademicProgress />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <CourseRegistration />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <AnnouncementCenter />
            </TabPanel>
                    </Box>
                </StyledPaper>
            </Container>
        </Box>
    );
};

export default StudentDashboard; 