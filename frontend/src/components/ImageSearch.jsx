import { useState } from 'react';
import ImageUploading from 'react-images-uploading';
import { CloudUpload, Search, Delete, ImageSearch as ImageSearchIcon } from '@mui/icons-material';
import Sidebar from './common/Sidebar';
import '../styles/ImageSearch.css';
import { apiService } from '../services/api.service';


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
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState('');

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

  const handleImageUpload = (imageList) => {
    setImages(imageList);
  };

  const handleSearch = async () => {
    if (images.length === 0) return;
    
    setLoading(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const company_id = userDetails?.company_id;

      // Validate company_id
      if (!company_id) {
        throw new Error('Không tìm thấy thông tin công ty');
      }

      const formData = new FormData();
      formData.append('file', images[0].file);
      formData.append('company_id', company_id);
      formData.append('top_k', 8);

      const response = await apiService.postFormData('/api/images/search', formData);

      setSearchResults(response.results.map(result => ({
        id: result.product_id,
        imageUrl: result.image_url,
        title: result.product_name,
        price: `${result.price.toLocaleString()}đ`,
        similarity: `${result.similarity.toFixed(1)}%`,
        description: result.description,
        brand: result.brand,
        productCode: result.product_code
      })));

    } catch (error) {
      console.error('Search error:', error);
      alert(`Lỗi tìm kiếm: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    // Xử lý thêm comment
    setComment('');
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
          <p className="lead">
            Tải lên hình ảnh sản phẩm để tìm kiếm
          </p>
        </div>
      
        {/* Upload Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <ImageUploading
              multiple={false}
              value={images}
              onChange={handleImageUpload}
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
                  {imageList.length === 0 ? (
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
                        src={imageList[0].data_url} 
                        alt="Preview" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '300px' }}
                      />
                      <button
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                        onClick={() => onImageRemove(0)}
                      >
                        <Delete />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ImageUploading>

            <button
              className="btn btn-primary w-100 mt-3"
              onClick={handleSearch}
              disabled={images.length === 0 || loading}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <Search className="me-2" />
              )}
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div className="results-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Kết quả tìm kiếm</h5>
              <span className="badge bg-primary">{searchResults.length} sản phẩm</span>
            </div>

            <div className="row row-cols-1 row-cols-md-3 row-cols-lg-5 g-3">
              {searchResults.map((item, index) => (
                <div key={`${item.id}-${index}`} className="col">
                  <div className="card h-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="card-img-top"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h6 className="card-title">{item.title}</h6>
                      <p className="card-text text-muted small mb-1">
                        Mã SP: {item.productCode}
                      </p>
                      <p className="card-text text-primary fw-bold mb-1">
                        {item.price}
                      </p>
                      <p className="card-text text-success small mb-0">
                        Độ tương đồng: {item.similarity}
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
                <h5 className="modal-title">{selectedImage?.title}</h5>
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
                      src={selectedImage?.imageUrl}
                      alt={selectedImage?.title}
                      className="img-fluid rounded"
                    />
                  </div>
                  <div className="col-md-4">
                    <h4 className="text-primary mb-3">{selectedImage?.price}</h4>
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
      </main>
    </div>
  );
}

export default ImageSearch;