import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  LinearProgress,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  styled,
  alpha,
  CssBaseline,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  Toolbar,
  AlertTitle,
  AppBar,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  Lock as LockIcon,
  BarChart as BarChartIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/auth.service';
import userService from '../../services/user.service';
import customUserService from '../../services/custom-user.service';
import mfaService from '../../services/mfa.service';
import { QRCodeSVG } from 'qrcode.react';
import AccountStatus from '../profile/AccountStatus';

// Global style reset for profile page
const GlobalStyles = styled('style')({
  [`
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100%;
      width: 100%;
    }
    #root {
      height: 100%;
    }
  `]: {}
});

// TabPanel component for the tabs
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Styled components for dark theme
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  color: '#fff',
}));

// Update the StyledTextField for better visibility on dark background
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: 16,
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#ffffff',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(63, 140, 255, 0.5)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3f8cff',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#3f8cff',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

// Add StyledFormControl component for select fields
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    color: '#fff',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(63, 140, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3f8cff',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#3f8cff',
    },
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiSelect-select': {
    color: '#fff',
  },
  '& .MuiMenuItem-root': {
    color: '#fff',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: 'none',
  '&.MuiButton-contained': {
    backgroundColor: '#3f8cff',
    '&:hover': {
      backgroundColor: alpha('#3f8cff', 0.8),
      boxShadow: '0 4px 12px rgba(63, 140, 255, 0.3)',
    },
  },
  '&.MuiButton-outlined': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
}));

const PasswordStrengthIndicator = styled(Box)(({ strength }) => ({
  position: 'relative',
  marginTop: 8,
  marginBottom: 12,
  '& .MuiLinearProgress-root': {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiTypography-root': {
    marginTop: 4,
  },
}));

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 8,
  backdropFilter: 'blur(10px)',
  ...(severity === 'error' && {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    color: '#fff',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    '& .MuiAlert-icon': {
      color: '#f44336',
    },
    '& .MuiAlert-message': {
      color: '#fff',
    },
  }),
  ...(severity === 'success' && {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    color: '#fff',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    '& .MuiAlert-icon': {
      color: '#4caf50',
    },
    '& .MuiAlert-message': {
      color: '#fff',
    },
  }),
  ...(severity === 'warning' && {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    color: '#fff',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    '& .MuiAlert-icon': {
      color: '#ff9800',
    },
    '& .MuiAlert-message': {
      color: '#fff',
    },
  }),
  ...(severity === 'info' && {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    color: '#fff',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    '& .MuiAlert-icon': {
      color: '#2196f3',
    },
    '& .MuiAlert-message': {
      color: '#fff',
    },
  }),
}));

// Constants
const PROFILE_CACHE_KEY = 'user_profile_cache';
const PROFILE_CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

const getCachedProfileData = () => {
  try {
    const cachedData = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cachedData) return null;
    
    const { data, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - timestamp > PROFILE_CACHE_EXPIRY) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error retrieving cached profile data:', err);
    return null;
  }
};

const cacheProfileData = (userData) => {
  try {
    const cacheData = {
      data: userData,
      timestamp: Date.now()
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error caching profile data:', err);
  }
};

// Password validation helper
const validatePassword = (password) => {
  const errors = [];
  const requirements = {
    minLength: 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  if (password.length < requirements.minLength) {
    errors.push(`minimum ${requirements.minLength} characters`);
  }
  if (!requirements.hasUppercase) {
    errors.push('at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('at least one lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('at least one number');
  }
  if (!requirements.hasSpecial) {
    errors.push('at least one special character');
  }

  // Calculate strength score (0-100)
  let strength = 0;
  if (password.length >= requirements.minLength) strength += 20;
  if (requirements.hasUppercase) strength += 20;
  if (requirements.hasLowercase) strength += 20;
  if (requirements.hasNumber) strength += 20;
  if (requirements.hasSpecial) strength += 20;

  return {
    errors,
    strength,
    valid: errors.length === 0,
  };
};

// Update the StyledMenuItem for better contrast in dark theme
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: '#fff',
  backgroundColor: 'rgba(15, 23, 42, 0.9)',
  '&:hover': {
    backgroundColor: 'rgba(63, 140, 255, 0.1)',
  },
  '&.Mui-selected': {
    backgroundColor: 'rgba(63, 140, 255, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(63, 140, 255, 0.3)',
    }
  }
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none'
}));

// Add this helper for formatting dates
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    department: '',
    degree: '',
    yearOfStudy: '',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const storedUser = authService.getCurrentUser();
  const isCurrentUser = (!id || id === 'me' || (storedUser && id === storedUser.id.toString()));
  const isAdmin = storedUser && storedUser.roles && storedUser.roles.includes('ROLE_ADMIN');

  useEffect(() => {
    if (!storedUser) {
      navigate('/login');
      return;
    }

    // Clear any previous errors/success messages
    setError('');
    setSuccess('');
    
    // Load profile with debug info
    console.log("UserProfile: Loading profile for userId:", id || 'current user');
    loadUserProfile();
    
    // Also log what user data we have from localStorage
    const currentUser = authService.getCurrentUser();
    console.log("UserProfile: Current user from auth:", currentUser);
    
    // Debug print metadata from custom service
    try {
      const metadata = localStorage.getItem('user_metadata');
      if (metadata) {
        console.log("UserProfile: Found stored metadata:", JSON.parse(metadata));
    } else {
        console.log("UserProfile: No stored metadata found");
      }
    } catch (e) {
      console.error("UserProfile: Error reading metadata", e);
    }
  }, [id]);

  const loadUserProfile = () => {
    setLoading(true);
    setError(null);

    // Get current user info from local storage first
    const storedUser = authService.getCurrentUser();
      if (!storedUser) {
        setLoading(false);
        setError('Not authenticated. Please log in again.');
        navigate('/login');
        return;
      }

    console.log('Attempting to load user profile data');
    
    // Define userId - either from params or current user
    const userId = id && id !== 'me' ? id : storedUser.id;
    
    // Use the appropriate method based on whether we're loading the current user or another user
    const profilePromise = id === 'me' || !id 
        ? userService.getCurrentUser() // Get current user's profile
        : userService.get(userId);     // Get specific user by ID
    
    profilePromise
        .then(response => {
            console.log('Profile data retrieved:', response.data);
            setUser(response.data);
            
            // Update form fields
      setFormData({
                username: response.data.username || '',
                email: response.data.email || '',
                firstName: response.data.firstName || '',
                lastName: response.data.lastName || '',
                department: response.data.department || '',
                degree: response.data.degree || '',
                yearOfStudy: response.data.yearOfStudy || '',
        currentPassword: '',
        newPassword: '',
                confirmPassword: ''
            });
            
            // Update MFA status
            setMfaEnabled(response.data.mfaEnabled || false);
            
            // Cache user data to localStorage for fallback
            try {
                const updatedUser = {
                    ...storedUser,
                    ...response.data,
                    token: storedUser.token,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {
                console.error('Error updating localStorage:', e);
            }
            
      setLoading(false);
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            
            // Fallback to local storage data if API fails
            if (storedUser) {
                setUser(storedUser);
                setFormData({
                    username: storedUser.username || '',
                    email: storedUser.email || '',
                    firstName: storedUser.firstName || '',
                    lastName: storedUser.lastName || '',
                    department: storedUser.department || '',
                    degree: storedUser.degree || '',
                    yearOfStudy: storedUser.yearOfStudy || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
                // Set MFA status from storage if available
                setMfaEnabled(storedUser.mfaEnabled || false);
                
                setError({
                    message: 'Unable to load complete profile data from server. Some fields may be limited.',
                    severity: 'warning'
                });
            } else {
                setError({
                    message: 'Failed to load profile data. Please try again later.',
                    severity: 'error'
                });
            }
            
            setLoading(false);
        });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      const { errors, strength } = validatePassword(value);
      setPasswordStrength(strength);
      setPasswordErrors(errors);
    }
  };

  // Separate handler for profile info update
  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const updateData = {};
    if (formData.email !== user.email) {
      updateData.email = formData.email;
    }
    if (formData.username !== user.username) {
      updateData.username = formData.username;
    }

    const userId = user.id;
    
    // Use the combined update method that handles both profile info and avatar
    userService.updateProfileWithAvatar(userId, updateData, avatarFile)
      .then(response => {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          const updatedUser = {
            ...storedUser,
            email: response.data.email || formData.email,
            username: response.data.username || formData.username,
            avatar: response.data.avatar || storedUser.avatar,
            token: storedUser.token,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Clear avatar state after successful update
        if (avatarFile) {
          setAvatarFile(null);
          setAvatarPreview(null);
        }
        
        // Determine appropriate success message
        let msg = '';
        if (avatarFile && (updateData.username || updateData.email)) {
          msg = 'Profile picture and information updated successfully';
        } else if (avatarFile) {
          msg = 'Profile picture updated successfully';
        } else if (updateData.username && updateData.email) {
          msg = 'Username and email updated successfully';
        } else if (updateData.username) {
          msg = 'Username updated successfully';
        } else if (updateData.email) {
          msg = 'Email updated successfully';
        } else {
          msg = 'Profile updated successfully';
        }
        
        setSuccess(msg);
        setLoading(false);
        
        // Reload user profile to get the latest data
        loadUserProfile();
      })
      .catch(error => {
        setError(error.response?.data?.message || 'Failed to update profile');
        setLoading(false);
      });
  };

  // Helper to logout and redirect with message
  const logoutAndRedirect = () => {
    authService.logout();
    navigate('/login', { state: { message: 'Password changed successfully. Please sign in with your new password.' } });
  };

  // Separate handler for password change
  const handlePasswordChange = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.currentPassword) {
      setError('Current password is required to change password');
      setLoading(false);
      return;
    }
    if (!formData.newPassword) {
      setError('New password is required');
      setLoading(false);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }

    userService.changePassword(formData.currentPassword, formData.newPassword)
      .then(response => {
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setLoading(false);
        logoutAndRedirect();
      })
      .catch(error => {
        setError(error.response?.data?.message || 'Failed to change password');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setLoading(false);
      });
  };

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const navigateBack = () => {
    // Check user role to navigate to the correct dashboard
    const user = authService.getCurrentUser();
    if (user) {
      // The roles might be an array or a single string - handle both cases
      const roles = user.roles || [];
      
      // Check if user is admin
      if (Array.isArray(roles) && roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN')) {
        navigate('/admin');
      } 
      // Check if user is moderator
      else if (Array.isArray(roles) && roles.some(r => r === 'ROLE_MODERATOR' || r === 'MODERATOR')) {
        navigate('/moderator');
      } 
      // Default to student dashboard
      else {
        // For student, navigate to the student dashboard which is at /dashboard
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMfaSetup = async () => {
    setMfaLoading(true);
    try {
      const data = await mfaService.setup();
      console.log('MFA setup data received:', data);
      console.log('Has secret?', !!data.secretKey);
      console.log('Has QR code URL?', !!data.qrCodeUrl);
      console.log('Secret format:', data.secretKey);
      
      if (!data.qrCodeUrl) {
        console.error('QR code URL is missing from the response');
        setError('Failed to set up two-factor authentication: QR code URL is missing');
      }
      
      // If the secret looks base32 encoded, we need to make sure it's properly formatted
      if (data.secretKey) {
        // Remove spaces and padding if present
        data.secretKey = data.secretKey.replace(/\s/g, '').replace(/=+$/, '');
      }
      
      setMfaSetupData(data);
      setShowBackupCodes(true);
      setBackupCodes(data.backupCodes || []);
    } catch (error) {
      console.error('Error setting up MFA:', error);
      setError('Failed to set up two-factor authentication: ' + (error.response?.data?.message || error.message));
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    setMfaLoading(true);
    try {
      await mfaService.disable();
      setMfaEnabled(false);
      setMfaSetupData(null);
      setShowBackupCodes(false);
      setBackupCodes([]);
      setSuccess('Two-factor authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      setError('Failed to disable two-factor authentication');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setMfaLoading(true);
    try {
      const codes = await mfaService.generateBackupCodes();
      setBackupCodes(codes);
      setShowBackupCodes(true);
    } catch (error) {
      console.error('Error generating backup codes:', error);
      setError('Failed to generate backup codes');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    setMfaLoading(true);
    try {
      console.log('Attempting to verify code:', mfaVerificationCode);
      
      // Validate code format
      if (!/^\d{6}$/.test(mfaVerificationCode)) {
        throw new Error('Code must be exactly 6 digits');
      }
      
      // DEV MODE: Accept test codes without backend verification
      const isTestCode = ['123456', '000000', '111111'].includes(mfaVerificationCode);
      if (process.env.NODE_ENV === 'development' && isTestCode) {
        console.log('DEVELOPMENT MODE: Accepting test verification code');
        setMfaEnabled(true);
        setMfaSetupData(null);
        setShowBackupCodes(false);
        setBackupCodes([]);
        setSuccess('Two-factor authentication verified successfully (Development Mode)');
        
        // Update user locally to show MFA as enabled
        if (user) {
          const updatedUser = { ...user, mfaEnabled: true };
          setUser(updatedUser);
        }
        
        setMfaLoading(false);
        return;
      }
      
      // Normal verification through service
      const response = await mfaService.verify(mfaVerificationCode);
      console.log('Verification successful:', response);
      
      setMfaEnabled(true);
      setMfaSetupData(null);
      setShowBackupCodes(false);
      setBackupCodes([]);
      setSuccess('Two-factor authentication verified successfully');
      
      // Reload profile to update MFA status
      loadUserProfile();
    } catch (error) {
      console.error('Error verifying MFA:', error);
      
      // DEV MODE FALLBACK: Accept test codes if backend verification fails
      const isTestCode = ['123456', '000000', '111111'].includes(mfaVerificationCode);
      if (process.env.NODE_ENV === 'development' && isTestCode) {
        console.log('DEVELOPMENT FALLBACK: Accepting test verification code after backend failure');
        setMfaEnabled(true);
        setMfaSetupData(null);
        setShowBackupCodes(false);
        setBackupCodes([]);
        setSuccess('Two-factor authentication verified successfully (Development Fallback)');
        
        // Update user locally to show MFA as enabled
        if (user) {
          const updatedUser = { ...user, mfaEnabled: true };
          setUser(updatedUser);
        }
        
        setMfaLoading(false);
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify code';
      setError(`Failed to verify two-factor authentication: ${errorMessage}`);
      
      // If error is related to invalid code, clear the input
      if (errorMessage.includes('invalid') || errorMessage.includes('code')) {
        setMfaVerificationCode('');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <Box 
        className="profile-page-container"
        display="flex" 
        justifyContent="center" 
        alignItems="center"
      >
        <CircularProgress sx={{ color: '#3f8cff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <StyledAppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={navigateBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {isCurrentUser ? 'My Profile' : `User Profile: ${formData.username}`}
        </Typography>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <StyledAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </StyledAlert>
        )}
        
        {success && (
          <StyledAlert severity="success" sx={{ mb: 3 }}>
            {success}
          </StyledAlert>
        )}
        
        <Box sx={{ width: '100%', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#3f8cff',
                },
              },
            }}
          >
            <Tab label="Profile Information" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Security & MFA" icon={<SecurityIcon />} iconPosition="start" />
            <Tab label="Account Status" icon={<BarChartIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Profile Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <StyledPaper elevation={3}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
              User Information
        </Typography>

            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                label="Username"
                    fullWidth
                name="username"
                value={formData.username}
                    onChange={handleChange}
                    disabled={!(isCurrentUser || isAdmin)}
              />
            </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                label="Email"
                    fullWidth
                name="email"
                value={formData.email}
                    onChange={handleChange}
                    disabled={!isCurrentUser}
              />
            </Grid>
                
                {/* Student-specific fields */}
                {(isCurrentUser && !isAdmin) && (
                  <>
                    <Grid item xs={12} md={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                        Academic Information
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                        label="Department/Major"
                    fullWidth
                    name="department"
                    value={formData.department || ''}
                        onChange={handleChange}
                        disabled={!isCurrentUser}
                  />
                </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                        label="Degree Program"
                    fullWidth
                    name="degree"
                    value={formData.degree || ''}
                        onChange={handleChange}
                        disabled={!isCurrentUser}
                  />
                </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                    label="Year of Study"
                        fullWidth
                    name="yearOfStudy"
                    value={formData.yearOfStudy || ''}
                        onChange={handleChange}
                        disabled={!isCurrentUser}
                  />
                </Grid>
              </>
            )}
                
                {/* Display roles only if admin or viewing other user */}
                {(isAdmin || !isCurrentUser) && user && user.roles && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                      User Roles
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {user.roles.map((role, index) => (
                        <Chip 
                          key={index}
                          label={typeof role === 'string' ? role.replace('ROLE_', '') : role.name.replace('ROLE_', '')}
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            borderColor: 'rgba(63, 140, 255, 0.5)',
                            backgroundColor: 'rgba(63, 140, 255, 0.1)'
                          }}
                        />
                      ))}
                    </Box>
          </Grid>
                )}
                
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={avatarPreview || user?.avatar || '/default-avatar.png'}
                    alt="Profile Picture"
                    sx={{ width: 120, height: 120, mb: 2, border: '2px solid #3f8cff' }}
                  />
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={e => {
                      setAvatarError('');
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setAvatarError('File size exceeds 2MB limit');
                        return;
                      }
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setAvatarError('Only JPEG, PNG, and WEBP images are allowed');
                        return;
                      }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                  <label htmlFor="avatar-upload">
                    <Button variant="outlined" component="span" sx={{ mb: 1 }}>
                      Choose Profile Picture
                    </Button>
                  </label>
                  {avatarPreview && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        New profile picture selected
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        sx={{ ml: 1, color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {avatarError && <Typography color="error" variant="caption">{avatarError}</Typography>}
                </Grid>
                
                {isCurrentUser && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2 }}>
                      {avatarFile && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                          Your new profile picture will be uploaded when you save changes
                        </Typography>
                      )}
                      <StyledButton 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                      </StyledButton>
                    </Box>
                  </Grid>
                )}
          </Grid>
            </form>
          </StyledPaper>
        </TabPanel>
        
        {/* Security & MFA Tab */}
        <TabPanel value={activeTab} index={1}>
          <StyledPaper elevation={3}>
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom 
              sx={{ fontWeight: 600, mb: 4, color: '#ffffff' }}
            >
              Security Settings
            </Typography>
            
            {/* Password Section */}
            {isCurrentUser && (
              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}
                >
            Change Password
          </Typography>
                
                <form onSubmit={handlePasswordChange}>
                  <Grid container spacing={3}>
            <Grid item xs={12}>
                      <StyledTextField
                label="Current Password"
                fullWidth
                name="currentPassword"
                        type={showPassword.current ? 'text' : 'password'}
                value={formData.currentPassword}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => toggleShowPassword('current')}
                                edge="end"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
              />
            </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                label="New Password"
                fullWidth
                name="newPassword"
                        type={showPassword.new ? 'text' : 'password'}
                value={formData.newPassword}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => toggleShowPassword('new')}
                                edge="end"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
              />
              {formData.newPassword && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={passwordStrength} 
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: passwordStrength < 40 
                                  ? '#f44336' 
                                  : passwordStrength < 70 
                                    ? '#ff9800' 
                                    : '#4caf50'
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                            {passwordStrength < 40 
                              ? 'Weak password' 
                              : passwordStrength < 70 
                                ? 'Moderate password' 
                                : 'Strong password'}
                  </Typography>
                          
                  {passwordErrors.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="error">
                                Your password must have:
                        </Typography>
                              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                                {passwordErrors.map((err, i) => (
                                  <li key={i}>
                                    <Typography variant="caption" color="error">
                                      {err}
                        </Typography>
                                  </li>
                      ))}
                              </ul>
                    </Box>
                  )}
                </Box>
              )}
            </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                label="Confirm New Password"
                fullWidth
                name="confirmPassword"
                        type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => toggleShowPassword('confirm')}
                                edge="end"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          Passwords do not match
                        </Typography>
                      )}
            </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <StyledButton 
                          type="submit" 
                          variant="contained" 
                          color="primary"
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Update Password'}
                        </StyledButton>
                      </Box>
          </Grid>
                  </Grid>
                </form>
              </Box>
            )}
            
            {/* MFA Section */}
            {isCurrentUser && (
              <>
                <Divider sx={{ my: 4 }} />
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}
                  >
                    Two-Factor Authentication
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    Add an extra layer of security to your account by enabling two-factor authentication.
                    You'll need to enter a code from your authenticator app when logging in.
                  </Typography>
                  
                  {mfaEnabled ? (
                    <Box>
                      <Alert severity="success" sx={{ mb: 3 }}>
                        Two-factor authentication is currently enabled.
                      </Alert>
                      
            <Button
                        variant="outlined" 
                        color="error" 
                        onClick={handleMfaDisable}
                        disabled={mfaLoading}
                        startIcon={<SecurityIcon />}
                        sx={{ mr: 2 }}
                      >
                        {mfaLoading ? <CircularProgress size={24} /> : 'Disable Two-Factor Authentication'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleGenerateBackupCodes}
                        disabled={mfaLoading}
                        startIcon={<VpnKeyIcon />}
                      >
                        {mfaLoading ? <CircularProgress size={24} /> : 'Generate New Backup Codes'}
                      </Button>
                      
                      {showBackupCodes && backupCodes.length > 0 && (
                        <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ mb: 2, color: '#ffb74d' }}
                          >
                            Save these backup codes in a secure location. They can be used to access your account if you lose your phone.
                            Each code can only be used once.
                          </Typography>
                          
                          <Grid container spacing={1}>
                            {backupCodes.map((code, index) => (
                              <Grid item xs={6} sm={4} md={3} key={index}>
                                <Chip 
                                  label={code} 
                                  variant="outlined" 
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: 'white'
                                  }} 
              />
            </Grid>
                            ))}
          </Grid>

                          <Button 
                            variant="text" 
                            size="small" 
                            onClick={() => setShowBackupCodes(false)} 
                            sx={{ mt: 2 }}
                          >
                            Hide Backup Codes
                          </Button>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      {!mfaSetupData ? (
                        <Button
              variant="contained"
                          color="primary"
                          onClick={handleMfaSetup}
                          disabled={mfaLoading}
                          startIcon={<LockIcon />}
                        >
                          {mfaLoading ? <CircularProgress size={24} /> : 'Set Up Two-Factor Authentication'}
            </Button>
                      ) : (
                        <Box>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ mb: 2, color: '#ffffff' }}
                          >
                            1. Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
                          </Typography>
                          
                          <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', width: 'fit-content', borderRadius: 1 }}>
                            {mfaSetupData?.qrCodeUrl ? (
                              <QRCodeSVG 
                                value={mfaSetupData.qrCodeUrl}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                                includeMargin={true}
                              />
                            ) : (
                              <CircularProgress />
                            )}
          </Box>
                          
                          <Button 
                            size="small"
                            variant="text"
                            onClick={() => console.log('QR Code URL:', mfaSetupData?.qrCodeUrl)}
                            sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.5)' }}
                          >
                            Debug QR Code
                          </Button>
                          
                          <Typography 
                            variant="subtitle2" 
                            sx={{ mb: 2, color: '#ffffff' }}
                          >
                            2. Or manually enter this code in your app:
                          </Typography>
                          
                          <Box sx={{ mb: 3, p: 3, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: '#ffffff' }}>
                              Manual Entry Instructions for Google Authenticator:
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  • Account name: <span style={{ fontWeight: 'bold' }}>LMS:{storedUser?.username || 'user'}</span>
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  • Your key: <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{mfaSetupData.secretKey}</span>
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  • Key type: <span style={{ fontWeight: 'bold' }}>Time based</span>
                                </Typography>
                              </Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                            
                            <Typography variant="subtitle2" sx={{ mb: 2, color: '#ffb74d' }}>
                              Test Mode: For testing, you can use these codes instead of the Google Authenticator code:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                              <Chip 
                                label="123456" 
                                onClick={() => setMfaVerificationCode('123456')}
                                sx={{ fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                              />
                              <Chip 
                                label="000000" 
                                onClick={() => setMfaVerificationCode('000000')}
                                sx={{ fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                              />
                              <Chip 
                                label="111111" 
                                onClick={() => setMfaVerificationCode('111111')}
                                sx={{ fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                              />
        </Box>
                          </Box>
                          
                          <Typography 
                            variant="subtitle2" 
                            sx={{ mb: 2, color: '#ffffff' }}
                          >
                            3. Enter the verification code from your authenticator app:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <TextField
                              value={mfaVerificationCode}
                              onChange={(e) => setMfaVerificationCode(e.target.value)}
                              placeholder="6-digit code"
                              autoComplete="off"
                              inputProps={{ 
                                maxLength: 6,
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                              }}
                              sx={{ 
                                width: 150, 
                                mr: 2,
                                '& .MuiOutlinedInput-root': {
                                  color: '#ffffff',
                                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                  fontSize: '20px',
                                  letterSpacing: '2px',
                                  fontFamily: 'monospace'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(63, 140, 255, 0.5)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#3f8cff',
                                },
                              }}
                            />
                            
            <Button
              variant="contained"
                              color="primary"
                              onClick={handleMfaVerify}
                              disabled={mfaLoading || !mfaVerificationCode || mfaVerificationCode.length !== 6}
            >
                              {mfaLoading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Box>
                          
                          {showBackupCodes && backupCodes.length > 0 && (
                            <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ mb: 2, color: '#ffb74d' }}
                              >
                                Save these backup codes in a secure location. They can be used to access your account if you lose your phone.
                                Each code can only be used once.
                              </Typography>
                              
                              <Grid container spacing={1}>
                                {backupCodes.map((code, index) => (
                                  <Grid item xs={6} sm={4} md={3} key={index}>
                                    <Chip 
                                      label={code} 
                                      variant="outlined" 
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        fontWeight: 'bold',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                      }} 
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
        </Box>
              </>
            )}
          </StyledPaper>
        </TabPanel>
        
        {/* Account Status Tab */}
        <TabPanel value={activeTab} index={2}>
          <StyledPaper elevation={3}>
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom 
              sx={{ fontWeight: 600, mb: 4, color: '#ffffff' }}
            >
              Account Status Information
            </Typography>
            
            <AccountStatus />
          </StyledPaper>
        </TabPanel>
    </Container>
    </Box>
  );
};

export default UserProfile; 