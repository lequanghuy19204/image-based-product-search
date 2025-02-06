import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import viteLogo from '/vite.svg';
import '../styles/Login.css';
import { authService } from '../services/auth.service';
import { Form, Button } from 'react-bootstrap';

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
  const [accountType, setAccountType] = useState('user');
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [generatedCompanyCode, setGeneratedCompanyCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const generateCompanyCode = async () => {
    try {
      setIsGeneratingCode(true);
      const response = await authService.generateCompanyCode();
      setGeneratedCompanyCode(response.company_code);
    } catch (error) {
      console.error('Lỗi khi tạo mã công ty:', error);
    } finally {
      setIsGeneratingCode(false);
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

    if (!isLogin) {
      if (accountType === 'admin' && !companyName) {
        newErrors.companyName = 'Tên công ty là bắt buộc';
      }
      if (accountType === 'user' && !companyCode) {
        newErrors.companyCode = 'Mã công ty là bắt buộc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateForm()) return;

    try {
        setIsLoading(true);
        if (isLogin) {
            // Xử lý đăng nhập
            const response = await authService.login(
                formData.email,
                formData.password,
                rememberMe
            );
            
            if (response.access_token) {
                // Lưu token và thông tin user
                localStorage.setItem('token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
                if (rememberMe) {
                    localStorage.setItem('rememberedLogin', 'true');
                }
                navigate('/search');
            }
        } else {
            // Xử lý đăng ký
            const company_code = accountType === 'admin' ? generatedCompanyCode : companyCode;
            
            const userData = {
                username: formData.username || formData.email.split('@')[0],
                email: formData.email,
                password: formData.password,
                role: accountType === 'admin' ? "Admin" : "User",
                company_code: company_code,
                company_name: accountType === 'admin' ? companyName : undefined
            };

            const response = await authService.register(userData);
            if (response.access_token) {
                localStorage.setItem('token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/search');
            }
        }
    } catch (error) {
        console.error('Lỗi:', error);
        setLoginError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
        setIsLoading(false);
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

  useEffect(() => {
    if (!isLogin && accountType === 'admin') {
      generateCompanyCode();
    }
  }, [isLogin, accountType]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rememberedLogin = localStorage.getItem('rememberedLogin');
    
    if (token && rememberedLogin === 'true') {
      navigate('/search');
    }
  }, [navigate]);

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

              <Form onSubmit={handleSubmit}>
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

                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label">Loại tài khoản</label>
                    <div className="account-type-selector">
                      <div
                        className={`account-type-option ${accountType === 'user' ? 'selected' : ''}`}
                        onClick={() => setAccountType('user')}
                      >
                        <i className="fas fa-user"></i>
                        <span>Người dùng</span>
                      </div>
                      <div
                        className={`account-type-option ${accountType === 'admin' ? 'selected' : ''}`}
                        onClick={() => setAccountType('admin')}
                      >
                        <i className="fas fa-user-tie"></i>
                        <span>Quản trị viên</span>
                      </div>
                    </div>
                  </div>
                )}

                {!isLogin && accountType === 'admin' && (
                  <div className="mb-3">
                    <label className="form-label">Tên công ty</label>
                    <input
                      type="text"
                      className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nhập tên công ty"
                    />
                    {errors.companyName && (
                      <div className="invalid-feedback">{errors.companyName}</div>
                    )}
                    
                    <div className="company-code-display mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="code-label">Mã công ty</span>
                        <button 
                          type="button"
                          className="code-copy-btn d-flex align-items-center gap-1"
                          onClick={generateCompanyCode}
                          disabled={isGeneratingCode}
                        >
                          <i className="fas fa-sync-alt"></i>
                          {isGeneratingCode ? 'Đang tạo...' : 'Tạo mã mới'}
                        </button>
                      </div>
                      <div className="generated-code-container">
                        {isGeneratingCode ? (
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="text-muted small">Đang tạo mã...</span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="generated-code">{generatedCompanyCode || 'Chưa có mã'}</span>
                            {generatedCompanyCode && (
                              <button
                                type="button"
                                className="code-copy-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedCompanyCode);
                                }}
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!isLogin && accountType === 'user' && (
                  <div className="mb-3">
                    <label className="form-label">Mã công ty</label>
                    <input
                      type="text"
                      className={`form-control ${errors.companyCode ? 'is-invalid' : ''}`}
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã công ty"
              
                    />
                    {errors.companyCode && (
                      <div className="invalid-feedback">{errors.companyCode}</div>
                    )}
                  </div>
                )}

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Ghi nhớ đăng nhập"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Button>

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
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
