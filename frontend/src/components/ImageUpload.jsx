import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { storage, db } from '../firebase/config';

function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      // Lấy dữ liệu từ Firestore
      const querySnapshot = await getDocs(collection(db, 'products'));
      const imageList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setImages(imageList);
    } catch (error) {
      setMessage('Không thể tải danh sách hình ảnh');
      console.error('Error fetching images:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !productInfo.name) {
      setMessage('Vui lòng chọn file và nhập tên sản phẩm');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload hình ảnh lên Firebase Storage
      const storageRef = ref(storage, `products/${Date.now()}-${selectedFile.name}`);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Lưu thông tin sản phẩm vào Firestore
      await addDoc(collection(db, 'products'), {
        name: productInfo.name,
        description: productInfo.description,
        price: Number(productInfo.price),
        category: productInfo.category,
        imageUrl: downloadURL,
        storagePath: snapshot.ref.fullPath,
        createdAt: new Date().toISOString()
      });

      // 3. Reset form và cập nhật UI
      setMessage('Tải lên thành công!');
      setSelectedFile(null);
      setPreview(null);
      setProductInfo({
        name: '',
        description: '',
        price: '',
        category: ''
      });
      fetchImages();
    } catch (error) {
      setMessage('Có lỗi xảy ra khi tải lên');
      console.error('Error uploading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;

    try {
      // 1. Xóa file từ Storage
      const storageRef = ref(storage, image.storagePath);
      await deleteObject(storageRef);

      // 2. Xóa document từ Firestore
      const q = query(collection(db, 'products'), where('imageUrl', '==', image.imageUrl));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      setMessage('Xóa hình ảnh thành công');
      fetchImages();
    } catch (error) {
      setMessage('Có lỗi xảy ra khi xóa hình ảnh');
      console.error('Error deleting:', error);
    }
  };

  return (
    <div className="image-upload">
      <div className="upload-form">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
        />
        
        <div className="product-info">
          <input
            type="text"
            placeholder="Tên sản phẩm"
            value={productInfo.name}
            onChange={(e) => setProductInfo({...productInfo, name: e.target.value})}
          />
          <textarea
            placeholder="M�� tả"
            value={productInfo.description}
            onChange={(e) => setProductInfo({...productInfo, description: e.target.value})}
          />
          <input
            type="number"
            placeholder="Giá"
            value={productInfo.price}
            onChange={(e) => setProductInfo({...productInfo, price: e.target.value})}
          />
          <select
            value={productInfo.category}
            onChange={(e) => setProductInfo({...productInfo, category: e.target.value})}
          >
            <option value="">Chọn danh mục</option>
            <option value="electronics">Điện tử</option>
            <option value="clothing">Thời trang</option>
            <option value="books">Sách</option>
          </select>
        </div>

        {preview && (
          <div className="preview">
            <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
          </div>
        )}
        
        <button 
          onClick={handleUpload} 
          disabled={loading || !selectedFile}
        >
          {loading ? 'Đang tải lên...' : 'Tải lên'}
        </button>
        
        {message && <p className={message.includes('thành công') ? 'success' : 'error'}>{message}</p>}
      </div>

      <div className="image-gallery">
        <h3>Danh sách hình ảnh</h3>
        <div className="image-grid">
          {images.map((image) => (
            <div key={image.id} className="image-item">
              <img src={image.imageUrl} alt={image.name} />
              <div className="image-info">
                <h4>{image.name}</h4>
                <p>{image.description}</p>
                <p>Giá: {image.price}</p>
                <p>Danh mục: {image.category}</p>
                <button onClick={() => handleDelete(image)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;