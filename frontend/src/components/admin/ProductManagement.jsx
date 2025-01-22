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

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');

  // Mock data
  const [products] = useState([
    {
      id: 'CP_x3945',
      code: 'DHT287-TRT1523',
      brand: 'Nike',
      images: [
        'https://picsum.photos/300/300?random=1',
        'https://picsum.photos/300/300?random=2',
        'https://picsum.photos/300/300?random=3',
        'https://picsum.photos/300/300?random=3',
        'https://picsum.photos/300/300?random=3'
      ],
      notes: 'Áo thun cotton 100%, form regular fit',
      creator: 'Mkt trưởng',
    },
    // Thêm nhiều sản phẩm mẫu...
  ]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(products.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset về trang 1 khi thay đổi số lượng items/trang
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

  return (
    <div className="layout-container">
      <Sidebar 
        open={sidebarOpen}
        onToggle={handleToggleSidebar}
      />
      
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="product-management">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="d-flex align-items-center gap-3">
              <h4 className="mb-0">Quản lý Sản phẩm</h4>
              <div className="input-group search-field">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-outline-secondary">
                  <SearchIcon fontSize="small" />
                </button>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setOpenDialog(true)}>
              <AddIcon className="me-2" />
              Thêm sản phẩm
            </button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="table table-bordered table-hover align-middle">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-uppercase image-column">Hình ảnh</th>
                  <th className="text-uppercase code-column">Mã sản phẩm</th>
                  <th className="text-uppercase brand-column">Thương hiệu</th>
                  <th className="text-uppercase notes-column">Ghi chú</th>
                  <th className="text-uppercase creator-column">Người tạo</th>
                  <th className="text-uppercase actions-column text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
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
                            onClick={() => setOpenDialog(true)}
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
                  Hiển thị {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, products.length)} trong số {products.length} sản phẩm
                </div>
              </div>

              <div className="pagination-controls">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <PrevIcon fontSize="small" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <NextIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductManagement;
