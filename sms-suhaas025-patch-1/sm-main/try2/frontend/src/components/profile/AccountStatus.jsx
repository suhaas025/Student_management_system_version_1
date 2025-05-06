import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Grid, 
  CircularProgress, 
  Alert,
  AlertTitle,
  LinearProgress,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import accountService from '../../services/account.service';
import AuthService from '../../services/auth.service';

// Styled components
const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: alpha(statuscolor, 0.15),
  color: statuscolor,
  border: `1px solid ${alpha(statuscolor, 0.3)}`,
  '& .MuiChip-label': {
    textTransform: 'uppercase',
    fontSize: '0.70rem',
    letterSpacing: '0.5px',
  }
}));

const InfoCard = styled(Box)(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: alpha(color, 0.1),
  borderRadius: '8px',
  border: `1px solid ${alpha(color, 0.2)}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(color, 0.15),
    transform: 'translateY(-2px)',
  }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  backgroundColor: alpha(color, 0.15),
  color: color,
  width: 40,
  height: 40,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  '& svg': {
    fontSize: 22,
  },
}));

const ProgressWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  marginTop: theme.spacing(1),
}));

const AccountStatus = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to get current user's account status
        const status = await accountService.getMyAccountStatus();
        setAccountStatus(status);
      } catch (err) {
        console.error('Error fetching account status:', err);
        setError('Failed to load account status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountStatus();
  }, []);

  const getStatusColor = (status) => {
    if (!status) return theme.palette.grey[500];
    
    switch (status) {
      case 'ACTIVE':
        return theme.palette.success.main;
      case 'EXPIRED':
        return theme.palette.warning.main;
      case 'BLOCKED':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTimeColor = (days) => {
    if (days === null || days === undefined) return theme.palette.grey[500];
    
    // If admin, show as primary color
    if (accountStatus?.isAdmin) return theme.palette.primary.main;
    
    // For regular users
    if (days <= 3) return theme.palette.error.main;
    if (days <= 7) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getProgressValue = (days) => {
    if (days === null || days === undefined) return 0;
    
    // If admin or has "infinite" days
    if (accountStatus?.isAdmin || days >= 10000) return 100;
    
    // Max days considered is 30
    const maxDays = 30;
    return Math.min(100, Math.max(0, (days / maxDays) * 100));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // If status couldn't be loaded
  if (!accountStatus) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Account status information is not available.</Alert>
      </Box>
    );
  }

  const isAdmin = accountStatus.isAdmin || (accountStatus.roles && 
    (accountStatus.roles.includes('ROLE_ADMIN') || accountStatus.roles.includes('ADMIN')));

  return (
    <Box>
      {/* Status Card */}
      <InfoCard color={getStatusColor(accountStatus.accountStatus)}>
        <IconWrapper color={getStatusColor(accountStatus.accountStatus)}>
          {accountStatus.accountStatus === 'ACTIVE' && <CheckCircleIcon />}
          {accountStatus.accountStatus === 'BLOCKED' && <BlockIcon />}
          {accountStatus.accountStatus === 'EXPIRED' && <TimerIcon />}
          {!accountStatus.accountStatus && <InfoIcon />}
        </IconWrapper>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Account Status
            </Typography>
            <StatusChip 
              label={isAdmin ? 'ADMIN' : (accountStatus.accountStatus || 'ACTIVE')} 
              statuscolor={getStatusColor(accountStatus.accountStatus)}
              size="small"
            />
          </Box>
          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.7) }}>
            {isAdmin ? 
              'Your admin account has full privileges and never expires.' : 
              accountStatus.accountStatus === 'ACTIVE' ? 
                'Your account is active and in good standing.' :
                accountStatus.accountStatus === 'BLOCKED' ? 
                  'Your account has been blocked. Please contact an administrator.' :
                  accountStatus.accountStatus === 'EXPIRED' ?
                    'Your account has expired. Please contact an administrator to reactivate it.' :
                    'Your account status is currently unknown.'
            }
          </Typography>
        </Box>
      </InfoCard>

      {/* Login Info Card */}
      <InfoCard color={theme.palette.info.main}>
        <IconWrapper color={theme.palette.info.main}>
          <AccountCircleIcon />
        </IconWrapper>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Last Login
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.7) }}>
            {formatDate(accountStatus.lastLoginDate)}
          </Typography>
        </Box>
      </InfoCard>

      {/* Expiration Card */}
      <InfoCard color={isAdmin ? theme.palette.primary.main : theme.palette.warning.main}>
        <IconWrapper color={isAdmin ? theme.palette.primary.main : theme.palette.warning.main}>
          <EventIcon />
        </IconWrapper>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {isAdmin ? 'Account Never Expires' : 'Account Expiration'}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.7) }}>
            {isAdmin ? 
              'As an admin, your account does not expire' : 
              `Expires on: ${formatDate(accountStatus.expirationDate)}`
            }
          </Typography>
          
          {/* Time Remaining Card - only shown for non-admin accounts */}
          {!isAdmin && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: getTimeColor(accountStatus.daysUntilExpiration) }}>
                  <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {accountStatus.daysUntilExpiration !== null && accountStatus.daysUntilExpiration !== undefined
                    ? `${accountStatus.daysUntilExpiration} days remaining`
                    : 'Expiration time unknown'
                  }
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.5) }}>
                  {getProgressValue(accountStatus.daysUntilExpiration)}%
                </Typography>
              </Box>
              <ProgressWrapper>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressValue(accountStatus.daysUntilExpiration)} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: alpha(getTimeColor(accountStatus.daysUntilExpiration), 0.15),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getTimeColor(accountStatus.daysUntilExpiration),
                    }
                  }}
                />
              </ProgressWrapper>
            </Box>
          )}
        </Box>
      </InfoCard>

      {/* Role Information Card */}
      {accountStatus.roles && accountStatus.roles.length > 0 && (
        <InfoCard color={theme.palette.primary.main}>
          <IconWrapper color={theme.palette.primary.main}>
            <PersonIcon />
          </IconWrapper>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Account Roles
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {accountStatus.roles.map((role, index) => (
                <Chip 
                  key={index}
                  label={role.replace('ROLE_', '')}
                  size="small"
                  sx={{
                    backgroundColor: role.includes('ADMIN') 
                      ? alpha(theme.palette.primary.main, 0.2) 
                      : alpha(theme.palette.info.main, 0.2),
                    color: role.includes('ADMIN') 
                      ? theme.palette.primary.main 
                      : theme.palette.info.main,
                    border: `1px solid ${alpha(
                      role.includes('ADMIN') ? theme.palette.primary.main : theme.palette.info.main, 
                      0.3
                    )}`,
                  }}
                />
              ))}
            </Box>
          </Box>
        </InfoCard>
      )}
      
      {/* Warning Messages based on status */}
      {!isAdmin && accountStatus.daysUntilExpiration !== null && accountStatus.daysUntilExpiration <= 7 && (
        <Alert 
          severity={accountStatus.daysUntilExpiration <= 3 ? "error" : "warning"} 
          sx={{ mt: 2, borderRadius: '8px' }}
        >
          <AlertTitle>
            {accountStatus.daysUntilExpiration <= 3 ? "Critical Warning" : "Warning"}
          </AlertTitle>
          Your account will expire in {accountStatus.daysUntilExpiration} days. 
          {accountStatus.daysUntilExpiration <= 3 
            ? " Please log in more frequently to prevent account expiration."
            : " Regular login extends your account validity."}
        </Alert>
      )}
      
      {accountStatus.accountStatus === 'EXPIRED' && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
          <AlertTitle>Account Expired</AlertTitle>
          Your account has expired due to inactivity. Please contact an administrator to reactivate it.
        </Alert>
      )}
      
      {accountStatus.accountStatus === 'BLOCKED' && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
          <AlertTitle>Account Blocked</AlertTitle>
          Your account has been blocked. Please contact an administrator for assistance.
        </Alert>
      )}
    </Box>
  );
};

export default AccountStatus; 