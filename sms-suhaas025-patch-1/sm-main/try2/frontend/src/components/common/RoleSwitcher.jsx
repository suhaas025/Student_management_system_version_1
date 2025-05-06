import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, 
    Menu, 
    MenuItem, 
    ListItemIcon,
    Typography,
    Box,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SchoolIcon from '@mui/icons-material/School';
import { 
    normalizeRoles, 
    getRoleName, 
    getDashboardUrl,
    getAvailableDashboards
} from '../../utils/roleUtils';

const StyledButton = styled(Button)(({ theme }) => ({
    color: '#fff',
    textTransform: 'none',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: '0.85rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(0.5),
        fontSize: '1.1rem',
    },
}));

const RoleBadge = styled(Box)(({ theme, role }) => {
    const getColor = () => {
        switch (role) {
            case 'ROLE_ADMIN':
                return '#f44336';
            case 'ROLE_MODERATOR':
                return '#ff9800';
            case 'ROLE_STUDENT':
            case 'ROLE_USER':
                return '#4caf50';
            default:
                return '#2196f3';
        }
    };

    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 8px',
        borderRadius: 12,
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        marginLeft: theme.spacing(1),
        backgroundColor: getColor(),
    };
});

const RoleSwitcher = ({ currentRoles }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    
    // Debug logs
    console.log("RoleSwitcher - currentRoles:", currentRoles);
    
    // Get the current active dashboard based on URL
    const getCurrentDashboard = () => {
        const path = window.location.pathname;
        if (path.includes('/admin')) return 'ROLE_ADMIN';
        if (path.includes('/moderator')) return 'ROLE_MODERATOR';
        return 'ROLE_STUDENT';
    };

    const currentDashboard = getCurrentDashboard();
    console.log("RoleSwitcher - currentDashboard:", currentDashboard);
    
    // Get all available dashboards for this user
    const availableDashboards = getAvailableDashboards(currentRoles);
    console.log("RoleSwitcher - availableDashboards:", availableDashboards);
    
    const getRoleIcon = (role) => {
        switch (role) {
            case 'ROLE_ADMIN':
                return <AdminPanelSettingsIcon />;
            case 'ROLE_MODERATOR':
                return <SupervisorAccountIcon />;
            case 'ROLE_STUDENT':
            case 'ROLE_USER':
                return <SchoolIcon />;
            default:
                return null;
        }
    };
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleRoleSwitch = (role) => {
        handleClose();
        navigate(getDashboardUrl(role));
    };
    
    // For testing, always show the component even with one dashboard
    // Remove this condition for production
    // if (availableDashboards.length <= 1) {
    //     return null;
    // }
    
    return (
        <>
            <Tooltip title="Switch Dashboard">
                <StyledButton
                    id="role-switcher-button"
                    aria-controls={open ? 'role-switcher-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    startIcon={<SwapHorizIcon />}
                >
                    {getRoleName(currentDashboard)}
                    <RoleBadge role={currentDashboard}>
                        {getRoleName(currentDashboard)}
                    </RoleBadge>
                </StyledButton>
            </Tooltip>
            
            <Menu
                id="role-switcher-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'role-switcher-button',
                }}
                PaperProps={{
                    sx: {
                        backgroundColor: '#1a2027',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                        },
                    }
                }}
            >
                {availableDashboards.map((role) => (
                    <MenuItem 
                        key={role} 
                        onClick={() => handleRoleSwitch(role)}
                        disabled={role === currentDashboard}
                        sx={{
                            opacity: role === currentDashboard ? 0.6 : 1,
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit' }}>
                            {getRoleIcon(role)}
                        </ListItemIcon>
                        <Typography variant="body2">
                            {getRoleName(role)} Dashboard
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default RoleSwitcher; 