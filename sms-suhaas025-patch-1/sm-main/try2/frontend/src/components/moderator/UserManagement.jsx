import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    styled,
    alpha,
    CircularProgress,
    Button,
    Alert
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';

// Styled components for consistent design
const SectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    color: '#fff',
    fontWeight: 600,
    fontSize: '1.25rem',
}));

const SectionIcon = styled(Box)(({ theme }) => ({
    backgroundColor: alpha('#ff9800', 0.15),
    color: '#ff9800',
    borderRadius: '8px',
    padding: theme.spacing(1),
    marginRight: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const SectionContent = styled(Paper)(({ theme }) => ({
    backgroundColor: 'rgba(26, 32, 39, 0.7)',
    borderRadius: '12px',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

// UserManagement component
const UserManagement = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        // Here you would typically fetch users from your API
        // For now, we'll just simulate loading
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // You can add mock data here if needed
            setUsers([]);
        }, 1000);
    }, []);

    return (
        <Box component="section" sx={{ mb: 4 }}>
            <SectionHeader>
                <SectionIcon>
                    <PeopleIcon />
                </SectionIcon>
                <SectionTitle>User Management</SectionTitle>
            </SectionHeader>
            
            <SectionContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <Box>
                        <Typography color="white" variant="body1" mb={3}>
                            Manage student profiles, enrollments, and access permissions.
                        </Typography>
                        
                        <Button 
                            variant="contained"
                            sx={{
                                backgroundColor: '#ff9800',
                                '&:hover': {
                                    backgroundColor: alpha('#ff9800', 0.8)
                                },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            View Student Directory
                        </Button>
                        
                        {users.length === 0 && (
                            <Typography 
                                color="rgba(255, 255, 255, 0.7)" 
                                sx={{ mt: 3, textAlign: 'center' }}
                            >
                                No user data available at this time.
                            </Typography>
                        )}
                    </Box>
                )}
            </SectionContent>
        </Box>
    );
};

export default UserManagement; 