console.log("Loading OLD AdminBoard component from /components/AdminBoard.jsx");

import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Tooltip,
    useTheme,
    TablePagination,
    Select,
    FormControl,
    InputLabel,
    IconButton,
    Stack,
    Card,
    CardContent,
    Avatar,
    LinearProgress,
    Chip,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Checkbox,
    InputAdornment
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Styled components for dark theme
const StyledPaper = styled(Paper)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    color: '#fff',
}));

// Add a styled header component for admin portal navigation
const AdminHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(3),
}));

const AdminNavigation = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    '& .active-tab': {
        backgroundColor: '#3f8cff',
        color: '#fff',
        '&:hover': {
            backgroundColor: 'rgba(63, 140, 255, 0.8)',
        },
    }
}));

const AdminNavButton = styled(Button)(({ theme }) => ({
    borderRadius: 8,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(26, 32, 39, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '&:hover': {
        backgroundColor: 'rgba(63, 140, 255, 0.2)',
        borderColor: '#3f8cff',
    },
    '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1),
    },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    background: 'rgba(26, 32, 39, 0.95)',
    '& .MuiTableCell-root': {
        color: '#fff',
        fontWeight: 600,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    color: '#fff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    background: '#3f8cff',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 16px',
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': {
        background: alpha('#3f8cff', 0.8),
    }
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        background: 'rgba(26, 32, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        color: '#fff',
    },
    '& .MuiInputBase-root': {
        color: '#fff',
        '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px rgb(26, 32, 39) inset !important',
            WebkitTextFillColor: '#fff !important',
            caretColor: '#fff !important',
        },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#3f8cff',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#3f8cff',
    },
    '& .MuiSelect-icon': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiTextField-root': {
        '& input': {
            color: '#fff',
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgb(26, 32, 39) inset !important',
                WebkitTextFillColor: '#fff !important',
                caretColor: '#fff !important',
            },
        },
        '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
                borderColor: '#3f8cff',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#3f8cff',
            },
        },
    },
    '& .MuiSelect-select': {
        backgroundColor: 'rgb(26, 32, 39) !important',
    },
    '& .MuiMenu-paper': {
        backgroundColor: 'rgba(38, 46, 56, 0.95)',
    },
    '& .MuiMenuItem-root': {
        color: '#fff',
    },
    // Additional styles to fix drop-downs
    '& .MuiSelect-outlined': {
        backgroundColor: 'rgb(26, 32, 39) !important',
    },
    '& .MuiList-root': {
        backgroundColor: 'rgb(38, 46, 56) !important',
    },
    '& .MuiPaper-root': {
        backgroundColor: 'rgb(38, 46, 56) !important',
    },
    '& .MuiPopover-root .MuiPaper-root': {
        backgroundColor: 'rgb(38, 46, 56) !important',
        color: '#fff',
    },
}));

const SortableHeader = styled('th')(({ theme }) => ({
    padding: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
}));

const HeaderContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: '#fff',
    '& .sort-icon': {
        opacity: 0.5,
        transition: 'opacity 0.2s ease',
    },
    '&:hover .sort-icon': {
        opacity: 1,
    }
}));

const PaginationButton = styled(IconButton)(({ theme }) => ({
    margin: theme.spacing(0, 0.5),
    color: '#3f8cff',
    '&.Mui-disabled': {
        color: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover': {
        backgroundColor: 'rgba(63, 140, 255, 0.1)',
    },
    transition: 'all 0.2s ease-in-out',
    borderRadius: '8px',
    padding: theme.spacing(1),
    '&:first-of-type': {
        marginLeft: 0,
    },
    '&:last-of-type': {
        marginRight: 0,
    }
}));

const PageNumberButton = styled(Button)(({ theme, active }) => ({
    minWidth: '36px',
    height: '36px',
    padding: '0 12px',
    margin: theme.spacing(0, 0.5),
    backgroundColor: active ? '#3f8cff' : 'transparent',
    color: active ? '#fff' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: '8px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        backgroundColor: active 
            ? 'rgba(63, 140, 255, 0.8)'
            : 'rgba(63, 140, 255, 0.1)',
    },
    '&:first-of-type': {
        marginLeft: 0,
    },
    '&:last-of-type': {
        marginRight: 0,
    }
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: 'rgba(26, 32, 39, 0.4)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const RowsPerPageSelect = styled(FormControl)(({ theme }) => ({
    minWidth: 120,
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        }
    },
    '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
    }
}));

const AdminBoard = () => {
    console.log("Rendering OLD AdminBoard component");
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        roles: ['ROLE_STUDENT'],
        password: ''
    });
    const [currentUserId, setCurrentUserId] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [tableLoading, setTableLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [activeSection, setActiveSection] = useState('users');
    const theme = useTheme();
    const [roleOptions, setRoleOptions] = useState([]);
    const [moderatorTypeOptions, setModeratorTypeOptions] = useState([]);
    const [dropdownsLoading, setDropdownsLoading] = useState(true);
    const [dropdownsError, setDropdownsError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sortField, setSortField] = useState('id');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterUsername, setFilterUsername] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [departmentInput, setDepartmentInput] = useState('');
    const [roleInput, setRoleInput] = useState('');
    const [departments, setDepartments] = useState([]);
    const [departmentOptionsLoading, setDepartmentOptionsLoading] = useState(true);
    const [departmentOptionsError, setDepartmentOptionsError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in and has admin role
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.roles.includes('ROLE_ADMIN')) {
            setError('You do not have permission to access this page.');
            setLoading(false);
            return;
        }
        setCurrentUserId(currentUser.id);
        fetchUsers();
    }, []);

    useEffect(() => {
        setDropdownsLoading(true);
        Promise.all([
            userService.getAllRoles(),
            userService.getAllModeratorTypes()
        ])
        .then(([roles, moderatorTypes]) => {
            // Ensure roleOptions is always an array
            const rolesArray = Array.isArray(roles) ? roles : 
                              (roles && Array.isArray(roles.data) ? roles.data : 
                               ['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER', 'ROLE_STUDENT']);
            setRoleOptions(rolesArray);
            
            // Ensure moderatorTypeOptions is always an array
            const moderatorTypesArray = Array.isArray(moderatorTypes) ? moderatorTypes : [];
            setModeratorTypeOptions(moderatorTypesArray);
            
            setDropdownsLoading(false);
        })
        .catch((err) => {
            console.error('Error loading dropdown options:', err);
            // Set default values in case of error
            setRoleOptions(['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER', 'ROLE_STUDENT']);
            setModeratorTypeOptions([]);
            setDropdownsError('Failed to load dropdown options');
            setDropdownsLoading(false);
        });
    }, []);

    useEffect(() => {
        // Fetch departments from backend
        setDepartmentOptionsLoading(true);
        const currentUser = authService.getCurrentUser && authService.getCurrentUser();
        const token = currentUser && currentUser.token;
        console.log('Current user for departments:', currentUser);
        console.log('Token for departments:', token);
        if (!token) {
            setDepartmentOptionsError('Not authenticated: Please log in again.');
            setDepartmentOptionsLoading(false);
            return;
        }
        axios.get('/api/departments', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => {
                console.log('Fetched departments:', res.data); // Debug log
                setDepartments(res.data || []);
                setDepartmentOptionsLoading(false);
            })
            .catch(err => {
                setDepartmentOptionsError('Failed to load departments');
                setDepartmentOptionsLoading(false);
            });
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setTableLoading(true);
            setError('');
            const params = {
                page,
                size: rowsPerPage,
                sort: `${sortField},${sortOrder}`,
                username: filterUsername || undefined,
                department: filterDepartment || undefined,
                role: filterRole || undefined,
            };
            const response = await userService.getUsersPaginated(params);
            
            // Process the user data to properly show department information
            const updatedUsers = response.data.content.map(newUser => {
                // Log the department information for debugging
                console.log(`Processing user ${newUser.username}:`, {
                    department: newUser.department,
                    departmentName: newUser.departmentName,
                    departmentId: newUser.departmentId
                });
                
                // Handle the case where the API returns departmentName instead of department
                const userDepartment = newUser.departmentName || newUser.department;
                
                // If the user has a departmentId but no department name, try to get the name
                if (newUser.departmentId && (!userDepartment || userDepartment === 'No Department')) {
                    const matchingDept = departments.find(d => d.id === newUser.departmentId);
                    if (matchingDept) {
                        console.log(`Found matching department for ${newUser.username}:`, matchingDept.name);
                        return { 
                            ...newUser, 
                            department: matchingDept.name,
                            departmentName: matchingDept.name 
                        };
                    }
                }
                
                // If API returns departmentName, make sure we set department as well
                if (newUser.departmentName && !newUser.department) {
                    newUser.department = newUser.departmentName;
                }
                
                // If the user doesn't have a department, set a default
                if (!userDepartment || userDepartment === '') {
                    return { 
                        ...newUser, 
                        department: 'No Department',
                        departmentName: 'No Department'
                    };
                }
                
                return newUser;
            });
            
            setUsers(updatedUsers);
            setTotalPages(response.data.totalPages || 0);
            setTotalElements(response.data.totalElements || 0);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response) {
                console.error('Error response:', {
                    status: err.response.status,
                    data: err.response.data,
                    headers: err.response.headers
                });
                setError(`Failed to fetch users: ${err.response.data.message || err.response.statusText}`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('No response received from server. Please check if the server is running.');
            } else {
                console.error('Error setting up request:', err.message);
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    };

    const sortUsers = (users, key) => {
        return [...users].sort((a, b) => {
            let aValue, bValue;

            switch (key) {
                case 'username':
                    aValue = a.username.toLowerCase();
                    bValue = b.username.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'role':
                    aValue = Array.isArray(a.roles)
                        ? a.roles.map(role => role.name || role).join(', ')
                        : (a.roles?.name || a.roles || '');
                    bValue = Array.isArray(b.roles)
                        ? b.roles.map(role => role.name || role).join(', ')
                        : (b.roles?.name || b.roles || '');
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getVisiblePageNumbers = () => {
        const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
        const maxVisiblePages = 5;
        const currentPage = page + 1;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return {
            pages,
            showStartEllipsis: startPage > 1,
            showEndEllipsis: endPage < totalPages
        };
    };

    const renderPagination = () => {
        const start = totalElements === 0 ? 0 : page * rowsPerPage + 1;
        const end = Math.min((page + 1) * rowsPerPage, totalElements);
        return (
            <PaginationContainer sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel id="rows-per-page-label">
                            <span role="img" aria-label="Rows">📄</span> Rows per page
                        </InputLabel>
                        <Select
                            labelId="rows-per-page-label"
                            value={rowsPerPage}
                            label="Rows per page"
                            onChange={handleChangeRowsPerPage}
                            sx={{ borderRadius: 2, fontWeight: 500 }}
                        >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>
                        {`${start}-${end} of ${totalElements}`}
                </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                <PaginationButton
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                    size="small"
                    sx={{ color: page === 0 ? 'rgba(255, 255, 255, 0.3)' : '#3f8cff' }}
                >
                    <FirstPageIcon />
                </PaginationButton>
                <PaginationButton
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    size="small"
                    sx={{ color: page === 0 ? 'rgba(255, 255, 255, 0.3)' : '#3f8cff' }}
                >
                    <ChevronLeftIcon />
                </PaginationButton>
                    {[...Array(totalPages)].map((_, i) => (
                        <PageNumberButton
                            key={i}
                            active={page === i}
                            onClick={() => setPage(i)}
                            size="small"
                            sx={{
                                backgroundColor: page === i ? '#3f8cff' : 'rgba(255,255,255,0.05)',
                                color: page === i ? '#fff' : 'rgba(255,255,255,0.7)',
                                fontWeight: page === i ? 700 : 400,
                                border: page === i ? '2px solid #3f8cff' : '1px solid rgba(255,255,255,0.1)',
                                minWidth: 36,
                                mx: 0.5
                            }}
                        >
                            {i + 1}
                    </PageNumberButton>
                ))}
                <PaginationButton
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    size="small"
                    sx={{ color: page >= totalPages - 1 ? 'rgba(255, 255, 255, 0.3)' : '#3f8cff' }}
                >
                    <ChevronRightIcon />
                </PaginationButton>
                <PaginationButton
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    size="small"
                    sx={{ color: page >= totalPages - 1 ? 'rgba(255, 255, 255, 0.3)' : '#3f8cff' }}
                >
                    <LastPageIcon />
                </PaginationButton>
                </Stack>
            </PaginationContainer>
        );
    };

    const renderTable = () => {
        if (tableLoading) {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: 200 
                }}>
                    <CircularProgress size={40} />
                </Box>
            );
        }

        return (
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'background.paper'
                }}>
                    <thead>
                        <tr>
                            <th style={{ 
                                padding: theme.spacing(2),
                                textAlign: 'left',
                                color: 'text.secondary',
                                fontWeight: 600,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                paddingLeft: theme.spacing(3),
                                paddingRight: theme.spacing(3)
                            }}>Username</th>
                            <th style={{ 
                                padding: theme.spacing(2),
                                textAlign: 'left',
                                color: 'text.secondary',
                                fontWeight: 600,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                paddingLeft: theme.spacing(3),
                                paddingRight: theme.spacing(3)
                            }}>Email</th>
                            <th style={{ 
                                padding: theme.spacing(2),
                                textAlign: 'left',
                                color: 'text.secondary',
                                fontWeight: 600,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                paddingLeft: theme.spacing(3),
                                paddingRight: theme.spacing(3)
                            }}>Role</th>
                            <th style={{ 
                                padding: theme.spacing(2),
                                textAlign: 'left',
                                color: 'text.secondary',
                                fontWeight: 600,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                paddingLeft: theme.spacing(3),
                                paddingRight: theme.spacing(3)
                            }}>Department/Type</th>
                            <th style={{ 
                                padding: theme.spacing(2),
                                textAlign: 'left',
                                color: 'text.secondary',
                                fontWeight: 600,
                                borderBottom: `2px solid ${theme.palette.divider}`,
                                paddingLeft: theme.spacing(3),
                                paddingRight: theme.spacing(3)
                            }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                                <tr key={user.id} style={{
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover
                                    }
                                }}>
                                    <td style={{ 
                                        padding: theme.spacing(2),
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        paddingLeft: theme.spacing(3),
                                        paddingRight: theme.spacing(3)
                                    }}>
                                        <Box display="flex" alignItems="center">
                                            <Avatar 
                                                src={user.avatar} 
                                                alt={user.username}
                                                sx={{ 
                                                    mr: 2, 
                                                    bgcolor: 'primary.main',
                                                    width: 32,
                                                    height: 32,
                                                    border: `2px solid ${theme.palette.primary.main}`,
                                                    '& img': {
                                                        objectFit: 'cover'
                                                    }
                                                }}
                                            >
                                                {!user.avatar && user.username[0].toUpperCase()}
                                            </Avatar>
                                            {user.username}
                                        </Box>
                                    </td>
                                    <td style={{ 
                                        padding: theme.spacing(2),
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        paddingLeft: theme.spacing(3),
                                        paddingRight: theme.spacing(3)
                                    }}>{user.email}</td>
                                    <td style={{ padding: '16px' }}>
                                        {user.roles && user.roles.map((role, index) => {
                                        const roleLabel =
                                            (role === 'ROLE_USER' || role === 'ROLE_STUDENT') ? 'User'
                                            : (typeof role === 'string' ? role.replace('ROLE_', '')
                                                : (role.name ? role.name.replace('ROLE_', '')
                                                    : (role.authority ? role.authority.replace('ROLE_', '') : 'Unknown')));
                                            return (
                                                <Chip
                                                    key={index}
                                                    label={roleLabel}
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                    color={
                                                        roleLabel === 'ADMIN' ? 'error' :
                                                        roleLabel === 'MODERATOR' ? 'warning' :
                                                        'primary'
                                                    }
                                                />
                                            );
                                        })}
                                    </td>
                                    <td style={{ 
                                        padding: theme.spacing(2),
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        paddingLeft: theme.spacing(3),
                                        paddingRight: theme.spacing(3)
                                    }}>
                                        {user.roles.includes('ROLE_MODERATOR') && user.roles.includes('ROLE_USER') ? (
                                            // For users with both moderator and student roles
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {/* Show moderator type */}
                                                <Chip
                                                    label={user.moderatorType ? user.moderatorType.replace(/_/g, ' ') : 'Teacher'}
                                                    size="small"
                                                    color="warning"
                                                    sx={{ 
                                                        bgcolor: 'rgba(255, 183, 77, 0.2)',
                                                        color: '#ffb74d',
                                                        border: '1px solid #ffb74d',
                                                        fontWeight: 500 
                                                    }}
                                                />
                                                {/* Show department - use departmentName if available, fall back to department */}
                                                <Chip
                                                    label={(user.departmentName || user.department) && (user.departmentName || user.department) !== 'Unspecified Type' ? 
                                                        (user.departmentName || user.department) : 'General Department'}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ 
                                                        bgcolor: 'rgba(63, 140, 255, 0.2)',
                                                        color: '#3f8cff',
                                                        border: '1px solid #3f8cff',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </Box>
                                        ) : user.roles.includes('ROLE_MODERATOR') ? (
                                            <Chip
                                                label={user.moderatorType ? user.moderatorType.replace(/_/g, ' ') : 'Unspecified Type'}
                                                size="small"
                                                color="warning"
                                                sx={{ 
                                                    bgcolor: 'rgba(255, 183, 77, 0.2)',
                                                    color: '#ffb74d',
                                                    border: '1px solid #ffb74d',
                                                    fontWeight: 500 
                                                }}
                                            />
                                        ) : user.roles.includes('ROLE_USER') ? (
                                            <Chip
                                                label={(user.departmentName || user.department) || 'No Department'}
                                                size="small"
                                                color="primary"
                                                sx={{ 
                                                    bgcolor: 'rgba(63, 140, 255, 0.2)',
                                                    color: '#3f8cff',
                                                    border: '1px solid #3f8cff',
                                                    fontWeight: 500 
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label={(user.departmentName || user.department) || 'No Department'}
                                                size="small"
                                                color="error"
                                                sx={{ 
                                                    bgcolor: 'rgba(255, 92, 147, 0.2)',
                                                    color: '#ff5c93',
                                                    border: '1px solid #ff5c93',
                                                    fontWeight: 500 
                                                }}
                                            />
                                        )}
                                    </td>
                                    <td style={{ 
                                        padding: theme.spacing(2),
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        paddingLeft: theme.spacing(3),
                                        paddingRight: theme.spacing(3)
                                    }}>
                                    <Tooltip title="Edit User">
                                        {user.id === currentUserId ? (
                                                <span>
                                                    <IconButton
                                                        onClick={() => handleOpenDialog(user)}
                                                    disabled
                                                    sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </span>
                                        ) : (
                                            <IconButton 
                                                onClick={() => handleOpenDialog(user)} 
                                                sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' } }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                            </Tooltip>
                                    <Tooltip title="Delete User">
                                        {user.id === currentUserId ? (
                                                <span>
                                                    <IconButton
                                                        onClick={() => handleOpenDeleteConfirm(user)}
                                                    disabled
                                                    sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                        ) : (
                                            <IconButton 
                                                onClick={() => handleOpenDeleteConfirm(user)} 
                                                sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' } }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                            </Tooltip>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </Box>
        );
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, [page, rowsPerPage, sortField, sortOrder, filterUsername, filterDepartment, filterRole]);

    useEffect(() => {
        const handler = setTimeout(() => setFilterUsername(usernameInput), 400);
        return () => clearTimeout(handler);
    }, [usernameInput]);

    useEffect(() => {
        const handler = setTimeout(() => setFilterDepartment(departmentInput), 400);
        return () => clearTimeout(handler);
    }, [departmentInput]);

    useEffect(() => {
        const handler = setTimeout(() => setFilterRole(roleInput), 400);
        return () => clearTimeout(handler);
    }, [roleInput]);

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleOpenDialog = (user = null) => {
        setShowPassword(false);
        setSelectedUser(user);
        if (user) {
            // Edit user
            setFormData({
                username: user.username || '',
                email: user.email || '',
                // Set roles correctly based on user roles
                roles: user.roles ? user.roles.map(role => typeof role === 'string' ? role : role.name) : ['ROLE_USER'],
                role: user.roles?.length > 0 ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].name) : 'ROLE_USER',
                moderatorType: user.moderatorType || '',
                specialization: user.specialization || '',
                hostelName: user.hostelName || '',
                librarySection: user.librarySection || '',
                labName: user.labName || '',
                sportsCategory: user.sportsCategory || '',
                culturalCategory: user.culturalCategory || '',
                academicProgram: user.academicProgram || '',
                department: user.department || '',
                departmentId: user.departmentId || '',
                yearOfStudy: user.yearOfStudy || ''
            });
        } else {
            // Add new user
            setFormData({
                username: '',
                email: '',
                role: 'ROLE_USER',
                roles: ['ROLE_USER'],
                password: '',
                moderatorType: '',
                specialization: '',
                hostelName: '',
                librarySection: '',
                labName: '',
                sportsCategory: '',
                culturalCategory: '',
                academicProgram: '',
                department: '',
                departmentId: '',
                yearOfStudy: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
        setShowPassword(false);
        setFormData({
            username: '',
            email: '',
            role: 'ROLE_USER',
            roles: ['ROLE_USER'],
            password: ''
        });
    };

    const handleOpenDeleteConfirm = (user) => {
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(`Field changed: ${name} = "${value}"`);
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            // Validate required fields
            if (!formData.username || !formData.roles.length) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                setLoading(false);
                return;
            }

            // Validate moderator type is selected when role is moderator
            if (formData.roles.includes('ROLE_MODERATOR') && !formData.moderatorType) {
                setError('Please select a Moderator Type');
                setLoading(false);
                return;
            }

            // Log the form data for debugging
            console.log('Form data before submission:', formData);
            console.log('Selected roles in form:', formData.roles);
            console.log('Moderator type in form:', formData.moderatorType);
            
            // Log department details
            const selectedDepartment = formData.departmentId ? 
                departments.find(d => d.id === formData.departmentId) : null;
            console.log('Department data:', { 
                departmentId: formData.departmentId, 
                department: formData.department,
                selectedDepartment: selectedDepartment ? selectedDepartment.name : 'None'
            });

            // Get the role value (remove ROLE_ prefix if present)
            const roleValue = formData.roles.map(role => role.replace('ROLE_', '').toLowerCase());
            
            // Log converted roles
            console.log('Converted role values for backend:', roleValue);
            
            // The department name to use in the API request
            const departmentName = selectedDepartment ? selectedDepartment.name : 'No Department';
            
            // Make sure department is explicitly included even if empty string
            const userData = {
                username: formData.username,
                email: formData.email,
                // Backend expects role and roles fields
                role: roleValue[0],
                roles: roleValue,
                // Include both departmentId and department name
                departmentId: formData.departmentId || null,
                // Get department name from the selected departmentId
                department: departmentName,
                // Also include departmentName for API compatibility
                departmentName: departmentName
            };
            
            console.log('Base userData constructed:', userData);
            
            // Add role-specific fields
            if (roleValue.includes('user')) {
                userData.degree = formData.degree || '';
                userData.yearOfStudy = formData.yearOfStudy ? parseInt(formData.yearOfStudy, 10) : null;
                console.log('Added student-specific fields:', { degree: userData.degree, yearOfStudy: userData.yearOfStudy });
            } else if (roleValue.includes('moderator')) {
                // For moderator role, moderatorType is required
                userData.moderatorType = formData.moderatorType;
                console.log('Setting moderatorType in user data:', formData.moderatorType);
                
                // Add fields based on moderator type
                switch (formData.moderatorType) {
                    case 'TEACHER':
                        userData.specialization = formData.specialization || '';
                        break;
                    case 'HOSTEL_WARDEN':
                        userData.hostelName = formData.hostelName || '';
                        break;
                    case 'LIBRARIAN':
                        userData.librarySection = formData.librarySection || '';
                        break;
                    case 'LAB_INCHARGE':
                        userData.labName = formData.labName || '';
                        break;
                    case 'SPORTS_COORDINATOR':
                        userData.sportsCategory = formData.sportsCategory || '';
                        break;
                    case 'CULTURAL_COORDINATOR':
                        userData.culturalCategory = formData.culturalCategory || '';
                        break;
                    case 'ACADEMIC_COORDINATOR':
                        userData.academicProgram = formData.academicProgram || '';
                        break;
                    default:
                        break;
                }
            } else if (roleValue.includes('admin')) {
                console.log('Preparing user for ADMIN role');
                // Ensure role is properly set for admin
                userData.role = 'admin';
                userData.roles = ['admin'];
            }

            console.log('Final userData before submission:', JSON.stringify(userData, null, 2));

            let response;
            if (selectedUser) {
                if (selectedUser.id === currentUserId) {
                    setError('You cannot edit your own account');
                    setLoading(false);
                    return;
                }
                console.log('Updating user with ID:', selectedUser.id);
                
                try {
                response = await userService.update(selectedUser.id, userData);
                console.log('Update response:', response);
                console.log('Updated user data:', response.data);
                console.log('User roles after update:', response.data.roles);
                
                    // Force a complete refresh of users
                    await fetchUsers();
                
                setSnackbar({
                    open: true,
                    message: 'User updated successfully',
                    severity: 'success'
                });
                    
                    // Close dialog after successful update
                    handleCloseDialog();
                } catch (updateError) {
                    console.error('Error during update:', updateError);
                    setError(`Update failed: ${updateError.message}`);
                    setLoading(false);
                    return;
                }
            } else {
                // For new user creation, ensure password is included
                if (!formData.password) {
                    setError('Password is required for new users');
                    setLoading(false);
                    return;
                }
                
                // Add password to userData
                userData.password = formData.password;
                
                console.log('Creating new user with data:', userData);
                try {
                response = await userService.create(userData);
                console.log('Create response:', response);
                    
                    // Force a complete refresh of users
                    await fetchUsers();
                    
                setSnackbar({
                    open: true,
                    message: 'User created successfully',
                    severity: 'success'
                });

                    // Close dialog after successful creation
            handleCloseDialog();
                } catch (createError) {
                    console.error('Error during user creation:', createError);
                    setError(`Creation failed: ${createError.message}`);
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error('Error saving user:', err);
            // Add more specific error logging to help debug
            if (err.name === 'TypeError') {
                console.error('TypeError details:', {
                    message: err.message,
                    stack: err.stack
                });
            }
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                statusText: err.response?.statusText,
                requestData: err.config?.data
            });
            const errorMessage = err.response?.data?.message || `Failed to save user: ${err.message}`;
            setError(errorMessage);
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        try {
            // Prevent deleting your own account
            if (userId === currentUserId) {
                setError('You cannot delete your own account.');
                return;
            }

            // Check if the user is an admin
            const userToDelete = users.find(u => u.id === userId);
            if (userToDelete && userToDelete.roles.some(role => role.name === 'ROLE_ADMIN')) {
                // Count total admins
                const adminCount = users.filter(u => u.roles.some(role => role.name === 'ROLE_ADMIN')).length;
                if (adminCount <= 1) {
                    setError('Cannot delete the last admin user.');
                    return;
                }
            }

            await userService.delete(userId);
            setSnackbar({
                open: true,
                message: `User has been successfully deleted`,
                severity: 'success'
            });
            handleCloseDeleteConfirm();
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
        }
    };

    // Filter roleOptions to only show one of ROLE_USER or ROLE_STUDENT as 'User'
    const filteredRoleOptions = React.useMemo(() => {
        // Check if roleOptions is an array before using includes
        if (Array.isArray(roleOptions) && roleOptions.includes('ROLE_USER') && roleOptions.includes('ROLE_STUDENT')) {
            return roleOptions.filter(role => role !== 'ROLE_STUDENT');
        }
        // If roleOptions is not an array or does not have expected values, return it as is
        return Array.isArray(roleOptions) ? roleOptions : [];
    }, [roleOptions]);

    // Sort moderatorTypeOptions alphabetically and map to user-friendly display names
    const sortedModeratorTypeOptions = React.useMemo(() => {
        return [...moderatorTypeOptions].sort((a, b) => a.localeCompare(b));
    }, [moderatorTypeOptions]);

    // Add debug logs before rendering the dropdown
    console.log('Department dropdown render:', {
      departments,
      departmentOptionsError,
      departmentOptionsLoading,
      formDataDepartmentId: formData.departmentId
    });

    const handleDepartmentDropdownOpen = () => {
      console.log('Department dropdown opened');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                py: 4,
                px: 2,
            }}
        >
            <Container maxWidth="lg">
                {/* Admin Portal Header */}
                <AdminHeader>
                    <Box display="flex" alignItems="center">
                        <DashboardIcon sx={{ color: '#3f8cff', fontSize: 32, mr: 1.5 }} />
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                            Admin Portal
                        </Typography>
                    </Box>
                </AdminHeader>

                <StyledPaper>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ color: '#3f8cff', fontSize: 32 }} />
                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                                {activeSection === 'users' ? 'User Management' : 'Course Management'}
                            </Typography>
                        </Box>
                        <StyledButton
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => activeSection === 'users' ? handleOpenDialog() : null}
                                disabled={activeSection !== 'users'}
                            >
                                {activeSection === 'users' ? 'Add New User' : 'Add New Course'}
                        </StyledButton>
                        </Box>

                        {error && (
                        <Alert severity="error" sx={{ mb: 3, background: 'rgba(211, 47, 47, 0.1)', color: '#fff' }}>
                                {error}
                            </Alert>
                        )}

                        {/* Display either User Management or Course Management based on activeSection */}
                        {activeSection === 'users' ? (
                            <>
                                {/* User Management content */}
                        {/* Search and Filter Section */}
                                <Box sx={{ mb: 3 }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={3}>
                            <TextField
                                        label="Username" 
                                        value={usernameInput} 
                                        onChange={e => setUsernameInput(e.target.value)} 
                                fullWidth
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <FormControl fullWidth>
                                        <InputLabel>Department</InputLabel>
                                        <Select value={departmentInput} onChange={e => setDepartmentInput(e.target.value)} label="Department" disabled={departmentOptionsLoading || !!departmentOptionsError}>
                                          <MenuItem value="">All</MenuItem>
                                          {departments.map(dept => (
                                            <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                                        <Select value={roleInput} onChange={e => setRoleInput(e.target.value)} label="Role">
                                          <MenuItem value="">All</MenuItem>
                                          {filteredRoleOptions.map(role => (
                                            <MenuItem key={role} value={role}>{role.replace('ROLE_', '')}</MenuItem>
                                          ))}
                            </Select>
                        </FormControl>
                                    </Grid>
                                  </Grid>
                        </Box>

                        <Box sx={{ overflowX: 'auto' }}>
                        {tableLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress sx={{ color: '#3f8cff' }} />
                            </Box>
                                ) : users.length > 0 ? (
                            <TableContainer>
                                <Table>
                                    <StyledTableHead>
                                        <TableRow>
                                                    <StyledTableCell onClick={() => handleSort('username')} sx={{ cursor: 'pointer' }}>Username</StyledTableCell>
                                                    <StyledTableCell onClick={() => handleSort('email')} sx={{ cursor: 'pointer' }}>Email</StyledTableCell>
                                            <StyledTableCell>Role</StyledTableCell>
                                                    <StyledTableCell onClick={() => handleSort('department')} sx={{ cursor: 'pointer' }}>Department/Type</StyledTableCell>
                                            <StyledTableCell>Actions</StyledTableCell>
                                        </TableRow>
                                    </StyledTableHead>
                                    <TableBody>
                                                {users.map((user) => (
                                                <TableRow key={user.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}>
                                                    <StyledTableCell>{user.username}</StyledTableCell>
                                                    <StyledTableCell>{user.email}</StyledTableCell>
                                                    <StyledTableCell>
                                                                {user.roles && user.roles.map((role, index) => {
                                                                    const roleLabel =
                                                                        (role === 'ROLE_USER' || role === 'ROLE_STUDENT') ? 'User'
                                                                        : (typeof role === 'string' ? role.replace('ROLE_', '')
                                                                            : (role.name ? role.name.replace('ROLE_', '')
                                                                                : (role.authority ? role.authority.replace('ROLE_', '') : 'Unknown')));
                                                            return (
                                                                <Chip 
                                                                            key={index}
                                                                            label={roleLabel}
                                                                    size="small" 
                                                                            sx={{ mr: 1 }}
                                                                            color={
                                                                                roleLabel === 'ADMIN' ? 'error' :
                                                                                roleLabel === 'MODERATOR' ? 'warning' :
                                                                                'primary'
                                                                            }
                                                                />
                                                            );
                                                        })}
                                                    </StyledTableCell>
                                                            <StyledTableCell>
                                                                {user.roles.includes('ROLE_MODERATOR') && user.roles.includes('ROLE_USER') ? (
                                                                    // For users with both moderator and student roles
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                        {/* Show moderator type */}
                                                                        <Chip
                                                                            label={user.moderatorType ? user.moderatorType.replace(/_/g, ' ') : 'Teacher'}
                                                                            size="small"
                                                                            color="warning"
                                                                            sx={{ 
                                                                                bgcolor: 'rgba(255, 183, 77, 0.2)',
                                                                                color: '#ffb74d',
                                                                                border: '1px solid #ffb74d',
                                                                                fontWeight: 500 
                                                                            }}
                                                                        />
                                                                        {/* Show department - use departmentName if available, fall back to department */}
                                                                        <Chip
                                                                            label={(user.departmentName || user.department) && (user.departmentName || user.department) !== 'Unspecified Type' ? 
                                                                                (user.departmentName || user.department) : 'General Department'}
                                                                            size="small"
                                                                            color="primary"
                                                                            sx={{ 
                                                                                bgcolor: 'rgba(63, 140, 255, 0.2)',
                                                                                color: '#3f8cff',
                                                                                border: '1px solid #3f8cff',
                                                                                fontWeight: 500
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                ) : user.roles.includes('ROLE_MODERATOR') ? (
                                                                    <Chip
                                                                        label={user.moderatorType ? user.moderatorType.replace(/_/g, ' ') : 'Unspecified Type'}
                                                                        size="small"
                                                                        color="warning"
                                                                        sx={{ 
                                                                            bgcolor: 'rgba(255, 183, 77, 0.2)',
                                                                            color: '#ffb74d',
                                                                            border: '1px solid #ffb74d',
                                                                            fontWeight: 500 
                                                                        }}
                                                                    />
                                                                ) : user.roles.includes('ROLE_USER') ? (
                                                                    <Chip
                                                                        label={(user.departmentName || user.department) || 'No Department'}
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{ 
                                                                            bgcolor: 'rgba(63, 140, 255, 0.2)',
                                                                            color: '#3f8cff',
                                                                            border: '1px solid #3f8cff',
                                                                            fontWeight: 500 
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Chip
                                                                        label={(user.departmentName || user.department) || 'No Department'}
                                                                        size="small"
                                                                        color="error"
                                                                        sx={{ 
                                                                            bgcolor: 'rgba(255, 92, 147, 0.2)',
                                                                            color: '#ff5c93',
                                                                            border: '1px solid #ff5c93',
                                                                            fontWeight: 500 
                                                                        }}
                                                                    />
                                                                )}
                                                            </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Tooltip title="Edit User">
                                                                    {user.id === currentUserId ? (
                                                                        <span>
                                                            <IconButton 
                                                                onClick={() => handleOpenDialog(user)} 
                                                                                disabled
                                                                                sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } }}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                                        </span>
                                                                    ) : (
                                                                        <IconButton 
                                                                            onClick={() => handleOpenDialog(user)} 
                                                                            sx={{ color: '#3f8cff', '&:hover': { background: 'rgba(63, 140, 255, 0.1)' } }}
                                                                        >
                                                                            <EditIcon />
                                                                        </IconButton>
                                                                    )}
                                                        </Tooltip>
                                                        <Tooltip title="Delete User">
                                                                    {user.id === currentUserId ? (
                                                                        <span>
                                                            <IconButton 
                                                                onClick={() => handleOpenDeleteConfirm(user)}
                                                                                disabled
                                                                                sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' }, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                                        </span>
                                                                    ) : (
                                                                        <IconButton 
                                                                            onClick={() => handleOpenDeleteConfirm(user)} 
                                                                            sx={{ color: '#ff5252', '&:hover': { background: 'rgba(255, 82, 82, 0.1)' } }}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    )}
                                                        </Tooltip>
                                                    </StyledTableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <SchoolIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
                                    No users found
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', mb: 3 }}>
                                            {usernameInput || departmentInput || roleInput !== '' 
                                        ? 'Try adjusting your filters'
                                        : 'Get started by adding users to the system'}
                                </Typography>
                            </Box>
                        )}
                        </Box>
                    {/* Pagination Controls */}
                            {users.length > 0 && (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mt: 3,
                            gap: 2,
                            flexWrap: { xs: 'wrap', sm: 'nowrap' }
                        }}>
                            {renderPagination()}
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <SchoolIcon sx={{ fontSize: 60, color: '#3f8cff', mb: 2 }} />
                                <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                                    Course Management
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3, maxWidth: 600, mx: 'auto' }}>
                                    Course Management functionality is coming soon. Here you will be able to create, edit and manage courses in the system.
                                </Typography>
                                <StyledButton variant="contained" startIcon={<SchoolIcon />} disabled>
                                    Coming Soon
                                </StyledButton>
                        </Box>
                    )}
                    </StyledPaper>
            </Container>

            {/* User Dialog */}
            <StyledDialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#3f8cff' }} />
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={selectedUser?.id === currentUserId}
                        autoComplete="off"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={selectedUser?.id === currentUserId}
                        sx={{ mb: 2 }}
                    />
                    {!selectedUser && (
                        <TextField
                            margin="dense"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            autoComplete="new-password"
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={formData.roles || [formData.role]}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                roles: e.target.value,
                                role: e.target.value.length > 0 ? e.target.value[0] : 'ROLE_USER' // Keep legacy role field for compatibility
                            })}
                            label="Role"
                            multiple
                            disabled={dropdownsLoading || !!dropdownsError || selectedUser?.id === currentUserId}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip 
                                            key={value} 
                                            label={(value === 'ROLE_USER' || value === 'ROLE_STUDENT') ? 'User' : value.replace('ROLE_', '').charAt(0) + value.replace('ROLE_', '').slice(1).toLowerCase()} 
                                            size="small"
                                            sx={{ 
                                                bgcolor: 'rgba(63, 140, 255, 0.15)',
                                                color: '#fff',
                                                '& .MuiChip-label': { px: 1 }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{
                                backgroundColor: 'rgb(26, 32, 39)',
                                '& .MuiSelect-select': {
                                    backgroundColor: 'rgb(26, 32, 39) !important',
                                },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        bgcolor: 'rgb(38, 46, 56)',
                                        '& .MuiMenuItem-root': {
                                            color: '#fff',
                                        }
                                    }
                                }
                            }}
                        >
                            {filteredRoleOptions.map(role => (
                                <MenuItem key={role} value={role}>
                                <Checkbox 
                                        checked={formData.roles ? formData.roles.indexOf(role) > -1 : formData.role === role} 
                                    sx={{ color: 'rgba(255, 255, 255, 0.5)', '&.Mui-checked': { color: '#3f8cff' } }}
                                />
                                    {(role === 'ROLE_USER' || role === 'ROLE_STUDENT')
                                        ? 'User'
                                        : role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase()}
                            </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* Only show department field if user is not an admin */}
                    {(formData.roles ? (formData.roles.includes('ROLE_USER') || !formData.roles.includes('ROLE_MODERATOR')) && !formData.roles.includes('ROLE_ADMIN') : (formData.role === 'ROLE_USER' || formData.role !== 'ROLE_MODERATOR') && formData.role !== 'ROLE_ADMIN') && (
                        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={formData.departmentId || ''}
                                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                        label="Department"
                                onOpen={handleDepartmentDropdownOpen}
                            >
                                {departmentOptionsError && (
                                  <MenuItem value="error">{departmentOptionsError}</MenuItem>
                                )}
                                <MenuItem value="">Select Department</MenuItem>
                                {departments.length === 0 && !departmentOptionsError && (
                                  <MenuItem value="" disabled>No departments found</MenuItem>
                                )}
                                {/* If current user has department that's not in list, show it */}
                                {formData.department && !departments.some(d => d.name === formData.department) && !departments.some(d => d.id === formData.departmentId) && (
                                  <MenuItem value={formData.departmentId || "custom"} disabled>
                                    Current: {formData.department} (not in department list)
                                  </MenuItem>
                                )}
                                {departments.map(dept => (
                                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Moderator specific fields */}
                    {(formData.roles ? formData.roles.includes('ROLE_MODERATOR') : formData.role === 'ROLE_MODERATOR') && (
                        <>
                            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                                <InputLabel>Moderator Type</InputLabel>
                                <Select
                                    value={formData.moderatorType || ''}
                                    onChange={(e) => setFormData({ ...formData, moderatorType: e.target.value })}
                                    label="Moderator Type"
                                    disabled={dropdownsLoading || !!dropdownsError}
                                    sx={{
                                        backgroundColor: 'rgb(26, 32, 39)',
                                        '& .MuiSelect-select': {
                                            backgroundColor: 'rgb(26, 32, 39) !important',
                                        },
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                bgcolor: 'rgb(38, 46, 56)',
                                                '& .MuiMenuItem-root': {
                                                    color: '#fff',
                                                }
                                            }
                                        }
                                    }}
                                >
                                    {sortedModeratorTypeOptions.map(type => (
                                        <MenuItem key={type} value={type}>
                                            {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Type-specific fields */}
                            {formData.moderatorType === 'TEACHER' && (
                                <TextField
                                    margin="dense"
                                    label="Specialization"
                                    fullWidth
                                    value={formData.specialization || ''}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    placeholder="Enter specialization"
                                />
                            )}
                            {formData.moderatorType === 'HOSTEL_WARDEN' && (
                                <TextField
                                    margin="dense"
                                    label="Hostel Name"
                                    fullWidth
                                    value={formData.hostelName || ''}
                                    onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                                    placeholder="Enter hostel name"
                                />
                            )}
                            {formData.moderatorType === 'LIBRARIAN' && (
                                <TextField
                                    margin="dense"
                                    label="Library Section"
                                    fullWidth
                                    value={formData.librarySection || ''}
                                    onChange={(e) => setFormData({ ...formData, librarySection: e.target.value })}
                                    placeholder="Enter library section"
                                />
                            )}
                            {formData.moderatorType === 'LAB_INCHARGE' && (
                                <TextField
                                    margin="dense"
                                    label="Lab Name"
                                    fullWidth
                                    value={formData.labName || ''}
                                    onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                                    placeholder="Enter lab name"
                                />
                            )}
                            {formData.moderatorType === 'SPORTS_COORDINATOR' && (
                                <TextField
                                    margin="dense"
                                    label="Sports Category"
                                    fullWidth
                                    value={formData.sportsCategory || ''}
                                    onChange={(e) => setFormData({ ...formData, sportsCategory: e.target.value })}
                                    placeholder="Enter sports category"
                                />
                            )}
                            {formData.moderatorType === 'CULTURAL_COORDINATOR' && (
                                <TextField
                                    margin="dense"
                                    label="Cultural Category"
                                    fullWidth
                                    value={formData.culturalCategory || ''}
                                    onChange={(e) => setFormData({ ...formData, culturalCategory: e.target.value })}
                                    placeholder="Enter cultural category"
                                />
                            )}
                            {formData.moderatorType === 'ACADEMIC_COORDINATOR' && (
                                <TextField
                                    margin="dense"
                                    label="Academic Program"
                                    fullWidth
                                    value={formData.academicProgram || ''}
                                    onChange={(e) => setFormData({ ...formData, academicProgram: e.target.value })}
                                    placeholder="Enter academic program"
                                />
                            )}
                        </>
                    )}

                    {/* Student specific fields */}
                    {(formData.roles ? formData.roles.includes('ROLE_USER') : formData.role === 'ROLE_USER') && (
                        <>
                            <TextField
                                margin="dense"
                                label="Degree"
                                fullWidth
                                value={formData.degree || ''}
                                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                placeholder="Enter degree"
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="Year of Study"
                                fullWidth
                                type="number"
                                value={formData.yearOfStudy || ''}
                                onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                                placeholder="Enter year of study"
                                inputProps={{ min: 1, max: 6 }}
                            />
                        </>
                    )}
                </DialogContent>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <DialogActions>
                    <Button 
                        onClick={handleCloseDialog}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <StyledButton onClick={handleSubmit} disabled={loading}>
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Save'}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Delete Confirmation Dialog */}
            <StyledDialog
                open={deleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
            >
                <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon sx={{ color: '#ff5252' }} />
                    Confirm Deletion
                </DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <DialogContent>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <DialogActions>
                    <Button 
                        onClick={handleCloseDeleteConfirm}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleDelete(userToDelete?.id)}
                        sx={{
                            background: '#ff5252',
                            color: '#fff',
                            '&:hover': {
                                background: 'rgba(255, 82, 82, 0.8)',
                            },
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </StyledDialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminBoard; 