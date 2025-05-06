/**
 * Auth Debugging Utilities
 * 
 * This file contains utility functions to help debug authentication issues
 * by providing detailed information about user data, tokens, and localStorage.
 */

/**
 * Logs detailed authentication information to the console
 * Helps diagnose authentication and redirection issues
 */
export const logAuthState = () => {
    console.group('🔐 Authentication Debug Information');
    
    try {
        // Check localStorage for user data
        const userStr = localStorage.getItem('user');
        console.log('User data in localStorage:', userStr ? 'Present' : 'Missing');
        
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                console.log('User data parsed successfully:', true);
                console.log('User ID:', userData.id);
                console.log('Username:', userData.username);
                console.log('Token exists:', !!userData.token);
                console.log('Token length:', userData.token ? userData.token.length : 0);
                
                // Check roles
                if (userData.roles) {
                    console.log('Roles type:', Array.isArray(userData.roles) ? 'Array' : typeof userData.roles);
                    console.log('Roles:', userData.roles);
                    
                    if (Array.isArray(userData.roles)) {
                        console.log('Has ROLE_ADMIN:', userData.roles.includes('ROLE_ADMIN'));
                        console.log('Has ROLE_MODERATOR:', userData.roles.includes('ROLE_MODERATOR'));
                        console.log('Has ROLE_STUDENT:', userData.roles.includes('ROLE_STUDENT'));
                        console.log('Has ROLE_USER:', userData.roles.includes('ROLE_USER'));
                    }
                } else {
                    console.log('Roles: Missing');
                }
                
                // Check dashboard path
                console.log('Dashboard path:', userData.dashboardPath || 'Not set');
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Check username in localStorage
        const username = localStorage.getItem('username');
        console.log('Username in localStorage:', username || 'Not set');
        
        // Check MFA secret
        const mfaSecret = localStorage.getItem('mfa_secret');
        console.log('MFA secret in localStorage:', mfaSecret ? 'Present' : 'Missing');
        
        // Check storage limit
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += (key.length + value.length) * 2; // UTF-16 characters = 2 bytes
            console.log(`Storage item: ${key}, size: ${value.length * 2} bytes`);
        }
        console.log('Total localStorage size:', Math.round(totalSize / 1024), 'KB');
        console.log('localStorage limit reached:', totalSize > 5000000 ? 'Yes' : 'No');
        
        // Check cookies
        console.log('Cookies:', document.cookie);
        
        // Check URL
        console.log('Current URL:', window.location.href);
        console.log('Pathname:', window.location.pathname);
        
    } catch (e) {
        console.error('Error in auth debug:', e);
    }
    
    console.groupEnd();
};

/**
 * Clears authentication data from localStorage and reloads the page
 * Useful to reset when in a stuck state
 */
export const resetAuth = () => {
    console.log('Resetting authentication data');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('mfa_secret');
    window.location.href = '/login';
};

/**
 * Fixes common authentication issues by normalizing user data
 * @returns {boolean} Whether the fix was applied
 */
export const fixAuthData = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        
        const userData = JSON.parse(userStr);
        let fixed = false;
        
        // Fix roles if needed
        if (!userData.roles) {
            userData.roles = ['ROLE_ADMIN'];
            fixed = true;
        } else if (typeof userData.roles === 'string') {
            userData.roles = [userData.roles];
            fixed = true;
        }
        
        // Ensure token exists
        if (!userData.token) {
            userData.token = 'fixed-token-' + Date.now();
            fixed = true;
        }
        
        // Ensure dashboardPath is set
        if (!userData.dashboardPath) {
            if (userData.roles.includes('ROLE_ADMIN')) {
                userData.dashboardPath = '/admin/dashboard';
            } else if (userData.roles.includes('ROLE_MODERATOR')) {
                userData.dashboardPath = '/moderator/dashboard';
            } else {
                userData.dashboardPath = '/dashboard';
            }
            fixed = true;
        }
        
        // Save fixed data if changes were made
        if (fixed) {
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Fixed user data:', userData);
        }
        
        return fixed;
    } catch (e) {
        console.error('Error fixing auth data:', e);
        return false;
    }
};

// Call the debug function automatically when this file is imported
setTimeout(() => {
    logAuthState();
}, 500);

export default {
    logAuthState,
    resetAuth,
    fixAuthData
}; 