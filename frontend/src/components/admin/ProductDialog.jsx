import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import ImageUploading from 'react-images-uploading';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { cloudinaryService } from '../../services/cloudinary.service';

function ProductDialog({ show, onHide, onSubmit, initialData = null }) {
  const initialFormState = {
    product_name: '',
    product_code: '',
    brand: '',
    description: '',
    price: '',
  };

  const [formData, setFormData] = useState(initialData || initialFormState);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const suggestedPrices = [
    { label: '50,000đ', value: 50000 },
    { label: '100,000đ', value: 100000 },
    { label: '200,000đ', value: 200000 },
    { label: '500,000đ', value: 500000 },
    { label: '1,000,000đ', value: 1000000 }
  ];

  const handlePriceSuggestionClick = (price) => {
    setFormData({ ...formData, price: price });
  };

  // Thêm useEffect để xử lý initialData khi dialog mở
  useEffect(() => {
    if (initialData) {
      setFormData({
        product_name: initialData.product_name || '',
        product_code: initialData.product_code || '',
        brand: initialData.brand || '',
        description: initialData.description || '',
        price: initialData.price || '',
      });

      // Chuyển đổi URLs thành đối tượng ảnh
      const initialImages = initialData.image_urls?.map((url) => ({
        data_url: url,
        file: null,
        isExisting: true // Đánh dấu ảnh đã tồn tại
      })) || [];
      
      setImages(initialImages);
    } else {
      setFormData(initialFormState);
      setImages([]);
    }
    setErrors({});
  }, [initialData, show]);

  const handleClose = () => {
    setFormData(initialFormState);
    setImages([]);
    setErrors({});
    onHide();
  };

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

    setSubmitting(true);
    try {
        // Tạo mảng promises cho việc upload ảnh
        const imageFiles = images.filter(img => img.file).map(img => img.file);
        const existingUrls = images.filter(img => img.isExisting).map(img => img.data_url);
        
        // Upload song song tất cả ảnh mới
        const uploadPromises = imageFiles.map(file => 
            cloudinaryService.uploadImage(file)
        );
        
        // Chờ tất cả ảnh upload xong
        const uploadedImages = await Promise.all(uploadPromises);
        const newImageUrls = uploadedImages.map(img => img.secure_url);
        
        // Kết hợp URLs
        const allImageUrls = [...existingUrls, ...newImageUrls];

        // Xác định ảnh đã bị xóa (nếu đang edit)
        const deletedImages = initialData?.image_urls?.filter(
            url => !existingUrls.includes(url)
        ) || [];

        // Tạo product data
        const productData = {
            product_name: formData.product_name.trim(),
            product_code: formData.product_code.trim(),
            brand: formData.brand?.trim() || '',
            description: formData.description?.trim() || '',
            price: parseFloat(formData.price),
            company_id: JSON.parse(localStorage.getItem('userDetails')).company_id,
            image_urls: allImageUrls,
            deleted_images: deletedImages // Thêm thông tin về ảnh đã xóa
        };

        await onSubmit(productData);
        handleClose();
    } catch (error) {
        setErrors(prev => ({
            ...prev, 
            submit: error.message || 'Có lỗi xảy ra'
        }));
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
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
            <div className="mt-2 d-flex gap-2 flex-wrap">
              {suggestedPrices.map((price) => (
                <button
                  key={price.value}
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handlePriceSuggestionClick(price.value)}
                >
                  {price.label}
                </button>
              ))}
            </div>
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
              maxNumber={20}
              dataURLKey="data_url"
              acceptType={['jpg', 'jpeg', 'png', 'webp']}
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
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          
          <Button 
            variant="primary" 
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              'Lưu'
            )}
          </Button>
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