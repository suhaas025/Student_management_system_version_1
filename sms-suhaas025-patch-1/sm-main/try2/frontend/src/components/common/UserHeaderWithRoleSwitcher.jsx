import React, { useState } from 'react';
import { 
    Box, 
    IconButton, 
    Avatar, 
    Menu, 
    MenuItem, 
    ListItemIcon, 
    Tooltip, 
    Typography,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import RoleSwitcher from './RoleSwitcher';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

const HeaderContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2),
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: '#1a2027',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'visible',
        '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            backgroundColor: '#1a2027',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        },
    },
    '& .MuiMenuItem-root': {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.9rem',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
    },
    '& .MuiDivider-root': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        margin: theme.spacing(1, 0),
    },
    '& .MuiListItemIcon-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        minWidth: 36,
    },
}));

const UserHeaderWithRoleSwitcher = ({ currentUser, handleLogout }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const goToProfile = () => {
        handleClose();
        navigate('/profile');
    };

    const goToSettings = () => {
        handleClose();
        navigate('/settings');
    };

    const logout = async () => {
        handleClose();
        if (handleLogout) {
            handleLogout();
        } else {
            try {
                await authService.logout();
                // Short delay to ensure logout request completes
                setTimeout(() => {
                    navigate('/login');
                }, 300);
            } catch (error) {
                console.error('Error during logout:', error);
                // Navigate even on error
                navigate('/login');
            }
        }
    };
    
    const username = currentUser?.username || 'User';
    const userAvatar = currentUser?.avatar;
    const avatarSrc = userAvatar || null;
    
    // Get available dashboards for this user
    const availableDashboards = authService.getAvailableDashboards();
    const hasMultipleRoles = availableDashboards.length > 1;
    
    return (
        <HeaderContainer>
            {/* Show role switcher only if user has multiple roles */}
            {hasMultipleRoles && (
                <RoleSwitcher currentRoles={currentUser?.roles || []} />
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                    variant="body1" 
                    sx={{ 
                        color: 'white', 
                        fontWeight: 500,
                        display: { xs: 'none', sm: 'block' } 
                    }}
                >
                    {username}
                </Typography>
                
                <Tooltip title="Account menu">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        sx={{ 
                            p: 0.5,
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                            }
                        }}
                    >
                        {avatarSrc ? (
                            <Avatar 
                                src={avatarSrc} 
                                alt={username} 
                                sx={{ width: 36, height: 36 }}
                            />
                        ) : (
                            <AccountCircleIcon 
                                sx={{ 
                                    width: 36, 
                                    height: 36, 
                                    color: 'white' 
                                }} 
                            />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>
            
            <StyledMenu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {username}
                    </Typography>
                </Box>
                
                <Divider />
                
                <MenuItem onClick={goToProfile}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                
                <MenuItem onClick={goToSettings}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={logout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </StyledMenu>
        </HeaderContainer>
    );
};

export default UserHeaderWithRoleSwitcher; 