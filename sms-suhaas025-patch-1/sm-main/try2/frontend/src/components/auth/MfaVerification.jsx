import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Tooltip,
  IconButton,
  Fade,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import mfaService from '../../services/mfa.service';
import authService from '../../services/auth.service';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: '450px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  background: 'linear-gradient(145deg, rgba(25, 25, 39, 0.9) 0%, rgba(33, 33, 53, 0.9) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}));

const DigitInput = styled(TextField)(({ theme }) => ({
  width: '100%',
  letterSpacing: '0.7em',
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(5px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover, &.Mui-focused': {
      borderColor: theme.palette.primary.main,
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      boxShadow: '0 0 0 2px rgba(63, 140, 255, 0.2)'
    }
  },
  '& input': {
    textAlign: 'center',
    fontSize: '1.8rem',
    fontWeight: '500',
    padding: '16px 14px',
    color: '#ffffff'
  },
  '& label': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& label.Mui-focused': {
    color: theme.palette.primary.main
  }
}));

const VerifyButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(3),
  borderRadius: '12px',
  fontWeight: '600',
  textTransform: 'none',
  fontSize: '1rem',
  background: 'linear-gradient(90deg, #3f8cff 0%, #2f7bf4 100%)',
  boxShadow: '0 4px 10px rgba(47, 123, 244, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 15px rgba(47, 123, 244, 0.4)',
    transform: 'translateY(-2px)'
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.12)',
    color: 'rgba(255, 255, 255, 0.3)',
    boxShadow: 'none'
  }
}));

const LinkButton = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.light,
    textDecoration: 'none'
  }
}));

const MfaVerification = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [username, setUsername] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { username: locationUsername, returnUrl } = location.state || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check multiple sources for username in order of preference
    // 1. From location state (passed when navigating to this component)
    // 2. From localStorage fallback we just added
    // 3. From existing localStorage 'username' key
    
    const pendingUsername = localStorage.getItem('mfa_pending_username');
    const storedUsername = localStorage.getItem('username');
    const effectiveUsername = locationUsername || pendingUsername || storedUsername;
    
    setUsername(effectiveUsername);
    
    console.log('MFA verification component using username:', effectiveUsername);
    
    if (!effectiveUsername) {
      console.log('No username found from any source, redirecting to login');
      setError('Unable to determine username. Please try logging in again.');
      setTimeout(() => navigate('/login'), 2000);
    }
    
    // Generate test codes in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      mfaService.generateTestCode(localStorage.getItem('mfa_secret') || 'JBSWY3DPEHPK3PXP');
    }
  }, [locationUsername, navigate]);

  // Function to determine correct dashboard path based on roles
  const getDashboardPath = (userData) => {
    if (!userData || !userData.roles) return '/dashboard';
    
    console.log('Determining dashboard path for roles:', userData.roles);
    
    // Get a normalized array of roles
    const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
    
    // Normalize role strings to uppercase
    const normalizedRoles = roles.map(role => {
      if (typeof role === 'string') {
        return role.toUpperCase();
      } else if (role && role.name) {
        return role.name.toUpperCase();
      }
      return '';
    });
    
    console.log('Normalized roles for dashboard path:', normalizedRoles);
    
    // Check roles in priority order
    if (normalizedRoles.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN')) {
      console.log('User has admin role, redirecting to admin dashboard');
      return '/admin/dashboard';
    } else if (normalizedRoles.some(role => role === 'ROLE_MODERATOR' || role === 'MODERATOR')) {
      console.log('User has moderator role, redirecting to moderator dashboard');
      return '/moderator/dashboard'; 
    } else if (normalizedRoles.some(role => role === 'ROLE_STUDENT' || role === 'STUDENT' || role === 'ROLE_USER' || role === 'USER')) {
      console.log('User has student role, redirecting to student dashboard');
      return '/student/dashboard';
    }
    
    // Default fallback
    console.log('No specific role found, using default dashboard');
    return '/dashboard';
  };

  // Process successful verification and ensure token persistence
  const handleSuccessfulVerification = (userData) => {
    setLoading(false);
    setError(null);
    setShowSuccessAnimation(true);
    
    console.log("MFA Verification successful with user data:", userData);
    
    // Ensure the user data includes all necessary fields
    if (!userData) {
      console.error("MFA verification returned empty user data");
      setError("Verification succeeded but user data was incomplete. Please try again.");
      return;
    }
    
    // Ensure token is present
    if (!userData.token && userData.accessToken) {
      userData.token = userData.accessToken;
    }
    
    if (!userData.token) {
      console.error("MFA verification returned user data without token");
      setError("Verification succeeded but authentication token was missing. Please try again.");
      return;
    }
    
    // Use authService to properly store user data
    const storageSuccess = authService.ensureUserStored(userData);
    
    if (!storageSuccess) {
      console.error("Failed to store user data after MFA verification");
      setError("Verification succeeded but we encountered an error saving your session. Please try again.");
      return;
    }
    
    // Determine dashboard path based on roles
    const dashboardPath = authService.getDashboardPathFromRoles(userData.roles);
    
    console.log(`MFA Verification completed. Redirecting to: ${dashboardPath}`);
    
    // Navigate to appropriate dashboard after brief success animation
    setTimeout(() => {
      navigate(dashboardPath);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code) {
      setError('Please enter a verification code');
      return;
    }
    
    if (!username) {
      setError('Username is missing. Please return to login page and try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Validating ${isBackupCode ? 'backup' : 'MFA'} code for user: ${username}`);
      
      // Send the username we determined in the useEffect
      const response = await mfaService.validateMfa(
        code,
        username,
        isBackupCode
      );
      
      console.log('MFA validation response:', response);
      
      // Check for the new response format with user object
      if (response.success && response.user && response.user.token) {
        // Clean up the temporary username we stored
        localStorage.removeItem('mfa_pending_username');
        handleSuccessfulVerification(response.user);
      } else if (response.token) {
        // Legacy direct response format
        localStorage.removeItem('mfa_pending_username');
        handleSuccessfulVerification(response);
      } else {
        setError('Authentication failed: Invalid response format from server');
        console.error('Invalid response from server:', response);
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #16213e 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        backgroundColor: 'rgba(63, 140, 255, 0.03)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '5%',
        right: '15%',
        width: '30vw',
        height: '30vw',
        borderRadius: '50%',
        backgroundColor: 'rgba(100, 65, 255, 0.04)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      
      <Fade in={true} timeout={800}>
        <StyledPaper elevation={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
            <IconButton 
              sx={{ color: 'rgba(255,255,255,0.5)', p: 1 }} 
              onClick={() => navigate('/login')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <SecurityIcon sx={{ color: theme.palette.primary.main, fontSize: 28, mr: 1.5 }} />
          </Box>
          
          <Typography variant="h4" gutterBottom align="center" sx={{ 
            color: '#ffffff', 
            fontWeight: 700,
            fontSize: isMobile ? '1.5rem' : '1.8rem',
            mb: 1
          }}>
            Two-Factor Authentication
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '90%',
            mb: 3
          }}>
            {isBackupCode 
              ? 'Enter a backup code from your list of recovery codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              variant="filled"
              sx={{ 
                width: '100%', 
                borderRadius: '10px',
                mb: 2
              }}
            >
              {error}
            </Alert>
          )}
          
          {attempts > 2 && (
            <Alert 
              severity="info" 
              variant="outlined"
              sx={{ 
                width: '100%', 
                borderRadius: '10px',
                mb: 2,
                backgroundColor: 'rgba(41, 98, 255, 0.08)'
              }}
              icon={<InfoIcon />}
            >
              Having trouble? Make sure your device time is synced, or try using a backup code.
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Box sx={{ position: 'relative' }}>
              <DigitInput
                variant="outlined"
                required
                fullWidth
                name={isBackupCode ? "backupCode" : "verificationCode"}
                label={isBackupCode ? "Backup Code" : "Verification Code"}
                type="text"
                id={isBackupCode ? "backupCode" : "verificationCode"}
                autoComplete="off"
                autoFocus
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  setCode(isBackupCode ? value : value.slice(0, 6)); // Limit to 6 digits for TOTP codes
                }}
                InputProps={{
                  inputProps: {
                    maxLength: isBackupCode ? 8 : 6,
                    pattern: isBackupCode ? '[0-9]{8}' : '[0-9]{6}'
                  },
                  startAdornment: (
                    <Box sx={{ mr: 1, opacity: 0.5 }}>
                      {isBackupCode ? <KeyIcon /> : <SecurityIcon />}
                    </Box>
                  )
                }}
                placeholder={isBackupCode ? "12345678" : "123456"}
              />
              <Tooltip title="If using Google Authenticator, make sure your device time is in sync. You can also try one of the test codes in development mode.">
                <IconButton sx={{ 
                  position: 'absolute', 
                  right: 8, 
                  top: 12, 
                  color: 'rgba(255, 255, 255, 0.5)' 
                }}>
                  <InfoIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <VerifyButton
              type="submit"
              disabled={loading || !code || (isBackupCode && code.length !== 8) || (!isBackupCode && code.length !== 6)}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" thickness={4} />
              ) : showSuccessAnimation ? (
                "Verified Successfully!"
              ) : (
                "Verify & Continue"
              )}
            </VerifyButton>
          </form>
          
          <Divider sx={{ width: '100%', my: 2.5, opacity: 0.2 }} />
          
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mt: 1 }}>
            <LinkButton
              component="button"
              variant="body2"
              onClick={() => {
                setIsBackupCode(!isBackupCode);
                setCode('');
                setError('');
              }}
            >
              {isBackupCode 
                ? 'Use verification code instead' 
                : 'Use backup code instead'}
            </LinkButton>
            
            <LinkButton
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
            >
              Back to login
            </LinkButton>
          </Box>
        </StyledPaper>
      </Fade>
    </Box>
  );
};

export default MfaVerification; 