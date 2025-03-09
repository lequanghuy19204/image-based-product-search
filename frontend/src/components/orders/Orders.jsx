import React, { useState } from 'react';
import { 
  Container, Row, Col, Form, InputGroup, Button, Table, 
  Card, Dropdown, OverlayTrigger, Tooltip 
} from 'react-bootstrap';
import { 
  FaUser, FaPhone, FaMapMarkerAlt, FaHome, FaStickyNote, FaBox, FaSearch, FaTruck, FaCalendarAlt, FaPercent,
  FaTicketAlt, FaCreditCard, FaMoneyBillWave, FaExchangeAlt,
  FaPrint, FaQuestionCircle, FaPlus, FaChevronDown, FaSync
} from 'react-icons/fa';
import '../../styles/Orders.css';
import Sidebar from '../common/Sidebar';

const Orders = () => {
  const [validated, setValidated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

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

  return (
    <div className="layout-container">
      <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Container className="orders-container py-3">
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
                    <Form.Select className="d-inline-block me-2 source-select">
                      <option>- Nguồn đơn hàng -</option>
                      <option>Facebook</option>
                      <option>Zalo</option>
                      <option>Website</option>
                    </Form.Select>
                    <Button variant="light" size="sm">
                      <FaPlus />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaPhone />
                        </InputGroup.Text>
                        <Form.Control placeholder="Điện thoại" />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control placeholder="Tên khách" />
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaHome />
                        </InputGroup.Text>
                        <Form.Control placeholder="Địa chỉ" />
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
                        <Form.Select>
                          <option>- Thành phố -</option>
                          <option>Hà Nội</option>
                          <option>TP. Hồ Chí Minh</option>
                          <option>Đà Nẵng</option>
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select>
                          <option>- Quận huyện -</option>
                        </Form.Select>
                      </InputGroup>
                      
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Select>
                          <option>- Phường xã -</option>
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
                  <div>
                    <Button variant="light" size="sm" className="me-2">
                      <FaSearch className="me-1" /> Xem tồn
                    </Button>
                    <Dropdown className="d-inline-block">
                      <Dropdown.Toggle variant="light" size="sm">
                        Bán lẻ
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item>Bán lẻ</Dropdown.Item>
                        <Dropdown.Item>Bán sỉ</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Card.Header>
                <Card.Body>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control placeholder="(F3) Tìm kiếm sản phẩm" />
                  </InputGroup>
                  
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
                        <FaQuestionCircle className="ms-1 text-muted" />
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
                        <FaQuestionCircle className="ms-1 text-muted" />
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
                        <FaQuestionCircle className="ms-1 text-muted" />
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
                          <FaQuestionCircle className="ms-1 text-muted" />
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
                      <FaQuestionCircle className="ms-1 text-muted" />
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
                        <FaQuestionCircle className="text-muted" />
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
                    <Form.Control placeholder="Nhân viên bán hàng" />
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
                        <FaQuestionCircle className="text-muted" />
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