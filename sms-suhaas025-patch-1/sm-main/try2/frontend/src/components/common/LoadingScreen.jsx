import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';

const LoadingContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  zIndex: 9999,
  '& .icon-container': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
    position: 'relative',
  },
  '& .school-icon': {
    fontSize: 80,
    color: '#3f8cff',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  '& .loading-text': {
    color: '#fff',
    fontWeight: 500,
    marginTop: theme.spacing(2),
    opacity: 0.7,
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.95)',
      opacity: 0.7,
    },
    '50%': {
      transform: 'scale(1.05)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(0.95)',
      opacity: 0.7,
    }
  },
}));

const StyledProgress = styled(CircularProgress)(({ theme }) => ({
  position: 'absolute',
  color: 'rgba(63, 140, 255, 0.3)',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
  },
}));

const LoadingScreen = ({ text = "Loading..." }) => {
  return (
    <Fade in={true} timeout={300}>
      <LoadingContainer>
        <Box className="icon-container">
          <StyledProgress size={120} thickness={2} />
          <SchoolIcon className="school-icon" />
        </Box>
        <Typography variant="body1" className="loading-text">
          {text}
        </Typography>
      </LoadingContainer>
    </Fade>
  );
};

export default LoadingScreen; 