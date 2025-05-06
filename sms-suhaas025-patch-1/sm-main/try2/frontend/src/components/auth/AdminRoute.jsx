import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';

const AdminRoute = () => {
    // Get current user and location
    const location = useLocation();
    
    // Try various methods to get the current user
    let currentUser = authService.getCurrentUser();
    console.log('AdminRoute - Current user from authService:', currentUser);
    
    // If no user from auth service, check localStorage directly
    if (!currentUser) {
        try {
            const userStr = localStorage.getItem('user');
            console.log('AdminRoute - User string from localStorage:', userStr);
            
            if (userStr) {
                const parsedUser = JSON.parse(userStr);
                console.log('AdminRoute - User from localStorage:', parsedUser);
                
                if (parsedUser && parsedUser.token) {
                    console.log('AdminRoute - Using user data from localStorage');
                    currentUser = parsedUser;
                    
                    // Ensure auth service has this data
                    authService.ensureUserStored(parsedUser);
                }
            }
        } catch (e) {
            console.error('AdminRoute - Error checking localStorage:', e);
        }
    }
    
    console.log('AdminRoute - Final current user:', currentUser);
    console.log('AdminRoute - Current location:', location.pathname);

    // Use effect to log repeated check of user status over time
    useEffect(() => {
        // Log additional debug info about roles
        if (currentUser && currentUser.roles) {
            console.log('AdminRoute - User roles:', currentUser.roles);
            console.log('AdminRoute - Has admin role:', currentUser.roles.includes('ROLE_ADMIN'));
            console.log('AdminRoute - Roles type:', Array.isArray(currentUser.roles) ? 'array' : typeof currentUser.roles);
        }
    }, [currentUser]);

    if (!currentUser) {
        console.log('AdminRoute - No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check token more carefully
    const tokenExists = !!currentUser.token;
    const tokenValid = !authService.isTokenExpired();
    console.log('AdminRoute - Token exists:', tokenExists);
    console.log('AdminRoute - Token valid:', tokenValid);
    
    if (!tokenExists || !tokenValid) {
        console.log('AdminRoute - Token invalid or expired, redirecting to login');
        authService.logout();
        return <Navigate to="/login" replace />;
    }

    // Ensure roles is an array and normalize
    const roles = Array.isArray(currentUser.roles) 
        ? currentUser.roles 
        : (typeof currentUser.roles === 'string' ? [currentUser.roles] : []);
    
    // Check admin role with more tolerance
    const hasAdminRole = roles.some(role => 
        (typeof role === 'string' && 
        (role.toUpperCase() === 'ROLE_ADMIN' || role.toUpperCase() === 'ADMIN'))
    );
    
    console.log('AdminRoute - Normalized roles:', roles);
    console.log('AdminRoute - Has admin role (normalized check):', hasAdminRole);
    
    if (!hasAdminRole) {
        console.log('AdminRoute - User is not an admin, redirecting to dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('AdminRoute - Admin access confirmed, rendering admin route');
    return <Outlet />;
};

export default AdminRoute; 