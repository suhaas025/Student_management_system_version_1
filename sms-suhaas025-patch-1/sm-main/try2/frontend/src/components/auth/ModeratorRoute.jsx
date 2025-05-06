import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';

const ModeratorRoute = () => {
    // Get current user and location
    const location = useLocation();
    
    // Try various methods to get the current user
    let currentUser = authService.getCurrentUser();
    console.log('ModeratorRoute - Current user from authService:', currentUser);
    
    // If no user from auth service, check localStorage directly
    if (!currentUser) {
        try {
            const userStr = localStorage.getItem('user');
            console.log('ModeratorRoute - User string from localStorage:', userStr);
            
            if (userStr) {
                const parsedUser = JSON.parse(userStr);
                console.log('ModeratorRoute - User from localStorage:', parsedUser);
                
                if (parsedUser && parsedUser.token) {
                    console.log('ModeratorRoute - Using user data from localStorage');
                    currentUser = parsedUser;
                    
                    // Ensure auth service has this data
                    authService.ensureUserStored(parsedUser);
                }
            }
        } catch (e) {
            console.error('ModeratorRoute - Error checking localStorage:', e);
        }
    }
    
    console.log('ModeratorRoute - Final current user:', currentUser);
    console.log('ModeratorRoute - Current location:', location.pathname);

    // Use effect to log repeated check of user status over time
    useEffect(() => {
        // Log additional debug info about roles
        if (currentUser && currentUser.roles) {
            console.log('ModeratorRoute - User roles:', currentUser.roles);
            console.log('ModeratorRoute - Has moderator role:', 
                currentUser.roles.includes('ROLE_MODERATOR') || currentUser.roles.includes('ROLE_ADMIN'));
            console.log('ModeratorRoute - Roles type:', Array.isArray(currentUser.roles) ? 'array' : typeof currentUser.roles);
        }
    }, [currentUser]);

    if (!currentUser) {
        console.log('ModeratorRoute - No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check token more carefully
    const tokenExists = !!currentUser.token;
    const tokenValid = !authService.isTokenExpired();
    console.log('ModeratorRoute - Token exists:', tokenExists);
    console.log('ModeratorRoute - Token valid:', tokenValid);
    
    if (!tokenExists || !tokenValid) {
        console.log('ModeratorRoute - Token invalid or expired, redirecting to login');
        authService.logout();
        return <Navigate to="/login" replace />;
    }

    // Ensure roles is an array and normalize
    const roles = Array.isArray(currentUser.roles) 
        ? currentUser.roles 
        : (typeof currentUser.roles === 'string' ? [currentUser.roles] : []);
    
    // Check moderator role with more tolerance (also allow admin)
    const hasModeratorRole = roles.some(role => 
        (typeof role === 'string' && 
        (role.toUpperCase() === 'ROLE_MODERATOR' || 
         role.toUpperCase() === 'MODERATOR' ||
         role.toUpperCase() === 'ROLE_ADMIN' ||
         role.toUpperCase() === 'ADMIN'))
    );
    
    console.log('ModeratorRoute - Normalized roles:', roles);
    console.log('ModeratorRoute - Has moderator role (normalized check):', hasModeratorRole);
    
    if (!hasModeratorRole) {
        console.log('ModeratorRoute - User is not a moderator, redirecting to dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('ModeratorRoute - Moderator access confirmed, rendering moderator route');
    return <Outlet />;
};

export default ModeratorRoute; 