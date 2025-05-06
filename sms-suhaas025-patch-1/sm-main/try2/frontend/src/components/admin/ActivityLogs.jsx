import React, { useEffect, useState } from 'react';
import userService from '../../services/user.service';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    userService.getAllActivityLogs()
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch activity logs');
        setLoading(false);
      });
  }, []);

  // Extract unique actions for filter dropdown
  const actions = Array.from(new Set(logs.map(log => log.action)));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.username?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter ? log.action === actionFilter : true;
    return matchesSearch && matchesAction;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Activity Logs</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by user or details"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={actionFilter}
            label="Action"
            onChange={e => setActionFilter(e.target.value)}
          >
            <MenuItem value="">All Actions</MenuItem>
            {actions.map(action => (
              <MenuItem key={action} value={action}>{action.replace(/_/g, ' ').toLowerCase()}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>{log.action.replace(/_/g, ' ').toLowerCase()}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.timestamp?.replace('T', ' ').slice(0, 19)}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No logs found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ActivityLogs; 