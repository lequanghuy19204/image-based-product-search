import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Link,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Facebook
} from '@mui/icons-material';
import { TEST_ACCOUNTS, mockLoginWithEmail } from '../utils/mockData';
import '../styles/Login.css';
import viteLogo from '/vite.svg';

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
    <Container component="main" maxWidth="lg" className="login-container">
      <Grid container spacing={2} className="login-wrapper">
        {/* Left side - Introduction */}
        <Grid item xs={12} md={6} className="login-left">
          <Box className="intro-content">
            <img src={viteLogo} className="logo" alt="Vite logo" />
            <Typography variant="h5">
              Hệ thống quản lý hình ảnh chuyên nghiệp
            </Typography>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="body1" gutterBottom>
                Đăng nhập nhanh với tài khoản mẫu:
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => handleDemoLogin('admin')}
                sx={{ mb: 1 }}
              >
                Admin (admin@test.com / admin123)
              </Button>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => handleDemoLogin('user')}
              >
                User (user@test.com / user123)
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Right side - Login Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="form-paper">
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            
            <Box className="form-header">
              <Typography variant="h4" component="h2">
                {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} className="form-content">
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Tên người dùng"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  margin="normal"
                />
              )}

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Mật khẩu"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {!isLogin && (
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  margin="normal"
                />
              )}

              {isLogin && (
                <Box className="login-options">
                  <FormControlLabel
                    control={<Checkbox color="primary" />}
                    label="Ghi nhớ đăng nhập"
                  />
                  <Link href="#" variant="body2">
                    Quên mật khẩu?
                  </Link>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className="submit-button"
              >
                {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
              </Button>

              <Box className="social-login">
                <Divider>
                  <Typography variant="body2" color="textSecondary">
                    Hoặc đăng nhập với
                  </Typography>
                </Divider>
                <Box className="social-buttons">
                  <Button
                    variant="outlined"
                    startIcon={<Google />}
                    fullWidth
                  >
                    Google
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Facebook />}
                    fullWidth
                  >
                    Facebook
                  </Button>
                </Box>
              </Box>

              <Box className="form-footer">
                <Typography variant="body2">
                  {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                  <Link
                    href="#"
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
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Login;
  