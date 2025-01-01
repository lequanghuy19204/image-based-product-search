import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import Sidebar from '../common/Sidebar';
import '../../styles/ProductManagement.css';

function ProductManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userData } = useUser();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    status: 'active',
    image: null,
    featured: false
  });

  const [products] = useState([
    {
      id: 1,
      name: 'Áo thun nam',
      price: 199000,
      image: 'https://picsum.photos/300/300',
      category: 'Áo',
      description: 'Áo thun nam chất lượng cao',
      status: 'active',
      featured: true
    },
    // Thêm sản phẩm mẫu khác...
  ]);

  const categories = [
    'Áo', 'Quần', 'Giày', 'Phụ kiện'
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userData?.role !== 'admin') {
      navigate('/products');
      return;
    }

    setLoading(false);
  }, [currentUser, userData, navigate]);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description || '',
        status: product.status,
        image: product.image,
        featured: product.featured || false
      });
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        status: 'active',
        image: null,
        featured: false
      });
    }
    setSelectedProduct(product);
    setDialogOpen(true);
    setFormError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
    setFormError('');
  };

  const handleOpenDeleteDialog = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Thêm xử lý upload ảnh ở đây
      setFormData(prev => ({
        ...prev,
        image: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.price || !formData.category) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      // Thêm xử lý lưu sản phẩm vào database
      console.log('Saving product:', formData);
      handleCloseDialog();
    } catch (error) {
      setFormError('Có lỗi xảy ra. Vui lòng thử lại.', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Thêm xử lý xóa sản phẩm
      console.log('Deleting product:', selectedProduct);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar 
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <Box className={`product-management ${sidebarOpen ? 'content-shift' : ''}`}>
        <Paper className="toolbar">
          <Typography variant="h5">Quản lý Sản phẩm</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Thêm sản phẩm
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper} className="table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hình ảnh</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="right">Giá</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box className="product-table-image">
                      <img src={product.image} alt={product.name} />
                    </Box>
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.category}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {product.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                      color={product.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box className="table-actions">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(product)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} trên ${count}`
            }
          />
        </TableContainer>

        {/* Dialog thêm/sửa sản phẩm */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={2} className="form-content">
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  variant="outlined"
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Danh mục"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Trạng thái"
                  >
                    <MenuItem value="active">Đang bán</MenuItem>
                    <MenuItem value="inactive">Ngừng bán</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.featured}
                      onChange={handleInputChange}
                      name="featured"
                    />
                  }
                  label="Sản phẩm nổi bật"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  fullWidth
                >
                  Tải ảnh lên
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              </Grid>
              {formData.image && (
                <Grid item xs={12}>
                  <Box className="preview-image">
                    <img src={formData.image} alt="Preview" />
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button 
              variant="contained"
              onClick={handleSubmit}
              startIcon={<SaveIcon />}
            >
              {selectedProduct ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog xác nhận xóa */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>
            Xác nhận xóa sản phẩm
          </DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa sản phẩm {selectedProduct?.name} không?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>
              Hủy
            </Button>
            <Button 
              onClick={handleDelete}
              variant="contained"
              color="error"
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default ProductManagement;
