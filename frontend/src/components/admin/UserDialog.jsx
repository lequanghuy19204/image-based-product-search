import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

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
  const [submitting, setSubmitting] = useState(false);
  const [currentUser] = useState(null);

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
    
    // Validate username
    if (!formData.username) {
      newErrors.username = 'Vui lòng nhập tên người dùng';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password for new users
    if (mode === 'add') {
      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    // Validate role
    if (!formData.role) {
      newErrors.role = 'Vui lòng chọn vai trò';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      if (error.message.includes('Email đã được sử dụng')) {
        setErrors(prev => ({
          ...prev,
          email: 'Email này đã được đăng ký'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          submit: error.message || 'Có lỗi xảy ra'
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={open} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Tên người dùng *</label>
            <input
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (errors.email) setErrors({...errors, email: ''});
              }}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {mode === 'add' && (
            <div className="mb-3">
              <label className="form-label">Mật khẩu *</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Vai trò *</label>
            <select
              className={`form-select ${errors.role ? 'is-invalid' : ''}`}
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="User">Người dùng</option>
              <option value="Admin">Quản trị viên</option>
            </select>
            {errors.role && (
              <div className="invalid-feedback">{errors.role}</div>
            )}
          </div>

          {errors.submit && (
            <div className="alert alert-danger">{errors.submit}</div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              mode === 'add' ? 'Thêm' : 'Cập nhật'
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
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