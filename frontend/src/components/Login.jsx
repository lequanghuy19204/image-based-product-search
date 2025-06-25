import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { authService } from '../services/auth.service';
import { Form } from 'react-bootstrap';

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
  const [emailError, setEmailError] = useState('');

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

  const checkExistingEmail = async (email) => {
    try {
      const response = await authService.checkEmail(email);
      if (response.exists) {
        setErrors(prev => ({
          ...prev,
          email: 'Email này đã được đăng ký'
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setErrors({});
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      if (isLogin) {
        const response = await authService.login(
          formData.email,
          formData.password,
          rememberMe
        );
        
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          if (rememberMe) {
            localStorage.setItem('rememberedLogin', 'true');
          }
          navigate('/search');
        }
      } else {
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
      if (error.message.includes('Email đã được sử dụng')) {
        setErrors(prev => ({
          ...prev,
          email: 'Email này đã được đăng ký'
        }));
      } else {
        setLoginError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
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
    if (name === 'email') {
      setEmailError('');
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
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
    <div className={`login-container ${isLogin ? 'login-mode' : 'signup-mode'}`}>
      {/* Background image side */}
      <div className={`image-side ${isLogin ? 'left-image' : 'right-image'}`} />

      {/* Form side */}
      <div className="form-side">
        <div className="form-wrapper">
          {loginError && (
            <div className="alert alert-danger" role="alert">
              {loginError}
            </div>
          )}

          <div className="form-header">
            <h1>{isLogin ? 'Welcome back!' : 'Get Started Now'}</h1>
            <p>{isLogin ? 'Enter your Credentials to access your account' : 'Create your account to get started'}</p>
          </div>

          <Form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-field">
                <label>Name</label>
                <div className={`input-container ${errors.username ? 'is-invalid' : ''}`}>
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your name"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.username && (
                  <div className="invalid-feedback">{errors.username}</div>
                )}
              </div>
            )}

            <div className="form-field">
              <label>Email address</label>
              <div className={`input-container ${errors.email ? 'is-invalid' : ''}`}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            <div className="form-field">
              <div className="password-label-container">
                <label>Password</label>
              </div>
              <div className={`input-container ${errors.password ? 'is-invalid' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            {!isLogin && (
              <div className="form-field">
                <label>Confirm Password</label>
                <div className={`input-container ${errors.confirmPassword ? 'is-invalid' : ''}`}>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>
            )}

            {!isLogin && (
              <div className="form-field">
                <label>Account Type</label>
                <div className="account-type-selector">
                  <div
                    className={`account-type-option ${accountType === 'user' ? 'selected' : ''}`}
                    onClick={() => setAccountType('user')}
                  >
                    <span>User</span>
                  </div>
                  <div
                    className={`account-type-option ${accountType === 'admin' ? 'selected' : ''}`}
                    onClick={() => setAccountType('admin')}
                  >
                    <span>Admin</span>
                  </div>
                </div>
              </div>
            )}

            {!isLogin && accountType === 'admin' && (
              <div className="form-field">
                <label>Company Name</label>
                <div className={`input-container ${errors.companyName ? 'is-invalid' : ''}`}>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                {errors.companyName && (
                  <div className="invalid-feedback">{errors.companyName}</div>
                )}
                
                <div className="company-code-display">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="code-label">Company Code</span>
                    <button 
                      type="button"
                      className="code-generate-btn"
                      onClick={generateCompanyCode}
                      disabled={isGeneratingCode}
                    >
                      <i className="fas fa-sync-alt"></i>
                      {isGeneratingCode ? 'Generating...' : 'Generate new code'}
                    </button>
                  </div>
                  <div className="generated-code-container">
                    {isGeneratingCode ? (
                      <div className="code-loading">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>Generating code...</span>
                      </div>
                    ) : (
                      <div className="code-display">
                        <span className="generated-code">{generatedCompanyCode || 'No code yet'}</span>
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
              <div className="form-field">
                <label>Company Code</label>
                <div className={`input-container ${errors.companyCode ? 'is-invalid' : ''}`}>
                  <input
                    type="text"
                    placeholder="Enter company code"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  />
                </div>
                {errors.companyCode && (
                  <div className="invalid-feedback">{errors.companyCode}</div>
                )}
              </div>
            )}

            <div className="form-checkbox">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  {isLogin ? 'Remember for 30 days' : 'I agree to the terms & policy'}
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Signup'}
            </button>

            <div className="form-divider">
              <span>Or</span>
            </div>

            <div className="switch-form-type">
              <p>
                {isLogin ? "Don't have an account? " : "Have an account? "}
                <a
                  href="#"
                  onClick={toggleMode}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </a>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
