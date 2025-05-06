import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import RoleChip from '../common/RoleChip';
import { normalizeRoles } from '../../utils/roleUtils';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'rgba(26, 32, 39, 0.95)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    marginBottom: theme.spacing(3),
}));

const UserProfileRoles = ({ user }) => {
    if (!user) return null;
    
    // Normalize roles to ensure we have an array of role strings
    const userRoles = normalizeRoles(user.roles);
    
    if (!userRoles || userRoles.length === 0) {
        return null;
    }
    
    return (
        <StyledPaper>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                User Roles
            </Typography>
            
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                {userRoles.length > 1 
                    ? 'This user has multiple roles in the system with different access levels:'
                    : 'This user has the following role in the system:'}
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {userRoles.map((role, index) => (
                    <RoleChip 
                        key={index} 
                        role={role} 
                        size="medium"
                        sx={{ my: 0.5 }}
                    />
                ))}
            </Stack>
            
            {userRoles.length > 1 && (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
                    You can switch between different dashboards using the role switcher in the top-right corner of the page.
                </Typography>
            )}
        </StyledPaper>
    );
};

export default UserProfileRoles; 