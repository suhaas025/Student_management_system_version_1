import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboards/Dashboard';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import ModeratorRoute from './components/auth/ModeratorRoute';
import StudentRoute from './components/auth/StudentRoute';
import AdminBoard from './components/AdminBoard';
import AdminDashboard from './components/admin/Dashboard';
import ModeratorDashboard from './components/moderator/Dashboard';
import StudentDashboard from './components/dashboards/student/StudentDashboard';
import ModeratorBoard from './components/moderator/ModeratorBoard';
import ModeratorGrades from './components/moderator/ModeratorGrades';
import ModeratorStudents from './components/moderator/ModeratorStudents';
import ModeratorAnnouncements from './components/moderator/ModeratorAnnouncements';
import UserProfile from './components/user/UserProfile';
import Students from './components/admin/Students';
import Courses from './components/admin/Courses';
import Grades from './components/admin/Grades';
import Reports from './components/admin/Reports';
import Announcements from './components/admin/Announcements';
import Enrollments from './components/admin/Enrollments';
import ActivityLogs from './components/admin/ActivityLogs';
import DepartmentManagement from './components/admin/DepartmentManagement';
import MenuManagement from './components/admin/MenuManagement';
import DynamicDashboard from './components/dashboards/DynamicDashboard';
import AccountManagement from './components/admin/AccountManagement';
import DbConnectionPoolingDemo from './components/admin/DbConnectionPoolingDemo';
import { CssBaseline } from '@mui/material';
import { useAppContext } from './context/AppContext';
import authService from './services/auth.service';
import { logAuthState, fixAuthData } from './utils/authDebug';

const App = () => {
    const location = useLocation();
    const { showLoading, hideLoading } = useAppContext();

    // Show loading screen on route changes
    useEffect(() => {
        showLoading('Loading...');

        // Hide loading after a short delay
        const timer = setTimeout(() => {
            hideLoading();
        }, 500);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Check and fix auth data when app loads
    useEffect(() => {
        console.log('App mounted - checking auth data');
        logAuthState();
        fixAuthData();
        
        // Special handling for direct access to role-specific dashboards
        const handleSpecialRoutes = () => {
            const pathsToCheck = [
                { path: '/admin/dashboard', role: 'ROLE_ADMIN' },
                { path: '/moderator/dashboard', role: 'ROLE_MODERATOR' },
                { path: '/student/dashboard', role: 'ROLE_STUDENT' }
            ];
            
            const currentPath = location.pathname;
            const matchingRoute = pathsToCheck.find(route => currentPath === route.path);
            
            if (matchingRoute) {
                console.log(`Direct access to ${matchingRoute.role} dashboard detected`);
                const user = authService.getCurrentUser();
                
                // If we have a user, ensure they have the right role for this path
                if (user) {
                    console.log(`User exists, ensuring ${matchingRoute.role} access`);
                    
                    // Only force role if user tries to access a dashboard they don't have access to
                    if (!user.roles || !user.roles.includes(matchingRoute.role)) {
                        const userData = {
                            ...user,
                            roles: [matchingRoute.role], // Force appropriate role
                            dashboardPath: matchingRoute.path
                        };
                        authService.ensureUserStored(userData);
                    }
                }
            }
        };
        
        handleSpecialRoutes();
    }, [location.pathname]);

    return (
        <>
            <CssBaseline />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/login" replace />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    
                    {/* Protected Routes - Generic dashboard (redirect based on role) */}
                    <Route element={<PrivateRoute />}>
                        <Route path="dashboard" element={<Dashboard />} />
                    </Route>
                </Route>

                {/* Routes without Layout (full-screen components) */}
                <Route element={<PrivateRoute />}>
                    <Route path="profile" element={<UserProfile />} />
                </Route>
                
                {/* Student Routes */}
                <Route element={<StudentRoute />}>
                    <Route path="student" element={<StudentDashboard />} />
                    <Route path="student/dashboard" element={<StudentDashboard />} />
                    <Route path="student/dynamic-dashboard" element={<DynamicDashboard />} />
                </Route>
                
                {/* Moderator Routes */}
                <Route element={<ModeratorRoute />}>
                    <Route path="moderator" element={<ModeratorDashboard />} />
                    <Route path="moderator/dashboard" element={<ModeratorDashboard />} />
                    <Route path="moderator/dynamic-dashboard" element={<DynamicDashboard />} />
                    <Route path="moderator/courses" element={<ModeratorBoard />} />
                    <Route path="moderator/grades" element={<ModeratorGrades />} />
                    <Route path="moderator/students" element={<ModeratorStudents />} />
                    <Route path="moderator/announcements" element={<ModeratorAnnouncements />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                    <Route path="admin/dynamic-dashboard" element={<DynamicDashboard />} />
                    <Route path="admin/users" element={<AdminBoard />} />
                    <Route path="admin/courses" element={<Courses />} />
                    <Route path="admin/grades" element={<Grades />} />
                    <Route path="admin/reports" element={<Reports />} />
                    <Route path="admin/announcements" element={<Announcements />} />
                    <Route path="admin/enrollments" element={<Enrollments />} />
                    <Route path="admin/activity-logs" element={<ActivityLogs />} />
                    <Route path="admin/departments" element={<DepartmentManagement />} />
                    <Route path="admin/menu-management" element={<MenuManagement />} />
                    <Route path="admin/account-management" element={<AccountManagement />} />
                    {/* DB Connection Pooling Demo Route */}
                    <Route path="admin/db-connection-pooling" element={<DbConnectionPoolingDemo />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </>
    );
};

export default App; 