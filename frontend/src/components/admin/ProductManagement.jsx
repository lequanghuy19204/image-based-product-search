import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
  
  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    setUser(currentUser);
  }, []);

  // Hàm kiểm tra quyền xóa
  const canDelete = () => {
    return user?.role === 'Admin';
  };

  // Hàm xử lý xóa sản phẩm
  const handleDelete = async (productId) => {
    if (!canDelete()) {
      alert('Bạn không có quyền xóa sản phẩm');
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await apiService.delete(`/api/admin/products/${productId}`);
        // Cập nhật lại danh sách sản phẩm
        fetchProducts();
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/api/products');
      setProducts(response.data);
      setTotalPages(Math.ceil(response.data.length / rowsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    }
  };

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

  const handleAddProduct = async (formData) => {
    try {
      const response = await apiService.post('/api/products', formData);
      
      if (response.data) {
        setSuccessMessage('Thêm sản phẩm thành công');
        fetchProducts();
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error adding product:', error.response?.data);
      let errorMessage = 'Không thể thêm sản phẩm';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc[1]}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleEditProduct = async (formData) => {
    try {
      await apiService.put(`/api/products/${selectedProduct.id}`, formData);
      toast.success('Cập nhật sản phẩm thành công');
      fetchProducts();
      setShowDialog(false);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Không thể cập nhật sản phẩm');
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
            <table className="table table-bordered table-hover align-middle">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="image-column">Hình ảnh</th>
                  <th className="code-column">Mã sản phẩm</th>
                  <th className="brand-column">Thương hiệu</th>
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
                          {product.images.map((img, index) => (
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
                          <div>{product.id}</div>
                          <div className="text-muted">{product.code}</div>
                        </div>
                      </td>
                      <td>{product.brand}</td>
                      <td>
                        <p className="notes-column">{product.notes}</p>
                      </td>
                      <td>{product.creator}</td>
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
                              onClick={() => handleDelete(product.id)}
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
    </div>
  );
}

export default ProductManagement;
