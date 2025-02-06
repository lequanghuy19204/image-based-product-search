import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    role: '',
    company_name: '',
    company_code: '',
    status: '',
    created_at: '',
    updated_at: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiService.get('/api/users/profile');
      setProfile(data);
    } catch (error) {
      setError('Không thể tải thông tin hồ sơ', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await apiService.put('/api/users/profile', {
        username: profile.username,
        email: profile.email
      });
      
      setSuccess('Cập nhật thông tin thành công');
      setTimeout(() => setSuccess(''), 2000);
      setIsEditing(false);
      setProfile(response.user);
    } catch (error) {
      setError(error.message || 'Không thể cập nhật thông tin');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Hồ sơ của tôi</h5>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/search')}
          >
            Quay lại
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tên người dùng</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên người dùng mới"
                value={profile.username || ''}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                required
                maxLength={50}
                isInvalid={!profile.username}
              />
              <Form.Text className="text-muted">
                Tên người dùng có thể thay đổi (tối đa 50 ký tự)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email mới"
                value={profile.email || ''}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                required
                isInvalid={!profile.email}
              />
              <Form.Text className="text-muted">
                Địa chỉ email hợp lệ (có thể dùng để đăng nhập)
              </Form.Text>
            </Form.Group>

            <div className="profile-info-grid">
              <div className="info-card">
                <div className="info-label">Vai trò</div>
                <div className="info-value">{profile.role}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Trạng thái</div>
                <div className={`info-value status-${profile.status}`}>
                  {profile.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </div>
              </div>

              {profile.company_name && (
                <div className="info-card">
                  <div className="info-label">Công ty</div>
                  <div className="info-value">{profile.company_name}</div>
                </div>
              )}

              {profile.company_code && (
                <div className="info-card">
                  <div className="info-label">Mã công ty</div>
                  <div className="info-value">{profile.company_code}</div>
                </div>
              )}

              <div className="info-card">
                <div className="info-label">Ngày tạo</div>
                <div className="info-value">
                  <i className="bi bi-calendar-event me-2"></i>
                  {formatDateTime(profile.created_at)}
                </div>
              </div>

              <div className="info-card">
                <div className="info-label">Cập nhật lần cuối</div>
                <div className="info-value">
                  <i className="bi bi-clock-history me-2"></i>
                  {formatDateTime(profile.updated_at)}
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              {isEditing ? (
                <Button variant="primary" type="submit">
                  Lưu thay đổi
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => navigate('/search')}
              >
                Quay lại
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Profile; 