import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, InputGroup, Badge, Card } from 'react-bootstrap';
import { appConfigService } from '../../services/app-config.service';
import Sidebar from '../common/Sidebar';
import { 
  FaKey, FaEye, FaEyeSlash, FaTag, FaPalette, FaRuler, 
  FaCog, FaStore, FaSync, FaTrash, FaSave, FaPlus
} from 'react-icons/fa';
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
    depotId: '',
    product_names: [],
    colors: [],
    sizes: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPancakeToken, setShowPancakeToken] = useState(false);
  const [showNhanhToken, setShowNhanhToken] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');

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
        depotId: config.depotId || '',
        product_names: config.product_names || [],
        colors: config.colors || [],
        sizes: config.sizes || []
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
        depotId: '',
        product_names: [],
        colors: [],
        sizes: []
      });
      setSuccess('Xóa cấu hình thành công!');
    } catch (error) {
      setError('Lỗi khi xóa: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const addProductName = () => {
    if (newProductName.trim()) {
      setFormData(prev => ({
        ...prev,
        product_names: [...prev.product_names, newProductName.trim()]
      }));
      setNewProductName('');
    }
  };

  const addColor = () => {
    if (newColor.trim()) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  const addSize = () => {
    if (newSize.trim()) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()]
      }));
      setNewSize('');
    }
  };

  const removeProductName = (index) => {
    setFormData(prev => ({
      ...prev,
      product_names: prev.product_names.filter((_, i) => i !== index)
    }));
  };

  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const removeSize = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const handleEnterKey = (e, actionFn) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      actionFn();
    }
  };

  return (
    <div className="layout-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Container className="config-container py-3">
          <h2 className="text-center mb-4">Cấu hình Ứng dụng</h2>

          {error && (
            <Alert variant="danger" className="animate__fadeIn mb-3">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="animate__fadeIn mb-3">
              {success}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <input type="hidden" name="company_id" value={formData.company_id} />
              
              <Row>
                {/* Cột trái - Cấu hình API */}
                <Col lg={6} className="mb-3">
                  {/* Pancake */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header>
                      <div className="card-header-icon">
                        <FaCog className="text-primary" />
                      </div>
                      <span>Cấu hình Pancake</span>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Access Token (Pancake)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaKey />
                          </InputGroup.Text>
                          <Form.Control
                            type={showPancakeToken ? "text" : "password"}
                            name="access_token"
                            value={formData.access_token}
                            onChange={handleChange}
                            required
                            placeholder="Nhập access token"
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => setShowPancakeToken(!showPancakeToken)}
                          >
                            {showPancakeToken ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Nhanh.vn */}
                  <Card className="shadow-sm">
                    <Card.Header>
                      <div className="card-header-icon">
                        <FaStore className="text-success" />
                      </div>
                      <span>Cấu hình Nhanh.vn</span>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Version</Form.Label>
                        <Form.Control
                          type="text"
                          name="version"
                          value={formData.version}
                          onChange={handleChange}
                          placeholder="Nhập version (tùy chọn)"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>App ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="appId"
                          value={formData.appId}
                          onChange={handleChange}
                          placeholder="Nhập App ID (tùy chọn)"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Business ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="businessId"
                          value={formData.businessId}
                          onChange={handleChange}
                          placeholder="Nhập Business ID (tùy chọn)"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Access Token (Nhanh.vn)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaKey />
                          </InputGroup.Text>
                          <Form.Control
                            type={showNhanhToken ? "text" : "password"}
                            name="accessToken"
                            value={formData.accessToken}
                            onChange={handleChange}
                            placeholder="Nhập Access Token (tùy chọn)"
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => setShowNhanhToken(!showNhanhToken)}
                          >
                            {showNhanhToken ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Depot ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="depotId"
                          value={formData.depotId}
                          onChange={handleChange}
                          placeholder="Nhập Depot ID (tùy chọn)"
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
                
                {/* Cột phải - Cấu hình Dữ liệu */}
                <Col lg={6}>
                  {/* Tên sản phẩm */}
                  <Card className="mb-3">
                    <Card.Header>
                      <div className="card-icon">
                        <FaTag className="text-info" />
                      </div>
                      Tên sản phẩm
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <InputGroup>
                          <Form.Control
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="Nhập tên sản phẩm"
                            onKeyDown={(e) => handleEnterKey(e, addProductName)}
                          />
                          <Button 
                            variant="outline-primary" 
                            onClick={addProductName}
                            className="add-btn"
                          >
                            <FaPlus className="me-1" />Thêm
                          </Button>
                        </InputGroup>
                      </div>
                      <div className="tag-container">
                        {formData.product_names.length === 0 ? (
                          <div className="empty-message">
                            Chưa có tên sản phẩm nào
                          </div>
                        ) : (
                          formData.product_names.map((name, index) => (
                            <Badge 
                              key={index} 
                              bg="secondary" 
                              className="tag-item"
                            >
                              {name}
                              <span 
                                className="ms-2 remove-tag" 
                                onClick={() => removeProductName(index)}
                              >
                                &times;
                              </span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                  
                  {/* Màu sắc */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header>
                      <div className="card-header-icon">
                        <FaPalette className="text-warning" />
                      </div>
                      <span>Màu sắc</span>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <InputGroup>
                          <Form.Control
                            type="text"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            placeholder="Nhập màu sắc"
                            onKeyDown={(e) => handleEnterKey(e, addColor)}
                          />
                          <Button 
                            variant="outline-primary" 
                            onClick={addColor}
                            className="add-btn"
                          >
                            <FaPlus className="me-1" /> Thêm
                          </Button>
                        </InputGroup>
                      </div>
                      <div className="tag-container">
                        {formData.colors.length === 0 ? (
                          <div className="text-muted w-100 text-center d-flex align-items-center justify-content-center">
                            Chưa có màu sắc nào
                          </div>
                        ) : (
                          formData.colors.map((color, index) => (
                            <Badge 
                              key={index} 
                              bg="secondary" 
                              className="tag-item"
                            >
                              {color}
                              <span 
                                className="ms-2 remove-tag" 
                                onClick={() => removeColor(index)}
                              >
                                &times;
                              </span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                  
                  {/* Kích cỡ */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header>
                      <div className="card-header-icon">
                        <FaRuler className="text-danger" />
                      </div>
                      <span>Kích cỡ</span>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <InputGroup>
                          <Form.Control
                            type="text"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            placeholder="Nhập kích cỡ"
                            onKeyDown={(e) => handleEnterKey(e, addSize)}
                          />
                          <Button 
                            className="add-btn"
                            variant="outline-primary" 
                            onClick={addSize}
                            
                          >
                            <FaPlus className="me-1" /> Thêm
                          </Button>
                        </InputGroup>
                      </div>
                      <div className="tag-container">
                        {formData.sizes.length === 0 ? (
                          <div className="text-muted w-100 text-center d-flex align-items-center justify-content-center">
                            Chưa có kích cỡ nào
                          </div>
                        ) : (
                          formData.sizes.map((size, index) => (
                            <Badge 
                              key={index} 
                              bg="secondary" 
                              className="tag-item"
                            >
                              {size}
                              <span 
                                className="ms-2 remove-tag" 
                                onClick={() => removeSize(index)}
                              >
                                &times;
                              </span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="d-flex justify-content-center gap-3 mt-4">
                {isEditing && (
                  <Button 
                    variant="outline-danger" 
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4"
                  >
                    <FaTrash className="me-2" /> Xóa cấu hình
                  </Button>
                )}
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                  className="px-4"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang xử lý...
                    </>
                  ) : isEditing ? (
                    <>
                      <FaSync className="me-2" /> Cập nhật
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" /> Tạo mới
                    </>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Container>
      </main>
    </div>
  );
}

export default AppConfig; 