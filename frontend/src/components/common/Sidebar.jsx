import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Search,
  ShoppingBag,
  People,
  Person,
  ExitToApp,
  VpnKey,
  Menu as MenuIcon,
  ChevronLeft,
} from '@mui/icons-material';
import '../../styles/Sidebar.css';
import { authService } from '../../services/auth.service';

function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userDetails, setUserDetails] = useState(null);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchUserDetails();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Không tìm thấy token');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch user details');
      }

      const data = await response.json();
      // console.log('User details:', data);
      setUserDetails(data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle(false);
    }
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    // Xóa token
    localStorage.removeItem('token');
    // Xóa thông tin user
    localStorage.removeItem('user');
    // Reset state
    setUser(null);
    setUserDetails(null);
    // Chuyển hướng về trang login
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Tìm kiếm Sản phẩm',
      path: '/search',
      icon: <Search />,
      showFor: ['Admin', 'User']
    },
    {
      title: 'Quản lý Sản phẩm',
      path: '/admin/products',
      icon: <ShoppingBag />,
      showFor: ['Admin', 'User']
    },
    {
      title: 'Quản lý Người dùng',
      path: '/admin/users',
      icon: <People />,
      showFor: ['Admin']
    }
  ];

  return (
    <>
      {isMobile && (
        <button 
          className="mobile-toggle-btn"
          onClick={() => onToggle(!open)}
        >
          <MenuIcon/>
        </button>
      )}

      <div className={`sidebar ${!open ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobile && open ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            {open && <h5 className="mb-0 ms-2">Admin Portal</h5>}
          </div>
          {!isMobile && (
            <button 
              className="btn btn-icon"
              onClick={() => onToggle(!open)}
            >
              {open ? <ChevronLeft/> : <MenuIcon/>}
            </button>
          )}
        </div>
        
        <hr className="divider my-0"/>
        
        <nav className="sidebar-menu">
          {menuItems
            .filter(item => user && item.showFor.includes(user.role))
            .map((item) => (
              <div 
                key={item.path}
                className="nav-item"
                title={!open ? item.title : undefined}
              >
                <button
                  className={`nav-link d-flex align-items-center ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="icon-wrapper">
                    {item.icon}
                  </span>
                  {open && <span className="nav-text">{item.title}</span>}
                </button>
              </div>
            ))}
        </nav>

        <hr className="divider mt-auto mb-0"/>
        
        <div className="user-profile">
          <div className="dropdown">
            <button
              className="profile-toggle d-flex align-items-center w-100"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="user-avatar">
                <span>{userDetails?.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              {open && (
                <div className="user-info ms-3">
                  <div className="user-name">{userDetails?.username || user?.username}</div>
                  <small className="user-email">{userDetails?.email || user?.email}</small>
                </div>
              )}
            </button>

            <div className={`dropdown-menu ${showProfileMenu ? 'show' : ''}`}>
              <div className="dropdown-item-text">
                <div className="mb-1">
                  <small className="text-muted">Vai trò:</small>
                  <div className="fw-semibold">{userDetails?.role || user?.role}</div>
                </div>
                {userDetails?.company_name && (
                  <div className="mb-1">
                    <small className="text-muted">Công ty:</small>
                    <div className="fw-semibold">{userDetails.company_name}</div>
                  </div>
                )}
                {userDetails?.company_code && (
                  <div className="mb-1">
                    <small className="text-muted">Mã công ty:</small>
                    <div className="fw-semibold">{userDetails.company_code}</div>
                  </div>
                )}
              </div>
              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-item d-flex align-items-center"
                onClick={() => handleNavigation('/profile')}
              >
                <Person className="me-2"/>
                <span>Hồ sơ</span>
              </button>
              <button 
                className="dropdown-item d-flex align-items-center"
                onClick={() => handleNavigation('/change-password')}
              >
                <VpnKey className="me-2"/>
                <span>Đổi mật khẩu</span>
              </button>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item d-flex align-items-center text-danger"
                onClick={handleLogout}
              >
                <ExitToApp className="me-2"/>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobile && open && (
        <div className="sidebar-overlay" onClick={() => onToggle(false)}/>
      )}
    </>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default Sidebar;
