import { useState, useEffect } from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/ProductManagement.css';
import { apiService } from '../../services/api.service';
import ProductDialog from './ProductDialog';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

function ProductManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);


  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset về trang 1 khi thay đổi số lượng items/trang
  };

  const [user, setUser] = useState(null);
  
  const CACHE_DURATION = 30 * 60 * 1000; // 30 phút
  const [isDataStale, setIsDataStale] = useState(false);

  // Thêm phương thức updateProductCache
  const updateProductCache = (updatedProducts) => {
    setProducts(updatedProducts);
    localStorage.setItem('cachedProducts', JSON.stringify(updatedProducts));
    localStorage.setItem('cachedProductsTime', Date.now().toString());
  };

  // Hàm kiểm tra xem có cần fetch lại data không
  const shouldFetchData = () => {
    const cachedTime = localStorage.getItem('cachedProductsTime');
    if (!cachedTime) return true;
    
    const timeElapsed = Date.now() - parseInt(cachedTime);
    const isExpired = timeElapsed > CACHE_DURATION;
    
    if (isExpired) setIsDataStale(true);
    return isExpired;
  };

  // Thêm useEffect để kiểm tra data cũ
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUser(user);
    fetchProducts();

    // Thiết lập interval để kiểm tra data cũ
    const interval = setInterval(() => {
      if (shouldFetchData()) {
        setIsDataStale(true);
      }
    }, 60000); // Kiểm tra mỗi phút

    return () => clearInterval(interval);
  }, []);

  // Hàm kiểm tra quyền xóa
  const canDelete = () => {
    return user?.role === 'Admin';
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Thay thế hàm handleDelete cũ bằng 2 hàm mới
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      await apiService.delete(`/api/products/${selectedProduct.id}`);
      const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
      updateProductCache(updatedProducts);
      setSuccessMessage('Xóa sản phẩm thành công');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Cập nhật lại fetchProducts để sử dụng cache
  const fetchProducts = async (forceFetch = false) => {
    try {
      // Kiểm tra cache trước
      const cachedData = localStorage.getItem('cachedProducts');
      
      // Nếu có cache và không bắt buộc fetch mới
      if (cachedData && !forceFetch && !shouldFetchData()) {
        const parsedData = JSON.parse(cachedData);
        updateProductCache(parsedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await apiService.get('/api/products', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: rowsPerPage
        }
      });

      if (response && response.data) {
        updateProductCache(response.data);
        setTotalItems(response.total);
        setTotalPages(response.total_pages);
        setIsDataStale(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Thêm useEffect để fetch lại khi các params thay đổi
  useEffect(() => {
    fetchProducts();
  }, [currentPage, rowsPerPage, searchTerm]);

  // Thêm debounce cho search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        fetchProducts();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

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

  // Cập nhật các hàm xử lý thêm/sửa/xóa
  const handleAddProduct = async (formData) => {
    try {
      const response = await apiService.post('/api/products', formData);
      if (response) {
        const updatedProducts = [...products, response];
        updateProductCache(updatedProducts);
        setSuccessMessage('Thêm sản phẩm thành công');
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleEditProduct = async (formData) => {
    try {
      const response = await apiService.putFormData(`/api/products/${selectedProduct.id}`, formData);
      const updatedProducts = products.map(p => p.id === selectedProduct.id ? response : p);
      updateProductCache(updatedProducts);
      setSuccessMessage('Cập nhật sản phẩm thành công');
      setShowDialog(false);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message || 'Không thể cập nhật sản phẩm');
    }
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
              <div className="input-group search-field">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary">
                  <SearchIcon fontSize="small" />
                </button>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedProduct(null);
                setShowDialog(true);
              }}
            >
              <AddIcon className="me-2" />
              Thêm sản phẩm
            </button>
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
                    <th className="code-column">Mã sản phẩm</th>
                    <th className="brand-column">Thương hiệu</th>
                    <th className="price-column">Giá</th>
                    <th className="notes-column">Ghi chú</th>
                    <th className="creator-column">Người tạo</th>
                    <th className="actions-column text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((product) => (
                      <tr key={product.id}>
                        <td style={{minWidth: '400px'}}>
                          <div className="product-images-container">
                            {product.image_urls && product.image_urls.map((img, index) => (
                              <div key={index} className="product-table-image">
                                <img
                                  src={img}
                                  alt={`Product ${index + 1}`}
                                  className="img-fluid"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="product-code">
                            <div>{product.product_code}</div>
                            <div className="text-muted">{product.product_name}</div>
                          </div>
                        </td>
                        <td>{product.brand || '-'}</td>
                        <td>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(product.price)}
                        </td>
                        <td>
                          <p className="notes-column">{product.description || '-'}</p>
                        </td>
                        <td>
                          <div className="creator-info">
                            <div>{product.created_by_name}</div>
                            <div className="text-muted small">
                              {new Date(product.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </td>
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
                            {canDelete() && (
                              <button 
                                className="btn btn-sm btn-icon text-danger"
                                onClick={() => handleDeleteClick(product)}
                                title="Xóa"
                              >
                                <DeleteIcon fontSize="small" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-controls-container">
                <div className="rows-per-page">
                  <span>Hiển thị</span>
                  <select 
                    className="form-select"
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>sản phẩm mỗi trang</span>
                </div>
                
                <div className="pagination-info">
                  Hiển thị {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, products.length)} trong số {products.length} sản phẩm
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <NextIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add ProductDialog */}
      <ProductDialog
        show={showDialog}
        onHide={() => {
          setShowDialog(false);
          setSelectedProduct(null);
        }}
        onSubmit={selectedProduct ? handleEditProduct : handleAddProduct}
        initialData={selectedProduct}
      />

      {/* Thêm Dialog xác nhận xóa */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa sản phẩm này?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ProductManagement;
