import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import { getRoleName } from '../../utils/roleUtils';

const StyledChip = styled(Chip)(({ theme, roletype }) => {
    // Define colors for different roles
    const getBackgroundColor = () => {
        switch (roletype) {
            case 'ROLE_ADMIN':
                return 'rgba(244, 67, 54, 0.15)';
            case 'ROLE_MODERATOR':
                return 'rgba(255, 152, 0, 0.15)';
            case 'ROLE_STUDENT':
                return 'rgba(76, 175, 80, 0.15)';
            case 'ROLE_USER':
                return 'rgba(33, 150, 243, 0.15)';
            default:
                return 'rgba(158, 158, 158, 0.15)';
        }
    };
    
    const getTextColor = () => {
        switch (roletype) {
            case 'ROLE_ADMIN':
                return '#f44336';
            case 'ROLE_MODERATOR':
                return '#ff9800';
            case 'ROLE_STUDENT':
                return '#4caf50';
            case 'ROLE_USER':
                return '#2196f3';
            default:
                return '#9e9e9e';
        }
    };
    
    const getBorderColor = () => {
        switch (roletype) {
            case 'ROLE_ADMIN':
                return 'rgba(244, 67, 54, 0.5)';
            case 'ROLE_MODERATOR':
                return 'rgba(255, 152, 0, 0.5)';
            case 'ROLE_STUDENT':
                return 'rgba(76, 175, 80, 0.5)';
            case 'ROLE_USER':
                return 'rgba(33, 150, 243, 0.5)';
            default:
                return 'rgba(158, 158, 158, 0.5)';
        }
    };
    
    return {
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        border: `1px solid ${getBorderColor()}`,
        fontSize: '0.75rem',
        height: 24,
        '& .MuiChip-icon': {
            color: getTextColor(),
        },
    };
});

const getRoleIcon = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return <AdminPanelSettingsIcon fontSize="small" />;
        case 'ROLE_MODERATOR':
            return <SupervisorAccountIcon fontSize="small" />;
        case 'ROLE_STUDENT':
            return <SchoolIcon fontSize="small" />;
        case 'ROLE_USER':
            return <PersonIcon fontSize="small" />;
        default:
            return null;
    }
};

const getRoleDescription = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return 'Administrator with full system access';
        case 'ROLE_MODERATOR':
            return 'Moderator with content management privileges';
        case 'ROLE_STUDENT':
            return 'Student with access to courses and academic resources';
        case 'ROLE_USER':
            return 'Regular user with basic access privileges';
        default:
            return `User with ${role.replace('ROLE_', '')} privileges`;
    }
};

const RoleChip = ({ role, size = 'small', variant = 'outlined', clickable = false, onClick, ...props }) => {
    // Normalize the role name if it's an object
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    
    return (
        <Tooltip title={getRoleDescription(roleName)}>
            <StyledChip
                label={getRoleName(roleName)}
                icon={getRoleIcon(roleName)}
                size={size}
                variant={variant}
                roletype={roleName}
                clickable={clickable}
                onClick={onClick}
                {...props}
            />
        </Tooltip>
    );
};

export default RoleChip; 