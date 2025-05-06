import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner() {
  return (
    <Box mt={4} display="flex" justifyContent="center">
      <CircularProgress />
    </Box>
  );
} 