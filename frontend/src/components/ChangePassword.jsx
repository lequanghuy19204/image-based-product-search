import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';

function ChangePassword() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Kiểm tra mật khẩu mới và xác nhận
    if (passwords.new_password !== passwords.confirm_password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await apiService.post('/api/users/change-password', passwords);
      setSuccess('Đổi mật khẩu thành công');
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setError(error.message || 'Không thể đổi mật khẩu');
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Đổi mật khẩu</h5>
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
              <Form.Label>Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                value={passwords.current_password}
                onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Xác nhận mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                Đổi mật khẩu
              </Button>
              <Button 
                variant="secondary" 
                type="button"
                onClick={() => navigate('/search')}
              >
                Hủy
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ChangePassword; 