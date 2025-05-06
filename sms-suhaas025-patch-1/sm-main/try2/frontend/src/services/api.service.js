import axios from 'axios';
import authService from './auth.service';

// Create an Axios instance with default configuration
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 15000, // Timeout after 15 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track if we're already refreshing the token
let isRefreshingToken = false;
// Queue of requests to retry after token refresh
let failedQueue = [];

// Process the failed queue with new token
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Add request interceptor
api.interceptors.request.use(
    config => {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
        
        // Log request body for debugging
        if (config.data) {
            console.log('[API Request Body]', JSON.stringify(config.data, null, 2));
        }
        
        // Skip adding auth token to auth endpoints to prevent auth issues
        if (!config.url.includes('/auth/signin') && !config.url.includes('/auth/signup')) {
            const token = authService.getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
                // Log token for MFA endpoints only
                if (config.url.includes('/mfa/')) {
                    console.log('[MFA Auth Token]', `${token.substring(0, 15)}...`);
                }
            } else {
                console.warn('[API Request] No auth token available for request');
            }
        } else {
            console.log('[API Request] Skipping auth token for authentication endpoint');
        }
        
        console.log('[API Request Headers]', config.headers);
        
        // For MFA verification in development, log extra details
        if (config.url.includes('/mfa/verify')) {
            console.log('[MFA Verify Request] Complete request:', {
                url: `${config.baseURL}${config.url}`,
                method: config.method,
                headers: config.headers,
                data: config.data
            });
        }
        
        return config;
    },
    error => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Add request interceptor for specific endpoints
api.interceptors.request.use(request => {
    if (request.url.includes('/auth/create-user')) {
        console.log('CREATE USER REQUEST DATA:', JSON.stringify(request.data, null, 2));
    }
    return request;
}, error => {
    return Promise.reject(error);
});

// Add response interceptor for handling errors and authentication issues
api.interceptors.response.use(
    response => {
        console.log(`[API Response] ${response.status} from ${response.config.method.toUpperCase()} ${response.config.url}`);
        
        // For debugging, log the response data
        console.log('[API Response Data]', JSON.stringify(response.data, null, 2));
        
        // Process specific endpoint responses to ensure department field is consistent
        if (response.config.url.includes('/users') && response.data) {
            // If it's an array of users
            if (
                Array.isArray(response.data) &&
                response.data.length > 0 &&
                typeof response.data[0] === 'object' &&
                'username' in response.data[0]
            ) {
                console.log('Processing array of users in response interceptor');
                response.data = response.data.map(user => {
                    // Ensure department is a string, not null or undefined
                    if (user.department === null || user.department === undefined) {
                        user.department = '';
                        console.log(`Converted null/undefined department to empty string for user ${user.id}`);
                    }
                    return user;
                });
            } 
            // If it's a single user object
            else if (response.data && typeof response.data === 'object' && 'username' in response.data) {
                console.log('Processing single user object in response interceptor');
                if (response.data.department === null || response.data.department === undefined) {
                    response.data.department = '';
                    console.log(`Converted null/undefined department to empty string for user ${response.data.id}`);
                }
            }
        }
        
        return response;
    },
    async error => {
        const originalRequest = error.config;
        
        if (error.response) {
            console.error(`[API Error] ${error.response.status} from ${error.config.method.toUpperCase()} ${error.config.url}`);
            console.error('[API Error Response]', error.response.data);
            
            // Don't retry auth endpoints
            if (originalRequest.url && (originalRequest.url.includes('/auth/signin') || originalRequest.url.includes('/auth/signup'))) {
                console.log('[API] Not retrying auth endpoint');
                return Promise.reject(error);
            }
            
            // Handle 401 Unauthorized or 403 Forbidden errors
            if (
                (error.response.status === 401 || error.response.status === 403) && 
                !originalRequest._retry
            ) {
                originalRequest._retry = true;
                console.warn('[API] Authentication error detected, attempting recovery');
                
                try {
                    console.log('[API] Checking token status');
                    const isExpired = authService.isTokenExpired();
                    
                    if (isExpired) {
                        console.log('[API] Token is expired, redirecting to login');
                        authService.logout()
                            .catch(err => console.error('[API] Error during logout:', err))
                            .finally(() => {
                                // If we're not already on the login page, redirect there
                                if (window.location.pathname !== '/login') {
                                    console.log('[API] Redirecting to login page');
                                    window.location.href = '/login';
                                }
                            });
                    } else {
                        console.log('[API] Token appears valid but server rejected it. Forcing re-login');
                        authService.logout()
                            .catch(err => console.error('[API] Error during logout:', err))
                            .finally(() => {
                                // If we're not already on the login page, redirect there
                                if (window.location.pathname !== '/login') {
                                    console.log('[API] Redirecting to login page');
                                    window.location.href = '/login';
                                }
                            });
                    }
                } catch (err) {
                    console.error('[API] Error handling authentication failure:', err);
                }
                
                return Promise.reject(error);
            }
        } else if (error.request) {
            console.error('[API Error] No response received', error.request);
        } else {
            console.error('[API Error] Error setting up request', error.message);
        }
        
        if (error.response && error.response.status === 401) {
            if (
                error.response.data &&
                error.response.data.message &&
                error.response.data.message.includes('Session invalidated')
            ) {
                window.localStorage.removeItem('user');
                window.sessionStorage.setItem('sessionInvalidated', 'true');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api; 