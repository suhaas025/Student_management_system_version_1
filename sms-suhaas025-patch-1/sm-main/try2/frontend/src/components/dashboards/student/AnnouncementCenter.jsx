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
    Chip,
    List,
    ListItem,
    ListItemText,
    Paper,
    Badge,
    IconButton,
    Button,
    Tabs,
    Tab,
    styled,
    alpha
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
    Flag as FlagIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Announcement as AnnouncementIcon,
    MarkEmailRead as MarkReadIcon,
    DeleteOutline as DeleteIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import authService from '../../../services/auth.service';
import announcementService from '../../../services/announcement.service';

// Styled components for dark theme
const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease-in-out',
    height: '100%',
    marginBottom: theme.spacing(2),
    '&:hover': {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        borderColor: '#3f8cff',
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: 8,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 500,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    backgroundColor: alpha('#3f8cff', 0.2),
    '&:hover': {
        backgroundColor: alpha('#3f8cff', 0.4),
        borderColor: '#3f8cff',
    },
    '&.Mui-disabled': {
        color: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    minHeight: '48px',
    '& .MuiTabs-indicator': {
        display: 'none',
    },
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
        '&.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.3)',
            '& .MuiSvgIcon-root': {
                color: 'rgba(255, 255, 255, 0.3)',
            },
        },
    }
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
        fontWeight: 600,
    },
    '& .MuiListItemText-secondary': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

// TabPanel component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`announcement-tabpanel-${index}`}
            aria-labelledby={`announcement-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AnnouncementCenter = () => {
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [readAnnouncements, setReadAnnouncements] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load data on component mount
    useEffect(() => {
        loadData();
        
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        
        // Still keep read status in localStorage
        const savedReadAnnouncements = localStorage.getItem('readAnnouncements');
        if (savedReadAnnouncements) {
            setReadAnnouncements(JSON.parse(savedReadAnnouncements));
        }
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const user = authService.getCurrentUser();
            if (!user) {
                throw new Error("User not authenticated");
            }

            // Get user's role for filtering announcements
            const roleString = user.roles?.[0] || 'ROLE_USER';
            
            // Get announcements from backend API
            console.log("Fetching announcements from the server...");
            const response = await announcementService.getAllAnnouncements();
            
            if (response.data && Array.isArray(response.data)) {
                console.log(`Successfully fetched ${response.data.length} announcements`);
                setAnnouncements(response.data);
                
                if (response.data.length === 0) {
                    setError("No announcements available at this time.");
                }
            } else {
                setAnnouncements([]);
                setError("No announcements available at this time.");
            }
        } catch (err) {
            console.error('Failed to load announcements from backend:', err);
            setError('Unable to load announcements from the server. Please try again later.');
            setAnnouncements([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Add refresh capability
    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const markAsRead = (announcementId) => {
        // Check if already in the array to prevent duplicates
        if (!readAnnouncements.includes(announcementId)) {
            const updatedReadAnnouncements = [...readAnnouncements, announcementId];
            setReadAnnouncements(updatedReadAnnouncements);
            
            // Save to localStorage
            localStorage.setItem('readAnnouncements', JSON.stringify(updatedReadAnnouncements));
        }
    };

    const isAnnouncementRead = (announcementId) => {
        return readAnnouncements.includes(announcementId);
    };

    const markAllAsRead = () => {
        const allIds = announcements.map(announcement => announcement.id);
        setReadAnnouncements(allIds);
        
        // Save to localStorage
        localStorage.setItem('readAnnouncements', JSON.stringify(allIds));
    };

    // Simplify urgent announcement filtering with direct boolean check
    const urgentAnnouncements = announcements.filter(announcement => {
        // Check both isUrgent and urgent properties - the API uses 'urgent' while the local storage might use 'isUrgent'
        const isUrgent = announcement.isUrgent === true || 
               String(announcement.isUrgent) === 'true' || 
               announcement.isUrgent === 1 ||
               announcement.urgent === true ||  // Add check for 'urgent' property from API
               String(announcement.urgent) === 'true';
        
        return isUrgent;
    });

    // Combine all announcements without filtering on isActive
    const allAnnouncements = [...announcements].sort(
        (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );

    const unreadCount = allAnnouncements.filter(
        announcement => !readAnnouncements.includes(announcement.id)
    ).length;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress sx={{ color: '#3f8cff' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap'
            }}>
                <Typography variant="h5" component="h2" sx={{ color: '#fff', fontWeight: 600 }}>
                    <AnnouncementIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                    Announcements
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 } }}>
                    <StyledButton 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        startIcon={isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </StyledButton>
                    
                    <StyledButton 
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        startIcon={<MarkReadIcon />}
                    >
                        Mark All as Read
                    </StyledButton>
                </Box>
            </Box>

            {loading && !isRefreshing ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                    <CircularProgress sx={{ color: '#3f8cff' }} />
                </Box>
            ) : (
                <>
                    {error && (
                        <Alert 
                            severity="info" 
                            sx={{ mb: 3, backgroundColor: 'rgba(63, 140, 255, 0.1)', color: '#3f8cff' }}
                        >
                            {error}
                        </Alert>
                    )}
                    
                    {!loading && announcements.length === 0 && !error && (
                        <Alert 
                            severity="info" 
                            sx={{ mb: 3, backgroundColor: 'rgba(63, 140, 255, 0.1)', color: '#3f8cff' }}
                        >
                            No announcements available at this time.
                        </Alert>
                    )}
                
                    <StyledTabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ mb: 3 }}
                    >
                        <Tab
                            label={`All (${allAnnouncements.length})`}
                            icon={<NotificationsIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label={`Unread (${unreadCount})`}
                            icon={
                                <Badge badgeContent={unreadCount} color="error" max={99}>
                                    <NotificationsActiveIcon />
                                </Badge>
                            }
                            iconPosition="start"
                            disabled={unreadCount === 0}
                        />
                        <Tab
                            label={`Urgent (${urgentAnnouncements.length})`}
                            icon={<WarningIcon />}
                            iconPosition="start"
                            disabled={urgentAnnouncements.length === 0}
                        />
                    </StyledTabs>
                </>
            )}

            {/* Tab content - only render when not initially loading */}
            {!loading && (
                <>
                    <TabPanel value={tabValue} index={0}>
                        <AnnouncementList 
                            announcements={allAnnouncements}
                            isRead={isAnnouncementRead}
                            onMarkAsRead={markAsRead}
                        />
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={1}>
                        <AnnouncementList 
                            announcements={allAnnouncements.filter(announcement => 
                                !readAnnouncements.includes(announcement.id)
                            )}
                            isRead={isAnnouncementRead}
                            onMarkAsRead={markAsRead}
                        />
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={2}>
                        <AnnouncementList 
                            announcements={urgentAnnouncements}
                            isRead={isAnnouncementRead}
                            onMarkAsRead={markAsRead}
                        />
                    </TabPanel>
                </>
            )}
        </Box>
    );
};

// AnnouncementList component
const AnnouncementList = ({ announcements, isRead, onMarkAsRead }) => {
    // Early return with message if no announcements
    if (!announcements || announcements.length === 0) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '200px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 3
                }}
            >
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                    <NotificationsOffIcon sx={{ fontSize: '3rem', opacity: 0.5, mb: 2, display: 'block', mx: 'auto' }} />
                    No announcements found in this category
                </Typography>
            </Box>
        );
    }

    return (
        <List>
            {announcements.map((announcement) => (
                <StyledListItem key={announcement.id}>
                    <AnnouncementItem 
                        announcement={announcement} 
                        isRead={isRead(announcement.id)}
                        onMarkAsRead={() => onMarkAsRead(announcement.id)}
                    />
                </StyledListItem>
            ))}
        </List>
    );
};

// AnnouncementItem component
const AnnouncementItem = ({ announcement, isRead, onMarkAsRead }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Invalid date';
        }
    };
    
    // Handle expand/collapse
    const handleExpandClick = () => {
        setExpanded(!expanded);
        if (!isRead && !expanded) {
            onMarkAsRead();
        }
    };
    
    // Determine if it's urgent
    const isUrgent = announcement.isUrgent === true || 
        String(announcement.isUrgent) === 'true' || 
        announcement.isUrgent === 1 ||
        announcement.urgent === true || 
        String(announcement.urgent) === 'true';
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box 
                onClick={handleExpandClick}
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    backgroundColor: expanded ? 'rgba(63, 140, 255, 0.1)' : 'transparent',
                    '&:hover': {
                        backgroundColor: 'rgba(63, 140, 255, 0.05)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, pr: 2 }}>
                    <Chip 
                        icon={isUrgent ? <WarningIcon /> : <AnnouncementIcon />}
                        label={isUrgent ? 'Urgent' : 'Normal'}
                        size="small"
                        color={isUrgent ? 'warning' : 'primary'}
                        sx={{ 
                            backgroundColor: isUrgent ? 'rgba(255, 152, 0, 0.2)' : 'rgba(63, 140, 255, 0.2)', 
                            color: isUrgent ? '#ff9800' : '#3f8cff',
                            mr: 2,
                            minWidth: '80px'
                        }}
                    />
                    
                    <Box>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: isRead ? 400 : 700,
                                color: isRead ? 'rgba(255, 255, 255, 0.8)' : 'white',
                                mb: 0.5
                            }}
                        >
                            {announcement.title || 'Untitled Announcement'}
                        </Typography>
                        
                        <Typography 
                            variant="caption" 
                            sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}
                        >
                            {announcement.createdByUsername ? `From: ${announcement.createdByUsername}` : ''}
                            {announcement.createdAt && announcement.createdByUsername ? ' • ' : ''}
                            {announcement.createdAt ? formatDate(announcement.createdAt) : ''}
                        </Typography>
                    </Box>
                </Box>
                
                <Box>
                    {!isRead && (
                        <FlagIcon 
                            sx={{ 
                                color: '#3f8cff', 
                                fontSize: 16,
                                mr: 1
                            }} 
                        />
                    )}
                </Box>
            </Box>
            
            {expanded && (
                <Box 
                    sx={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        p: 2, 
                        borderRadius: 1,
                        mt: 1,
                        borderLeft: isUrgent ? '3px solid #ff9800' : '3px solid #3f8cff'
                    }}
                >
                    <Typography 
                        sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)',
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {announcement.message || 'No message content'}
                    </Typography>
                    
                    {!isRead && (
                        <Button
                            size="small"
                            startIcon={<MarkReadIcon />}
                            onClick={onMarkAsRead}
                            sx={{ 
                                mt: 2,
                                backgroundColor: 'rgba(63, 140, 255, 0.1)',
                                color: '#3f8cff',
                                '&:hover': {
                                    backgroundColor: 'rgba(63, 140, 255, 0.2)',
                                }
                            }}
                        >
                            Mark as read
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AnnouncementCenter; 