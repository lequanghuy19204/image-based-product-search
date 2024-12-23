import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

function ImageUpload({ token }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch('/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Lỗi:', error);
      setMessage('Không thể tải danh sách hình ảnh');
    }
  }, [token]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Vui lòng chọn file để tải lên');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('Tải lên thành công!');
        setSelectedFile(null);
        setPreview(null);
        fetchImages(); // Cập nhật danh sách hình ảnh
      } else {
        setMessage('Có lỗi xảy ra khi tải lên');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      setMessage('Có lỗi xảy ra khi tải lên');
    }
  };

  const handleDelete = async (filename) => {
    try {
      const response = await fetch(`/api/images/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchImages(); // Cập nhật danh sách hình ảnh
        setMessage('Xóa hình ảnh thành công');
      } else {
        setMessage('Có lỗi xảy ra khi xóa hình ảnh');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      setMessage('Có lỗi xảy ra khi xóa hình ảnh');
    }
  };

  return (
    <div className="image-upload">
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleFileSelect} />
        {preview && (
          <div className="preview">
            <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
          </div>
        )}
        <button onClick={handleUpload} disabled={!selectedFile}>
          Tải lên
        </button>
        {message && <p>{message}</p>}
      </div>

      <div className="image-gallery">
        <h3>Danh sách hình ảnh</h3>
        <div className="image-grid">
          {images.map((image) => (
            <div key={image.name} className="image-item">
              <img src={image.url} alt={image.name} />
              <button onClick={() => handleDelete(image.name)}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ImageUpload.propTypes = {
  token: PropTypes.string.isRequired,
};

export default ImageUpload;