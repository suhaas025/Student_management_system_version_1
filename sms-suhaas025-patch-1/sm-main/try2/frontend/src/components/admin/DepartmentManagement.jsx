import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import axios from 'axios';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/departments/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setAnalytics(null);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchAnalytics();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post('/api/departments', form);
      setForm({ name: '', code: '', description: '' });
      fetchDepartments();
      fetchAnalytics();
    } catch (err) {
      setError('Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>Department Management</Typography>
      <Typography variant="body1" mb={4}>
        Create new departments, view all departments, and see analytics.
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>Create New Department</Typography>
        <form onSubmit={handleCreate}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Code" name="code" value={form.code} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={creating}>
                {creating ? 'Creating...' : 'Create Department'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>All Departments</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell>{dept.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Card sx={{ p: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <BarChartIcon sx={{ fontSize: 32, color: '#3f8cff', mr: 2 }} />
            <Typography variant="h6">Department Analytics</Typography>
          </Box>
          {analytics ? (
            <>
              <Divider sx={{ mb: 2 }} />
              {analytics.studentCountPerDepartment && Object.keys(analytics.studentCountPerDepartment).length > 0 ? (
                <>
                  <Typography variant="subtitle1" mb={1}>Student Count Per Department:</Typography>
                  <ul>
                    {Object.entries(analytics.studentCountPerDepartment).map(([dept, count]) => (
                      <li key={dept}><b>{dept}:</b> {count} students</li>
                    ))}
                  </ul>
                </>
              ) : (
                <Typography>No analytics data available.</Typography>
              )}
            </>
          ) : (
            <Typography>Loading analytics...</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DepartmentManagement; 