import { useState } from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/UserManagement.css';

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

  // Mock data
  const [users] = useState([
    { 
      id: 1, 
      username: 'admin', 
      email: 'admin@test.com', 
      role: 'admin', 
      status: 'active',
      createdAt: '2024-03-15',
      lastLogin: '2024-03-20 14:30'
    },
    { 
      id: 2, 
      username: 'user1', 
      email: 'user1@test.com', 
      role: 'user', 
      status: 'blocked',
      createdAt: '2024-03-10',
      lastLogin: '2024-03-18 09:15'
    },
    // Thêm users demo khác...
  ]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleToggleStatus = (user) => {
    // Xử lý thay đổi trạng thái user
    console.log('Toggle status:', user);
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = (
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    return matchSearch && matchRole;
  });

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
            </div>
            <button className="btn btn-primary" onClick={() => setOpenDialog(true)}>
              <AddIcon className="me-2" />
              Thêm người dùng
            </button>
          </div>

          <div className="table-container">
            <table className="table table-bordered table-hover align-middle">
              <thead>
                <tr className="bg-primary text-white">
                  <th>Tên người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Đăng nhập cuối</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                  .map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                          {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td>{user.createdAt}</td>
                      <td>{user.lastLogin}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="btn btn-sm btn-icon"
                            onClick={() => setOpenDialog(true)}
                            title="Chỉnh sửa"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button 
                            className="btn btn-sm btn-icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'active' ? 'Khóa' : 'Kích hoạt'}
                          >
                            {user.status === 'active' ? 
                              <BlockIcon fontSize="small" className="text-danger" /> : 
                              <CheckCircleIcon fontSize="small" className="text-success" />
                            }
                          </button>
                          <button 
                            className="btn btn-sm btn-icon"
                            title="Xóa"
                          >
                            <DeleteIcon fontSize="small" className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

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
                  Hiển thị {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredUsers.length)} trong số {filteredUsers.length} người dùng
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
        </div>
      </main>
    </div>
  );
}

export default UserManagement;
