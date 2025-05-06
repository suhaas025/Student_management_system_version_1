import React from 'react';
import { Alert, Box } from '@mui/material';

export default function ErrorAlert({ message }) {
  return (
    <Box mt={4}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
} 