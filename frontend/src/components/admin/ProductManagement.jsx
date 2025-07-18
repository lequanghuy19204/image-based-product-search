import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ZoomOut as ZoomOutIcon,
  ZoomIn as ZoomInIcon,
  ContentCopy as ContentCopyIcon,
  Fullscreen as FullscreenIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  FlipSharp as FlipHorizontalIcon,
  SwapVert as FlipVerticalIcon,
  RestartAlt as ResetIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/ProductManagement.css';
import { apiService } from '../../services/api.service';
import ProductDialog from './ProductDialog';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ImageViewer from '../common/ImageViewer';


function ProductManagement() {
  // Khai báo tất cả state ở đầu component
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [user, setUser] = useState(null);
  const [isDataStale, setIsDataStale] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isHorizontalFlipped, setIsHorizontalFlipped] = useState(false);
  const [isVerticalFlipped, setIsVerticalFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(true);
  const imageRef = useRef(null);
  const playTimerRef = useRef(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userRole, setUserRole] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('code');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentImagesArray, setCurrentImagesArray] = useState([]);
  const [selectedProductForViewer, setSelectedProductForViewer] = useState(null);

  // Sau đó là các hàm xử lý
  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    // Force fetch khi thay đổi số lượng items/trang
    fetchProducts(true);
  };

  // Thêm useEffect để lấy company_id từ localStorage
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (userDetails?.company_id) {
      // Đảm bảo company_id là string
      setCompanyId(userDetails.company_id.toString());
    }
  }, []);

  // Thêm hàm kiểm tra data cũ
  const checkDataFreshness = () => {
    const cacheKey = apiService.getCacheKey('/api/products', {
      search: searchTerm,
      page: currentPage,
      limit: rowsPerPage,
      company_id: companyId
    });
    
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
      const isStale = Date.now() - timestamp > apiService.CACHE_DURATION;
      setIsDataStale(isStale);
    }
  };

  // Cập nhật fetchProducts để ưu tiên dùng cache
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getProductsWithCache({
        page: currentPage,
        limit: rowsPerPage,
        search: searchQuery,
        search_field: searchField,
        sort_by: sortField,
        sort_order: sortOrder
      });

      if (response?.data) {
        setProducts(response.data);
        setTotalItems(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchQuery, searchField, sortField, sortOrder]);

  // Sử dụng useEffect để fetch data khi các tham số thay đổi
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProductsWithCache({
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
                search_field: searchField,
                sort_by: sortField,
                sort_order: sortOrder
            });

            if (response?.data) {
                setProducts(response.data);
                setTotalItems(response.total || 0);
                setTotalPages(response.total_pages || 1);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error('Error fetching products:', error);
                setError(error.message);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    fetchData();

    // Cleanup function
    return () => {
        controller.abort();
    };
  }, [currentPage, rowsPerPage, searchQuery, searchField, sortField, sortOrder]);

  // Thêm useEffect mới để theo dõi thay đổi params
  useEffect(() => {
    if (companyId) {
      const cacheKey = apiService.getCacheKey('/api/products', {
        search: searchTerm,
        page: currentPage,
        limit: rowsPerPage,
        company_id: companyId
      });

      const cachedData = apiService.getCacheData(cacheKey);
      if (!cachedData) {
        fetchProducts(true);
      }
    }
  }, [currentPage, rowsPerPage, searchTerm, companyId]);

  // Thêm useEffect để lấy role của user từ localStorage
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    setUserRole(userDetails?.role || '');
  }, []);

  // Hàm kiểm tra quyền admin
  const isAdmin = () => userRole === 'Admin';

  // Thêm hàm kiểm tra quyền xóa
  const canDelete = () => {
    return user?.role === 'Admin';
  };

  // Thêm hàm xử lý mở dialog xóa
  const handleOpenDeleteDialog = (productId) => {
    setSelectedProductId(productId);
    setDeleteDialogOpen(true);
  };

  // Hàm xử lý xóa sản phẩm
  const handleDeleteProduct = async () => {
    if (!selectedProductId) return;

    try {
      setDeleteLoading(true);
      const response = await apiService.deleteProduct(selectedProductId);
      
      // Xóa sản phẩm khỏi state
      setProducts(prev => prev.filter(p => p.id !== selectedProductId));
      
      // Cập nhật tổng số sản phẩm
      setTotalItems(prev => prev - 1);
      
      // Tính lại tổng số trang
      const newTotalPages = Math.ceil((totalItems - 1) / rowsPerPage);
      setTotalPages(newTotalPages);
      
      // Kiểm tra và điều chỉnh trang hiện tại nếu cần
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
      
      setSuccessMessage('Xóa sản phẩm và các ảnh liên quan thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message || 'Không thể xóa sản phẩm');
    } finally {
      setDeleteLoading(false);
      setSelectedProductId(null);
    }
  };

  // Thêm useEffect để xóa thông báo sau 3 giây
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Thêm hàm xử lý thêm sản phẩm
  const handleAddProduct = async (productData) => {
    try {
      setLoading(true);
      
      // Lấy thông tin user hiện tại
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Chuẩn bị dữ liệu sản phẩm
      const newProductData = {
        product_name: productData.product_name,
        product_code: productData.product_code,
        brand: productData.brand || "",
        description: productData.description || "",
        price: parseFloat(productData.price),
        company_id: userDetails.company_id,
        image_urls: productData.image_urls || [],
        colors: productData.colors || "",
        creator_name: productData.creator_name || ""
      };

      // Gọi API tạo sản phẩm
      const response = await apiService.createProduct(newProductData);
      
      setSuccessMessage('Thêm sản phẩm thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Cập nhật state với sản phẩm mới
      setProducts(prev => [{
        ...response,
        created_by_name: userDetails.username,
        created_at: new Date().toISOString()
      }, ...prev]);

      // Xóa cache và fetch lại dữ liệu mới nhất
      await fetchProducts(true);
      
      // Đóng dialog
      setShowDialog(false);
    } catch (error) {
      setError(error.message || 'Không thể thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      if (!selectedProduct) return;
      
      // Tạo object chứa dữ liệu cập nhật
      const updateData = {
        ...productData,
        company_id: companyId
      };
      
      const response = await apiService.put(
        `/api/products/${selectedProduct.id}`, 
        updateData
      );
      
      if (response) {
        // Xóa cache và fetch lại dữ liệu
        apiService.clearProductsCache(companyId);
        await fetchProducts(true);
        
        setSuccessMessage('Cập nhật sản phẩm thành công');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message || 'Không thể cập nhật sản phẩm');
    }
  };

  // Thêm phương thức clearProductCache
  const clearProductCache = () => {
    if (companyId) {
      apiService.clearProductsCache(companyId);
    }
  };

  // Hàm xử lý click vào ảnh
  const handleImageClick = (imageUrl, product, index) => {
    setSelectedImageIndex(index);
    setCurrentImagesArray(product.image_urls || []);
    setSelectedProductForViewer(product);
    setImageViewerOpen(true);
  };

  // Hàm xử lý zoom bằng scroll chuột
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5);
    setZoomLevel(newZoom);
  };


  // Hàm xử lý copy URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(selectedImage);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Hàm điều hướng ảnh
  const handleNavigate = (direction) => {
    if (!currentProduct?.image_urls || currentProduct.image_urls.length <= 1) return;
    
    // Reset các trạng thái transform khi chuyển ảnh
    resetImageTransform();
    
    if (direction === 'next') {
      setCurrentImageIndex(prev => 
        prev < currentProduct.image_urls.length - 1 ? prev + 1 : 0
      );
      setSelectedImage(currentProduct.image_urls[
        currentImageIndex < currentProduct.image_urls.length - 1 ? currentImageIndex + 1 : 0
      ]);
    } else {
      setCurrentImageIndex(prev => 
        prev > 0 ? prev - 1 : currentProduct.image_urls.length - 1
      );
      setSelectedImage(currentProduct.image_urls[
        currentImageIndex > 0 ? currentImageIndex - 1 : currentProduct.image_urls.length - 1
      ]);
    }
  };

  // Hàm xử lý quay ảnh
  const handleRotate = (direction) => {
    setRotation(prev => {
      if (direction === 'left') return (prev - 90) % 360;
      if (direction === 'right') return (prev + 90) % 360;
      return prev;
    });
  };

  // Hàm xử lý lật ảnh
  const handleFlip = (direction) => {
    if (direction === 'horizontal') {
      setIsHorizontalFlipped(prev => !prev);
    } else if (direction === 'vertical') {
      setIsVerticalFlipped(prev => !prev);
    }
  };

  // Hàm reset tất cả transform
  const resetImageTransform = () => {
    setZoomLevel(1);
    setRotation(0);
    setIsHorizontalFlipped(false);
    setIsVerticalFlipped(false);
  };

  // Hàm bắt đầu/dừng slideshow
  const toggleSlideshow = () => {
    if (isPlaying) {
      clearInterval(playTimerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playTimerRef.current = setInterval(() => {
        handleNavigate('next');
      }, 3000);
    }
  };

  // Xử lý phím tắt
  useEffect(() => {
    if (!imageModalOpen) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      
      switch (e.key) {
        case 'ArrowLeft':
          handleNavigate('prev');
          break;
        case 'ArrowRight':
          handleNavigate('next');
          break;
        case 'r':
          handleRotate('right');
          break;
        case 'l':
          handleRotate('left');
          break;
        case 'h':
          handleFlip('horizontal');
          break;
        case 'v':
          handleFlip('vertical');
          break;
        case 'Escape':
          closeImageViewer();
          break;
        case '0':
          resetImageTransform();
          break;
        case 'c':
          handleCopyUrl();
          break;
        case 'p':
          toggleSlideshow();
          break;
        case 'i':
          setShowImageInfo(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageModalOpen, currentImageIndex, currentProduct, zoomLevel, rotation, isHorizontalFlipped, isVerticalFlipped, isPlaying]);

  // Dừng slideshow khi đóng modal
  const closeImageViewer = () => {
    if (isPlaying) {
      clearInterval(playTimerRef.current);
      setIsPlaying(false);
    }
    setImageModalOpen(false);
    resetImageTransform();
  };

  // Xóa interval khi unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, []);

  // Cải tiến hàm tải lại dữ liệu
  const handleRefresh = async (force = false) => {
    try {
      setLoading(true);
      
      // Lấy dữ liệu mới nhất
      const response = await apiService.get('/api/products', {
        params: {
          page: currentPage,
          limit: rowsPerPage,
          search: searchTerm,
          company_id: companyId,
          forceFetch: force
        }
      });

      // So sánh với dữ liệu hiện tại
      const isDataChanged = JSON.stringify(products) !== JSON.stringify(response.data);
      
      if (isDataChanged || force) {
        setProducts(response.data || []);
        setTotalItems(response.total || 0);
        setTotalPages(Math.ceil(response.total / rowsPerPage) || 1);
        setSuccessMessage('Dữ liệu đã được cập nhật');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage('Dữ liệu đã là mới nhất');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Không thể tải lại dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi click vào nút thêm sản phẩm
  const handleAddProductClick = () => {
    if (!isAdmin()) {
      setError('Bạn không có quyền thêm sản phẩm mới');
      return;
    }
    setSelectedProduct(null);
    setShowDialog(true);
  };

  // Hàm xử lý tìm kiếm
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: 1,
        limit: rowsPerPage,
        search: searchQuery,
        search_field: searchField || 'code'
      };

      const data = await apiService.get('/api/products', { params });
      setProducts(data.data);
      setTotalItems(data.total);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Không thể tìm kiếm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy tên file từ URL
  const getFileNameFromUrl = (url) => {
    if (!url) return '';
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop();
    } catch (error) {
      console.error('Không thể phân tích URL:', error);
      return url.split('/').pop() || '';
    }
  };

  // Hàm lấy kích thước ảnh
  const getImageDimensions = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  // Lấy kích thước ảnh khi chọn ảnh mới
  useEffect(() => {
    if (selectedImage && imageModalOpen) {
      getImageDimensions(selectedImage).then((dimensions) => {
        setImageDimensions(dimensions);
      });
    }
  }, [selectedImage, imageModalOpen]);

  // Hàm đóng ImageViewer
  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
    setSelectedImageIndex(0);
    setCurrentImagesArray([]);
    setSelectedProductForViewer(null);
  };

  return (
    <div className="layout-container">
      <Sidebar 
        open={sidebarOpen}
        onToggle={handleToggleSidebar}
      />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="product-management">
          {/* Thêm thông báo thành công/lỗi */}
          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Thêm thông báo data cũ */}
          {isDataStale && (
            <div className="alert alert-warning" role="alert">
              Dữ liệu có thể đã cũ. 
              <button 
                className="btn btn-link"
                onClick={() => fetchProducts(true)}
              >
                Cập nhật ngay
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="toolbar">
            <div className="d-flex align-items-center gap-3">
              <h4 className="mb-0">Quản lý Sản phẩm</h4>
              
              {/* Cập nhật giao diện tìm kiếm */}
              <div className="input-group search-field" style={{ maxWidth: '400px' }}>
                <select
                  className="form-select"
                  style={{ maxWidth: '100px' }}
                  value={searchField || 'code'}
                  onChange={(e) => setSearchField(e.target.value)}
                >
                  <option value="code">Mã SP</option>
                  <option value="name">Tên SP</option>
                  <option value="creator">Người tạo</option>
                  <option value="price">Giá</option>
                </select>
                
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {/* {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : ( */}
                    <SearchIcon fontSize="small" />
                  {/* )} */}
                </button>
              </div>

              <button 
                className="btn btn-outline-secondary"
                onClick={() => handleRefresh(true)}
                title="Tải lại dữ liệu"
              >
                <RefreshIcon fontSize="small" />

              </button>
            </div>
            {/* Chỉ hiển thị nút thêm sản phẩm cho admin */}
            {isAdmin() && (
              <button
                className="btn btn-primary"
                onClick={handleAddProductClick}
              >
                <AddIcon className="me-2" />
                Thêm sản phẩm
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : (
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="image-column">Hình ảnh</th>
                    <th className="code-column" style={{minWidth: '120px'}}>Mã sản phẩm</th>
                    <th className="brand-column" style={{minWidth: '115px'}}>Thương hiệu</th>
                    <th className="colors-column" style={{minWidth: '100px'}}>Màu sắc</th>
                    <th className="price-column" style={{minWidth: '100px'}}>Giá</th>
                    <th className="notes-column">Ghi chú</th>
                    <th className="creator-original-column" style={{minWidth: '100px'}}>Người tạo SP</th>
                    <th className="creator-column" style={{minWidth: '100px'}}>Người tạo</th>
                    
                    {/* Chỉ hiển thị cột thao tác cho admin */}
                    {isAdmin() && (
                      <th className="actions-column text-center" style={{minWidth: '100px'}}>Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(products) && products.map((product) => (
                    <tr key={product.id}>
                      <td style={{minWidth: '400px'}}>
                        <div className="product-images-container">
                          {product.image_urls && product.image_urls.map((img, index) => (
                            <div 
                              key={index} 
                              className="product-table-image" 
                              style={{ cursor: 'pointer' }} 
                              onClick={() => handleImageClick(img, product, index)}
                            >
                              <div className="image-placeholder">
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Đang tải...</span>
                                </div>
                              </div>
                              <img
                                src={img}
                                alt={`Product ${index + 1}`}
                                className="img-fluid"
                                loading="lazy"
                                onLoad={(e) => {
                                  e.target.previousSibling.style.display = 'none';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{minWidth: '120px'}}>
                        <div className="product-code">
                          <div>{product.product_code}</div>
                          <div className="text-muted">{product.product_name}</div>
                        </div>
                      </td>
                      <td style={{minWidth: '115px'}}>{product.brand || '-'}</td>
                      <td style={{minWidth: '100px'}}>{product.colors || '-'}</td>
                      <td style={{minWidth: '100px'}}>
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency',
                          currency: 'VND'
                        }).format(product.price)}
                      </td>
                      <td>
                        <p className="notes-column">{product.description || '-'}</p>
                      </td>
                      <td>
                        <div className="creator-original-info">
                          <div>{product.creator_name || '-'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="creator-info">
                          <div>{product.created_by_name}</div>
                        </div>
                      </td>
                      
                      {/* Chỉ hiển thị cột thao tác cho admin */}
                      {isAdmin() && (
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn btn-sm btn-icon"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDialog(true);
                              }}
                              title="Chỉnh sửa"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            <button 
                              className="btn btn-sm btn-icon text-danger"
                              onClick={() => handleOpenDeleteDialog(product.id)}
                              disabled={deleteLoading}
                              title="Xóa"
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {/* Pagination */}
        <div className="pagination-container">
              <div className="pagination-controls-container">
                <div className="rows-per-page">
                  <span>Hiển thị</span>
                  <select 
                    className="form-select"
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    style={{minWidth: '60px'}}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span>sản phẩm mỗi trang</span>
                </div>
                
                <div className="pagination-info">
                  Hiển thị {products.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0} - {Math.min(currentPage * rowsPerPage, totalItems)} trong số {totalItems} sản phẩm
                </div>
              </div>

              <div className="pagination-controls">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <PrevIcon fontSize="small" />
                </button>
                
                {(() => {
                  // Số lượng trang hiển thị ở hai bên trang hiện tại
                  const siblingCount = 2;
                  // Luôn hiển thị trang đầu và cuối
                  const showFirst = true;
                  const showLast = true;
                  
                  // Mảng chứa các trang sẽ hiển thị
                  let pages = [];
                  
                  // Thêm trang đầu
                  if (showFirst && totalPages > 0) {
                    pages.push(1);
                  }
                  
                  // Tính toán phạm vi trang cần hiển thị
                  let startPage = Math.max(2, currentPage - siblingCount);
                  let endPage = Math.min(totalPages - 1, currentPage + siblingCount);
                  
                  // Thêm dấu "..." sau trang đầu nếu cần
                  if (startPage > 2) {
                    pages.push('ellipsis-start');
                  }
                  
                  // Thêm các trang ở giữa
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }
                  
                  // Thêm dấu "..." trước trang cuối nếu cần
                  if (endPage < totalPages - 1) {
                    pages.push('ellipsis-end');
                  }
                  
                  // Thêm trang cuối
                  if (showLast && totalPages > 1) {
                    pages.push(totalPages);
                  }
                  
                  // Loại bỏ các giá trị trùng lặp
                  pages = [...new Set(pages)];
                  
                  // Render các nút trang
                  return pages.map((pageNum, index) => {
                    if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                      return (
                        <button 
                          key={pageNum} 
                          className="btn btn-sm btn-outline-secondary disabled"
                          disabled
                        >
                          ...
                        </button>
                      );
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
                
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <NextIcon fontSize="small" />
                </button>
              </div>
            </div>
      </main>

      {/* Add ProductDialog */}
      <ProductDialog
        show={showDialog}
        onHide={() => setShowDialog(false)}
        onSubmit={selectedProduct ? handleEditProduct : handleAddProduct}
        initialData={selectedProduct}
      />

      {/* Dialog xác nhận xóa */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => {
          if (!deleteLoading) {
            setDeleteDialogOpen(false);
            setSelectedProductId(null);
          }
        }}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa sản phẩm này?
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteProduct} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xóa...
              </>
            ) : (
              'Xóa'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ImageViewer component */}
      <ImageViewer
        show={imageViewerOpen}
        onClose={handleCloseImageViewer}
        images={currentImagesArray}
        startIndex={selectedImageIndex}
        productCode={selectedProductForViewer?.product_code || ''}
        productName={selectedProductForViewer?.product_name || ''}
      />

      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="copy-notification">
          Đã sao chép URL ảnh vào clipboard
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
