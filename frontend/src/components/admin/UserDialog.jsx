import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

function UserDialog({ open, onClose, user, onSubmit, mode = 'add' }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User',
    company_name: '',
    company_code: '',
    company_id: ''
  });
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy thông tin user hiện tại từ localStorage
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (userDetails && mode === 'add') {
      setFormData(prev => ({
        ...prev,
        company_id: userDetails.company_id
      }));
    }
  }, [mode]);

  // Set data khi edit
  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        password: '' // Không hiển thị mật khẩu cũ
      });
    }
  }, [user, mode]);

  // Reset form khi đóng dialog
  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'User',
      company_name: currentUser?.company_name || '',
      company_code: currentUser?.company_code || '',
      company_id: ''
    });
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Vui lòng nhập tên người dùng';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (mode === 'add' && !formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    if (!formData.role) newErrors.role = 'Vui lòng chọn vai trò';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Tên người dùng"
          fullWidth
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
        />
        {mode === 'add' && (
          <TextField
            margin="dense"
            label="Mật khẩu"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password}
          />
        )}
        <FormControl fullWidth margin="dense">
          <InputLabel>Vai trò</InputLabel>
          <Select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            error={!!errors.role}
          >
            <MenuItem value="User">Người dùng</MenuItem>
            <MenuItem value="Admin">Quản trị viên</MenuItem>
          </Select>
        </FormControl>
        
        {/* Hiển thị thông tin công ty readonly */}
        {mode !== 'add' && (
          <>
            <TextField
              margin="dense"
              label="Tên công ty"
              fullWidth
              value={formData.company_name}
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
            <TextField
              margin="dense"
              label="Mã công ty"
              fullWidth
              value={formData.company_code}
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {mode === 'add' ? 'Thêm' : 'Cập nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  user: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit'])
};

export default UserDialog; 