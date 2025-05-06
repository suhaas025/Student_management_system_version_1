import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';

const StudentRoute = () => {
    // Get current user and location
    const location = useLocation();
    
    // Try various methods to get the current user
    let currentUser = authService.getCurrentUser();
    console.log('StudentRoute - Current user from authService:', currentUser);
    
    // If no user from auth service, check localStorage directly
    if (!currentUser) {
        try {
            const userStr = localStorage.getItem('user');
            console.log('StudentRoute - User string from localStorage:', userStr);
            
            if (userStr) {
                const parsedUser = JSON.parse(userStr);
                console.log('StudentRoute - User from localStorage:', parsedUser);
                
                if (parsedUser && parsedUser.token) {
                    console.log('StudentRoute - Using user data from localStorage');
                    currentUser = parsedUser;
                    
                    // Ensure auth service has this data
                    authService.ensureUserStored(parsedUser);
                }
            }
        } catch (e) {
            console.error('StudentRoute - Error checking localStorage:', e);
        }
    }
    
    console.log('StudentRoute - Final current user:', currentUser);
    console.log('StudentRoute - Current location:', location.pathname);

    // Use effect to log repeated check of user status over time
    useEffect(() => {
        // Log additional debug info about roles
        if (currentUser && currentUser.roles) {
            console.log('StudentRoute - User roles:', currentUser.roles);
            console.log('StudentRoute - Has student role:', 
                currentUser.roles.includes('ROLE_STUDENT') || 
                currentUser.roles.includes('ROLE_USER'));
            console.log('StudentRoute - Roles type:', Array.isArray(currentUser.roles) ? 'array' : typeof currentUser.roles);
        }
    }, [currentUser]);

    if (!currentUser) {
        console.log('StudentRoute - No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check token more carefully
    const tokenExists = !!currentUser.token;
    
    // For development environment, be more lenient with token validation
    let tokenValid = true;
    if (process.env.NODE_ENV !== 'development') {
        // Only validate token strictly in production
        tokenValid = !authService.isTokenExpired();
    } else {
        // In development, check if it looks like a JWT token
        const token = currentUser.token;
        tokenValid = typeof token === 'string' && token.includes('.') && token.split('.').length === 3;
        console.log('StudentRoute - Development mode token check:', tokenValid);
    }
    
    console.log('StudentRoute - Token exists:', tokenExists);
    console.log('StudentRoute - Token valid:', tokenValid);
    
    if (!tokenExists || !tokenValid) {
        console.log('StudentRoute - Token invalid or expired, redirecting to login');
        authService.logout();
        return <Navigate to="/login" replace />;
    }

    // Ensure roles is an array and normalize
    const roles = Array.isArray(currentUser.roles) 
        ? currentUser.roles 
        : (typeof currentUser.roles === 'string' ? [currentUser.roles] : []);
    
    // Check student role with more tolerance - all users should have access to student routes
    // including admins and moderators (hierarchical access)
    const hasStudentAccess = roles.some(role => 
        (typeof role === 'string' && 
        (role.toUpperCase() === 'ROLE_STUDENT' || 
         role.toUpperCase() === 'STUDENT' ||
         role.toUpperCase() === 'ROLE_USER' ||
         role.toUpperCase() === 'USER' ||
         role.toUpperCase() === 'ROLE_MODERATOR' ||
         role.toUpperCase() === 'MODERATOR' ||
         role.toUpperCase() === 'ROLE_ADMIN' ||
         role.toUpperCase() === 'ADMIN'))
    );
    
    console.log('StudentRoute - Normalized roles:', roles);
    console.log('StudentRoute - Has student access (normalized check):', hasStudentAccess);
    
    if (!hasStudentAccess) {
        console.log('StudentRoute - User has no role at all, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    console.log('StudentRoute - Student access confirmed, rendering student route');
    return <Outlet />;
};

export default StudentRoute; 