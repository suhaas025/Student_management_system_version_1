import React from 'react';
import Dashboard from './components/dashboard/Dashboard';
import DashboardAdminConfig from './components/dashboard/DashboardAdminConfig';
import { ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material';
import { useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: { mode: 'light' },
});

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        {isAuthenticated && user.roles.includes('ADMIN')
          ? <DashboardAdminConfig />
          : <Dashboard />}
      </Container>
    </ThemeProvider>
  );
} 