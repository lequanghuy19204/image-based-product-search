import { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Facebook
} from '@mui/icons-material';
import '../styles/Login.css';
import viteLogo from '/vite.svg';
import { loginWithEmail, registerWithEmail, loginWithGoogle, loginWithFacebook } from '../services/authService';
import { generateUniqueCompanyCode } from '../utils/helpers';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: 'user',
    companyName: '',
    companyCode: ''
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialAuthData, setSocialAuthData] = useState(null);
  const [showSocialDataModal, setShowSocialDataModal] = useState(false);
  const [socialFormData, setSocialFormData] = useState({
    role: 'user',
    companyName: '',
    companyCode: ''
  });
  const [generatedSocialCode, setGeneratedSocialCode] = useState('');

  useEffect(() => {
    if (!isLogin && formData.role === 'admin') {
      generateUniqueCompanyCode().then(code => {
        setGeneratedCode(code);
      });
    }
  }, [formData.role, isLogin]);

  useEffect(() => {
    if (showSocialDataModal && socialFormData.role === 'admin') {
      generateUniqueCompanyCode().then(code => {
        setGeneratedSocialCode(code);
      });
    }
  }, [socialFormData.role, showSocialDataModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { userData } = await loginWithEmail(formData.email, formData.password);
        if (userData?.role === 'admin') {
          navigate('/admin/products');
        } else {
          navigate('/search');
        }
      } else {
        const userData = {
          username: formData.username,
          role: formData.role,
          email: formData.email
        };

        if (formData.role === 'admin') {
          userData.company_name = formData.companyName;
          userData.company_code = generatedCode;
        } else {
          userData.company_code = formData.companyCode;
        }

        await registerWithEmail(formData.email, formData.password, userData);
        setIsLogin(true);
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          username: '',
          role: 'user',
          companyName: '',
          companyCode: ''
        });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Tên người dùng là bắt buộc';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }

      if (formData.role === 'admin' && !formData.companyName) {
        newErrors.companyName = 'Tên công ty là bắt buộc';
      }

      if (formData.role === 'user' && !formData.companyCode) {
        newErrors.companyCode = 'Mã công ty là bắt buộc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setFormData(prev => ({
        ...prev,
        role: newRole
      }));
    }
  };

  const handleSocialLogin = async (provider) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await provider();
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin/products');
        } else {
          navigate('/search');
        }
      } else {
        setSocialAuthData({
          user: result.user,
          provider: provider
        });
        setShowSocialDataModal(true);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialFormSubmit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (socialFormData.role === 'admin' && !socialFormData.companyName) {
        throw new Error('Vui lòng nhập tên công ty');
      }
      if (socialFormData.role === 'user' && !socialFormData.companyCode) {
        throw new Error('Vui lòng nhập mã công ty');
      }

      const companyData = {
        companyName: socialFormData.companyName,
        companyCode: socialFormData.role === 'admin' ? generatedSocialCode : socialFormData.companyCode
      };

      const { userData } = await socialAuthData.provider(
        socialFormData.role,
        companyData
      );

      setShowSocialDataModal(false);
      setSocialAuthData(null);
      setSocialFormData({
        role: 'user',
        companyName: '',
        companyCode: ''
      });

      if (userData.role === 'admin') {
        navigate('/admin/products');
      } else {
        navigate('/search');
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setSocialFormData({
        ...socialFormData,
        role: newRole,
        companyName: '',
        companyCode: ''
      });
    }
  };

  return (
    <Container component="main" maxWidth="lg" className="login-container">
      <Grid container spacing={2} className="login-wrapper">
        <Grid item xs={12} md={6} className="login-left">
          <Box className="intro-content">
            <img src={viteLogo} className="logo" alt="Vite logo" />
            <Typography variant="h5">
              Hệ thống quản lý hình ảnh chuyên nghiệp
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="form-paper">
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
                <>
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

                  <ToggleButtonGroup
                    value={formData.role}
                    exclusive
                    onChange={handleRoleChange}
                    fullWidth
                    sx={{ mt: 2, mb: 2 }}
                  >
                    <ToggleButton value="user">
                      Người dùng
                    </ToggleButton>
                    <ToggleButton value="admin">
                      Quản trị viên
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {formData.role === 'admin' ? (
                    <>
                      <TextField
                        fullWidth
                        label="Tên công ty"
                        name="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        error={!!errors.companyName}
                        helperText={errors.companyName}
                        margin="normal"
                      />
                      {generatedCode && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Mã công ty: {generatedCode}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <TextField
                      fullWidth
                      label="Mã công ty"
                      name="companyCode"
                      value={formData.companyCode}
                      onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                      error={!!errors.companyCode}
                      helperText={errors.companyCode}
                      margin="normal"
                    />
                  )}
                </>
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

              {errors.submit && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.submit}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  isLogin ? 'Đăng nhập' : 'Đăng ký'
                )}
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
                    onClick={() => handleSocialLogin(loginWithGoogle)}
                    disabled={loading}
                  >
                    Google
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Facebook />}
                    fullWidth
                    onClick={() => handleSocialLogin(loginWithFacebook)}
                    disabled={loading}
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
                        email: '',
                        password: '',
                        confirmPassword: '',
                        username: '',
                        role: 'user',
                        companyName: '',
                        companyCode: ''
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

      <Dialog 
        open={showSocialDataModal} 
        onClose={() => !loading && setShowSocialDataModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Thông tin bổ sung
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ToggleButtonGroup
              value={socialFormData.role}
              exclusive
              onChange={handleSocialRoleChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="user">
                Người dùng
              </ToggleButton>
              <ToggleButton value="admin">
                Quản trị viên
              </ToggleButton>
            </ToggleButtonGroup>

            {socialFormData.role === 'admin' ? (
              <>
                <TextField
                  fullWidth
                  label="Tên công ty"
                  value={socialFormData.companyName}
                  onChange={(e) => setSocialFormData({
                    ...socialFormData,
                    companyName: e.target.value
                  })}
                  margin="normal"
                />
                {generatedSocialCode && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Mã công ty: {generatedSocialCode}
                  </Typography>
                )}
              </>
            ) : (
              <TextField
                fullWidth
                label="Mã công ty"
                value={socialFormData.companyCode}
                onChange={(e) => setSocialFormData({
                  ...socialFormData,
                  companyCode: e.target.value
                })}
                margin="normal"
              />
            )}

            {errors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSocialDataModal(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSocialFormSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Login;
  