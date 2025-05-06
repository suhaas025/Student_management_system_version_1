import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setUser(user);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            console.log('AuthContext: Starting login process');
            const response = await authService.login(username, password);
            console.log('AuthContext: Login response received:', response);
            
            const userData = response.data;
            console.log('AuthContext: Processing user data:', userData);
            
            // Validate user data
            if (!userData || !userData.token) {
                console.error('AuthContext: Invalid user data received:', userData);
                throw new Error('Invalid response from server');
            }
            
            // Set user data in localStorage
            console.log('AuthContext: Storing user data in localStorage');
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update the user state immediately
            console.log('AuthContext: Updating user state');
            setUser(userData);
            
            console.log('AuthContext: Login process completed successfully');
            return userData;
        } catch (error) {
            console.error('AuthContext: Login error:', error);
            // Clear any existing user data on error
            localStorage.removeItem('user');
            setUser(null);
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        // No need to remove 'user' again since authService.logout already does it
        setUser(null);
    };

    const register = async (username, email, password) => {
        try {
            const response = await authService.register(username, email, password);
            const userData = response.data;
            
            // Set user data in localStorage
            if (userData.token) {
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            // Update the user state immediately
            setUser(userData);
            return userData;
        } catch (error) {
            throw error;
        }
    };

    const updateUser = (updatedUserData) => {
        // Update localStorage
        const currentUser = authService.getCurrentUser();
        const updatedUser = {
            ...currentUser,
            ...updatedUserData
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 