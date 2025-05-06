import axios from 'axios';
import api from './api.service';
import { normalizeRoles } from '../utils/roleUtils';

// Attach JWT token to every request if present
axios.interceptors.request.use(
    (config) => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    config.headers['Authorization'] = 'Bearer ' + user.token;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Use relative URL for proxy to work
const API_URL = '/api/auth/';

// Add request interceptor for logging
axios.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Request headers:', config.headers);
        if (config.data) {
            console.log('Request data:', config.data);
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for logging
axios.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

class AuthService {
    login(username, password, force = false) {
        console.log('Attempting login with:', { username, password, force });
        return this.loginWithProxy(username, password, force)
            .catch(error => {
                console.error('Proxy login failed, trying direct connection:', error);
                return this.loginDirect(username, password, force);
            });
    }
    
    // Login via the Vite proxy (default approach)
    loginWithProxy(username, password, force = false) {
        console.log('Attempting login via proxy');
        return axios.post('/api/auth/signin', {
            username,
            password,
            force
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((response) => this.processLoginResponse(response, username))
        .catch(error => {
            console.error('Proxy login error:', error);
            throw error;
        });
    }
    
    // Direct login (fallback approach)
    loginDirect(username, password, force = false) {
        console.log('Attempting direct login');
        return axios.post('http://localhost:8080/api/auth/signin', {
            username,
            password,
            force
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((response) => this.processLoginResponse(response, username))
        .catch((error) => this.handleLoginError(error));
    }
    
    // Process login response
    processLoginResponse(response, originalUsername) {
        const { data } = response;
        // Handle already logged in response
        if (data.alreadyLoggedIn) {
            return data; // Pass up to Login.jsx for dialog/modal handling
        }
        console.log('Raw login response:', response);
        
        // Log the structure of the response
        console.log('Response data structure:', {
            hasId: !!data.id,
            hasUsername: !!data.username,
            hasToken: !!(data.token || data.accessToken),
            hasRoles: !!data.roles,
            hasAvatar: !!data.avatar,
            roles: data.roles,
            tokenType: data.token ? 'token' : (data.accessToken ? 'accessToken' : 'none')
        });

        // Check if MFA is required
        if (data.mfaRequired) {
            console.log('MFA is required for this user');
            // Store original username in localStorage as fallback
            if (originalUsername) {
                localStorage.setItem('mfa_pending_username', originalUsername);
            }
            
            // Return the temporary token and mfaRequired flag
            // Use originalUsername as fallback if data.username is undefined
            return {
                mfaRequired: true,
                username: data.username || originalUsername,
                temporaryToken: data.temporaryToken
            };
        }

        // Handle different token formats
        let token = data.accessToken || data.token;
        if (!token) {
            console.error('No token in response:', data);
            throw new Error('No token received from server');
        }

        // Standardize the user data structure with improved role handling
        const userData = {
            id: data.id,
            username: data.username,
            email: data.email || '',
            roles: normalizeRoles(data.roles || data.role || 'ROLE_USER'),
            token: token,
            avatar: data.avatar || null
        };

        console.log('Final user data to be returned:', userData);
        
        // If not requiring MFA, store the user data
        localStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
    }
    
    // Handle login errors
    handleLoginError(error) {
        console.error('Login error:', error);
        
        // Handle direct connection errors (server down, etc.)
        if (!error.response) {
            console.error('No response received. Server might be down.');
            throw new Error('Unable to connect to the server. Please check if the server is running.');
        }
        
        // If we got a response, handle specific status codes
        switch (error.response.status) {
            case 401:
                console.error('401 Unauthorized error from server');
                throw new Error('Invalid username or password');
            case 403:
                // Check if this is an authorization issue or a disabled account
                if (error.response.data && error.response.data.message) {
                    throw new Error(error.response.data.message);
                } else {
                    throw new Error('Authorization failed. You do not have permission to access this resource.');
                }
            case 404:
                throw new Error('Login service not found. Please check if the server is running.');
            case 500:
                throw new Error('Server error. Please try again later.');
            default:
                throw new Error(error.response.data?.message || 'Login failed. Please try again.');
        }
    }

    async logout() {
        console.log('Logging out user');
        
        // Get the current user's token
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    // Send logout request to the backend with the token
                    console.log('Sending logout request to backend');
                    try {
                        // Use direct URL to backend to avoid proxy issues
                        const response = await axios({
                            method: 'post',
                            url: '/api/auth/logout',
                            headers: {
                                'Authorization': `Bearer ${user.token}`,
                                'Content-Type': 'application/json'
                            },
                            // Add timeout to ensure request doesn't hang
                            timeout: 5000
                        });
                        console.log('Logout successful:', response.data);
                        
                        // Also attempt direct connection as fallback
                        try {
                            await axios({
                                method: 'post',
                                url: 'http://localhost:8080/api/auth/logout',
                                headers: {
                                    'Authorization': `Bearer ${user.token}`,
                                    'Content-Type': 'application/json'
                                },
                                timeout: 3000
                            });
                            console.log('Direct logout request also successful');
                        } catch (directError) {
                            // Ignore direct connection errors, already tried proxy
                            console.log('Direct logout attempt failed (expected if proxy worked):', directError.message);
                        }
                    } catch (error) {
                        console.error('Logout request error:', error);
                        console.log('Will try direct connection as fallback');
                        
                        try {
                            // Try direct connection as fallback
                            const directResponse = await axios({
                                method: 'post',
                                url: 'http://localhost:8080/api/auth/logout',
                                headers: {
                                    'Authorization': `Bearer ${user.token}`,
                                    'Content-Type': 'application/json'
                                },
                                timeout: 5000
                            });
                            console.log('Direct logout successful:', directResponse.data);
                        } catch (directError) {
                            console.error('All logout attempts failed:', directError.message);
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing user data during logout:', e);
            }
        }
        
        // Clear user data from localStorage
        localStorage.removeItem('user');
        
        // Optionally, also clear other sensitive data
        // localStorage.removeItem('mfa_secret');
        console.log('User data cleared from localStorage');
        
        // Return a promise that resolves after a short delay to ensure
        // the backend has time to process the logout request
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    register(username, email, password, role) {
        console.log('Attempting registration for user:', username);
        
        // Ensure role is an array and normalize role names
        let roleArray;
        if (Array.isArray(role)) {
            roleArray = role;
        } else if (role) {
            roleArray = [role];
        } else {
            roleArray = ["user"]; // Default role if none provided
        }
        
        // Make sure roles don't already have the ROLE_ prefix
        roleArray = roleArray.map(r => {
            let normalized = r.toLowerCase().trim();
            return normalized.startsWith('role_') ? normalized.substring(5) : normalized;
        });
        
        console.log('Sending roles for registration:', roleArray);
        
        return api.post('auth/signup', {
            username,
            email,
            password,
            role: roleArray
        })
        .then(response => {
            console.log('Registration successful:', response.data);
            return response.data;
        })
        .catch(error => {
            console.error('Registration error:', error);
            console.error('Registration error response:', error.response?.data);
            throw error;
        });
    }

    // Get all students (users with ROLE_USER)
    getStudents() {
        console.log('Fetching all students');
        return api.get('/users/students')
            .then(response => {
                console.log(`Retrieved ${response.data.length} students`);
                return response;
            })
            .catch(error => {
                console.error('Error fetching students:', error);
                throw error;
            });
    }

    getCurrentUser() {
        console.log('AUTH SERVICE: getCurrentUser called');
        try {
            // First try to get the user data from localStorage
            const userStr = localStorage.getItem('user');
            console.log('AUTH SERVICE: user string from localStorage:', userStr);
            
            if (!userStr) {
                console.log('AUTH SERVICE: No user found in localStorage');
                return null;
            }
            
            // Try to parse the user data
            let user;
            try {
                user = JSON.parse(userStr);
            } catch (e) {
                console.error('AUTH SERVICE: Error parsing user data from localStorage:', e);
                // Clear corrupted data
                localStorage.removeItem('user');
                return null;
            }
            
            // Validate the user object
            if (!user || typeof user !== 'object') {
                console.error('AUTH SERVICE: User data is not an object');
                localStorage.removeItem('user');
                return null;
            }
            
            console.log('AUTH SERVICE: Current user from localStorage:', user);
            
            // Normalize roles to ensure consistent format
            if (user.roles) {
                user.roles = normalizeRoles(user.roles);
                console.log('AUTH SERVICE: Normalized user roles:', user.roles);
            } else {
                // Set default role if none exists
                user.roles = ['ROLE_USER'];
                console.log('AUTH SERVICE: No roles found, setting default role');
            }
            
            // Check token format and validity
            if (!user.token) {
                console.error('AUTH SERVICE: User data has no token, cannot authenticate');
                return null;
            }
            
            // Check if token might be expired based on simple length check
            // (fallback if token validation fails)
            if (typeof user.token === 'string' && user.token.length < 10) {
                console.error('AUTH SERVICE: Token appears invalid (too short)');
                this.logout();
                return null;
            }
            
            // Store user back to localStorage with normalized roles
            localStorage.setItem('user', JSON.stringify(user));
            
            return user;
        } catch (error) {
            console.error('AUTH SERVICE: Unexpected error in getCurrentUser:', error);
            return null;
        }
    }

    getToken() {
        const user = this.getCurrentUser();
        return user ? user.token : null;
    }

    // Helper method to check if token is expired
    isTokenExpired() {
        const user = this.getCurrentUser();
        if (!user || !user.token) return true;
        
        // In development mode, be more lenient with token validation
        if (process.env.NODE_ENV === 'development') {
            // In development, just check token format
            const token = user.token;
            const isValidFormat = typeof token === 'string' && token.includes('.') && token.split('.').length === 3;
            console.log('Development mode - token format check:', isValidFormat);
            return !isValidFormat;
        }
        
        try {
            // Get the expiration from the token (assuming JWT)
            const token = user.token;
            console.log('Checking expiration for token:', token);

            // Check token format before attempting to decode
            if (typeof token !== 'string' || !token.includes('.')) {
                console.error('Invalid token format');
                return true;
            }

            // Split the token and ensure we have 3 parts (header, payload, signature)
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('Token does not have 3 parts');
                return true;
            }

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            
            // Safe way to decode base64
            let jsonPayload;
            try {
                jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
            } catch (e) {
                console.error('Error decoding token:', e);
                return true; // Consider expired if we can't decode
            }

            // Try to parse payload as JSON
            let payload;
            try {
                payload = JSON.parse(jsonPayload);
            } catch (e) {
                console.error('Error parsing JSON from token:', e);
                return true; // Consider expired if we can't parse
            }

            console.log('Token payload:', payload);

            const { exp } = payload;
            
            if (!exp) {
                console.log('No expiration found in token');
                return false;
            }
            
            const now = Date.now() / 1000;
            const expired = now >= exp;
            
            console.log('Token expiration check:', {
                expirationTime: new Date(exp * 1000).toISOString(),
                currentTime: new Date(now * 1000).toISOString(),
                isExpired: expired
            });

            if (expired) {
                console.log('Token has expired');
                this.logout();
            }
            return expired;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    // Ensure proper user storage with validation and normalization
    ensureUserStored(userData) {
        try {
            if (!userData) {
                console.error("Cannot store null or undefined user data");
                return false;
            }

            console.log("Ensuring user data is properly stored:", userData);

            // Normalize user data
            const normalizedUser = {
                ...userData,
                id: userData.id || 1,
                username: userData.username || 'user',
                email: userData.email || '',
                token: userData.token || '',
            };

            // Ensure roles are in correct format
            if (userData.roles) {
                // Convert to array if it's not already
                normalizedUser.roles = Array.isArray(userData.roles) 
                    ? userData.roles 
                    : [userData.roles];
                
                // Normalize role format
                normalizedUser.roles = normalizedUser.roles.map(role => {
                    if (typeof role === 'string') {
                        const upperRole = role.toUpperCase();
                        return upperRole.startsWith('ROLE_') ? upperRole : `ROLE_${upperRole}`;
                    } else if (role && role.name) {
                        const upperRole = role.name.toUpperCase();
                        return upperRole.startsWith('ROLE_') ? upperRole : `ROLE_${upperRole}`;
                    }
                    return 'ROLE_STUDENT';
                });
            } else {
                normalizedUser.roles = ['ROLE_STUDENT'];
            }

            console.log("Normalized user data before storage:", normalizedUser);

            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            
            // Additional items to help with auth persistence
            localStorage.setItem('username', normalizedUser.username);
            localStorage.setItem('auth_timestamp', Date.now().toString());
            
            // Verify storage succeeded
            const storedJson = localStorage.getItem('user');
            const storedUser = storedJson ? JSON.parse(storedJson) : null;
            
            const success = !!storedUser && !!storedUser.token;
            console.log("User storage verification result:", success);
            
            return success;
        } catch (error) {
            console.error("Error in ensureUserStored:", error);
            return false;
        }
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user || !user.roles) return false;
        
        const userRoles = normalizeRoles(user.roles);
        return userRoles.includes(role);
    }

    hasAnyRole(roles) {
        const user = this.getCurrentUser();
        if (!user || !user.roles) return false;
        
        const userRoles = normalizeRoles(user.roles);
        return roles.some(role => userRoles.includes(role));
    }

    // Check if current user can access admin dashboard
    canAccessAdmin() {
        console.log("Checking if user can access admin dashboard");
        const hasAccess = this.hasRole('ROLE_ADMIN');
        console.log("Admin access:", hasAccess);
        return hasAccess;
    }

    // Check if current user can access moderator dashboard
    canAccessModerator() {
        return this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR']);
    }

    // Check if current user can access student dashboard
    canAccessStudent() {
        return this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_STUDENT', 'ROLE_USER']);
    }

    // Get available dashboards for current user
    getAvailableDashboards() {
        const user = this.getCurrentUser();
        console.log("auth.service getAvailableDashboards - user:", user);
        
        if (!user) return [];
        
        const dashboards = [];
        
        // Handle roles in different formats
        console.log("auth.service getAvailableDashboards - user.roles:", user.roles);
        const userRoles = normalizeRoles(user.roles);
        console.log("auth.service getAvailableDashboards - normalizedRoles:", userRoles);
        
        // Always prioritize admin role
        if (userRoles.includes('ROLE_ADMIN')) {
            dashboards.push('ROLE_ADMIN');
            console.log("User has admin role, adding admin dashboard");
        }
        
        if (userRoles.includes('ROLE_MODERATOR')) {
            dashboards.push('ROLE_MODERATOR');
            console.log("User has moderator role, adding moderator dashboard");
        }
        
        if (userRoles.includes('ROLE_STUDENT') || userRoles.includes('ROLE_USER')) {
            dashboards.push('ROLE_STUDENT');
            console.log("User has student role, adding student dashboard");
        }
        
        // Force add student dashboard for testing - only if no other roles
        if (dashboards.length === 0) {
            dashboards.push('ROLE_STUDENT');
            console.log("No roles found, adding default student dashboard");
        }
        
        console.log("auth.service getAvailableDashboards - available dashboards (role names):", dashboards);
        return dashboards;
    }

    // Get the dashboard path based on user roles
    getDashboardPathFromRoles(roles) {
        console.log('Determining dashboard path for roles:', roles);
        
        // Handle case where roles is undefined or empty
        if (!roles || (Array.isArray(roles) && roles.length === 0)) {
            console.log('No roles provided, using default dashboard path');
            return '/dashboard';
        }
        
        // Ensure roles is an array
        const roleArray = Array.isArray(roles) ? roles : [roles];
        
        // Normalize role strings to uppercase
        const normalizedRoles = roleArray.map(role => {
            if (typeof role === 'string') {
                return role.toUpperCase();
            } else if (role && role.name) {
                return role.name.toUpperCase();
            }
            return '';
        });
        
        console.log('Normalized roles for dashboard path:', normalizedRoles);
        
        // Check roles in priority order (admin > moderator > student/user)
        if (normalizedRoles.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN')) {
            console.log('User has admin role, using admin dashboard path');
            return '/admin/dashboard';
        } else if (normalizedRoles.some(role => role === 'ROLE_MODERATOR' || role === 'MODERATOR')) {
            console.log('User has moderator role, using moderator dashboard path');
            return '/moderator/dashboard';
        } else if (normalizedRoles.some(role => 
            role === 'ROLE_STUDENT' || role === 'STUDENT' || 
            role === 'ROLE_USER' || role === 'USER')) {
            console.log('User has student/user role, using student dashboard path');
            return '/student/dashboard';
        }
        
        // Default fallback
        console.log('No specific role matched, using default dashboard path');
        return '/dashboard';
    }

    // Forgot Password (MFA-based)
    async requestForgotPasswordMfa(username) {
        return api.post('/auth/forgot-password/request-mfa', { username });
    }
    async verifyForgotPasswordMfa(username, code) {
        const res = await api.post('/auth/forgot-password/verify-mfa', { username, code });
        return res.data;
    }
    async resetForgotPassword(username, token, newPassword) {
        return api.post('/auth/forgot-password/reset', { username, token, newPassword });
    }
    // --- New: Setup MFA for forgot password (unauthenticated) ---
    async setupForgotPasswordMfa(username) {
        const res = await api.post('/auth/forgot-password/setup-mfa', { username });
        return res.data;
    }
    async verifyForgotPasswordMfaSetup(username, code) {
        const res = await api.post('/auth/forgot-password/verify-mfa-setup', { username, code });
        return res.data;
    }

    // Force reset a user's login state (useful for debugging "already logged in" issues)
    async forceResetLoggedInState(username) {
        console.log('Force resetting login state for user:', username);
        try {
            // Try proxy request
            const response = await axios.post('/api/auth/force-reset', { username });
            console.log('Force reset successful:', response.data);
            return true;
        } catch (error) {
            console.error('Force reset error:', error);
            // Try direct fallback
            try {
                const directResponse = await axios.post('http://localhost:8080/api/auth/force-reset', { username });
                console.log('Direct force reset successful:', directResponse.data);
                return true;
            } catch (directError) {
                console.error('All force reset attempts failed:', directError);
                return false;
            }
        }
    }
}

export default new AuthService(); 