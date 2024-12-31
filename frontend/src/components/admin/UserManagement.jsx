import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  BlockOutlined,
  AdminPanelSettings,
  PersonOutline
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/UserManagement.css';
import { useUser } from '../../contexts/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

function UserManagement() {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      if (!userData || userData.role !== 'admin') {
        navigate('/search');
        return;
      }

      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        let q;

        // Kiểm tra xem có phải là super admin không
        if (userData.companyCode === 'SUPER') {
          q = query(usersRef);
        } else {
          // Kiểm tra company_id tồn tại trước khi sử dụng
          if (!userData.company_id) {
            throw new Error('Không tìm thấy thông tin công ty');
          }
          q = query(usersRef, where('company_id', '==', userData.company_id));
        }

        const querySnapshot = await getDocs(q);
        const usersData = [];

        for (const userDoc of querySnapshot.docs) {
          const user = userDoc.data();
          
          try {
            // Kiểm tra company_id tồn tại trước khi truy vấn
            if (user.company_id) {
              const companyDoc = await getDoc(doc(db, 'companies', user.company_id));
              const companyData = companyDoc.data();

              usersData.push({
                id: userDoc.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status || 'active',
                created_at: user.created_at?.toDate().toLocaleString() || 'N/A',
                updated_at: user.updated_at?.toDate().toLocaleString() || 'N/A',
                company: {
                  id: user.company_id,
                  name: companyData?.company_name || 'N/A',
                  code: companyData?.company_code || 'N/A'
                }
              });
            }
          } catch (error) {
            console.error('Error loading company data:', error);
          }
        }

        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Không thể tải danh sách người dùng: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userData, navigate]);

  // State declarations
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    company_id: '',
  });

  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/search" />;
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin',
        severity: 'error'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Mật khẩu xác nhận không khớp',
        severity: 'error'
      });
      return;
    }

    try {
      // Tạo tài khoản authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Tạo document trong collection users
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: 'active',
        company_id: userData.company_id, // Mặc định là công ty của admin tạo
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Thêm user mới vào state
      const newUser = {
        id: userCredential.user.uid,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: 'active',
        company: {
          id: userData.company_id,
          name: userData.companyName,
          code: userData.companyCode
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUsers([...users, newUser]);

      setSnackbar({
        open: true,
        message: 'Thêm người dùng mới thành công!',
        severity: 'success'
      });

      handleCloseDialog();
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tạo người dùng mới: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Không thể xóa người dùng');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!userData || userData.role !== 'admin') return;

    // Không thể khóa tài khoản của chính mình
    if (user.id === userData.userId) {
      setSnackbar({
        open: true,
        message: 'Không thể khóa tài khoản của chính mình',
        severity: 'error'
      });
      return;
    }

    // Không cho phép khóa tài khoản SUPER admin
    if (user.role === 'admin' && user.company?.code === 'SUPER') {
      setSnackbar({
        open: true,
        message: 'Không thể khóa tài khoản SUPER admin',
        severity: 'error'
      });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      const newStatus = user.status === 'active' ? 'blocked' : 'active';
      
      await updateDoc(userRef, {
        status: newStatus,
        updated_at: serverTimestamp()
      });

      // Cập nhật UI
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));

      setSnackbar({
        open: true,
        message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'khóa'} tài khoản`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      setSnackbar({
        open: true,
        message: 'Không thể thay đổi trạng thái người dùng',
        severity: 'error'
      });
    }
  };

  const handleToggleRole = async (user) => {
    if (!userData || userData.role !== 'admin') return;
    
    // Kiểm tra quyền admin
    if (user.company?.code === 'SUPER' && userData.companyCode !== 'SUPER') {
      setSnackbar({
        open: true,
        message: 'Không thể thay đổi vai trò của admin SUPER',
        severity: 'error'
      });
      return;
    }

    // Không thể thay đổi role của chính mình
    if (user.id === userData.userId) {
      setSnackbar({
        open: true,
        message: 'Không thể thay đổi vai trò của chính mình',
        severity: 'error'
      });
      return;
    }

    // Admin thường chỉ có thể thay đổi role của user trong cùng công ty
    if (userData.companyCode !== 'SUPER' && user.company.id !== userData.company_id) {
      setSnackbar({
        open: true,
        message: 'Bạn chỉ có thể thay đổi vai trò người dùng trong công ty của mình',
        severity: 'error'
      });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      
      await updateDoc(userRef, {
        role: newRole,
        updated_at: serverTimestamp()
      });

      // Cập nhật UI
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      ));

      setSnackbar({
        open: true,
        message: `Đã ${newRole === 'admin' ? 'cấp' : 'thu hồi'} quyền admin`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Không thể thay đổi vai trò người dùng',
        severity: 'error'
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    const matchSearch = 
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.company?.name.toLowerCase().includes(searchLower);
    return matchSearch;
  });

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar 
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <Box className={`user-management ${sidebarOpen ? 'content-shift' : ''}`}>
        <Paper className="toolbar">
          <Typography variant="h5">Quản lý Người dùng</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-field"
              InputProps={{
                startAdornment: <SearchIcon />
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Vai trò"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="user">Người dùng</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Thêm mới
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên người dùng</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Công ty</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Cập nhật lần cuối</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{
                      backgroundColor: user.id === userData.userId ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                      '&:hover': {
                        backgroundColor: user.id === userData.userId 
                          ? 'rgba(25, 118, 210, 0.12)' 
                          : 'rgba(0, 0, 0, 0.04)'
                      },
                      // Thêm border left màu primary cho dòng của user hiện tại
                      borderLeft: user.id === userData.userId 
                        ? '4px solid #1976d2'
                        : 'none',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.id === userData.userId && (
                          <Tooltip title="Tài khoản của bạn">
                            <Chip
                              label="Bạn"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                        {user.username}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={user.role === 'admin' ? <AdminPanelSettings /> : <PersonOutline />}
                        label={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        onClick={() => handleToggleRole(user)}
                        style={{ 
                          cursor: (
                            // SUPER admin có thể thay đổi role của tất cả
                            userData.companyCode === 'SUPER' || 
                            // Admin thường chỉ có thể thay đổi role trong công ty của mình
                            (userData.role === 'admin' && user.company.id === userData.company_id)
                          ) ? 'pointer' : 'default' 
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {user.company.name}
                        <br />
                        <small>Mã: {user.company.code}</small>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={user.status === 'blocked' ? <BlockOutlined /> : null}
                        label={user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        color={user.status === 'active' ? 'success' : 'error'}
                        onClick={() => handleToggleStatus(user)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>{user.created_at}</TableCell>
                    <TableCell>{user.updated_at}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Thêm người dùng mới
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên người dùng"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mật khẩu"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Xác nhận mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    label="Vai trò"
                  >
                    <MenuItem value="user">Người dùng</MenuItem>
                    {userData.companyCode === 'SUPER' && (
                      <MenuItem value="admin">Quản trị viên</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button onClick={handleSubmit} variant="contained">
              Thêm mới
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}

export default UserManagement;
