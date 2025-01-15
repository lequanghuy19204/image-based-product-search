import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Tooltip,
  Avatar,
  Typography,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  ShoppingBag,
  People,
  Search,
  Person,
  ExitToApp,
  VpnKey
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../../styles/Sidebar.css';

function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Mock user data - thay thế bằng dữ liệu thực từ context/redux
  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: null // URL ảnh đại diện
  };

  const menuItems = [
    { text: 'Tìm kiếm', icon: <Search />, path: '/search' },
    { text: 'Quản lý Sản phẩm', icon: <ShoppingBag />, path: '/admin/products' },
    { text: 'Quản lý Người dùng', icon: <People />, path: '/admin/users' },
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Xử lý đăng xuất
    handleProfileMenuClose();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      className={`sidebar ${open ? 'sidebar-open' : 'sidebar-close'}`}
    >
      <Box className="sidebar-header">
        <IconButton onClick={onToggle}>
          {open ? <ChevronLeft /> : <MenuIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List className="sidebar-menu">
        {menuItems.map((item) => (
          <Tooltip 
            key={item.path}
            title={!open ? item.text : ''}
            placement="right"
          >
            <ListItem
              button
              onClick={() => navigate(item.path)}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <ListItemIcon className="menu-icon">
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      
      {/* User Profile Section */}
      <Box className="user-profile">
        <ListItem 
          button 
          onClick={handleProfileMenuOpen}
          className="profile-item"
        >
          <ListItemIcon>
            <Avatar 
              src={user.avatar}
              className="user-avatar"
            >
              {user.name.charAt(0)}
            </Avatar>
          </ListItemIcon>
          {open && (
            <Box className="user-info">
              <Typography variant="subtitle1" noWrap>
                {user.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          )}
        </ListItem>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          className="profile-menu"
        >
          <MenuItem onClick={() => {
            navigate('/profile');
            handleProfileMenuClose();
          }}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            Thông tin cá nhân
          </MenuItem>
          <MenuItem onClick={() => {
            navigate('/change-password');
            handleProfileMenuClose();
          }}>
            <ListItemIcon>
              <VpnKey fontSize="small" />
            </ListItemIcon>
            Đổi mật khẩu
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default Sidebar;
