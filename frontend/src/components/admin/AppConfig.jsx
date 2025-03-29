import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { appConfigService } from '../../services/app-config.service';
import Sidebar from '../common/Sidebar';
import '../../styles/AppConfig.css';

function AppConfig() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [appConfig, setAppConfig] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    access_token: '',
    version: '',
    appId: '',
    businessId: '',
    accessToken: '',
    depotId: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const cachedData = localStorage.getItem('userDetails');
    if (cachedData) {
      const userData = JSON.parse(cachedData);
      setUserDetails(userData);
      setFormData(prev => ({
        ...prev,
        company_id: userData.company_id || ''
      }));
    }
  }, []);

  // Lấy cấu hình hiện tại nếu có
  useEffect(() => {
    if (userDetails?.company_id) {
      fetchAppConfig(userDetails.company_id);
    }
  }, [userDetails]);

  const fetchAppConfig = async (companyId) => {
    try {
      setLoading(true);
      const config = await appConfigService.getAppConfig(companyId);
      setAppConfig(config);
      setFormData({
        company_id: config.company_id,
        access_token: config.access_token || '',
        version: config.version || '',
        appId: config.appId || '',
        businessId: config.businessId || '',
        accessToken: config.accessToken || '',
        depotId: config.depotId || ''
      });
      setIsEditing(true);
    } catch (error) {
      if (error.response?.status !== 404) {
        setError('Lỗi khi lấy cấu hình: ' + (error.response?.data?.detail || error.message));
      }
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing) {
        await appConfigService.updateAppConfig(appConfig.id, formData);
        setSuccess('Cập nhật cấu hình thành công!');
      } else {
        const result = await appConfigService.createAppConfig(formData);
        setAppConfig(result);
        setIsEditing(true);
        setSuccess('Tạo cấu hình thành công!');
      }
    } catch (error) {
      setError('Lỗi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình này không?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const configId = appConfig?._id || appConfig?.id;
      
      if (!configId) {
        throw new Error('Không tìm thấy ID cấu hình');
      }
      
      await appConfigService.deleteAppConfig(configId);
      
      setAppConfig(null);
      setIsEditing(false);
      setFormData({
        company_id: userDetails?.company_id || '',
        access_token: '',
        version: '',
        appId: '',
        businessId: '',
        accessToken: '',
        depotId: ''
      });
      setSuccess('Xóa cấu hình thành công!');
    } catch (error) {
      setError('Lỗi khi xóa: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-config-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Container className="py-4">
          <h2 className="mb-4">Cấu hình Ứng dụng</h2>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Card>
            <Card.Header>
              <h5 className="mb-0">{isEditing ? 'Chỉnh sửa cấu hình' : 'Tạo cấu hình mới'}</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Công ty</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        value={userDetails?.company_name || ''}
                        disabled
                      />
                      <Form.Control
                        type="hidden"
                        name="company_id"
                        value={formData.company_id}
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Access Token (Pancake)</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="access_token"
                        value={formData.access_token}
                        onChange={handleChange}
                        required
                        placeholder="Nhập access token"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Version</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleChange}
                        placeholder="Nhập version (tùy chọn)"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>App ID</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="appId"
                        value={formData.appId}
                        onChange={handleChange}
                        placeholder="Nhập App ID (tùy chọn)"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Business ID</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="businessId"
                        value={formData.businessId}
                        onChange={handleChange}
                        placeholder="Nhập Business ID (tùy chọn)"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Access Token (Nhanh.vn)</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="accessToken"
                        value={formData.accessToken}
                        onChange={handleChange}
                        placeholder="Nhập Access Token bổ sung (tùy chọn)"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={3}>Depot ID</Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="text"
                        name="depotId"
                        value={formData.depotId}
                        onChange={handleChange}
                        placeholder="Nhập Depot ID (tùy chọn)"
                      />
                    </Col>
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    {isEditing && (
                      <Button 
                        variant="danger" 
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        Xóa cấu hình
                      </Button>
                    )}
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={loading}
                    >
                      {isEditing ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
}

export default AppConfig; 