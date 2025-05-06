/**
 * Utility functions for handling user roles
 */

/**
 * Normalizes role data to ensure we always have an array of role strings
 * 
 * @param {Array|Object} roles - Roles that can be in different formats
 * @returns {Array} - Array of role strings (e.g., ['ROLE_ADMIN', 'ROLE_MODERATOR'])
 */
export const normalizeRoles = (roles) => {
    console.log("normalizeRoles - input:", roles);
    
    if (!roles) return [];
    
    // Handle array of roles
    if (Array.isArray(roles)) {
        const normalizedRoles = roles.map(role => {
            if (typeof role === 'string') {
                return role;
            }
            if (role && typeof role === 'object') {
                // Handle role object with 'name' property
                if (role.name) {
                    return role.name;
                }
                // Handle different object formats 
                if (role.roleName) {
                    return role.roleName;
                }
                if (role.role) {
                    return role.role;
                }
            }
            return '';
        }).filter(Boolean);
        
        console.log("normalizeRoles - output (array):", normalizedRoles);
        return normalizedRoles;
    }
    
    // If it's a single string role
    if (typeof roles === 'string') {
        console.log("normalizeRoles - output (string):", [roles]);
        return [roles];
    }
    
    // If it's a single role object
    if (roles && typeof roles === 'object') {
        if (roles.name) {
            console.log("normalizeRoles - output (object with name):", [roles.name]);
            return [roles.name];
        }
        if (roles.roleName) {
            console.log("normalizeRoles - output (object with roleName):", [roles.roleName]);
            return [roles.roleName];
        }
        if (roles.role) {
            console.log("normalizeRoles - output (object with role):", [roles.role]);
            return [roles.role];
        }
    }
    
    console.log("normalizeRoles - output (default):", []);
    return [];
};

/**
 * Checks if a user has a specific role
 * 
 * @param {Array|Object} userRoles - The user's roles
 * @param {String} roleToCheck - The role to check for
 * @returns {Boolean} - Whether the user has the specified role
 */
export const hasRole = (userRoles, roleToCheck) => {
    const normalizedRoles = normalizeRoles(userRoles);
    return normalizedRoles.includes(roleToCheck);
};

/**
 * Gets the highest priority role for a user
 * Priority order: ADMIN > MODERATOR > STUDENT > USER
 * 
 * @param {Array|Object} userRoles - The user's roles
 * @returns {String} - The highest priority role
 */
export const getHighestRole = (userRoles) => {
    const normalizedRoles = normalizeRoles(userRoles);
    
    if (normalizedRoles.includes('ROLE_ADMIN')) {
        return 'ROLE_ADMIN';
    }
    
    if (normalizedRoles.includes('ROLE_MODERATOR')) {
        return 'ROLE_MODERATOR';
    }
    
    if (normalizedRoles.includes('ROLE_STUDENT')) {
        return 'ROLE_STUDENT';
    }
    
    if (normalizedRoles.includes('ROLE_USER')) {
        return 'ROLE_USER';
    }
    
    return '';
};

/**
 * Gets a user-friendly role name
 * 
 * @param {String} role - The role (e.g., 'ROLE_ADMIN')
 * @returns {String} - User-friendly role name (e.g., 'Admin')
 */
export const getRoleName = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return 'Admin';
        case 'ROLE_MODERATOR':
            return 'Moderator';
        case 'ROLE_STUDENT':
            return 'Student';
        case 'ROLE_USER':
            return 'User';
        default:
            return role ? role.replace('ROLE_', '') : '';
    }
};

/**
 * Determines which dashboard URL to use based on a role
 * 
 * @param {String} role - The role
 * @returns {String} - The dashboard URL
 */
export const getDashboardUrl = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return '/admin';
        case 'ROLE_MODERATOR':
            return '/moderator';
        case 'ROLE_STUDENT':
        case 'ROLE_USER':
            return '/dashboard';
        default:
            return '/dashboard';
    }
};

/**
 * Gets all available dashboards for a user based on their roles
 * 
 * @param {Array|Object} userRoles - The user's roles
 * @returns {Array} - Array of available dashboard roles
 */
export const getAvailableDashboards = (userRoles) => {
    const normalizedRoles = normalizeRoles(userRoles);
    const dashboards = [];
    
    if (normalizedRoles.includes('ROLE_ADMIN')) {
        dashboards.push('ROLE_ADMIN');
    }
    
    if (normalizedRoles.includes('ROLE_MODERATOR')) {
        dashboards.push('ROLE_MODERATOR');
    }
    
    if (normalizedRoles.includes('ROLE_STUDENT') || normalizedRoles.includes('ROLE_USER')) {
        dashboards.push('ROLE_STUDENT');
    }
    
    return dashboards;
}; 