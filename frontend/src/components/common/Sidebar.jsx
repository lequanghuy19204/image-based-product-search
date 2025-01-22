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

function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle(false);
    }
    setShowProfileMenu(false);
  };

  const menuItems = [
    { text: 'Tìm kiếm', icon: <Search/>, path: '/search' },
    { text: 'Quản lý Sản phẩm', icon: <ShoppingBag/>, path: '/admin/products' },
    { text: 'Quản lý Người dùng', icon: <People/>, path: '/admin/users' },
  ];

  // Lấy thông tin user từ localStorage
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

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
          {menuItems.map((item) => (
            <div 
              key={item.path}
              className="nav-item"
              title={!open ? item.text : undefined}
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
                {open && <span className="nav-text">{item.text}</span>}
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
                <span>{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              {open && (
                <div className="user-info ms-3">
                  <div className="user-name">{user?.username}</div>
                  <small className="user-email">{user?.email}</small>
                </div>
              )}
            </button>

            <div className={`dropdown-menu ${showProfileMenu ? 'show' : ''}`}>
              {/* Thông tin chi tiết người dùng */}
              <div className="dropdown-item-text">
                <div className="mb-1">
                  <small className="text-muted">Vai trò:</small>
                  <div className="fw-semibold">{user?.role}</div>
                </div>
                {user?.company_name && (
                  <div className="mb-1">
                    <small className="text-muted">Công ty:</small>
                    <div className="fw-semibold">{user?.company_name}</div>
                  </div>
                )}
                {user?.company_code && (
                  <div className="mb-1">
                    <small className="text-muted">Mã công ty:</small>
                    <div className="fw-semibold">{user?.company_code}</div>
                  </div>
                )}
              </div>
              <div className="dropdown-divider"></div>

              {/* Các nút thao tác */}
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
                onClick={() => handleNavigation('/login')}
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
