import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Google, Facebook } from '@mui/icons-material';
import { TEST_ACCOUNTS, mockLoginWithEmail } from '../utils/mockData';
import viteLogo from '/vite.svg';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const handleDemoLogin = async (accountType) => {
    const account = TEST_ACCOUNTS[accountType];
    try {
      await mockLoginWithEmail(account.email, account.password);
      navigate('/search');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!isLogin && !formData.username) {
      newErrors.username = 'Tên người dùng là bắt buộc';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await mockLoginWithEmail(formData.email, formData.password);
        navigate('/search');
      } catch (error) {
        setLoginError(error.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row h-100 align-items-center justify-content-center">
        {/* Left side - Introduction */}
        <div className="col-12 col-md-6 text-center intro-section">
          <div className="p-4">
            <img src={viteLogo} alt="Vite logo" style={{ width: '64px' }} className="mb-3" />
            <h4 className="mb-3">Hệ thống quản lý hình ảnh chuyên nghiệp</h4>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-body p-4">
              {loginError && (
                <div className="alert alert-danger" role="alert">
                  {loginError}
                </div>
              )}

              <div className="text-center mb-4">
                <h3>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h3>
                <p className="text-muted">
                  {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label">Tên người dùng</label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                    {errors.username && (
                      <div className="invalid-feedback">{errors.username}</div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>
                </div>

                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">{errors.confirmPassword}</div>
                    )}
                  </div>
                )}

                {isLogin && (
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="remember" />
                      <label className="form-check-label" htmlFor="remember">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>
                    <a href="#" className="text-decoration-none">Quên mật khẩu?</a>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 mb-3">
                  {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                </button>

                <div className="text-center mb-3">
                  <div className="position-relative">
                    <hr className="my-4" />
                    <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted">
                      Hoặc đăng nhập với
                    </span>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={() => handleDemoLogin('user')}
                    >
                      <Google className="me-2" />
                      Google
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={() => handleDemoLogin('admin')}
                    >
                      <Facebook className="me-2" />
                      Facebook
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="mb-0">
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <a
                      href="#"
                      className="text-decoration-none"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsLogin(!isLogin);
                        setFormData({
                          username: '',
                          email: '',
                          password: '',
                          confirmPassword: ''
                        });
                        setErrors({});
                      }}
                    >
                      {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
  