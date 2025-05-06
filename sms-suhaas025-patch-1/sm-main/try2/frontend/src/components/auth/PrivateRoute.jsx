import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useAppContext } from '../../context/AppContext';
import LoadingScreen from '../common/LoadingScreen';

const PrivateRoute = () => {
    const { showLoading, hideLoading } = useAppContext();
    const [isChecking, setIsChecking] = useState(true);
    
    // First check through auth service
    let currentUser = authService.getCurrentUser();
    console.log('PrivateRoute - Current user from authService:', currentUser);
    
    // If no user from auth service, check localStorage directly as backup
    if (!currentUser) {
        try {
            const localUserData = localStorage.getItem('user');
            console.log('PrivateRoute - Checking localStorage directly:', localUserData);
            
            if (localUserData) {
                const parsedUser = JSON.parse(localUserData);
                if (parsedUser && parsedUser.token) {
                    console.log('PrivateRoute - Found user data in localStorage:', parsedUser);
                    currentUser = parsedUser;
                    
                    // Ensure the auth service has this data
                    authService.ensureUserStored(parsedUser);
                }
            }
        } catch (e) {
            console.error('Error checking localStorage directly:', e);
        }
    }

    useEffect(() => {
        if (!currentUser) {
            showLoading('Redirecting to login...');
            
            // Small delay before actual navigation
            const timer = setTimeout(() => {
                hideLoading();
                setIsChecking(false);
            }, 500);
            
            return () => clearTimeout(timer);
        } else {
            setIsChecking(false);
        }
    }, [currentUser, showLoading, hideLoading]);

    // Don't render anything while checking to avoid flash of redirect
    if (isChecking) {
        return <LoadingScreen message="Verifying authentication..." />;
    }

    if (!currentUser) {
        console.log('No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Use authService for token expiration, but with a backup check
    let tokenExpired = authService.isTokenExpired();
    
    // Manual check if authService result is unreliable
    if (!tokenExpired && currentUser && currentUser.token) {
        try {
            // Very basic check for token presence - can be enhanced for JWT validation
            if (!currentUser.token || currentUser.token.length < 10) {
                console.log('Token appears invalid, considering expired');
                tokenExpired = true;
            }
        } catch (e) {
            console.error('Error in manual token check:', e);
        }
    }

    if (tokenExpired) {
        console.log('Token expired, redirecting to login');
        showLoading('Session expired. Redirecting to login...');
        
        // Call logout asynchronously but don't wait for it
        authService.logout().catch(err => {
            console.error('Error during auto-logout on token expiration:', err);
        });
        
        // Delay to show the loading message
        setTimeout(() => {
            hideLoading();
        }, 500);
        
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute; 