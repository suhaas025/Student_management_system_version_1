import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Button, 
    Typography, 
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    TextField,
    Fade,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    GlobalStyles,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import authService from '../../services/auth.service';
import { useAppContext } from '../../context/AppContext';
import MfaVerification from './MfaVerification';

// Add global styles for the Menu component
const globalStyles = (
    <GlobalStyles
        styles={{
            '.MuiMenu-paper': {
                backgroundColor: '#1a2027 !important',
                color: '#fff !important',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& .MuiMenuItem-root': {
                    color: '#fff !important',
                },
                '& .MuiMenuItem-root:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
                },
                '& .MuiMenuItem-root.Mui-selected': {
                    backgroundColor: 'rgba(63, 140, 255, 0.15) !important',
                },
                '& .MuiMenuItem-root.Mui-selected:hover': {
                    backgroundColor: 'rgba(63, 140, 255, 0.25) !important',
                },
            },
        }}
    />
);

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
    maxWidth: 450,
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease-in-out',
    '& .MuiTypography-root': {
        color: '#fff',
    },
    '& .MuiTypography-body2': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
                borderColor: '#3f8cff',
            },
        },
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        '& input': {
            '-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 100px rgba(26, 32, 39, 0.95) inset',
                WebkitTextFillColor: '#fff',
            },
        },
        '&.Mui-focused input': {
            backgroundColor: 'transparent',
        },
    },
    '& .MuiSelect-icon': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiSelect-select': {
        backgroundColor: 'transparent !important',
    },
    '& .MuiPopover-paper': {
        backgroundColor: '#1a2027 !important',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '& .MuiMenuItem-root': {
            color: '#fff',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-selected': {
                backgroundColor: 'rgba(63, 140, 255, 0.15)',
                '&:hover': {
                    backgroundColor: 'rgba(63, 140, 255, 0.25)',
                },
            },
        },
    },
    '&:hover': {
        transform: 'translateY(-5px)',
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: 12,
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    background: 'linear-gradient(45deg, #3f8cff 30%, #00c6ff 90%)',
    boxShadow: '0 3px 5px 2px rgba(63, 140, 255, .3)',
    '&:hover': {
        background: 'linear-gradient(45deg, #357abd 30%, #00a6d6 90%)',
    },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.8)',
    boxShadow: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
}));

const Login = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formReady, setFormReady] = useState(false);
    const { showLoading, hideLoading } = useAppContext();
    
    // MFA states
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaData, setMfaData] = useState(null);
    
    // Lockout states
    const [lockoutSeconds, setLockoutSeconds] = useState(null);
    const lockoutTimerRef = useRef(null);
    
    // Force login states
    const [showForceDialog, setShowForceDialog] = useState(false);
    const [forceLogin, setForceLogin] = useState(false);
    const [pendingLogin, setPendingLogin] = useState({ username: '', password: '' });
    
    // Force reset form values and delay form display to avoid autofill
    useEffect(() => {
        // Small delay before showing form to avoid autofill
        const timer = setTimeout(() => {
            setFormReady(true);
        }, 100);
        // Show session invalidated error if present
        if (window.sessionStorage.getItem('sessionInvalidated')) {
            setError('Your session was terminated because you logged in elsewhere.');
            window.sessionStorage.removeItem('sessionInvalidated');
        }
        return () => clearTimeout(timer);
    }, []);

    // Watch for error message indicating lockout and extract seconds
    useEffect(() => {
        if (error && error.includes('Account is locked')) {
            // Try to extract seconds from the error message
            const match = error.match(/(\d+) seconds?/);
            if (match) {
                setLockoutSeconds(parseInt(match[1], 10));
            }
        } else {
            setLockoutSeconds(null);
            if (lockoutTimerRef.current) {
                clearInterval(lockoutTimerRef.current);
                lockoutTimerRef.current = null;
            }
        }
    }, [error]);

    // Countdown effect
    useEffect(() => {
        if (lockoutSeconds !== null && lockoutSeconds > 0) {
            if (!lockoutTimerRef.current) {
                lockoutTimerRef.current = setInterval(() => {
                    setLockoutSeconds((prev) => {
                        if (prev === 1) {
                            clearInterval(lockoutTimerRef.current);
                            lockoutTimerRef.current = null;
                            setError('');
                            return null;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        }
        return () => {
            if (lockoutTimerRef.current) {
                clearInterval(lockoutTimerRef.current);
                lockoutTimerRef.current = null;
            }
        };
    }, [lockoutSeconds]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(username, password, forceLogin);
            // Handle already logged in response
            if (response.alreadyLoggedIn) {
                setShowForceDialog(true);
                setPendingLogin({ username, password });
                setLoading(false);
                setForceLogin(false);
                return;
            }

            // Check if MFA is required
            if (response.mfaRequired) {
                setMfaRequired(true);
                setMfaData({
                    username: username,
                    temporaryToken: response.temporaryToken
                });
                setLoading(false);
                setForceLogin(false);
                return;
            }

            // Only check for a token if not alreadyLoggedIn
            const token = response?.token || response?.accessToken;
            if (!token) {
                setForceLogin(false);
                throw new Error('No token received from server');
            }

            // Store the user data
            const userData = {
                id: response.id,
                username: response.username,
                email: response.email,
                roles: response.roles || [response.role],
                token: token,
                avatar: response.avatar
            };

            localStorage.setItem('user', JSON.stringify(userData));
            showLoading('Loading Dashboard...');
            setTimeout(() => {
                const roleStrings = userData.roles.map(role =>
                    typeof role === 'string' ? role.toUpperCase() :
                    (typeof role === 'object' && role.name ? role.name.toUpperCase() : '')
                );
                if (roleStrings.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN')) {
                    navigate('/admin/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    setForceLogin(false);
                    return;
                } else if (roleStrings.some(role => role === 'ROLE_MODERATOR' || role === 'MODERATOR')) {
                    navigate('/moderator/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    setForceLogin(false);
                    return;
                } else {
                    navigate('/student/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    setForceLogin(false);
                    return;
                }
            }, 300);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials and try again.');
            setLoading(false);
            setForceLogin(false);
        }
    };

    const handleForceLogin = async () => {
        setShowForceDialog(false);
        setForceLogin(true);
        setLoading(true);
        try {
            const response = await authService.login(pendingLogin.username, pendingLogin.password, true);
            setForceLogin(false);
            // Handle MFA and normal login as before
            if (response.mfaRequired) {
                setMfaRequired(true);
                setMfaData({
                    username: pendingLogin.username,
                    temporaryToken: response.temporaryToken
                });
                setLoading(false);
                return;
            }
            const token = response?.token || response?.accessToken;
            if (!token) throw new Error('No token received from server');
            const userData = {
                id: response.id,
                username: response.username,
                email: response.email,
                roles: response.roles || [response.role],
                token: token,
                avatar: response.avatar
            };
            localStorage.setItem('user', JSON.stringify(userData));
            showLoading('Loading Dashboard...');
            setTimeout(() => {
                const roleStrings = userData.roles.map(role =>
                    typeof role === 'string' ? role.toUpperCase() :
                    (typeof role === 'object' && role.name ? role.name.toUpperCase() : '')
                );
                if (roleStrings.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN')) {
                    navigate('/admin/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    return;
                } else if (roleStrings.some(role => role === 'ROLE_MODERATOR' || role === 'MODERATOR')) {
                    navigate('/moderator/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    return;
                } else {
                    navigate('/student/dashboard');
                    setTimeout(() => hideLoading(), 500);
                    return;
                }
            }, 300);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials and try again.');
            setLoading(false);
            setForceLogin(false);
        }
    };

    const handleCancelForceLogin = () => {
        setShowForceDialog(false);
        setForceLogin(false);
    };

    // Handle successful MFA verification
    const handleMfaSuccess = (userData) => {
        console.log('MFA verification successful:', userData);
        // Show loading screen before navigation
        showLoading('Loading Dashboard...');
        // Navigate to the appropriate dashboard
        handleSuccessfulLogin(userData);
    };

    // Handle successful login after auth
    const handleSuccessfulLogin = (userData) => {
        const roles = userData.roles || [];
        console.log('Navigating based on roles:', roles);
        
        // Show loading before navigation
        showLoading('Loading Dashboard...');
        
        setTimeout(() => {
            hideLoading();
            
            // Determine correct dashboard based on roles
            if (roles.includes('ROLE_ADMIN')) {
                navigate('/admin/dashboard');
            }
            // Moderator dashboard
            else if (roles.includes('ROLE_MODERATOR')) {
                navigate('/moderator/dashboard');
            }
            // User/Student dashboard
            else if (roles.includes('ROLE_STUDENT') || roles.includes('ROLE_USER')) {
                navigate('/student/dashboard');
            }
            // Default dashboard as fallback
            else {
                navigate('/dashboard');
            }
        }, 800);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }}
        >
            {globalStyles}
            <StyledAppBar position="fixed">
                <Toolbar>
                    <Box display="flex" alignItems="center">
                        <SchoolIcon sx={{ color: '#3f8cff', fontSize: 32, mr: 1 }} />
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                            Learning Management System
                        </Typography>
                    </Box>
                </Toolbar>
            </StyledAppBar>
            
            <Container
                component="main"
                maxWidth="xs"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexGrow: 1,
                    py: 8
                }}
            >
                {/* Show MFA verification if required, otherwise show login form */}
                {mfaRequired ? (
                    <MfaVerification
                        username={mfaData.username}
                        temporaryToken={mfaData.temporaryToken}
                        onSuccess={handleMfaSuccess}
                    />
                ) : (
                    <Fade in={formReady} timeout={800}>
                        <StyledPaper elevation={3}>
                            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2,
                                    }}
                                >
                                    <SchoolIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                                    <Typography variant="h4" fontWeight="600">
                                        Login
                                    </Typography>
                                </Box>
                                <Typography variant="body2" textAlign="center">
                                    Sign in to access your student portal
                                </Typography>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5c5c' }}>
                                    {lockoutSeconds !== null && lockoutSeconds > 0 ? (
                                        <span>
                                            Account is locked due to too many failed login attempts.<br />
                                            Please try again in <b>{lockoutSeconds}</b> second{lockoutSeconds !== 1 ? 's' : ''}.
                                        </span>
                                    ) : (
                                        error
                                    )}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                    autoFocus
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <StyledButton
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading || !username || !password}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                                </StyledButton>
                                <Box sx={{ textAlign: 'right', mt: 1 }}>
                                    <Typography variant="body2" color="primary">
                                        <Button component={RouterLink} to="/forgot-password" color="primary" sx={{ textTransform: 'none', p: 0 }}>
                                            Forgot Password?
                                        </Button>
                                    </Typography>
                                </Box>
                            </form>
                        </StyledPaper>
                    </Fade>
                )}

                <Dialog open={showForceDialog} onClose={handleCancelForceLogin}>
                    <DialogTitle>Already Logged In</DialogTitle>
                    <DialogContent>
                        <Typography>
                            You are already logged in elsewhere. If you continue here, your old session will be terminated.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelForceLogin} color="secondary">Cancel</Button>
                        <Button onClick={handleForceLogin} color="primary" variant="contained" autoFocus>Continue Here</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Login; 