import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import mfaService from '../../services/mfa.service';
import authService from '../../services/auth.service';
import { QRCodeSVG } from 'qrcode.react';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { GlobalStyles } from '@mui/material';

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
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: 12,
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  background: 'linear-gradient(45deg, #3f8cff 30%, #00c6ff 90%)',
  boxShadow: '0 3px 5px 2px rgba(63, 140, 255, .3)',
  color: '#fff',
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

const globalStyles = (
  <GlobalStyles
    styles={{
      body: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' },
    }}
  />
);

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request MFA or MFA Setup
  const handleRequestMfa = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMfaSetupRequired(false);
    setMfaSetupData(null);
    try {
      const res = await authService.requestForgotPasswordMfa(username);
      // If mfaSetupRequired is true, show MFA setup UI
      if (res.data && res.data.mfaSetupRequired) {
        setMfaSetupRequired(true);
        // Call backend to get setup data
        const setupData = await authService.setupForgotPasswordMfa(username);
        setMfaSetupData(setupData);
        setStep(10); // Custom step for MFA setup
      } else if (res.data && res.data.token) {
        // (Should not happen with new backend logic, but fallback)
        setResetToken(res.data.token);
        setStep(3);
      } else {
        // Proceed to MFA code entry as before
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to request MFA.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify MFA
  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.verifyForgotPasswordMfa(username, code);
      setResetToken(res.token);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify MFA code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 10: Handle MFA Setup Verification
  const handleVerifyMfaSetup = async (e) => {
    e.preventDefault();
    setError('');
    setMfaSetupLoading(true);
    try {
      const res = await authService.verifyForgotPasswordMfaSetup(username, mfaSetupCode);
      setResetToken(res.token);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify MFA setup code.');
    } finally {
      setMfaSetupLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      await authService.resetForgotPassword(username, resetToken, newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { message: 'Password reset successful. Please log in.' } }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      {globalStyles}
      <StyledAppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ color: '#3f8cff', fontSize: 32, mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Learning Management System
          </Typography>
        </Toolbar>
      </StyledAppBar>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <StyledPaper elevation={3}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#fff' }}>Forgot Password</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {step === 1 && (
            <form onSubmit={handleRequestMfa}>
              <TextField
                label="Username"
                fullWidth
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              <StyledButton type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Request MFA Code'}
              </StyledButton>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyMfa}>
              <Typography sx={{ mb: 2, color: '#fff' }}>Enter the 6-digit code from your Google Authenticator app.</Typography>
              <TextField
                label="MFA Code"
                fullWidth
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              />
              <StyledButton type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Verify Code'}
              </StyledButton>
            </form>
          )}
          {step === 10 && mfaSetupData && (
            <Box>
              <Typography sx={{ mb: 2, color: '#fff' }}>Set up Two-Factor Authentication (MFA) to continue.</Typography>
              <Typography sx={{ mb: 1, color: '#fff' }}>Scan this QR code with your authenticator app:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <QRCodeSVG value={mfaSetupData.qrCodeUrl} size={180} />
              </Box>
              <Typography sx={{ mb: 1, color: '#fff' }}>Or enter this code manually:</Typography>
              <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 1, fontFamily: 'monospace', textAlign: 'center', color: '#fff' }}>
                {mfaSetupData.secretKey}
              </Box>
              <Typography sx={{ mb: 1, color: '#fff' }}>Enter the 6-digit code from your app to verify setup:</Typography>
              <form onSubmit={handleVerifyMfaSetup}>
                <TextField
                  label="MFA Code"
                  fullWidth
                  required
                  value={mfaSetupCode}
                  onChange={e => setMfaSetupCode(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                />
                <StyledButton type="submit" variant="contained" fullWidth disabled={mfaSetupLoading}>
                  {mfaSetupLoading ? <CircularProgress size={24} /> : 'Verify & Continue'}
                </StyledButton>
              </form>
              {mfaSetupData.backupCodes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#fff' }}>Backup Codes (save these):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Array.from(mfaSetupData.backupCodes).map((code, idx) => (
                      <Box key={idx} sx={{ bgcolor: 'rgba(63,140,255,0.15)', px: 1.5, py: 0.5, borderRadius: 1, fontFamily: 'monospace', fontSize: 14, color: '#fff' }}>
                        {code}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <StyledButton type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </StyledButton>
            </form>
          )}
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default ForgotPassword; 