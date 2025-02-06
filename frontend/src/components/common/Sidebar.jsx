import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Refresh as RefreshIcon
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
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const CACHE_DURATION = 30 * 60 * 1000; // 30 phút

  // Kiểm tra xem có cần fetch lại data không
  const shouldFetchData = useCallback(() => {
    if (!lastFetchTime) return true;
    const timeElapsed = Date.now() - lastFetchTime;
    return timeElapsed > CACHE_DURATION;
  }, [lastFetchTime]);

  // Xử lý resize window
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch và cache user details
  const fetchUserDetails = useCallback(async (forceFetch = false) => {
    try {
      // Kiểm tra cache
      const cachedData = localStorage.getItem('userDetails');
      const cachedTime = localStorage.getItem('userDetailsTime');

      // Sử dụng cache nếu có và chưa hết hạn
      if (!forceFetch && cachedData && cachedTime) {
        const timeElapsed = Date.now() - parseInt(cachedTime);
        if (timeElapsed < CACHE_DURATION) {
          setUserDetails(JSON.parse(cachedData));
          setLastFetchTime(parseInt(cachedTime));
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Không tìm thấy token');
        navigate('/login');
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
        if (response.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        throw new Error(errorData.detail || 'Lỗi khi lấy thông tin người dùng');
      }

      const data = await response.json();
      
      // Kiểm tra dữ liệu trước khi lưu
      if (!data || !data.id) {
        throw new Error('Dữ liệu người dùng không hợp lệ');
      }

      // Cập nhật cache và state
      localStorage.setItem('userDetails', JSON.stringify(data));
      localStorage.setItem('userDetailsTime', Date.now().toString());
      setUserDetails(data);
      setLastFetchTime(Date.now());
      setIsDataStale(false);
      setLoginError(null); // Reset error nếu thành công

    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
      setLoginError(error.message);
      // Nếu lỗi nghiêm trọng, có thể xóa cache
      localStorage.removeItem('userDetails');
      localStorage.removeItem('userDetailsTime');
    }
  }, [navigate]);

  // Khởi tạo dữ liệu
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchUserDetails();

    // Kiểm tra data cũ mỗi phút
    const interval = setInterval(() => {
      if (shouldFetchData()) {
        setIsDataStale(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchUserDetails, shouldFetchData]);

  // Menu items được memoized
  const menuItems = useMemo(() => [
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
  ], []);

  // Xử lý navigation
  const handleNavigation = useCallback((path) => {
    navigate(path);
    if (isMobile) {
      onToggle(false);
    }
    setShowProfileMenu(false);
  }, [navigate, isMobile, onToggle]);

  // Xử lý logout - cập nhật mới
  const handleLogout = useCallback(() => {
    // Xóa toàn bộ dữ liệu trong localStorage
    localStorage.clear();
    
    // Xóa toàn bộ dữ liệu trong sessionStorage
    sessionStorage.clear();
    
    // Reset các states
    setUser(null);
    setUserDetails(null);
    setLastFetchTime(null);
    setIsDataStale(false);
    
    // Chuyển hướng về trang login
    navigate('/login');
  }, [navigate]);

  return (
    <>
      {isMobile && (
        <button className="mobile-toggle-btn" onClick={() => onToggle(!open)}>
          <MenuIcon/>
        </button>
      )}

      <div className={`sidebar ${!open ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobile && open ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center justify-content-between w-100">
            {open && <h5 className="mb-0 ms-2">Admin Portal</h5>}
            {isDataStale && open && (
              <button 
                className="btn btn-link btn-sm text-warning"
                onClick={() => fetchUserDetails(true)}
                title="Cập nhật thông tin"
              >
                <RefreshIcon />
              </button>
            )}
          </div>
          {!isMobile && (
            <button className="btn btn-icon" onClick={() => onToggle(!open)}>
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
