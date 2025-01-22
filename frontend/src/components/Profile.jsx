import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    role: '',
    company_name: '',
    company_code: ''
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
    try {
      const data = await apiService.put('/api/users/profile', {
        username: profile.username,
        email: profile.email
      });
      setSuccess('Cập nhật thông tin thành công');
      setIsEditing(false);
      setProfile(data.user);
    } catch (error) {
      setError(error.message || 'Không thể cập nhật thông tin');
    }
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
                value={profile.username}
                disabled={!isEditing}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={profile.email}
                disabled={!isEditing}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Control
                type="text"
                value={profile.role}
                disabled
              />
            </Form.Group>

            {profile.company_name && (
              <Form.Group className="mb-3">
                <Form.Label>Công ty</Form.Label>
                <Form.Control
                  type="text"
                  value={profile.company_name}
                  disabled
                />
              </Form.Group>
            )}

            {profile.company_code && (
              <Form.Group className="mb-3">
                <Form.Label>Mã công ty</Form.Label>
                <Form.Control
                  type="text"
                  value={profile.company_code}
                  disabled
                />
              </Form.Group>
            )}

            <div className="d-flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="primary" type="submit">
                    Lưu thay đổi
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/search')}
                  >
                    Quay lại
                  </Button>
                </>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Profile; 