import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  tableCellClasses,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Divider,
  Badge,
  LinearProgress,
  useMediaQuery,
  Container,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import InfoIcon from '@mui/icons-material/Info';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import RefreshIcon from '@mui/icons-material/Refresh';
import accountService from '../../services/account.service';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  backgroundColor: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: 'rgba(26, 32, 39, 0.98)',
    color: theme.palette.common.white,
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '16px',
  },
  [`&.${tableCellClasses.body}`]: {
    color: theme.palette.common.white,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.common.white, 0.03),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const SummaryCard = styled(Card)(({ theme, color }) => ({
  height: '100%',
  borderRadius: '12px',
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(color, 0.3)}`,
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 8px 32px ${alpha(color, 0.2)}`,
    borderColor: color,
  },
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  backgroundColor: alpha(color, 0.15),
  color: color,
  width: 50,
  height: 50,
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  '& svg': {
    fontSize: 28,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  color: theme.palette.common.white,
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  color: '#e0e0e0',
  paddingTop: theme.spacing(3),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
}));

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

const AccountBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 8,
    top: 8,
    padding: '0 4px',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}));

const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  color: theme.palette.text.secondary,
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const AccountManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [daysValue, setDaysValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      // Get account status for all users
      const accountsData = await accountService.getAllAccountsStatus();
      
      // Enhance account data with admin status
      const enhancedAccountsData = accountsData.map(account => {
        // Check if this is an admin user - different ways to detect this
        const isAdminUser = 
          // Check by roles array if available
          (account.roles && 
            (account.roles.includes('ROLE_ADMIN') || 
             account.roles.includes('ADMIN'))) ||
          // Check by role property if available
          account.role === 'ADMIN' ||
          // Check by username if it contains admin (fallback)
          account.username?.toLowerCase().includes('admin');
        
        return {
          ...account,
          isAdmin: isAdminUser
        };
      });
      
      setAccounts(enhancedAccountsData);
      
      // Get account summary statistics
      const summaryData = await accountService.getAccountStatusSummary();
      setSummary(summaryData);

      // Track admin accounts by their IDs for quick lookup
      const admins = enhancedAccountsData
        .filter(account => account.isAdmin)
        .map(account => account.userId);
      
      setAdminAccounts(admins);
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError('Failed to load account information. Please try again later.');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const isAdmin = (userId) => {
    // Check if user ID is in our admin accounts list
    return adminAccounts.includes(userId);
  };

  const handleOpenDialog = (user, type) => {
    // Prevent opening dialog for admin accounts
    if (isAdmin(user.userId)) {
      return;
    }
    
    setSelectedUser(user);
    setDialogType(type);
    setDialogOpen(true);
    setDaysValue('');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setDialogType('');
  };

  const handleAction = async () => {
    try {
      // Double-check to ensure no actions on admin accounts
      if (selectedUser && isAdmin(selectedUser.userId)) {
        setActionError('Actions cannot be performed on admin accounts');
        return;
      }
      
      setActionLoading(true);
      setActionSuccess(null);
      setActionError(null);
      
      let result;
      switch (dialogType) {
        case 'block':
          result = await accountService.blockUser(selectedUser.userId);
          break;
        case 'unblock':
          result = await accountService.unblockUser(selectedUser.userId);
          break;
        case 'extend':
          if (!daysValue || isNaN(daysValue) || parseInt(daysValue) <= 0) {
            throw new Error('Please enter a valid number of days (greater than 0)');
          }
          result = await accountService.extendExpiration(selectedUser.userId, parseInt(daysValue));
          break;
        case 'reduce':
          if (!daysValue || isNaN(daysValue) || parseInt(daysValue) <= 0) {
            throw new Error('Please enter a valid number of days (greater than 0)');
          }
          result = await accountService.reduceExpiration(selectedUser.userId, parseInt(daysValue));
          break;
        case 'expire':
          result = await accountService.expireAccount(selectedUser.userId);
          break;
        default:
          throw new Error('Unknown action type');
      }
      
      setActionSuccess(result.message || 'Action completed successfully');
      
      // Refresh the account data after a short delay
      setTimeout(() => {
        fetchAccounts();
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      console.error('Error performing account action:', err);
      setActionError(err.message || 'Failed to perform the action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const getDaysColor = (days) => {
    if (days === null || days === undefined) return theme.palette.grey[500];
    if (days <= 3) return theme.palette.error.main;
    if (days <= 7) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getProgressValue = (days) => {
    if (days === null || days === undefined) return 100;
    // Max days considered is 30
    const maxDays = 30;
    return Math.min(100, Math.max(0, (days / maxDays) * 100));
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
          Loading account data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: 4,
      px: 2,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <Container maxWidth="xl">
        <PageHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconWrapper color={theme.palette.primary.main}>
              <ManageAccountsIcon />
            </IconWrapper>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: theme.palette.common.white,
                mb: 0.5
              }}>
                Account Management
              </Typography>
              <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                Manage user accounts, block/unblock accounts, and control account expiration
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchAccounts}
            disabled={refreshing}
            sx={{ 
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1,
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </PageHeader>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4, 
              borderRadius: '8px',
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            {error}
          </Alert>
        )}
        
        {refreshing && (
          <Box sx={{ width: '100%', mb: 4 }}>
            <LinearProgress color="primary" />
          </Box>
        )}
        
        {summary && (
          <Fade in={!loading || refreshing} timeout={500}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard color={theme.palette.info.main}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconWrapper color={theme.palette.info.main}>
                        <AccountCircleIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                          Total Accounts
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.common.white }}>
                          {summary.total}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.info.main, 0.15),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.info.main,
                        }
                      }}
                    />
                  </CardContent>
                </SummaryCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard color={theme.palette.success.main}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconWrapper color={theme.palette.success.main}>
                        <CheckCircleIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                          Active Accounts
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.common.white }}>
                          {summary.active}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(summary.active / summary.total) * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.success.main, 0.15),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.success.main,
                        }
                      }}
                    />
                  </CardContent>
                </SummaryCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard color={theme.palette.warning.main}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconWrapper color={theme.palette.warning.main}>
                        <TimerOffIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                          Expired Accounts
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.common.white }}>
                          {summary.expired}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(summary.expired / summary.total) * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.warning.main, 0.15),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.warning.main,
                        }
                      }}
                    />
                  </CardContent>
                </SummaryCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard color={theme.palette.error.main}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconWrapper color={theme.palette.error.main}>
                        <BlockIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                          Blocked Accounts
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.common.white }}>
                          {summary.blocked}
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(summary.blocked / summary.total) * 100} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.error.main, 0.15),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.error.main,
                        }
                      }}
                    />
                  </CardContent>
                </SummaryCard>
              </Grid>
            </Grid>
          </Fade>
        )}
        
        <Fade in={!loading || refreshing} timeout={700}>
          <StyledPaper>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                color: theme.palette.common.white,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <DashboardIcon sx={{ color: theme.palette.primary.main }} />
              Account Status Dashboard
            </Typography>
            
            <StyledTableContainer>
              <Table sx={{ minWidth: 650 }} size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>User ID</StyledTableCell>
                    <StyledTableCell>Username</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell>Last Login</StyledTableCell>
                    <StyledTableCell>Expiration Date</StyledTableCell>
                    <StyledTableCell>Days Left</StyledTableCell>
                    <StyledTableCell align="center">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <StyledTableRow 
                      key={account.userId}
                      sx={isAdmin(account.userId) ? {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                      } : {}}
                    >
                      <StyledTableCell>{account.userId}</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {account.username}
                          {isAdmin(account.userId) && (
                            <Chip
                              label="ADMIN"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                color: theme.palette.primary.main,
                                ml: 1
                              }}
                            />
                          )}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <StatusChip 
                          label={isAdmin(account.userId) ? 'ADMIN' : (account.accountStatus || 'ACTIVE')} 
                          statuscolor={isAdmin(account.userId) ? theme.palette.primary.main : getStatusColor(account.accountStatus)}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>{formatDate(account.lastLoginDate)}</StyledTableCell>
                      <StyledTableCell>
                        {isAdmin(account.userId) ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.primary.main }}>
                            Never Expires
                          </Typography>
                        ) : (
                          formatDate(account.expirationDate)
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        {isAdmin(account.userId) ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                            Unlimited
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600, 
                                color: getDaysColor(account.daysUntilExpiration) 
                              }}
                            >
                              {account.daysUntilExpiration !== null ? `${account.daysUntilExpiration} days` : 'N/A'}
                            </Typography>
                            <Box sx={{ width: 60, ml: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={getProgressValue(account.daysUntilExpiration)} 
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2,
                                  backgroundColor: alpha(getDaysColor(account.daysUntilExpiration), 0.15),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getDaysColor(account.daysUntilExpiration),
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {/* Admin accounts have disabled actions with a tooltip explanation */}
                          {isAdmin(account.userId) ? (
                            <Tooltip title="Admin accounts cannot be modified" arrow placement="top">
                              <span>
                                <AnimatedIconButton 
                                  color="disabled"
                                  size="small"
                                  disabled
                                >
                                  <InfoIcon />
                                </AnimatedIconButton>
                              </span>
                            </Tooltip>
                          ) : account.blocked || account.accountStatus === 'BLOCKED' ? (
                            <Tooltip title="Unblock Account" arrow placement="top">
                              <AnimatedIconButton 
                                color="success" 
                                size="small"
                                onClick={() => handleOpenDialog(account, 'unblock')}
                              >
                                <CheckCircleIcon />
                              </AnimatedIconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Block Account" arrow placement="top">
                              <AnimatedIconButton 
                                color="error" 
                                size="small"
                                onClick={() => handleOpenDialog(account, 'block')}
                              >
                                <BlockIcon />
                              </AnimatedIconButton>
                            </Tooltip>
                          )}
                          
                          {!isAdmin(account.userId) && (
                            <>
                              <Tooltip title="Extend Expiration" arrow placement="top">
                                <AnimatedIconButton 
                                  color="primary" 
                                  size="small"
                                  onClick={() => handleOpenDialog(account, 'extend')}
                                >
                                  <AddIcon />
                                </AnimatedIconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reduce Expiration" arrow placement="top">
                                <AnimatedIconButton 
                                  color="warning" 
                                  size="small"
                                  onClick={() => handleOpenDialog(account, 'reduce')}
                                >
                                  <RemoveIcon />
                                </AnimatedIconButton>
                              </Tooltip>
                              
                              <Tooltip title="Force Expire" arrow placement="top">
                                <AnimatedIconButton 
                                  color="error" 
                                  size="small"
                                  onClick={() => handleOpenDialog(account, 'expire')}
                                >
                                  <TimerOffIcon />
                                </AnimatedIconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  {accounts.length === 0 && !loading && (
                    <StyledTableRow>
                      <StyledTableCell colSpan={7} align="center">
                        <Typography variant="body1" sx={{ py: 3, color: alpha(theme.palette.common.white, 0.7) }}>
                          No accounts found
                        </Typography>
                      </StyledTableCell>
                    </StyledTableRow>
                  )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </StyledPaper>
        </Fade>
        
        {/* Action Dialogs */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          TransitionComponent={Zoom}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: '12px',
              backgroundColor: 'transparent',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }
          }}
        >
          <StyledDialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {dialogType === 'block' && <BlockIcon color="error" />}
              {dialogType === 'unblock' && <CheckCircleIcon color="success" />}
              {dialogType === 'extend' && <AddIcon color="primary" />}
              {dialogType === 'reduce' && <RemoveIcon color="warning" />}
              {dialogType === 'expire' && <TimerOffIcon color="error" />}
              
              {dialogType === 'block' && 'Block Account'}
              {dialogType === 'unblock' && 'Unblock Account'}
              {dialogType === 'extend' && 'Extend Expiration'}
              {dialogType === 'reduce' && 'Reduce Expiration'}
              {dialogType === 'expire' && 'Force Expire Account'}
            </Box>
          </StyledDialogTitle>
          
          <StyledDialogContent>
            {selectedUser && (
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  mb: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: '8px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                  <AccountBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={selectedUser.userId}
                  >
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.main 
                      }}
                    >
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </AccountBadge>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                      {selectedUser.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <StatusChip 
                        label={selectedUser.accountStatus || 'ACTIVE'} 
                        statuscolor={getStatusColor(selectedUser.accountStatus)}
                        size="small"
                      />
                      <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                        {selectedUser.daysUntilExpiration !== null ? 
                          `Expires in ${selectedUser.daysUntilExpiration} days` : 
                          'No expiration date'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <DialogContentText sx={{ color: alpha(theme.palette.common.white, 0.7), mb: 3 }}>
                  {dialogType === 'block' && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <InfoIcon color="info" sx={{ mt: 0.5 }} />
                      <Typography variant="body2">
                        Blocking this account will prevent the user from logging in. 
                        This action can be reversed by unblocking the account later.
                      </Typography>
                    </Box>
                  )}
                  
                  {dialogType === 'unblock' && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <InfoIcon color="info" sx={{ mt: 0.5 }} />
                      <Typography variant="body2">
                        Unblocking will restore access to this account and set its status to active.
                        The account expiration will be extended by 30 days from today.
                      </Typography>
                    </Box>
                  )}
                  
                  {dialogType === 'expire' && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <InfoIcon color="info" sx={{ mt: 0.5 }} />
                      <Typography variant="body2">
                        Force expiring an account will immediately set its status to expired,
                        preventing the user from logging in. This action can be reversed by extending the expiration date.
                      </Typography>
                    </Box>
                  )}
                  
                  {(dialogType === 'extend' || dialogType === 'reduce') && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
                        <InfoIcon color="info" sx={{ mt: 0.5 }} />
                        <Typography variant="body2">
                          {dialogType === 'extend' 
                            ? `Enter the number of days to extend ${selectedUser.username}'s account expiration.`
                            : `Enter the number of days to reduce ${selectedUser.username}'s account expiration.`}
                        </Typography>
                      </Box>
                      
                      <TextField
                        autoFocus
                        margin="dense"
                        label="Days"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={daysValue}
                        onChange={(e) => setDaysValue(e.target.value)}
                        inputProps={{ min: 1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: alpha(theme.palette.common.white, 0.2),
                            },
                            '&:hover fieldset': {
                              borderColor: alpha(theme.palette.common.white, 0.3),
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: alpha(theme.palette.common.white, 0.7),
                          },
                        }}
                      />
                    </>
                  )}
                </DialogContentText>
                
                {actionSuccess && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
                    {actionSuccess}
                  </Alert>
                )}
                
                {actionError && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
                    {actionError}
                  </Alert>
                )}
              </Box>
            )}
          </StyledDialogContent>
          
          <StyledDialogActions>
            <Button 
              onClick={handleCloseDialog} 
              disabled={actionLoading}
              variant="outlined"
              sx={{ 
                color: alpha(theme.palette.common.white, 0.7),
                borderColor: alpha(theme.palette.common.white, 0.2),
                '&:hover': {
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  backgroundColor: alpha(theme.palette.common.white, 0.05),
                },
                borderRadius: '8px',
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              color={dialogType === 'block' || dialogType === 'reduce' || dialogType === 'expire' ? 'error' : 'primary'}
              disabled={actionLoading || actionSuccess}
              variant="contained"
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                minWidth: 100
              }}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Confirm'}
            </Button>
          </StyledDialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AccountManagement; 