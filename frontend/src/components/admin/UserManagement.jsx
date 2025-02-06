import { useState, useEffect } from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import { apiService } from '../../services/api.service';
import '../../styles/UserManagement.css';
import UserDialog from './UserDialog';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';

function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  const [currentUser, setCurrentUser] = useState(null);
  const CACHE_DURATION = 30 * 60 * 1000; // 30 phút

  // Thêm state để lưu trữ dữ liệu đã được filter và phân trang
  const [processedUsers, setProcessedUsers] = useState([]);
  const [isDataStale, setIsDataStale] = useState(false);

  const [dialogMode, setDialogMode] = useState('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };


  // Hàm kiểm tra xem có cần fetch lại data không
  const shouldFetchData = () => {
    const cachedTime = localStorage.getItem('cachedUsersTime');
    if (!cachedTime) return true;
    
    const timeElapsed = Date.now() - parseInt(cachedTime);
    const isExpired = timeElapsed > CACHE_DURATION;
    
    // Đánh dấu data cũ nếu đã hết hạn cache
    if (isExpired) setIsDataStale(true);
    return isExpired;
  };

  // Hàm xử lý fetch users với cache
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getUsers();
      if (response) {
        setUsers(response);
        processAndUpdateUsers(response);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Không thể tải danh sách người dùng');
      if (err.message.includes('đăng nhập')) {
        // Redirect to login if session expired
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý filter và phân trang
  const processAndUpdateUsers = (userData) => {
    const filtered = userData.filter(user => {
      const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) ||
                          user.email?.toLowerCase().includes(search.toLowerCase()) ||
                          user.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                          user.company_code?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
      
      return matchesSearch && matchesRole;
    });

    setProcessedUsers(filtered);
    // Reset về trang 1 nếu số lượng trang thay đổi
    const newTotalPages = Math.ceil(filtered.length / rowsPerPage);
    if (page > newTotalPages) {
      setPage(1);
    }
  };

  // Xử lý thêm/sửa user
  const handleUserSubmit = async (userData) => {
    try {
      if (dialogMode === 'add') {
        const currentUser = JSON.parse(localStorage.getItem('userDetails'));
        const userDataWithCompany = {
          ...userData,
          company_id: currentUser.company_id,
          company_name: currentUser.company_name,
          company_code: currentUser.company_code
        };

        const response = await apiService.post('/api/admin/users', userDataWithCompany);
        const updatedUsers = [...users, response];
        updateUserCache(updatedUsers);
        setSuccessMessage('Thêm người dùng thành công');
      } else {
        const response = await apiService.put(`/api/admin/users/${selectedUser.id}`, userData);
        const updatedUsers = users.map(u => u.id === selectedUser.id ? response : u);
        updateUserCache(updatedUsers);
        setSuccessMessage('Cập nhật người dùng thành công');
      }
      setOpenDialog(false);
    } catch (error) {
      setError('Không thể thực hiện thao tác. Vui lòng thử lại.');
      console.error('Error submitting user:', error);
    }
  };

  // Xử lý xóa user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await apiService.delete(`/api/admin/users/${selectedUser.id}`);
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      updateUserCache(updatedUsers);
      setSuccessMessage('Xóa người dùng thành công');
      setDeleteDialogOpen(false);
    } catch (error) {
      setError('Không thể xóa người dùng. Vui lòng thử lại.');
      console.error('Error deleting user:', error);
    }
  };

  // Xử lý mở dialog thêm/sửa
  const handleOpenUserDialog = (user = null) => {
    setSelectedUser(user);
    setDialogMode(user ? 'edit' : 'add');
    setOpenDialog(true);
  };

  // Xử lý thay đổi role
  const handleRoleChange = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
      await apiService.put(`/api/admin/users/${userId}/role`, { role: newRole });
      
      // Cập nhật state local
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, role: newRole };
        }
        return u;
      }));

      setSuccessMessage(`Đã thay đổi quyền thành ${newRole}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Fetch lại dữ liệu sau khi cập nhật
      await fetchUsers();
    } catch (error) {
      setError('Không thể thay đổi quyền người dùng');
      console.error('Error updating user role:', error);
    }
  };

  // Xử lý thay đổi trạng thái
  const handleStatusChange = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await apiService.put(`/api/admin/users/${userId}/status`, {
        status: newStatus
      });
      
      if (response) {
        // Cập nhật state local
        setUsers(users.map(u => {
          if (u.id === userId) {
            return { ...u, ...response };
          }
          return u;
        }));

        setSuccessMessage(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Fetch lại dữ liệu
        await fetchUsers();
      }
    } catch (error) {
      setError(error.message || 'Không thể cập nhật trạng thái người dùng');
      console.error('Error updating user status:', error);
    }
  };

  // Effect hooks
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails || userDetails.role !== 'Admin') {
      setError('Bạn không có quyền truy cập trang này');
      return;
    }
    fetchUsers();
  }, []);

  // Effect để xử lý filter và search
  useEffect(() => {
    processAndUpdateUsers(users);
  }, [search, roleFilter, users, rowsPerPage]);

  // Render phần data đã được xử lý
  const currentUsers = processedUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const updateUserCache = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('cachedUsers', JSON.stringify(updatedUsers));
  };

  return (
    <div className="layout-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="user-management">
          <div className="toolbar">
            <div className="d-flex align-items-center gap-3">
              <h4 className="mb-0">Quản lý Người dùng</h4>
              <div className="input-group search-field">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm người dùng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ maxWidth: '150px' }}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="user">Người dùng</option>
                </select>
              </div>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => fetchUsers()}
                title="Tải lại dữ liệu"
              >
                <RefreshIcon fontSize="small" />
              </button>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleOpenUserDialog()}
            >
              <AddIcon className="me-2" />
              Thêm người dùng
            </button>
          </div>

          {isDataStale && (
            <div className="alert alert-warning" role="alert">
              Dữ liệu có thể đã cũ. 
              <button 
                className="btn btn-link"
                onClick={() => fetchUsers()}
              >
                Cập nhật ngay
              </button>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}
          
          {loading ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'Admin' ? 'bg-primary' : 'bg-secondary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                          {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td>{user.created_at}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenUserDialog(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={user.id === currentUser?.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-container">
            <div className="pagination-controls-container">
              <div className="rows-per-page">
                <span>Hiển thị</span>
                <select 
                  className="form-select"
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>người dùng mỗi trang</span>
              </div>
              
              <div className="pagination-info">
                Hiển thị {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, processedUsers.length)} trong số {processedUsers.length} người dùng
              </div>
            </div>

            <div className="pagination-controls">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <PrevIcon fontSize="small" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                <NextIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Dialog thêm/sửa user */}
      <UserDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={handleUserSubmit}
        mode={dialogMode}
      />

      {/* Dialog xác nhận xóa */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa người dùng này?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UserManagement;
