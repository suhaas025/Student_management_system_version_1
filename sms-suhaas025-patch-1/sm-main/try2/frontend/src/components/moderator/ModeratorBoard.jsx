import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Grid,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  styled,
  alpha
} from '@mui/material';
import { 
  Grade as GradeIcon, 
  School as SchoolIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Assessment as AssessmentIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import courseService from '../../services/course.service';
import authService from '../../services/auth.service';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: alpha('#121212', 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'relative',
  zIndex: 3
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(4),
  minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
  position: 'relative',
  zIndex: 1
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha('#121212', 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  color: 'white',
  boxShadow: `0 8px 32px 0 ${alpha('#000', 0.37)}`
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: 'transparent',
  borderRadius: 12,
  overflow: 'hidden',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: '0 8px'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: alpha('#1e1e1e', 0.6),
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s, background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha('#2d2d2d', 0.8),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`
  },
  '& > .MuiTableCell-root': {
    borderBottom: 'none',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '16px',
    '&:first-of-type': {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8
    },
    '&:last-of-type': {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8
    }
  }
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableRow-root': {
    backgroundColor: 'transparent',
    '& > .MuiTableCell-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: 600,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      borderBottom: 'none',
      padding: '10px 16px'
    }
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 'none',
  color: 'rgba(255, 255, 255, 0.9)'
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  '& .MuiToolbar-root': {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& .MuiTablePagination-select': {
    color: 'white'
  },
  '& .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: alpha('#2d2d2d', 0.6),
    borderRadius: 8,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  }
}));

const StyledChip = styled(Chip)(({ theme, color }) => {
  // Define default colors for various status values
  const colorMap = {
    primary: '#3f8cff',
    secondary: '#9c27b0',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#03a9f4',
    default: '#9e9e9e'
  };
  
  // Get the color from the map, or use primary if not found
  const chipColor = colorMap[color] || colorMap.primary;
  
  return {
    backgroundColor: alpha(chipColor, 0.2),
    color: chipColor,
    fontWeight: 500,
    borderRadius: 12
  };
});

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  padding: '6px 16px',
  '&.MuiButton-outlined': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.5)'
    }
  }
}));

const ModeratorBoard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'courseCode',
    direction: 'asc'
  });

  useEffect(() => {
    loadCurrentUser();
    loadCourses();
  }, []);

  const loadCurrentUser = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  // Filter and sort courses when search query or sort configuration changes
  useEffect(() => {
    let filtered = [...courses];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course => 
          (course.courseCode && course.courseCode.toLowerCase().includes(query)) ||
          (course.courseName && course.courseName.toLowerCase().includes(query)) ||
          (course.description && course.description.toLowerCase().includes(query)) ||
          (course.semester && course.semester.toLowerCase().includes(query)) ||
          (course.academicYear && course.academicYear.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle null or undefined values
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Handle numeric values
        if (sortConfig.key === 'credits') {
          return sortConfig.direction === 'asc' 
            ? Number(aValue) - Number(bValue) 
            : Number(bValue) - Number(aValue);
        }
        
        // Handle string values
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        return sortConfig.direction === 'asc'
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, sortConfig]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getModeratorCourses();
      console.log('Courses data:', response.data);
      setCourses(response.data);
      setFilteredCourses(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load courses. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page on new search
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    handleCloseMenu();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/moderator');
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  if (loading && courses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)' }}>
        <CircularProgress sx={{ color: '#3f8cff' }} />
      </Box>
    );
  }

  // Pagination calculations
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredCourses.length - page * rowsPerPage);
  const paginatedCourses = filteredCourses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Custom header */}
      <StyledAppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={handleBackToDashboard} sx={{ mr: 1 }}>
              <DashboardIcon />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'white' }}>
              Course Management
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleOpenMenu} size="small">
            <Avatar sx={{ bgcolor: '#3f8cff', width: 40, height: 40 }}>
              {currentUser?.username?.charAt(0)?.toUpperCase() || 'M'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            elevation={3}
            PaperProps={{
              sx: {
                backgroundColor: alpha('#1e1e1e', 0.9),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                minWidth: 200,
                color: 'white'
              }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {currentUser?.username}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {currentUser?.email}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem onClick={handleViewProfile} sx={{ gap: 1.5 }}>
              <PersonIcon fontSize="small" /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5 }}>
              <LogoutIcon fontSize="small" /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      
      <StyledContainer>
        <StyledPaper sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SchoolIcon sx={{ color: '#3f8cff', fontSize: 36, mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Assigned Courses
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          View the courses assigned to you. You can view grades and course details.
        </Typography>
      </Box>
          </Box>
        </StyledPaper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {courses.length === 0 ? (
          <StyledPaper sx={{ p: 4, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              No Courses Assigned
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            You don't have any courses assigned to you at the moment.
          </Typography>
          </StyledPaper>
      ) : (
          <StyledPaper>
            <Box sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ViewListIcon sx={{ color: '#3f8cff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>
                  Assigned Courses ({filteredCourses.length})
                </Typography>
                  </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StyledTextField
                  fullWidth
                  placeholder="Search courses..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                    <StyledButton
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={loadCourses}
                    >
                      Refresh
                    </StyledButton>
                  </Box>
                </Grid>
            </Grid>
          </Box>
          
            <StyledTableContainer>
            <Table>
                <StyledTableHead>
                <TableRow>
                    <StyledTableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'courseCode'}
                      direction={sortConfig.key === 'courseCode' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('courseCode')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7) !important' }}
                    >
                      Code
                      {sortConfig.key === 'courseCode' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {sortConfig.direction === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </TableSortLabel>
                    </StyledTableCell>
                    <StyledTableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'courseName'}
                      direction={sortConfig.key === 'courseName' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('courseName')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7) !important' }}
                    >
                      Name
                      {sortConfig.key === 'courseName' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {sortConfig.direction === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </TableSortLabel>
                    </StyledTableCell>
                    <StyledTableCell>Description</StyledTableCell>
                    <StyledTableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'credits'}
                      direction={sortConfig.key === 'credits' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('credits')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7) !important' }}
                    >
                      Credits
                      {sortConfig.key === 'credits' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {sortConfig.direction === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </TableSortLabel>
                    </StyledTableCell>
                    <StyledTableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'semester'}
                      direction={sortConfig.key === 'semester' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('semester')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7) !important' }}
                    >
                      Semester
                      {sortConfig.key === 'semester' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {sortConfig.direction === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </TableSortLabel>
                    </StyledTableCell>
                    <StyledTableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'academicYear'}
                      direction={sortConfig.key === 'academicYear' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('academicYear')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7) !important' }}
                    >
                      Academic Year
                      {sortConfig.key === 'academicYear' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {sortConfig.direction === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </TableSortLabel>
                    </StyledTableCell>
                  </TableRow>
                </StyledTableHead>
                <TableBody>
                  {paginatedCourses.map((course) => (
                    <StyledTableRow key={course.id || course.courseCode}>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon 
                            fontSize="small" 
                            sx={{ mr: 1, color: '#3f8cff' }} 
                          />
                          <Typography
                            sx={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 600,
                              color: '#3f8cff'
                            }}
                          >
                            {course.courseCode}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontWeight: 500 }}>
                          {course.courseName}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell
                        sx={{ 
                          maxWidth: 180, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
                      >
                        {course.description || "No description available"}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip 
                          label={course.credits || "N/A"} 
                          size="small" 
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white'
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {course.semester || "Not specified"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {course.academicYear || "Not specified"}
                        </Typography>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                {emptyRows > 0 && (
                    <TableRow style={{ height: 69 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </StyledTableContainer>
          
            <StyledTablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCourses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
          </StyledPaper>
      )}
      </StyledContainer>
    </Box>
  );
};

export default ModeratorBoard; 