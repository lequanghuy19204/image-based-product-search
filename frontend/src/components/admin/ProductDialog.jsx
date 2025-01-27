import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import ImageUploading from 'react-images-uploading';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

function ProductDialog({ show, onHide, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    product_name: '',
    product_code: '',
    brand: '',
    description: '',
    price: '',
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.product_name?.trim()) {
        newErrors.product_name = 'Tên sản phẩm là bắt buộc';
    }
    if (!formData.product_code?.trim()) {
        newErrors.product_code = 'Mã sản phẩm là bắt buộc';
    }
    if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Giá sản phẩm phải lớn hơn 0';
    }
    if (!images.length) {
        newErrors.images = 'Cần ít nhất 1 ảnh sản phẩm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Lấy thông tin user từ localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Log để debug
      console.log("Form Data before sending:", {
        product_name: formData.product_name,
        product_code: formData.product_code,
        brand: formData.brand,
        description: formData.description,
        price: formData.price,
        company_id: user.company_id
      });

      // Append các trường dữ liệu - đảm bảo không có undefined
      formDataToSend.append('product_name', formData.product_name.trim());
      formDataToSend.append('product_code', formData.product_code.trim());
      formDataToSend.append('brand', formData.brand || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('company_id', user.company_id);
      
      // Append files
      images.forEach((image) => {
        if (image.file) {
          formDataToSend.append('files', image.file);
        }
      });

      // Log FormData entries để debug
      for (let pair of formDataToSend.entries()) {
        console.log('FormData Entry:', pair[0], pair[1]);
      }

      await onSubmit(formDataToSend);
      onHide();
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Có lỗi xảy ra khi lưu sản phẩm' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </Modal.Title>
      </Modal.Header>
      
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Tên sản phẩm *</label>
            <input
              type="text"
              className={`form-control ${errors.product_name ? 'is-invalid' : ''}`}
              name="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            />
            {errors.product_name && (
              <div className="invalid-feedback">{errors.product_name}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Mã sản phẩm *</label>
            <input
              type="text"
              className={`form-control ${errors.product_code ? 'is-invalid' : ''}`}
              name="product_code"
              value={formData.product_code}
              onChange={(e) => setFormData({...formData, product_code: e.target.value})}
            />
            {errors.product_code && (
              <div className="invalid-feedback">{errors.product_code}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Thương hiệu</label>
            <input
              type="text"
              className="form-control"
              name="brand"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Giá *</label>
            <input
              type="number"
              className={`form-control ${errors.price ? 'is-invalid' : ''}`}
              name="price"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
            {errors.price && (
              <div className="invalid-feedback">{errors.price}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              name="description"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Hình ảnh sản phẩm *</label>
            <ImageUploading
              multiple
              value={images}
              onChange={setImages}
              maxNumber={5}
              dataURLKey="data_url"
            >
              {({
                imageList,
                onImageUpload,
                onImageRemove,
                isDragging,
                dragProps
              }) => (
                <div className="upload__image-wrapper">
                  <button
                    type="button"
                    className={`btn btn-outline-primary w-100 mb-3 ${isDragging ? 'btn-danger' : ''}`}
                    onClick={onImageUpload}
                    {...dragProps}
                  >
                    <CloudUploadIcon className="me-2" />
                    Kéo thả ảnh hoặc click để chọn
                  </button>
                  
                  {errors.images && (
                    <div className="text-danger mb-2">{errors.images}</div>
                  )}
                  
                  <div className="d-flex flex-wrap gap-2">
                    {imageList.map((image, index) => (
                      <div key={index} className="image-item position-relative">
                        <img
                          src={image.data_url}
                          alt=""
                          className="rounded"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0"
                          onClick={() => onImageRemove(index)}
                        >
                          <CloseIcon fontSize="small" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ImageUploading>
          </div>
          
          {errors.submit && (
            <div className="alert alert-danger">{errors.submit}</div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onHide}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              'Lưu'
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

ProductDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

export default ProductDialog; 