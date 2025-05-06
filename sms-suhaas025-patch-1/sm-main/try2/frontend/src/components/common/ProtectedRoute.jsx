import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../services/auth.service';
import { normalizeRoles } from '../../utils/roleUtils';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#0f172a',
        }}
    >
        <CircularProgress size={60} sx={{ color: '#3f8cff', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#fff' }}>
            Checking authorization...
        </Typography>
    </Box>
);

/**
 * A ProtectedRoute component that checks if the user has any of the specified roles
 * @param {string|string[]} requiredRoles - The role(s) required to access the route
 * @param {string} redirectPath - Where to redirect if not authorized
 * @param {boolean} strict - If true, requires exact role match; if false, allows higher privilege roles
 */
const ProtectedRoute = ({ 
    requiredRoles = [], 
    redirectPath = '/login', 
    strict = false,
    children 
}) => {
    // Convert requiredRoles to array if it's a string
    const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Get the current user
    const currentUser = authService.getCurrentUser();
    
    // If there's no user, redirect to login
    if (!currentUser) {
        return <Navigate to={redirectPath} replace />;
    }
    
    // Normalize the user's roles
    const userRoles = normalizeRoles(currentUser.roles);
    
    // Check if non-strict mode allows access based on higher privilege
    if (!strict) {
        // Admin can access any route
        if (userRoles.includes('ROLE_ADMIN')) {
            return children || <Outlet />;
        }
        
        // Moderator can access moderator and student/user routes
        if (userRoles.includes('ROLE_MODERATOR') && 
            (requiredRolesArray.includes('ROLE_MODERATOR') || 
             requiredRolesArray.includes('ROLE_STUDENT') || 
             requiredRolesArray.includes('ROLE_USER'))) {
            return children || <Outlet />;
        }
        
        // Student/User can only access student/user routes
        if ((userRoles.includes('ROLE_STUDENT') || userRoles.includes('ROLE_USER')) && 
            (requiredRolesArray.includes('ROLE_STUDENT') || requiredRolesArray.includes('ROLE_USER'))) {
            return children || <Outlet />;
        }
    } else {
        // In strict mode, check if the user has ANY of the required roles
        const hasRequiredRole = requiredRolesArray.some(role => userRoles.includes(role));
        
        if (hasRequiredRole) {
            return children || <Outlet />;
        }
    }
    
    // If we get here, the user doesn't have the required roles
    return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute; 