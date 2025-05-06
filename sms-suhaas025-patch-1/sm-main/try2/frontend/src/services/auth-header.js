import authService from './auth.service';

export default function authHeader() {
    try {
        // Get current user and check if token is expired
        if (authService.isTokenExpired()) {
            console.log('Auth Header - Token is expired - clearing session');
            // Call logout but don't wait - it will clear localStorage
            authService.logout().catch(err => {
                console.error('Error during logout in authHeader:', err);
            });
            // Reload page to force re-login
            setTimeout(() => {
                window.location.href = '/login';
            }, 500);
            return {};
        }

        const token = authService.getToken();
        
        // More detailed logging
        if (token) {
            console.log(`Auth Header - Retrieved token: ${token.substring(0, 10)}...`);
        } else {
            console.warn('Auth Header - No token available, session may have expired');
            // If we're on an authenticated page but no token, redirect to login
            if (window.location.pathname !== '/login' && 
                window.location.pathname !== '/register' &&
                !window.location.pathname.startsWith('/public')) {
                console.warn('Auth Header - Redirecting to login due to missing token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            }
        }

        if (!token) {
            console.log('Auth Header - No token available');
            return {};
        }

        // Return headers with token
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    } catch (error) {
        console.error('Auth Header - Error creating headers:', error);
        return {};
    }
} 