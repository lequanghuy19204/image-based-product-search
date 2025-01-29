import { useState, useEffect } from 'react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/ProductManagement.css';
import { apiService } from '../../services/api.service';
import ProductDialog from './ProductDialog';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [user, setUser] = useState(null);
  const [isDataStale, setIsDataStale] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Sau đó là các hàm xử lý
  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = {
        search: searchTerm,
        page: newPage,
        limit: rowsPerPage,
        company_id: companyId
      };
      
      // Kiểm tra xem có cache cho trang mới không
      const cacheKey = apiService.getProductsCacheKey(params);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, metadata } = JSON.parse(cachedData);
        setProducts(data);
        setTotalItems(metadata.total);
        setTotalPages(metadata.total_pages);
      }
      
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
      setCompanyId(userDetails.company_id);
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
  const fetchProducts = async (forceFetch = false) => {
    try {
      if (!companyId) return;
      setLoading(true);
      
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: rowsPerPage,
        company_id: companyId
      };

      // Kiểm tra cache trước khi gọi API
      const cacheKey = apiService.getProductsCacheKey(params);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData && !forceFetch) {
        const { data, metadata } = JSON.parse(cachedData);
        setProducts(data);
        setTotalItems(metadata.total);
        setTotalPages(metadata.total_pages);
        setLoading(false);
        return;
      }

      const response = await apiService.get('/api/products', {
        params,
        useCache: true,
        forceFetch
      });

      if (response) {
        setProducts(response.data);
        setTotalItems(response.total);
        setTotalPages(response.total_pages);
        setIsDataStale(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại useEffect để kiểm tra cache trước
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUser(user);
    
    // Chỉ gọi API nếu không có cache hoặc cache đã hết hạn
    const cacheKey = apiService.getCacheKey('/api/products', {
      search: searchTerm,
      page: currentPage,
      limit: rowsPerPage,
      company_id: companyId
    });

    const cachedData = apiService.getCacheData(cacheKey);
    if (cachedData) {
      setProducts(cachedData.data);
      setTotalItems(cachedData.total);
      setTotalPages(cachedData.total_pages);
      checkDataFreshness();
    } else {
      fetchProducts();
    }

    // Thiết lập interval để kiểm tra data cũ
    const interval = setInterval(() => {
      checkDataFreshness();
    }, 5*60000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(interval);
  }, []);

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

  // Hàm kiểm tra quyền xóa
  const canDelete = () => {
    return user?.role === 'Admin';
  };

  // Thay thế hàm handleDelete cũ bằng 2 hàm mới
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      await apiService.delete(`/api/products/${selectedProduct.id}`);
      clearProductCache(); // Xóa cache khi có thay đổi
      setSuccessMessage('Xóa sản phẩm thành công');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts(true);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Không thể xóa sản phẩm. Vui lòng thử lại.');
    } finally {
      setDeleteLoading(false);
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

  // Cập nhật các hàm xử lý thêm/sửa/xóa
  const handleAddProduct = async (formData) => {
    try {
      formData.append('company_id', companyId);
      const response = await apiService.postFormData('/api/products', formData);
      
      if (response) {
        clearProductCache();
        setSuccessMessage('Thêm sản phẩm thành công');
        setShowDialog(false);
        fetchProducts(true);
      }
    } catch (error) {
      setError(error.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleEditProduct = async (formData) => {
    try {
      if (!selectedProduct) return;
      
      formData.append('company_id', companyId);
      const response = await apiService.putFormData(
        `/api/products/${selectedProduct.id}`, 
        formData
      );
      
      if (response) {
        clearProductCache(); // Xóa cache khi có thay đổi
        setSuccessMessage('Cập nhật sản phẩm thành công');
        setShowDialog(false);
        fetchProducts(true);
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
              <button 
                className="btn btn-outline-secondary"
                onClick={() => fetchProducts(true)}
                title="Tải lại dữ liệu"
              >
                <RefreshIcon fontSize="small" />
              </button>
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
                    <th className="code-column" style={{minWidth: '120px'}}>Mã sản phẩm</th>
                    <th className="brand-column" style={{minWidth: '115px'}}>Thương hiệu</th>
                    <th className="price-column" style={{minWidth: '100px'}}>Giá</th>
                    <th className="notes-column">Ghi chú</th>
                    <th className="creator-column" style={{minWidth: '100px'}}>Người tạo</th>
                    <th className="actions-column text-center" style={{minWidth: '100px'}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .map((product) => (
                      <tr key={product.id}>
                        <td style={{minWidth: '400px'}}>
                          <div className="product-images-container">
                            {product.image_urls && product.image_urls.map((img, index) => (
                              <div key={index} className="product-table-image">
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
        onHide={() => setShowDialog(false)}
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
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
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
    </div>
  );
}

export default ProductManagement;
