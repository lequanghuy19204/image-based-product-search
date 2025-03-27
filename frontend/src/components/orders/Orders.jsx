import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Form, InputGroup, Button, Table, 
  Card, Dropdown, OverlayTrigger, Tooltip, Alert, ListGroup, Modal
} from 'react-bootstrap';
import { 
  FaUser, FaPhone, FaMapMarkerAlt, FaHome, FaStickyNote, FaBox, FaSearch, FaTruck, FaCalendarAlt, FaPercent,
  FaTicketAlt, FaCreditCard, FaMoneyBillWave, FaExchangeAlt, FaQuestionCircle, FaChevronDown, FaSync, FaLink, FaKey, FaPaperPlane, FaCheck,
  FaWeight, FaRulerVertical, FaMars, FaVenus, FaStore
} from 'react-icons/fa';
import '../../styles/Orders.css';
import Sidebar from '../common/Sidebar';
import { getOrderSources, createOrderFromConversation, getLocations, searchProducts, getUsers } from '../../services/nhanh.service';

const Orders = () => {
  // console.log('nhanhService methods:', Object.keys(nhanhService));
  const [validated, setValidated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [conversationLink, setConversationLink] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [orderSources, setOrderSources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [targetProvince, setTargetProvince] = useState('');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [targetWard, setTargetWard] = useState('');

  useEffect(() => {
    loadOrderSources();
    loadCities();
    const fetchStaffList = async () => {
      setIsLoadingStaff(true);
      try {
        const response = await getUsers();
        if (response?.users) {
          const staffArray = Object.values(response.users);
          setStaffList(staffArray);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffList();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrderSources = async () => {
    try {
      setIsLoadingSources(true);
      const sources = await getOrderSources();
      setOrderSources(sources);
    } catch (error) {
      console.error('Lỗi khi tải nguồn đơn hàng:', error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const loadCities = async () => {
    try {
      setIsLoadingLocations(true);
      const citiesData = await getLocations('CITY');
      if (citiesData && Array.isArray(citiesData)) {
        setCities(citiesData);
      } else {
        console.error('Dữ liệu thành phố không đúng định dạng:', citiesData);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách thành phố:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };

  const handleCreateOrder = async () => {
    if (!conversationLink) {
      setApiError('Vui lòng nhập Link hội thoại');
      setTimeout(() => setApiError(''), 3000);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);
    setSelectedOrderIndex(null);

    try {
      const response = await createOrderFromConversation(conversationLink);
      
      setApiResponse(response);
      // Nếu chỉ có một kết quả, tự động chọn
      if (Array.isArray(response) && response.length === 1) {
        setSelectedOrderIndex(0);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setApiError(error.response?.data?.detail || error.message || 'Có lỗi xảy ra khi gọi API');
      setTimeout(() => setApiError(''), 3000);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = (index) => {
    setSelectedOrderIndex(index);
  };

  const handleViewDetails = () => {
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
  };

  const handleConfirmOrder = async () => {
    if (selectedOrderIndex !== null && apiResponse) {
      const orderData = apiResponse[selectedOrderIndex];
      
      try {
        // Điền thông tin cơ bản trước
        setCustomerPhone(orderData.phone_number || '');
        setCustomerName(orderData.name_customers || '');
        setCustomerAddress(orderData.full_address || '');
        
        // Lưu thông tin địa chỉ cần tìm
        setTargetProvince(orderData.province || '');
        setTargetDistrict(orderData.district || '');
        setTargetWard(orderData.ward || '');

        // Hàm helper để so sánh tương đối
        const fuzzyMatch = (str1, str2) => {
          if (!str1 || !str2) return false;
          const s1 = str1.toLowerCase().trim();
          const s2 = str2.toLowerCase().trim();
          return s1.includes(s2) || s2.includes(s1);
        };

        // 1. Lấy và chọn thành phố
        if (cities.length > 0 && orderData.province) {
          const cityName = orderData.province.toLowerCase().trim();
          const matchedCity = cities.find(city => fuzzyMatch(city.name, cityName));
          
          if (matchedCity) {
            // 2. Lấy danh sách quận/huyện
            const districtsData = await getLocations('DISTRICT', parseInt(matchedCity.id));
            setDistricts(districtsData);
            setSelectedCity(matchedCity.id);

            // 3. Tìm và chọn quận/huyện
            if (districtsData.length > 0 && orderData.district) {
              const districtName = orderData.district.toLowerCase().trim();
              const matchedDistrict = districtsData.find(district => 
                fuzzyMatch(district.name, districtName)
              );

              if (matchedDistrict) {
                // 4. Lấy danh sách phường/xã
                const wardsData = await getLocations('WARD', parseInt(matchedDistrict.id));
                setWards(wardsData);
                setSelectedDistrict(matchedDistrict.id);

                // 5. Tìm và chọn phường/xã
                if (wardsData.length > 0 && orderData.ward) {
                  const wardName = orderData.ward.toLowerCase().trim();
                  const matchedWard = wardsData.find(ward => 
                    fuzzyMatch(ward.name, wardName)
                  );
                  
                  if (matchedWard) {
                    setSelectedWard(matchedWard.id);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi điền thông tin địa chỉ:', error);
      }
      
      // Đóng modal
      setShowOrderDetails(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    if (cityId) {
      try {
        setIsLoadingLocations(true);
        const districtsData = await getLocations('DISTRICT', parseInt(cityId));
        setDistricts(districtsData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách quận/huyện:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard('');
    setWards([]);

    if (districtId) {
      try {
        setIsLoadingLocations(true);
        const wardsData = await getLocations('WARD', parseInt(districtId));
        setWards(wardsData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách phường/xã:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const response = await searchProducts(searchTerm);
        
        if (response?.products) {
          const productsArray = Object.values(response.products);
          if (productsArray.length > 0) {
            setSearchResults(productsArray);
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="layout-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Container className="orders-container py-3">
          {/* API Integration Card */}
          <Card className="mb-3 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <FaLink className="me-2" /> Tạo đơn từ hội thoại
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={10}>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaLink />
                    </InputGroup.Text>
                    <Form.Control 
                      placeholder="Link hội thoại" 
                      value={conversationLink}
                      onChange={(e) => setConversationLink(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="primary" 
                    className="w-100" 
                    onClick={handleCreateOrder}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" /> Gửi
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
              
              {apiError && (
                <Alert variant="danger" className="mt-3">
                  {apiError}
                </Alert>
              )}
              
              {apiResponse && Array.isArray(apiResponse) && apiResponse.length > 0 && (
                <div className="mt-3">
                  <h6>Kết quả phân tích ({apiResponse.length} đơn hàng):</h6>
                  
                  <ListGroup className="mt-3">
                    {apiResponse.map((order, index) => (
                      <ListGroup.Item 
                        key={index}
                        action
                        active={selectedOrderIndex === index}
                        onClick={() => handleSelectOrder(index)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-bold">
                            <FaUser className="me-1" /> {order.name_customers} 
                            {order.gender && (
                              <span className="ms-2">
                                {order.gender === 'male' ? <FaMars className="text-primary" /> : <FaVenus className="text-danger" />}
                              </span>
                            )}
                          </div>
                          <div>
                            <FaPhone className="me-1" /> {order.phone_number}
                          </div>
                          <div>
                            <FaMapMarkerAlt className="me-1" /> {order.full_address}
                          </div>
                          <div>
                            <FaWeight className="me-1" /> Cân nặng: {order.weight} kg
                            <span className="ms-3"><FaRulerVertical className="me-1" /> Chiều cao: {order.height} m</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <div>
                            <FaBox className="me-1" /> {order.quantity}x {order.size} 
                            {order.color && ` - ${order.color}`}
                          </div>
                          <div>
                            <FaStore className="me-1" /> {order.name_page}
                          </div>
                          <div className="fw-bold">
                            Giá: {formatCurrency(order.order_price)}
                          </div>
                          <div>
                            Ship: {formatCurrency(order.shipping_fee)}
                          </div>
                          
                          <div>
                            Đặt cọc: {formatCurrency(order.money_deposit)}
                          </div>
                          
                          <div className="fw-bold">
                            Tổng: {formatCurrency(parseInt(order.order_price) + parseInt(order.shipping_fee || 0))}
                          </div>
                        </div>
                        {selectedOrderIndex === index && (
                          <div className="ms-2 text-success">
                            <FaCheck />
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  {selectedOrderIndex !== null && (
                    <div className="d-flex justify-content-end mt-3 gap-2">
                      <Button 
                        variant="info" 
                        onClick={handleViewDetails}
                      >
                        <FaQuestionCircle className="me-2" /> Xem chi tiết
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={handleConfirmOrder}
                      >
                        <FaCheck className="me-2" /> Xác nhận đơn hàng
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Modal hiển thị chi tiết đơn hàng */}
          {selectedOrderIndex !== null && apiResponse && (
            <Modal show={showOrderDetails} onHide={handleCloseDetails} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Chi tiết đơn hàng</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-0">
                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="30%">Tên khách hàng</td>
                        <td>{apiResponse[selectedOrderIndex].name_customers}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Giới tính</td>
                        <td>{apiResponse[selectedOrderIndex].gender === 'male' ? 'Nam' : 'Nữ'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Số điện thoại</td>
                        <td>{apiResponse[selectedOrderIndex].phone_number}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Địa chỉ đầy đủ</td>
                        <td style={{wordBreak: 'break-word'}}>{apiResponse[selectedOrderIndex].full_address}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tỉnh/Thành phố</td>
                        <td>{apiResponse[selectedOrderIndex].province}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Quận/Huyện</td>
                        <td>{apiResponse[selectedOrderIndex].district}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phường/Xã</td>
                        <td>{apiResponse[selectedOrderIndex].ward}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Cân nặng</td>
                        <td>{apiResponse[selectedOrderIndex].weight} kg</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Chiều cao</td>
                        <td>{apiResponse[selectedOrderIndex].height} m</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Số lượng</td>
                        <td>{apiResponse[selectedOrderIndex].quantity}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Kích thước</td>
                        <td>{apiResponse[selectedOrderIndex].size}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Màu sắc</td>
                        <td>{apiResponse[selectedOrderIndex].color || 'Không có'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Giá đơn hàng</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].order_price)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phí vận chuyển</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].shipping_fee)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tiền đặt cọc</td>
                        <td>{formatCurrency(apiResponse[selectedOrderIndex].money_deposit || 0)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tổng cộng</td>
                        <td className="fw-bold">{formatCurrency(parseInt(apiResponse[selectedOrderIndex].order_price) + parseInt(apiResponse[selectedOrderIndex].shipping_fee))}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tên trang</td>
                        <td>{apiResponse[selectedOrderIndex].name_page}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDetails}>
                  Đóng
                </Button>
                <Button variant="success" onClick={handleConfirmOrder}>
                  <FaCheck className="me-2" /> Xác nhận đơn hàng
                </Button>
              </Modal.Footer>
            </Modal>
          )}

          <Row>
            {/* Cột trái - 70% */}
            <Col lg={8}>
              {/* 1.1 Khối thông tin khách hàng */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaUser className="me-2" /> Khách hàng
                  </div>
                  <div>
                    <Form.Select 
                      className="d-inline-block me-2 source-select"
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      disabled={isLoadingSources}
                    >
                      <option value="">- Nguồn đơn hàng -</option>
                      {isLoadingSources ? (
                        <option disabled>Đang tải...</option>
                      ) : (
                        orderSources.map(source => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaPhone />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Điện thoại"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Tên khách"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaHome />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Địa chỉ"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaStickyNote />
                        </InputGroup.Text>
                        <Form.Control 
                          as="textarea" 
                          rows={2} 
                          placeholder="Ghi chú khách hàng (Để in)" 
                        />
                      </InputGroup>
                    </Col>
                    
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select 
                          value={selectedCity}
                          onChange={handleCityChange}
                          disabled={isLoadingLocations}
                        >
                          <option value="">- Chọn thành phố -</option>
                          {isLoadingLocations ? (
                            <option value="" disabled>Đang tải...</option>
                          ) : (
                            cities && cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))
                          )}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select
                          value={selectedDistrict}
                          onChange={handleDistrictChange}
                          disabled={!selectedCity || isLoadingLocations}
                        >
                          <option value="">- Quận huyện -</option>
                          {districts.map(district => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select
                          value={selectedWard}
                          onChange={(e) => setSelectedWard(e.target.value)}
                          disabled={!selectedDistrict || isLoadingLocations}
                        >
                          <option value="">- Phường xã -</option>
                          {wards.map(ward => (
                            <option key={ward.id} value={ward.id}>
                              {ward.name}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaStickyNote />
                        </InputGroup.Text>
                        <Form.Control 
                          as="textarea" 
                          rows={2} 
                          placeholder="Ghi chú chăm sóc khách hàng (Nội bộ)" 
                        />
                      </InputGroup>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button variant="light" size="sm">
                    <FaChevronDown />
                  </Button>
                </Card.Footer>
              </Card>

              {/* 1.2 Khối sản phẩm */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaBox className="me-2" /> Sản phẩm
                  </div>
                </Card.Header>
                <Card.Body>
                  <div ref={searchRef} className="position-relative">
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="(F3) Tìm kiếm sản phẩm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearch}
                      />
                    </InputGroup>

                    {showSearchResults && (
                      <div className="position-absolute w-100 mt-1 shadow bg-white rounded border" 
                           style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                        {isSearching ? (
                          <div className="p-3 text-center">
                            Đang tìm kiếm...
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          <ListGroup variant="flush">
                            {searchResults.map((product) => (
                              <ListGroup.Item 
                                key={product.idNhanh}
                                action
                                className="d-flex justify-content-between align-items-center py-2"
                              >
                                <div className="d-flex flex-column">
                                  <div className="fw-medium">{product.name}</div>
                                  <div className="small text-muted">
                                    {product.code && <span className="me-2">Mã: {product.code}</span>}
                                    <span>Tồn: {product.inventory.available}</span>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="text-primary fw-medium">
                                    {new Intl.NumberFormat('vi-VN', {
                                      style: 'currency',
                                      currency: 'VND'
                                    }).format(product.price)}
                                  </div>
                                  {product.wholesalePrice && product.wholesalePrice !== product.price && (
                                    <small className="text-success">
                                      Sỉ: {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                      }).format(product.wholesalePrice)}
                                    </small>
                                  )}
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        ) : (
                          <div className="p-3 text-center text-muted">
                            Không tìm thấy sản phẩm
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="table-responsive">
                    <Table bordered hover className="product-table">
                      <thead>
                        <tr>
                          <th style={{width: '30px'}}>
                            <Form.Check type="checkbox" />
                          </th>
                          <th>Sản phẩm</th>
                          <th>SL</th>
                          <th>T</th>
                          <th>Giá</th>
                          <th>T.Tiền <FaChevronDown className="text-danger" /></th>
                          <th>Giá <FaChevronDown className="text-danger" /></th>
                          <th>T.Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan="8" className="text-center py-3">
                            Chưa có sản phẩm nào
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="fw-bold">Tổng</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              {/* 1.3 Khối vận chuyển */}
              <Card className="mb-3 shadow-sm">
                <Card.Header>
                  <FaTruck className="me-2" /> Vận chuyển
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center mb-3">
                    <Col xs="auto">
                      <Form.Check 
                        type="checkbox" 
                        id="self-shipping"
                        label="Tự vận chuyển" 
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Select>
                        <option>Cho xem, không thử hàng</option>
                        <option>Cho xem, cho thử</option>
                        <option>Không cho xem hàng</option>
                      </Form.Select>
                    </Col>
                    <Col md={5}>
                      <InputGroup>
                        <Form.Control 
                          type="text" 
                          placeholder="Ngày giao hàng" 
                        />
                        <InputGroup.Text>
                          <FaCalendarAlt />
                        </InputGroup.Text>
                      </InputGroup>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col md={4}>
                      <Form.Label>Phí ship bảo khách</Form.Label>
                    </Col>
                    <Col md={5}>
                      <Form.Control type="text" />
                    </Col>
                    <Col md={3}>
                      <Form.Check 
                        type="checkbox" 
                        id="hvc-fee"
                        label="Lấy theo phí HVC" 
                      />
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={3}>
                      <Form.Check 
                        type="checkbox" 
                        id="hvc-promo"
                        label="Mã khuyến mại HVC" 
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check 
                        type="checkbox" 
                        id="insurance"
                        label="Mua bảo hiểm" 
                      />
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về bảo hiểm</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="ms-1 text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                    <Col md={3}>
                      <Form.Check 
                        type="checkbox" 
                        id="partial-delivery"
                        label="Giao hàng một phần" 
                      />
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về giao hàng một phần</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="ms-1 text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                    <Col md={3}>
                      <Form.Check 
                        type="checkbox" 
                        id="fragile"
                        label="Hàng dễ vỡ" 
                      />
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về hàng dễ vỡ</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="ms-1 text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  
                  <div>
                    <Form.Label>Kích thước</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control type="text" placeholder="KL (gram)" />
                      </Col>
                      <Col>
                        <Form.Control type="text" placeholder="Dài (cm)" />
                      </Col>
                      <Col>
                        <Form.Control type="text" placeholder="Rộng (cm)" />
                      </Col>
                      <Col>
                        <Form.Control type="text" placeholder="Cao (cm)" />
                      </Col>
                      <Col xs="auto" className="d-flex align-items-center">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Thông tin về kích thước</Tooltip>}
                        >
                          <span>
                            <FaQuestionCircle className="ms-1 text-muted" />
                          </span>
                        </OverlayTrigger>
                      </Col>
                    </Row>
                    <Form.Check 
                      type="checkbox" 
                      id="merge-package"
                      label="Gộp kiện" 
                      className="mt-2"
                    />
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Thông tin về gộp kiện</Tooltip>}
                    >
                      <span>
                        <FaQuestionCircle className="ms-1 text-muted" />
                      </span>
                    </OverlayTrigger>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Cột phải - 30% */}
            <Col lg={4}>
              {/* 2.2 Khối thanh toán */}
              <Card className="mb-3 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm">
                      Bổ tự động
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>Tùy chọn 1</Dropdown.Item>
                      <Dropdown.Item>Tùy chọn 2</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm">
                      VAT
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>Có VAT</Dropdown.Item>
                      <Dropdown.Item>Không VAT</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaPercent className="text-danger" />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Chiết khấu" />
                    </Col>
                    <Col xs={3}>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" className="w-100">
                          $
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item>$</Dropdown.Item>
                          <Dropdown.Item>%</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaTicketAlt />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Mã Coupon" />
                    </Col>    
                    <Col xs={3} className="text-center">
                      <Button variant="light" size="sm">
                        <FaSync />
                      </Button>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaMoneyBillWave />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Tiêu điểm" readOnly value="0" />
                    </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaCreditCard />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Tiền đặt cọc" />
                    </Col>
                  </Row>
                  
                  <Row className="mb-3 align-items-center">
                    <Col xs={2} className="text-center">
                      <FaExchangeAlt />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Tiền chuyển khoản" />
                    </Col>
                    <Col xs={1}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về chuyển khoản</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 2.3 Khối tùy chọn giao hàng */}
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Dropdown>
                      <Dropdown.Toggle variant="light" className="w-100 text-start">
                        Giao hàng tận nhà
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="w-100">
                        <Dropdown.Item>Giao hàng tận nhà</Dropdown.Item>
                        <Dropdown.Item>Khách đến lấy</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>
                  
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaUser />
                    </InputGroup.Text>
                    <Form.Select 
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      disabled={isLoadingStaff}
                    >
                      <option value="">Chọn nhân viên tạo đơn hàng</option>
                      {isLoadingStaff ? (
                        <option disabled>Đang tải...</option>
                      ) : (
                        staffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.id} {staff.fullName || staff.username} {staff.roleName ? `(${staff.roleName})` : ''}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </InputGroup>
                  
                  <Row className="mb-3">
                    <Col>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" className="w-100 text-start">
                          Mới
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          <Dropdown.Item>Mới</Dropdown.Item>
                          <Dropdown.Item>Cũ</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                    <Col xs="auto">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Thông tin về trạng thái đơn hàng</Tooltip>}
                      >
                        <span>
                          <FaQuestionCircle className="text-muted" />
                        </span>
                      </OverlayTrigger>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Dropdown>
                      <Dropdown.Toggle variant="light" className="w-100 text-start">
                        Tiếp tục thêm đơn hàng
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="w-100">
                        <Dropdown.Item>Tiếp tục thêm đơn hàng</Dropdown.Item>
                        <Dropdown.Item>Kết thúc sau khi lưu</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>
                  
                  <Row className="mb-3">
                    <Col>
                      <div className="text-success">Thu khách: <strong>0</strong></div>
                    </Col>
                    <Col>
                      <div className="text-primary">Thu shop: <strong>0</strong></div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 2.4 Khối nút tác vụ */}
              <div className="d-grid gap-2 mb-3">
                <Button variant="success" size="lg">
                  <FaBox className="me-2" /> (F9) Lưu
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Orders; 