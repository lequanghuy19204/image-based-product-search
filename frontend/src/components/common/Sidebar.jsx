import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { useUser } from '../../contexts/UserContext';
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
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  ShoppingBag,
  People,
  Search,
  ExitToApp,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import '../../styles/Sidebar.css';
import { motion } from 'framer-motion';

function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const { userData, loading } = useUser();
  const menuOpen = Boolean(anchorEl);

  const menuItems = [
    { 
      text: 'Tìm kiếm', 
      icon: <Search />, 
      path: '/search', 
      showFor: ['admin', 'user'] 
    },
    { 
      text: 'Sản phẩm', 
      icon: <ShoppingBag />, 
      path: userData?.role === 'admin' ? '/admin/products' : '/products', 
      showFor: ['admin', 'user'] 
    },
    { 
      text: 'Quản lý Người dùng', 
      icon: <People />, 
      path: '/admin/users', 
      showFor: ['admin'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.showFor.includes(userData?.role || 'user')
  );

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
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
      
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <List className="sidebar-menu">
          {filteredMenuItems.map((item) => (
            <motion.div
              key={item.path}
              variants={menuItemVariants}
              transition={{ duration: 0.3 }}
            >
              <Tooltip 
                title={!open ? item.text : ''}
                placement="right"
              >
                <ListItem
                  onClick={() => navigate(item.path)}
                  className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <ListItemIcon className="menu-icon">
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                </ListItem>
              </Tooltip>
            </motion.div>
          ))}
        </List>
      </motion.div>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      
      {/* User Profile Section */}
      <Box className="user-profile">
        <ListItem 
          onClick={handleProfileMenuOpen}
          className="profile-item"
          aria-controls={menuOpen ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
          sx={{ cursor: 'pointer' }}
        >
          <ListItemIcon>
            {loading ? (
              <CircularProgress size={40} />
            ) : (
              <Avatar 
                src={userData?.avatar}
                className="user-avatar"
              >
                {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
              </Avatar>
            )}
          </ListItemIcon>
          {open && (
            <Box className="user-info" sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="subtitle1" 
                noWrap
                sx={{ fontWeight: 'medium' }}
              >
                {loading ? 'Đang tải...' : userData?.username || 'Không có tên'}
              </Typography>
              <Typography 
                variant="body2"
                noWrap
                sx={{ 
                  color: userData?.role === 'admin' ? 'primary.main' : 'text.secondary',
                  fontWeight: 'medium'
                }}
              >
                {loading ? 'Đang tải...' : userData?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </Typography>
              {!loading && userData && (
                <>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {userData.email || 'Không có email'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    CT: {userData.companyName || 'Không có'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    Mã: {userData.companyCode || 'Không có'}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </ListItem>

        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleProfileMenuClose}
          className="profile-menu"
          MenuListProps={{
            'aria-labelledby': 'profile-button',
            role: 'menu'
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
        >
          <MenuItem 
            onClick={handleLogout}
            role="menuitem"
            tabIndex={0}
          >
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
