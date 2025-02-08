import { useState, useEffect } from 'react';
import ImageUploading from 'react-images-uploading';
import { CloudUpload, Search, Delete, ImageSearch as ImageSearchIcon } from '@mui/icons-material';
import Sidebar from './common/Sidebar';
import '../styles/ImageSearch.css';
import { apiService } from '../services/api.service';
import { Modal } from 'react-bootstrap';


function ImageSearch() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data cho comments
  const [comments] = useState([
    {
      id: 1,
      user: 'User 1',
      avatar: 'https://i.pravatar.cc/40?img=1',
      text: 'Sản phẩm rất đẹp!',
      timestamp: '2 giờ trước'
    },
    {
      id: 2,
      user: 'User 2',
      avatar: 'https://i.pravatar.cc/40?img=2',
      text: 'Giá cả hợp lý',
      timestamp: '1 giờ trước'
    }
  ]);

  // Thêm useEffect để tự động tìm kiếm khi có ảnh
  useEffect(() => {
    if (images.length > 0 || previewUrl) {
      handleSearch();
    }
  }, [images, previewUrl]);

  const handleImageUpload = (imageList) => {
    setImages(imageList);
  };

  const handleImageUrl = async (url) => {
    setImageUrl(url);
    try {
      // Kiểm tra và hiển thị preview ảnh
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải ảnh');
      setPreviewUrl(url);
      setImages([]); // Xóa ảnh upload nếu có
    } catch (error) {
      setSuccessMessage('URL ảnh không hợp lệ');
      setTimeout(() => setSuccessMessage(''), 3000);
      setPreviewUrl('');
    }
  };

  const handleSearch = async () => {
    if ((!images.length && !previewUrl) || loading) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (images.length > 0) {
        // Nếu có file ảnh được upload
        const imageFile = await fetch(images[0].data_url).then(r => r.blob());
        formData.append('file', imageFile, 'image.jpg');
      } else if (previewUrl) {
        // Nếu có URL ảnh hợp lệ
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error('Không thể tải ảnh từ URL');
        const blob = await response.blob();
        formData.append('file', blob, 'image.jpg');
      }

      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      formData.append('company_id', userDetails.company_id);
      formData.append('top_k', '8');

      const response = await apiService.postFormData('/api/images/search', formData);
      setSearchResults(response.results);
      setSuccessMessage('Tìm kiếm thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage(`Lỗi: ${error.message}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    // Xử lý thêm comment
    setComment('');
  };

  // Thêm hàm để lấy thông tin chi tiết sản phẩm
  const handleProductHover = async (productId) => {
    try {
      setLoading(true);
      const productDetails = await apiService.getProductDetails(productId);
      setSelectedProduct(productDetails);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Có thể thêm thông báo lỗi ở đây nếu cần
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar 
        open={sidebarOpen}
        onToggle={handleToggleSidebar}
      />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <h1 className="d-flex align-items-center justify-content-center">
            <ImageSearchIcon className="me-2" />
            Tìm kiếm Sản phẩm
          </h1>
          <p className="lead text-center">
            Tải lên hình ảnh sản phẩm để tìm kiếm
          </p>
        </div>
      
        {/* Upload Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập URL ảnh..."
                  value={imageUrl}
                  onChange={(e) => handleImageUrl(e.target.value)}
                />
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => handleImageUrl(imageUrl)}
                  disabled={!imageUrl}
                >
                  <Search className="me-1" />
                  Xem trước
                </button>
              </div>
            </div>

            <ImageUploading
              multiple={false}
              value={images}
              onChange={(imageList) => {
                setImages(imageList);
                setPreviewUrl('');
                setImageUrl('');
              }}
              maxNumber={1}
              dataURLKey="data_url"
              acceptType={['jpg', 'jpeg', 'png']}
            >
              {({
                imageList,
                onImageUpload,
                onImageRemove,
                isDragging,
                dragProps
              }) => (
                <div className="upload-area p-4 text-center">
                  {!imageList.length && !previewUrl ? (
                    <div 
                      className={`upload-placeholder border-2 border-dashed rounded p-5 
                        ${isDragging ? 'bg-light' : ''}`}
                      {...dragProps}
                    >
                      <button
                        className="btn btn-outline-primary btn-lg mb-3"
                        onClick={onImageUpload}
                      >
                        <CloudUpload className="me-2" />
                        Tải ảnh lên
                      </button>
                      <p className="text-muted mb-0">
                        Kéo thả hoặc nhấp để tải ảnh (JPG, JPEG, PNG)
                      </p>
                    </div>
                  ) : (
                    <div className="position-relative d-inline-block">
                      <img 
                        src={imageList[0]?.data_url || previewUrl}
                        alt="Preview" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '150px' }}
                      />
                      <button
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                        onClick={() => {
                          if (imageList.length) onImageRemove(0);
                          setPreviewUrl('');
                          setImageUrl('');
                        }}
                      >
                        <Delete />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ImageUploading>

            <div className="text-center mt-3">
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={loading || (!images.length && !previewUrl)}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : (
                  <Search className="me-2" />
                )}
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Hiển thị thông báo */}
        {successMessage && (
          <div className="alert alert-info">{successMessage}</div>
        )}

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div className="search-results mt-4">
            <h5 className="mb-3">Kết quả tìm kiếm: {searchResults.length} ảnh</h5>
            <div className="row">
              {searchResults.map((item, index) => (
                <div key={index} className="col-md-2 mb-4">
                  <div className="card h-100">
                    <div 
                      className="card-img-container cursor-pointer"
                      onClick={() => handleProductHover(item.product_id)}
                    >
                      <img
                        src={item.image_url}
                        className="card-img-top"
                        alt={item.product_name}
                      />
                    </div>
                    <div className="card-body">
                      <h6 className="card-title">{item.product_name}</h6>
                      <p className="card-text text-muted small mb-1">
                        Mã SP: {item.product_code}
                      </p>
                      <p className="card-text text-primary fw-bold mb-1">
                        {item.price ? `${item.price.toLocaleString()}đ` : '0đ'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Detail Modal */}
        <div 
          className={`modal fade ${selectedImage ? 'show' : ''}`} 
          tabIndex="-1"
          style={{ display: selectedImage ? 'block' : 'none' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedImage?.product_name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <img
                      src={selectedImage?.image_url}
                      alt={selectedImage?.product_name}
                      className="img-fluid rounded"
                    />
                  </div>
                  <div className="col-md-4">
                    <h4 className="text-primary mb-3">{selectedImage?.price ? `${selectedImage.price.toLocaleString()}đ` : '0đ'}</h4>
                    <p>{selectedImage?.description}</p>
                    
                    <div className="d-flex gap-2 mb-4">
                      <button className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-heart me-1"></i>
                        {selectedImage?.likes}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-share me-1"></i>
                        Chia sẻ
                      </button>
                    </div>

                    <hr />

                    <h6 className="mb-3">Bình luận</h6>
                    <div className="comments-section">
                      {comments.map((comment) => (
                        <div key={comment.id} className="d-flex mb-3">
                          <img
                            src={comment.avatar}
                            alt={comment.user}
                            className="rounded-circle me-2"
                            width="32"
                          />
                          <div>
                            <h6 className="mb-1">{comment.user}</h6>
                            <p className="mb-1">{comment.text}</p>
                            <small className="text-muted">{comment.timestamp}</small>
                          </div>
                        </div>
                      ))}

                      <div className="input-group mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Thêm bình luận..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handleCommentSubmit}
                          disabled={!comment.trim()}
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {selectedImage && <div className="modal-backdrop fade show"></div>}

        {/* Modal hiển thị chi tiết sản phẩm */}
        <Modal 
          show={showModal} 
          onHide={() => setShowModal(false)}
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết sản phẩm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : selectedProduct && (
              <div className="product-detail">
                <h5>{selectedProduct.product_name}</h5>
                <p className="text-muted small">Mã SP: {selectedProduct.product_code}</p>
                <p className="text-primary h5 mb-3">{selectedProduct.price.toLocaleString()}đ</p>
                
                {/* Hiển thị tất cả ảnh */}
                <div className="product-images-grid mb-3">
                  {selectedProduct.image_urls.map((url, index) => (
                    <img 
                      key={index}
                      src={url} 
                      alt={`Ảnh ${index + 1}`}
                      className="product-detail-image"
                    />
                  ))}
                </div>

                {selectedProduct.brand && (
                  <p className="mb-2"><strong>Thương hiệu:</strong> {selectedProduct.brand}</p>
                )}
                {selectedProduct.description && (
                  <div className="mb-2">
                    <strong>Mô tả:</strong>
                    <p className="small">{selectedProduct.description}</p>
                  </div>
                )}
                <p className="text-muted small mb-0">
                  Ngày tạo: {selectedProduct.created_at}
                </p>
              </div>
            )}
          </Modal.Body>
        </Modal>
      </main>
    </div>
  );
}

export default ImageSearch;