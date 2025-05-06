import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Grade as GradeIcon,
    SupervisorAccount as SupervisorAccountIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/user.service';
import courseService from '../../../services/course.service';
import gradeService from '../../../services/grade.service';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        users: [],
        courses: [],
        grades: []
    });
    const navigate = useNavigate();

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [usersResponse, coursesResponse, gradesResponse] = await Promise.all([
                userService.getAll(),
                courseService.getAll(),
                gradeService.getAllGrades()
            ]);

            setStats({
                users: usersResponse.data || [],
                courses: coursesResponse.data || [],
                grades: gradesResponse.data || []
            });
            setError(null);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

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

    const StatCard = ({ icon, title, value, subtitle, color, action }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: color, mr: 2 }}>
                        {icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" gutterBottom>{title}</Typography>
                        <Typography variant="h4">{value}</Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {action && (
                    <Box mt={2}>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={action.onClick}
                        >
                            {action.label}
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={loadDashboardData}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<PersonIcon />}
                        title="Total Users"
                        value={stats.users.length}
                        subtitle={`Students: ${stats.users.filter(u => u.roles.includes('ROLE_USER')).length}`}
                        color="primary.main"
                        action={{
                            label: "Add User",
                            onClick: () => navigate('/admin/users/new')
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<SchoolIcon />}
                        title="Courses"
                        value={stats.courses.length}
                        subtitle={`Active: ${stats.courses.filter(c => c.status === 'ACTIVE').length}`}
                        color="success.main"
                        action={{
                            label: "Add Course",
                            onClick: () => navigate('/admin/courses/new')
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<GradeIcon />}
                        title="Grades"
                        value={stats.grades.length}
                        subtitle="View all grades"
                        color="warning.main"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<SupervisorAccountIcon />}
                        title="Moderators"
                        value={stats.users.filter(u => u.roles.includes('ROLE_MODERATOR')).length}
                        subtitle={`Teachers: ${stats.users.filter(u => u.moderatorType === 'TEACHER').length}`}
                        color="error.main"
                        action={{
                            label: "Add Moderator",
                            onClick: () => navigate('/admin/moderators/new')
                        }}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<MenuIcon />}
                        title="Menu Management"
                        value="Configure"
                        subtitle="Manage application menus"
                        color="info.main"
                        action={{
                            label: "Manage Menus",
                            onClick: () => navigate('/admin/menu-management')
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={<span role="img" aria-label="connection-pool">🔗</span>}
                        title="DB Connection Pooling"
                        value="Demo"
                        subtitle="Demonstrate DB connection pool"
                        color="secondary.main"
                        action={{
                            label: "Open Demo",
                            onClick: () => navigate('/admin/db-connection-pooling')
                        }}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Users</Typography>
                            <List>
                                {stats.users.slice(0, 5).map(user => (
                                    <ListItem
                                        key={user.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                {user.username[0].toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.username}
                                            secondary={user.roles.join(', ')}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Courses</Typography>
                            <List>
                                {stats.courses.slice(0, 5).map(course => (
                                    <ListItem
                                        key={course.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => navigate(`/admin/courses/${course.id}`)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                                <SchoolIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={course.courseName}
                                            secondary={`${course.courseCode} - ${course.department || 'No Department'}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard; 