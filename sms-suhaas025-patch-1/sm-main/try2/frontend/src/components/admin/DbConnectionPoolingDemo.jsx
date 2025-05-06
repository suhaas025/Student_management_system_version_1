import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Snackbar, Alert, Divider, Tooltip, Avatar, Collapse, IconButton, Badge, useTheme, alpha, LinearProgress, Fade
} from '@mui/material';
import { 
  Info as InfoIcon, CheckCircle, HourglassEmpty, Error as ErrorIcon, Done, ExpandMore, ExpandLess, 
  Storage as StorageIcon, Refresh as RefreshIcon, DataUsage as DataUsageIcon, BarChart as BarChartIcon,
  Speed as SpeedIcon, ViewModule as ViewModuleIcon
} from '@mui/icons-material';

const API_BASE = '/api/connection-pool-demo';

function getAuthHeaders() {
  let token = localStorage.getItem('token');
  if (!token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    token = user.accessToken || user.token;
  }
  
  // Add more robust checking
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('Authentication token is missing or invalid');
    return {};
  }
  
  return { 'Authorization': `Bearer ${token}` };
}

// Add a helper function to check authentication
function isAuthenticated() {
  const headers = getAuthHeaders();
  return !!headers.Authorization;
}

function statusColor(status) {
  if (status?.startsWith('error')) return 'error';
  if (status === 'released') return 'default';
  if (status === 'holding') return 'success';
  if (status === 'waiting') return 'warning';
  return 'info';
}

function statusIcon(status) {
  if (status?.startsWith('error')) return <ErrorIcon fontSize="small" />;
  if (status === 'released') return <Done fontSize="small" />;
  if (status === 'holding') return <CheckCircle fontSize="small" />;
  if (status === 'waiting') return <HourglassEmpty fontSize="small" />;
  return <InfoIcon fontSize="small" />;
}

function formatTime(ts) {
  if (!ts) return 'Not set';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Add a new utility function to handle API requests with retry logic
async function makeApiRequest(url, options = {}, maxRetries = 2) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Add auth headers and content type
      const headers = { 
        ...getAuthHeaders(), 
        'Content-Type': 'application/json',
        ...options.headers 
      };

      // Ensure URL has cache busting
      const urlWithCache = url.includes('?') 
        ? `${url}&_t=${Date.now()}` 
        : `${url}?_t=${Date.now()}`;
      
      const response = await fetch(urlWithCache, {
        ...options,
        headers
      });
      
      // If unauthorized and we have retries left, try again with a short delay
      if (response.status === 401 && retries < maxRetries) {
        console.warn(`Authentication failed, retrying (${retries + 1}/${maxRetries})...`);
        retries++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        continue;
      }
      
      // Return both response and parsed data for better error handling
      return { 
        response,
        data: response.ok ? await response.json() : null,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      if (retries < maxRetries) {
        console.warn(`API request failed, retrying (${retries + 1}/${maxRetries})...`, error);
        retries++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
      } else {
        // Return error response for consistent handling
        return {
          response: null,
          data: null,
          ok: false,
          status: 0,
          statusText: error.message,
          error
        };
      }
    }
  }
}

export default function DbConnectionPoolingDemo() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);
  const [log, setLog] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tokenMissing, setTokenMissing] = useState(false);
  const [logOpen, setLogOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const logEndRef = useRef(null);
  
  // Track history of pool usage for chart
  const [poolHistory, setPoolHistory] = useState([]);
  const MAX_HISTORY_POINTS = 30;
  
  // Custom hold time setting 
  const [holdTime, setHoldTime] = useState(30000); // Default to 30 seconds for better demonstration
  
  // Force refresh interval
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Add new state variables for the demo sequence
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoWaitingObserved, setDemoWaitingObserved] = useState(false);

  // Add authentication error state
  const [authError, setAuthError] = useState(false);

  const fetchStats = async () => {
    try {
      const result = await makeApiRequest(`${API_BASE}/stats`);
      
      if (!result.ok) {
        if (result.status === 401) {
          setTokenMissing(true);
          setAuthError(true);
          addToLog('[error] Authentication failed: Unauthorized access');
        } else {
          addToLog(`[error] Failed to fetch stats: ${result.status} ${result.statusText}`);
        }
        setStats(null);
        return null;
      }
      
      // Reset auth error flags since request succeeded
      setTokenMissing(false);
      setAuthError(false);
      
      const data = result.data;
      setStats(data);
      
      // Debug information
      addToLog(`[debug] Pool stats: Active=${data.active}, Idle=${data.idle}, Total=${data.total}, Waiting=${data.threads_waiting}`);
      
      // Update history for the chart with forced data points if waiting
      setPoolHistory(prev => {
        const newPoint = { 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}),
          active: data.active,
          waiting: data.threads_waiting
        };
        const updated = [...prev, newPoint];
        return updated.slice(-MAX_HISTORY_POINTS);
      });
      
      return data; // Return the data for chaining
    } catch (e) {
      addToLog('[error] Failed to fetch stats: ' + e.message);
      setStats(null);
      return null;
    }
  };

  const fetchActiveConnections = async () => {
    try {
      const result = await makeApiRequest(`${API_BASE}/active`);
      
      if (!result.ok) {
        if (result.status === 401) {
          setTokenMissing(true);
          setAuthError(true);
          addToLog('[error] Authentication failed: Unauthorized access');
        } else {
          addToLog(`[error] Failed to fetch active connections: ${result.status} ${result.statusText}`);
        }
        setActiveConnections([]);
        return null;
      }
      
      // Reset auth error flags since request succeeded
      setTokenMissing(false);
      setAuthError(false);
      
      const data = result.data;
      
      if (Array.isArray(data)) {
        // Debug waiting connections
        const waitingConns = data.filter(conn => conn.status === 'waiting');
        if (waitingConns.length > 0) {
          addToLog(`[debug] Found ${waitingConns.length} waiting connections`);
        }
        
        setActiveConnections(data);
        return data; // Return the data for chaining
      } else {
        setActiveConnections([]);
        return [];
      }
    } catch (e) {
      addToLog('[error] Failed to fetch active connections: ' + e.message);
      setActiveConnections([]);
      return null;
    }
  };

  const acquireConnection = async () => {
    addToLog('[info] Acquiring connection with hold time: ' + holdTime + 'ms');
    setIsLoading(true);
    setForceRefresh(true); // Force immediate refresh of data
    
    if (!isAuthenticated()) {
      setTokenMissing(true);
      setAuthError(true);
      setSnackbar({ open: true, message: 'No admin token found. Please log in as admin.', severity: 'error' });
      setIsLoading(false);
      setForceRefresh(false);
      return;
    }
    
    try {
      // Notify user that the connection acquisition is in progress
      const acquisitionStartTime = Date.now();
      
      // Setup frequent polling to check for waiting state while the request is in progress
      const pollInterval = setInterval(async () => {
        try {
          // If we've been waiting for more than 2 seconds, check pool state
          if (Date.now() - acquisitionStartTime > 2000) {
            await fetchStats();
            await fetchActiveConnections();
            
            // If we have waiting threads, update the UI to indicate waiting rather than just "loading"
            if (stats?.threads_waiting > 0) {
              addToLog(`[info] Request is waiting for an available connection (${Math.round((Date.now() - acquisitionStartTime)/1000)}s)`);
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000);
      
      const result = await makeApiRequest(`${API_BASE}/acquire`, {
        method: 'POST',
        body: JSON.stringify({ holdTimeMs: holdTime })
      }, 3); // Try up to 3 times
      
      // Clear the polling interval since request completed
      clearInterval(pollInterval);
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status} ${result.statusText}`);
      }
      
      const waitTime = Date.now() - acquisitionStartTime;
      const waitTimeMessage = waitTime > 1000 ? ` (waited ${(waitTime/1000).toFixed(1)}s)` : '';
      
      setSnackbar({ open: true, message: `Connection requested${waitTimeMessage}.`, severity: 'success' });
      addToLog(`[success] Connection requested with hold time: ${holdTime}ms${waitTimeMessage}`);
      
      // Immediately refresh stats and connections for better feedback
      await fetchStats();
      await fetchActiveConnections();
      
      // Set a faster refresh interval temporarily to show changes
      setRefreshInterval(1000);
      setTimeout(() => setRefreshInterval(2000), 10000); // Reset after 10 seconds
      
    } catch (e) {
      let errorMessage = e.message;
      
      // Enhance error message if it's a timeout or auth error
      if (errorMessage.includes('timed out')) {
        errorMessage = 'Connection pool is full. Try releasing a connection first, or wait for one to be released automatically.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please log in again and try again.';
        setTokenMissing(true);
        setAuthError(true);
      }
      
      setSnackbar({ 
        open: true, 
        message: 'Failed to acquire connection: ' + errorMessage, 
        severity: 'error' 
      });
      addToLog('[error] Failed to acquire connection: ' + errorMessage);
    } finally {
      // Always reset loading and refresh states
      setIsLoading(false);
      setForceRefresh(false);
      
      // Ensure we have fresh data after any operation
      setTimeout(() => {
        fetchStats();
        fetchActiveConnections();
      }, 500);
    }
  };

  const releaseConnection = async (id) => {
    addToLog(`[info] Releasing connection ${id.slice(0, 6)}...`);
    
    if (!isAuthenticated()) {
      setTokenMissing(true);
      setAuthError(true);
      setSnackbar({ open: true, message: 'No admin token found. Please log in as admin.', severity: 'error' });
      return;
    }
    
    try {
      const result = await makeApiRequest(`${API_BASE}/release/${id}`, {
        method: 'POST'
      });
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}`);
      }
      
      setSnackbar({ open: true, message: `Connection ${id.slice(0, 6)} released.`, severity: 'success' });
      addToLog(`[success] Connection ${id.slice(0, 6)} released.`);
      
      // Immediately refresh to show the effect
      await fetchStats();
      await fetchActiveConnections();
      
      // Set a faster refresh interval temporarily
      setRefreshInterval(1000);
      setTimeout(() => setRefreshInterval(2000), 10000); // Reset after 10 seconds
    } catch (e) {
      setSnackbar({ open: true, message: `Failed to release connection ${id.slice(0, 6)}: ${e.message}`, severity: 'error' });
      addToLog(`[error] Failed to release connection ${id.slice(0, 6)}: ${e.message}`);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    setForceRefresh(true);
    
    try {
      await Promise.all([fetchStats(), fetchActiveConnections()]);
      addToLog('[info] Data refreshed manually');
    } catch (e) {
      addToLog('[error] Error during manual refresh: ' + e.message);
    }
    
    setTimeout(() => {
      setRefreshing(false);
      setForceRefresh(false);
    }, 500);
  };

  const addToLog = (message) => {
    setLog(prev => {
      // Limit log to 100 entries
      const newLog = [...prev, { message, timestamp: new Date().toISOString() }];
      if (newLog.length > 100) {
        return newLog.slice(-100);
      }
      return newLog;
    });
  };

  useEffect(() => {
    fetchStats();
    fetchActiveConnections();
    
    // Reset any stuck state that might exist from previous sessions
    setIsLoading(false);
    setRefreshing(false);
    
    // Set initial debug log
    addToLog('[info] Connection Pool Demo initialized');
    
    const interval = setInterval(() => {
      fetchStats();
      fetchActiveConnections();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Effect for handling force refresh
  useEffect(() => {
    if (forceRefresh) {
      const quickRefresh = setInterval(() => {
        fetchStats();
        fetchActiveConnections();
      }, 500);
      
      // Clear the quick refresh after 5 seconds
      const timeout = setTimeout(() => {
        clearInterval(quickRefresh);
        setForceRefresh(false);
      }, 5000);
      
      return () => {
        clearInterval(quickRefresh);
        clearTimeout(timeout);
      };
    }
  }, [forceRefresh]);

  // Pool usage for progress bar
  const poolActive = stats?.active || 0;
  const poolTotal = stats?.total || 10;
  const poolUsage = Math.min(100, Math.round((poolActive / poolTotal) * 100));
  
  // Calculate how many slots to display in the pool visualization
  const connectionSlots = Array(poolTotal || 10).fill().map((_, index) => {
    let status = 'idle';
    if (index < poolActive) status = 'active';
    return { id: index, status };
  });

  // Background and theme colors
  const bgGradient = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
  const cardBg = alpha(theme.palette.background.paper, 0.05);
  const darkBg = 'rgba(16, 24, 32, 0.8)';

  // Add a new component to better visualize waiting vs loading
  const LoadingButton = ({ isLoading, disabled, onClick, text, waitingCount }) => {
    const isWaiting = waitingCount > 0;
    
    return (
      <Button
        variant="contained"
        color={isWaiting ? "warning" : "primary"}
        fullWidth
        onClick={onClick}
        disabled={disabled || isLoading}
        sx={{ 
          py: 1.5,
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1rem',
          mt: 'auto',
          position: 'relative',
          overflow: 'hidden',
          ...(isWaiting && {
            bgcolor: theme => theme.palette.warning.main,
            '&:hover': {
              bgcolor: theme => theme.palette.warning.dark,
            }
          })
        }}
      >
        {isLoading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              ...(isWaiting && {
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'warning.light',
                }
              })
            }}
          />
        )}
        {isWaiting && isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HourglassEmpty sx={{ mr: 1, animation: 'spin 3s linear infinite' }} /> 
            Waiting for Connection...
          </Box>
        ) : (
          text
        )}
      </Button>
    );
  };

  // Add a function to run a connection pool demonstration
  const runPoolLimitDemo = async () => {
    if (demoRunning) return;
    
    // Check authentication first and display clear error message
    if (!isAuthenticated()) {
      setSnackbar({ 
        open: true, 
        message: 'Authentication required. Please log in as an administrator.', 
        severity: 'error' 
      });
      setTokenMissing(true);
      setAuthError(true);
      return;
    }
    
    setDemoRunning(true);
    setDemoProgress(0);
    setDemoWaitingObserved(false);
    addToLog('[info] Starting connection pool limit demonstration');
    
    try {
      // First, release all existing connections
      addToLog('[info] Releasing all existing connections');
      
      try {
        const releaseResult = await makeApiRequest(`${API_BASE}/release-all`, {
          method: 'POST'
        });
        
        if (!releaseResult.ok) {
          if (releaseResult.status === 401) {
            throw new Error('Authentication failed');
          } else {
            throw new Error(`Failed to release connections: HTTP ${releaseResult.status}`);
          }
        }
        
        addToLog('[info] Successfully released all existing connections');
      } catch (error) {
        addToLog(`[warn] Could not release all connections: ${error.message}. Continuing with demo.`);
        // Continue with the demo anyway
      }
      
      // Refresh data
      addToLog('[info] Checking current pool status');
      const statsData = await fetchStats();
      await fetchActiveConnections();
      
      if (!statsData && !isAuthenticated()) {
        throw new Error('Authentication failed');
      }
      
      setDemoProgress(10);
      
      // Define a longer hold time for demonstration
      const demoHoldTime = 30000; // Reduce to 30 seconds to make the demo faster
      
      // Step 1: Acquire 5 connections (pool max limit)
      addToLog('[info] Demo Step 1: Acquiring connections up to pool limit (5)');
      let acquiredCount = 0;
      let hasAuthError = false;
      
      for (let i = 0; i < 5; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for visualization
          
          const result = await makeApiRequest(`${API_BASE}/acquire`, {
            method: 'POST',
            body: JSON.stringify({ holdTimeMs: demoHoldTime })
          });
          
          if (!result.ok) {
            if (result.status === 401) {
              hasAuthError = true;
              throw new Error('Authentication failed');
            } else {
              throw new Error(`HTTP ${result.status}`);
            }
          }
          
          acquiredCount++;
          setDemoProgress(10 + ((acquiredCount) * 10));
          
          // Force a quick refresh to update UI
          const stats = await fetchStats();
          await fetchActiveConnections();
          
          // Check if we've lost authentication
          if (!stats && !isAuthenticated()) {
            hasAuthError = true;
            throw new Error('Authentication lost during acquisition');
          }
          
          addToLog(`[info] Successfully acquired connection ${i+1}/${5}`);
        } catch (error) {
          addToLog(`[error] Failed to acquire connection ${i+1}: ${error.message}`);
          if (hasAuthError) {
            throw new Error('Authentication failed during connection acquisition');
          }
          // Try to continue anyway
        }
      }
      
      if (acquiredCount === 0) {
        throw new Error('Could not acquire any connections. Demo cannot continue.');
      }
      
      addToLog(`[info] Successfully acquired ${acquiredCount} connections`);
      addToLog('[info] Demo Step 2: Pool limit reached, now attempting additional connection');
      setDemoProgress(60);
      
      // Set a faster refresh interval to capture waiting state
      setRefreshInterval(500);
      
      // Step 2: Attempt to acquire one more connection which should wait
      addToLog('[warn] The next connection will wait since the pool is full');
      
      // Make this non-blocking so we can continue updating the UI
      let waitPromiseError = null;
      let waitPromise = makeApiRequest(`${API_BASE}/acquire`, {
        method: 'POST',
        body: JSON.stringify({ holdTimeMs: demoHoldTime })
      }).catch(err => {
        waitPromiseError = err;
        addToLog(`[error] Error during waiting connection request: ${err.message}`);
      });
      
      // Monitor the pool for waiting threads
      let waitingDetected = false;
      let monitorAttempts = 0;
      const maxMonitorAttempts = 15; // Monitor for about 15 seconds
      
      const waitingCheck = setInterval(async () => {
        monitorAttempts++;
        
        try {
          const statsData = await fetchStats();
          const activeData = await fetchActiveConnections();
          
          // Check for authentication failures
          if (!statsData && !activeData && !isAuthenticated()) {
            clearInterval(waitingCheck);
            addToLog('[error] Authentication failed during waiting detection');
            return;
          }
          
          // Check if waiting state was detected
          if (statsData?.threads_waiting > 0) {
            if (!waitingDetected) {
              addToLog(`[success] Waiting state detected! Thread is waiting for a connection to become available`);
              setDemoWaitingObserved(true);
              waitingDetected = true;
              setDemoProgress(70);
            }
          }
          
          // If we've waited long enough without seeing waiting state
          if (monitorAttempts >= maxMonitorAttempts && !waitingDetected) {
            clearInterval(waitingCheck);
            addToLog('[warn] Exceeded maximum monitoring time without detecting waiting state');
          }
        } catch (error) {
          addToLog(`[error] Error during waiting detection: ${error.message}`);
        }
      }, 1000);
      
      // Wait for a maximum of 10 seconds to observe waiting state
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Clean up the interval
      clearInterval(waitingCheck);
      setRefreshInterval(1000);
      
      // Step 3: Release one connection to allow waiting connection to acquire
      setDemoProgress(80);
      addToLog('[info] Demo Step 3: Releasing one connection to allow waiting connection to proceed');
      
      try {
        // Find the first holding connection to release
        const activeConns = await fetchActiveConnections();
        const holdingConn = Array.isArray(activeConns) ? activeConns.find(conn => conn.status === 'holding') : null;
        
        if (holdingConn) {
          // Release the first connection
          const releaseResult = await makeApiRequest(`${API_BASE}/release/${holdingConn.id}`, {
            method: 'POST'
          });
          
          if (!releaseResult.ok) {
            throw new Error(`HTTP ${releaseResult.status}`);
          }
          
          addToLog(`[info] Released connection ${holdingConn.id.slice(0, 6)} to free up pool space`);
          await fetchStats();
          await fetchActiveConnections();
          setDemoProgress(90);
        } else {
          addToLog('[warn] No holding connections found to release. Waiting connection may timeout.');
        }
      } catch (error) {
        addToLog(`[error] Error releasing connection: ${error.message}`);
      }
      
      // Wait a bit more for the waiting connection to acquire
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchStats();
      await fetchActiveConnections();
      
      setDemoProgress(100);
      
      // Only show success if we actually observed waiting
      if (waitingDetected) {
        setSnackbar({ 
          open: true, 
          message: 'Connection pool limit demonstration completed successfully!', 
          severity: 'success' 
        });
        addToLog('[success] Connection pool limit demonstration completed with waiting observed');
      } else {
        if (waitPromiseError) {
          setSnackbar({
            open: true,
            message: 'Demo completed but waiting state not observed due to an error.',
            severity: 'warning'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Demo completed but waiting state not observed. Try running it again.',
            severity: 'info'
          });
        }
        addToLog('[info] Connection pool limit demonstration completed but waiting state was not observed');
      }
      
    } catch (error) {
      // Handle authentication errors specifically
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        setTokenMissing(true);
        setAuthError(true);
        addToLog('[error] Authentication failed during demo execution');
      }
      
      addToLog(`[error] Demo failed: ${error.message}`);
      setSnackbar({ 
        open: true, 
        message: `Demo failed: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setDemoRunning(false);
      setRefreshInterval(2000); // Reset to default
    }
  };

  return (
    <Box sx={{
      p: { xs: 2, md: 4 },
      background: bgGradient,
      minHeight: '100vh',
      color: 'white',
      '& .MuiTableCell-root': {
        color: 'rgba(255,255,255,0.85)'  // Ensure all table cells have light text by default
      },
      '& .MuiTypography-root': {
        color: 'rgba(255,255,255,0.9)'   // Ensure all typography has light text by default
      },
      '& .MuiTooltip-tooltip': {
        color: 'white',                  // Ensure tooltip text is white
        backgroundColor: 'rgba(0,0,0,0.85)'
      }
    }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} variant="filled" elevation={6}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <Avatar sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.9),
          width: 90,
          height: 90,
          mb: 2,
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          border: '3px solid rgba(255,255,255,0.1)'
        }}>
          <StorageIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#fff', 
            fontWeight: 800, 
            letterSpacing: 1, 
            mb: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
          }}
        >
          DB Connection Pooling
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255,255,255,0.85)', 
            mb: 3,
            textAlign: 'center',
            maxWidth: '800px',
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
          }}
        >
          Real-time visualization of your HikariCP connection pool in action
        </Typography>
        
        <Box sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10,
          display: { xs: 'none', md: 'block' }
        }}>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={refreshData} 
              color="primary"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <RefreshIcon sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {tokenMissing && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: 3
          }}
          variant="filled"
        >
          <Typography variant="subtitle1" fontWeight={600}>Authentication Required</Typography>
          <Typography variant="body2">
            You need to log in as an administrator to use the DB Connection Pooling Demo.
          </Typography>
        </Alert>
      )}

      {authError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: 3
          }}
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight={600}>Authentication Error</Typography>
          <Typography variant="body2">
            Your session may have expired. Please refresh the page and log in again to continue using the demo.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            elevation={8}
            sx={{
              background: 'rgba(13, 71, 161, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative'
            }}
          >
            {/* Status indicator for updating data */}
            {(isLoading || refreshing || forceRefresh) && (
              <LinearProgress 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: 3, 
                  zIndex: 10 
                }} 
              />
            )}
            
            <Box sx={{ 
              p: 0.5, 
              background: alpha(theme.palette.primary.main, 0.2),
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  px: 2, 
                  py: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontWeight: 700,
                  color: theme.palette.primary.light
                }}
              >
                <DataUsageIcon sx={{ mr: 1 }} /> Connection Pool Dashboard
              </Typography>
            </Box>
            
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'white' }}>
                      <SpeedIcon sx={{ mr: 1, color: theme.palette.primary.light }} /> 
                      Pool Metrics
                    </Typography>
                    
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: darkBg,
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.1)',
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {stats ? (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                              Active Connections
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="h3" fontWeight={700} sx={{ mr: 2 }}>
                                {stats.active}
                                <Typography component="span" variant="subtitle1" color="rgba(255,255,255,0.6)">
                                  /{stats.total}
                                </Typography>
                              </Typography>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={poolUsage}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: alpha(theme.palette.primary.light, 0.15),
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: poolUsage < 70 
                                        ? theme.palette.success.main 
                                        : poolUsage < 90 
                                          ? theme.palette.warning.main 
                                          : theme.palette.error.main,
                                      borderRadius: 4,
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 2, 
                                bgcolor: alpha(theme.palette.primary.dark, 0.4),
                                borderRadius: 2
                              }}>
                                <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                                  Idle
                                </Typography>
                                <Typography variant="h5" fontWeight={600}>
                                  {stats.idle}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6}>
                              <Paper sx={{ 
                                p: 2, 
                                bgcolor: alpha(theme.palette.warning.dark, 0.4),
                                borderRadius: 2,
                                // Add pulsing effect if there are waiting threads
                                ...(stats.threads_waiting > 0 && {
                                  animation: 'pulse-warn 1.5s infinite',
                                  '@keyframes pulse-warn': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 10px rgba(255, 152, 0, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0)' }
                                  }
                                })
                              }}>
                                <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                                  Waiting
                                </Typography>
                                <Typography 
                                  variant="h5" 
                                  fontWeight={600}
                                  // Make waiting count more noticeable when > 0
                                  sx={stats.threads_waiting > 0 ? {
                                    color: theme.palette.warning.light,
                                    fontWeight: 700,
                                    fontSize: '1.8rem'
                                  } : {}}
                                >
                                  {stats.threads_waiting}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {/* Hold time selector */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                              Connection Hold Time (ms)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {[5000, 10000, 20000, 30000, 60000].map((time) => (
                                <Button 
                                  key={time}
                                  size="small"
                                  variant={holdTime === time ? "contained" : "outlined"}
                                  color={holdTime === time ? "primary" : "inherit"}
                                  onClick={() => setHoldTime(time)}
                                  sx={{ 
                                    minWidth: 70,
                                    color: holdTime === time ? 'white' : 'rgba(255,255,255,0.7)',
                                    borderColor: 'rgba(255,255,255,0.2)'
                                  }}
                                >
                                  {time >= 60000 ? `${time/60000}m` : `${time/1000}s`}
                                </Button>
                              ))}
                            </Box>
                          </Box>
                          
                          {/* Run Demo section */}
                          <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                              Connection Pool Demo
                            </Typography>
                            <Button
                              variant="outlined"
                              color="info"
                              fullWidth
                              onClick={runPoolLimitDemo}
                              disabled={demoRunning || tokenMissing}
                              sx={{ 
                                py: 1.5,
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {demoRunning ? (
                                <>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={demoProgress} 
                                    sx={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: 4,
                                    }}
                                  />
                                  Running Demo ({demoProgress}%)...
                                </>
                              ) : (
                                'Run Pool Limit Demo'
                              )}
                            </Button>
                            {demoWaitingObserved && (
                              <Alert severity="success" sx={{ mt: 1, borderRadius: 2 }}>
                                <Typography variant="caption">
                                  Successfully demonstrated waiting! Connection had to wait for a slot in the pool.
                                </Typography>
                              </Alert>
                            )}
                          </Box>

                          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                          <LoadingButton
                            isLoading={isLoading}
                            disabled={tokenMissing || demoRunning}
                            onClick={acquireConnection}
                            text="Acquire New Connection"
                            waitingCount={stats?.threads_waiting}
                          />
                          
                          {/* Add debug status info */}
                          <Box sx={{ mt: 2, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Refresh: {refreshInterval}ms</span>
                              <span>Active: {poolActive}/{poolTotal}</span>
                            </Box>
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <CircularProgress size={40} />
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'white' }}>
                    <ViewModuleIcon sx={{ mr: 1, color: theme.palette.primary.light }} /> 
                    Connection Visualization
                  </Typography>
                  
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: darkBg,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                    mb: 3
                  }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                      {connectionSlots.map((slot) => (
                        <Fade in={true} key={slot.id} timeout={300 + slot.id * 100}>
                          <Box sx={{ 
                            width: 70, 
                            height: 70,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: slot.status === 'active' 
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.grey[600], 0.2),
                            border: `2px solid ${slot.status === 'active' 
                              ? theme.palette.success.main 
                              : alpha(theme.palette.grey[600], 0.3)}`,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {slot.status === 'active' && (
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                background: `linear-gradient(180deg, 
                                  ${alpha(theme.palette.success.main, 0)} 0%, 
                                  ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 0.5 },
                                  '50%': { opacity: 1 },
                                  '100%': { opacity: 0.5 }
                                }
                              }} />
                            )}
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={600}
                              color={slot.status === 'active' ? 'success.light' : 'grey.400'}
                            >
                              {slot.status === 'active' ? 'ACTIVE' : 'IDLE'}
                            </Typography>
                          </Box>
                        </Fade>
                      ))}
                    </Box>
                  </Paper>
                  
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'white' }}>
                    <BarChartIcon sx={{ mr: 1, color: theme.palette.primary.light }} /> 
                    Pool History
                  </Typography>
                  
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0,0,0,0.6)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: '180px', // Increased height
                    position: 'relative'
                  }}>
                    {poolHistory.length > 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        height: '100%', 
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        px: 1,
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                          backgroundSize: '100% 20%',
                          backgroundPosition: 'left bottom',
                          zIndex: 1
                        }
                      }}>
                        {poolHistory.map((point, index) => (
                          <Tooltip 
                            key={index} 
                            title={
                              <React.Fragment>
                                <Typography variant="body2" sx={{ color: 'white' }}>Time: {point.time}</Typography>
                                <Typography variant="body2" sx={{ color: 'white' }}>Active: {point.active}</Typography>
                                <Typography variant="body2" sx={{ color: 'white' }}>Waiting: {point.waiting}</Typography>
                              </React.Fragment>
                            }
                            arrow
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: 'rgba(0,0,0,0.85)',
                                  '& .MuiTooltip-arrow': {
                                    color: 'rgba(0,0,0,0.85)'
                                  }
                                }
                              }
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              width: `${90/Math.min(poolHistory.length, MAX_HISTORY_POINTS)}%`, // Ensure bars are wide enough
                              minWidth: 12, // Minimum width increased
                              maxWidth: 30, // Maximum width added
                              position: 'relative',
                              zIndex: 2
                            }}>
                              <Box sx={{
                                width: '100%',
                                minWidth: 8,
                                bgcolor: '#FFD54F', // Brighter yellow for waiting
                                height: `${(point.waiting / Math.max(poolTotal, 1)) * 100}%`,
                                maxHeight: '100%',
                                minHeight: point.waiting > 0 ? 8 : 0,
                                transition: 'height 0.3s ease',
                                borderTopLeftRadius: 2,
                                borderTopRightRadius: 2,
                                mb: 0.5,
                                boxShadow: '0 0 10px rgba(255, 213, 79, 0.6)' // Brighter glow
                              }} />
                              <Box sx={{
                                width: '100%',
                                minWidth: 8,
                                bgcolor: '#64B5F6', // Brighter blue for active
                                height: `${(point.active / Math.max(poolTotal, 1)) * 100}%`,
                                maxHeight: '100%',
                                transition: 'height 0.3s ease',
                                borderTopLeftRadius: 2,
                                borderTopRightRadius: 2,
                                boxShadow: '0 0 10px rgba(100, 181, 246, 0.6)' // Brighter glow
                              }} />
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">Collecting data...</Typography>
                      </Box>
                    )}
                    
                    {/* Pool capacity lines */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      pointerEvents: 'none',
                      zIndex: 3
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        right: 0, 
                        top: `${100 - (5 / 10) * 100}%`, // Pool max line at 50% (5/10)
                        borderTop: '1px dashed rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        p: 0.5
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          bgcolor: 'rgba(0,0,0,0.5)', 
                          px: 0.5,
                          borderRadius: 0.5,
                          fontSize: '0.7rem'
                        }}>
                          Pool Max (5)
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Legend for the chart */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      display: 'flex', 
                      gap: 2,
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: 1,
                      p: 0.5,
                      px: 1,
                      zIndex: 10
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          bgcolor: '#64B5F6', // Match the chart color
                          borderRadius: 0.5,
                          mr: 0.5,
                          boxShadow: '0 0 4px rgba(100, 181, 246, 0.6)'
                        }}/>
                        <Typography variant="caption" sx={{ color: 'white' }}>Active</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          bgcolor: '#FFD54F', // Match the chart color
                          borderRadius: 0.5,
                          mr: 0.5,
                          boxShadow: '0 0 4px rgba(255, 213, 79, 0.6)'
                        }}/>
                        <Typography variant="caption" sx={{ color: 'white' }}>Waiting</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{
            background: cardBg,
            color: '#fff',
            borderRadius: 4,
            boxShadow: 4,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 0.5, 
              background: alpha(theme.palette.primary.main, 0.2),
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  px: 2, 
                  py: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontWeight: 700,
                  color: theme.palette.primary.light
                }}
              >
                <StorageIcon sx={{ mr: 1 }} /> Active Connection Details
                {stats?.threads_waiting > 0 && (
                  <Chip 
                    label={`${stats.threads_waiting} Waiting`} 
                    color="warning" 
                    size="small" 
                    sx={{ ml: 2, animation: 'pulse 1.5s infinite' }}
                  />
                )}
              </Typography>
            </Box>

            <CardContent sx={{ p: 0 }}>
              <TableContainer 
                sx={{ 
                  maxHeight: 400, 
                  bgcolor: 'transparent',
                  '& .MuiTableCell-root': {
                    color: 'rgba(255,255,255,0.85)',
                    borderBottomColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>ID</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Start</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Acquired</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Released</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Hold(ms)</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Wait(ms)</TableCell>
                      <TableCell sx={{ 
                        bgcolor: alpha(theme.palette.primary.dark, 0.8), 
                        color: 'white',
                        fontWeight: 600
                      }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(activeConnections) && activeConnections.length > 0 ? (
                      activeConnections.map((conn) => (
                        <TableRow
                          key={conn.id}
                          sx={{
                            background: alpha(
                              conn.status === 'waiting'
                                ? theme.palette.warning.main
                                : conn.status === 'holding'
                                  ? theme.palette.success.main
                                  : conn.status.startsWith('error')
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                              conn.status === 'released' ? 0.0 : conn.status === 'waiting' ? 0.4 : 0.1 // Increase opacity for waiting status
                            ),
                            '&:hover': { 
                              background: alpha(
                                conn.status === 'waiting'
                                  ? theme.palette.warning.main
                                  : conn.status === 'holding'
                                    ? theme.palette.success.main
                                    : conn.status.startsWith('error')
                                      ? theme.palette.error.main
                                      : theme.palette.primary.main,
                                conn.status === 'released' ? 0.05 : conn.status === 'waiting' ? 0.5 : 0.2 // Increase hover opacity for waiting
                              )
                            },
                            transition: 'background-color 0.2s',
                            ...(conn.status === 'waiting' && {
                              animation: 'pulse-bg 1.5s infinite',
                              '@keyframes pulse-bg': {
                                '0%': { opacity: 0.7 },
                                '50%': { opacity: 1 },
                                '100%': { opacity: 0.7 }
                              }
                            })
                          }}
                        >
                          <TableCell>
                            <Avatar 
                              sx={{ 
                                width: 36, 
                                height: 36, 
                                fontSize: 14,
                                bgcolor: 
                                  conn.status === 'waiting'
                                    ? alpha(theme.palette.warning.main, 0.9)
                                    : conn.status === 'holding'
                                      ? alpha(theme.palette.success.main, 0.8)
                                      : conn.status.startsWith('error')
                                        ? alpha(theme.palette.error.main, 0.8)
                                        : alpha(theme.palette.primary.main, 0.8),
                                color: conn.status === 'waiting' ? 'black' : 'white',
                                fontWeight: 'bold',
                                ...(conn.status === 'waiting' && {
                                  border: '2px solid #f57c00',
                                  boxShadow: '0 0 10px #f57c00'
                                })
                              }}
                            >
                              {conn.id.slice(0, 2).toUpperCase()}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Chip
                                label={conn.status}
                                color={statusColor(conn.status)}
                                icon={statusIcon(conn.status)}
                                size="small"
                                variant={conn.status === 'released' ? 'outlined' : 'filled'}
                                sx={{ 
                                  fontWeight: 600,
                                  '& .MuiChip-label': { px: 1.5 },
                                  ...(conn.status === 'waiting' && {
                                    animation: 'pulse 1.2s infinite',
                                    bgcolor: '#ffb74d', // Brighter orange for better visibility
                                    color: 'rgba(0,0,0,0.9)', // Better contrast
                                    fontWeight: 'bold',
                                    '@keyframes pulse': {
                                      '0%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.8)' },
                                      '70%': { boxShadow: '0 0 0 10px rgba(255, 152, 0, 0)' },
                                      '100%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0)' }
                                    }
                                  })
                                }}
                              />
                              {conn.status === 'waiting' && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'black', 
                                    fontWeight: 'bold',
                                    mt: 0.5,
                                    fontSize: '0.7rem',
                                    bgcolor: 'rgba(255, 152, 0, 0.3)',
                                    p: 0.5,
                                    borderRadius: 1,
                                    textAlign: 'center'
                                  }}
                                >
                                  Waiting for connection...
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)' }}>{formatTime(conn.startTime)}</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)' }}>{formatTime(conn.acquiredTime)}</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)' }}>{formatTime(conn.releasedTime)}</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{conn.holdTimeMs}</TableCell>
                          <TableCell sx={{ 
                            color: conn.waitTimeMs > 500 ? '#ffcc80' : 'rgba(255,255,255,0.85)', 
                            fontWeight: conn.waitTimeMs > 500 ? 700 : 500 
                          }}>
                            {conn.waitTimeMs || 0}
                            {conn.waitTimeMs > 500 && (
                              <Tooltip title="This connection had to wait for pool availability" arrow>
                                <HourglassEmpty 
                                  fontSize="small" 
                                  sx={{ 
                                    ml: 1, 
                                    color: theme.palette.warning.light, 
                                    verticalAlign: 'middle'
                                  }} 
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            {conn.status !== 'released' && (
                              <Tooltip title="Release this connection" arrow>
                                <Button 
                                  size="small" 
                                  onClick={() => releaseConnection(conn.id)} 
                                  variant="contained" 
                                  color="secondary"
                                  sx={{ 
                                    fontWeight: 600,
                                    boxShadow: 2
                                  }}
                                >
                                  Release
                                </Button>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <StorageIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', mb: 1 }} />
                            <Typography variant="body1" color="rgba(255,255,255,0.5)">
                              No active connections
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.3)">
                              Click "Acquire New Connection" to create one
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{
        background: cardBg,
        color: '#fff',
        borderRadius: 4,
        boxShadow: 2,
        my: 3,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 0.5, 
          background: alpha(theme.palette.grey[800], 0.5),
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer' 
        }} 
        onClick={() => setLogOpen((open) => !open)}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              flex: 1, 
              px: 2, 
              py: 1, 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <InfoIcon sx={{ mr: 1, color: theme.palette.info.light }} /> Activity Log
          </Typography>
          <IconButton size="small" sx={{ color: '#fff', mr: 1 }}>
            {logOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={logOpen}>
          <CardContent sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
            {log.length === 0 ? (
              <Typography color="rgba(255,255,255,0.5)">No log entries yet.</Typography>
            ) : (
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7 }}>
                {log.map((entry, i) => {
                  let color = 'rgba(255,255,255,0.8)';
                  let prefix = '';
                  
                  if (entry.message.startsWith('[error]')) {
                    color = theme.palette.error.light;
                    prefix = '❌ ';
                  } else if (entry.message.startsWith('[success]')) {
                    color = theme.palette.success.light;
                    prefix = '✅ ';
                  } else if (entry.message.startsWith('[info]')) {
                    color = theme.palette.info.light;
                    prefix = 'ℹ️ ';
                  } else if (entry.message.startsWith('[debug]')) {
                    color = theme.palette.warning.light;
                    prefix = '🔍 ';
                  }
                  
                  return (
                    <Box key={i} sx={{ 
                      color, 
                      bgcolor: alpha(theme.palette.common.black, 0.3),
                      p: 0.75,
                      borderRadius: 1,
                      mb: 0.5,
                      '&:last-child': { mb: 0 }
                    }}>
                      {prefix}{entry.message}
                    </Box>
                  );
                })}
                <div ref={logEndRef} />
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>
      
      <Box sx={{ 
        textAlign: 'center', 
        p: 2, 
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.8rem'
      }}>
        <Typography variant="caption">
          Connection Pooling Demonstration © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}