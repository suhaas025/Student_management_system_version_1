import { styled, alpha } from '@mui/material/styles';
import { Paper, Button, Dialog, TableCell, TableHead, AppBar, Toolbar, Box, Typography, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 2,
  color: '#fff',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  '& .MuiMenuItem-root': {
    color: '#fff',
  },
  '& .MuiSelect-select': {
    color: '#fff',
  },
  '& .MuiFormLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiInputBase-root': {
    color: '#fff',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiTableBody-root .MuiTableRow-root:first-of-type': {
    backgroundColor: 'rgba(26, 32, 39, 0.6)',
  },
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: '#fff',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

export const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: '#3f8cff',
  '& .MuiTableCell-root': {
    color: '#fff',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#3f8cff',
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  background: '#3f8cff',
  color: '#fff',
  '&:hover': {
    background: alpha('#3f8cff', 0.8),
  },
}));

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'rgba(26, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  '& .MuiTextField-root': {
    '& .MuiInputBase-root': {
      color: '#fff',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3f8cff',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3f8cff',
    },
  },
  '& .MuiFormControl-root': {
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiSelect-icon': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-root': {
      color: '#fff',
    },
  },
  '& .MuiMenuItem-root': {
    color: 'rgba(0, 0, 0, 0.87)',
  },
}));

export const PageContainer = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
}));

export const ContentContainer = styled('div')(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4, 2),
}));

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(26, 32, 39, 0.8)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
}));

export const AdminHeader = ({ onProfileClick }) => {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Box 
          component={Link}
          to="/admin"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            cursor: 'pointer',
            textDecoration: 'none',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          <DashboardIcon sx={{ color: '#3f8cff', fontSize: 32 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'white',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Admin Portal
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {onProfileClick && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={onProfileClick}
          >
            <Avatar 
              sx={{ 
                bgcolor: alpha('#3f8cff', 0.8),
                width: 40, 
                height: 40 
              }}
            >
              <AccountCircleIcon />
            </Avatar>
          </Box>
        )}
      </Toolbar>
    </StyledAppBar>
  );
};

// Add a new styled component for dropdown menus
export const darkDropdownStyles = {
  PaperProps: {
    sx: {
      bgcolor: 'rgba(26, 32, 39, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 1,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      '& .MuiMenuItem-root': {
        color: '#fff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        '&:last-child': {
          borderBottom: 'none',
        },
      },
      '& .MuiMenuItem-root:hover': {
        bgcolor: 'rgba(63, 140, 255, 0.1)',
      },
      '& .MuiMenuItem-root.Mui-selected': {
        bgcolor: 'rgba(63, 140, 255, 0.2)',
        '&:hover': {
          bgcolor: 'rgba(63, 140, 255, 0.3)',
        },
      },
    },
  },
}; 