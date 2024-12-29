import { useState } from 'react';
import ImageUploading from 'react-images-uploading';
import {
  Box,
  Container,
  Typography,
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Search,
  Delete,
  ImageSearch as ImageSearchIcon,
  Info,
  Favorite,
  FavoriteBorder,
  Share,
  GetApp,
  Send
} from '@mui/icons-material';
import Sidebar from './common/Sidebar';
import '../styles/ImageSearch.css';

function ImageSearch() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [images, setImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState('');

  // Mock data cho comments
  const [comments] = useState([
    {
      id: 1,
      user: 'User 1',
      avatar: 'https://i.pravatar.cc/40?img=1',
      text: 'Sản phẩm rất đẹp!',
      timestamp: '2 giờ trước'
    },
    {
      id: 2,
      user: 'User 2',
      avatar: 'https://i.pravatar.cc/40?img=2',
      text: 'Giá cả hợp lý',
      timestamp: '1 giờ trước'
    }
  ]);

  const handleImageUpload = (imageList) => {
    setImages(imageList);
  };

  const handleSearch = async () => {
    if (images.length === 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Giả lập kết quả tìm kiếm với thêm thông tin
      setSearchResults([
        {
          id: 1,
          imageUrl: 'https://picsum.photos/400/300',
          title: 'Áo thun nam',
          price: '199.000đ',
          similarity: '98%',
          likes: 120,
          views: 1500,
          description: 'Áo thun nam chất liệu cotton 100%, thoáng mát',
          uploadDate: '2024-03-15',
          author: 'Shop ABC'
        },
        // ... thêm các kết quả khác
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    // Xử lý thêm comment
    setComment('');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar 
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Container 
        maxWidth={false}
        disableGutters
        className={`search-container ${sidebarOpen ? 'content-shift' : ''}`}
      >
        <Box className="header-section">
          <Typography variant="h4" component="h1" className="page-title">
            <ImageSearchIcon className="title-icon" />
            Tìm kiếm Sản phẩm Qua Hình ảnh
          </Typography>
          <Typography variant="body1" color="text.secondary" className="subtitle">
            Tải lên hình ảnh sản phẩm bạn muốn tìm, chúng tôi sẽ tìm những sản phẩm tương tự
          </Typography>
        </Box>

        <Paper elevation={3} className="upload-section">
          <ImageUploading
            multiple={false}
            value={images}
            onChange={handleImageUpload}
            maxNumber={1}
            dataURLKey="data_url"
            acceptType={['jpg', 'jpeg', 'png']}
          >
            {({
              imageList,
              onImageUpload,
              onImageRemove,
              isDragging,
              dragProps
            }) => (
              <Box className="upload-box">
                {imageList.length === 0 ? (
                  <Box className="upload-placeholder">
                    <Button
                      variant="outlined"
                      className={`upload-button ${isDragging ? 'dragging' : ''}`}
                      onClick={onImageUpload}
                      {...dragProps}
                    >
                      <CloudUpload className="upload-icon" />
                      <Box className="upload-text">
                        <Typography variant="h6">
                          Kéo thả hoặc nhấp để tải ảnh
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hỗ trợ: JPG, JPEG, PNG
                        </Typography>
                      </Box>
                    </Button>
                  </Box>
                ) : (
                  <Box className="preview-box">
                    <img src={imageList[0].data_url} alt="Preview" />
                    <IconButton
                      className="remove-button"
                      onClick={() => onImageRemove(0)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}
          </ImageUploading>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={loading ? null : <Search />}
            onClick={handleSearch}
            disabled={images.length === 0 || loading}
            className="search-button"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Tìm kiếm'}
          </Button>
        </Paper>

        {searchResults.length > 0 && (
          <Box className="results-section">
            <Typography variant="h6" gutterBottom className="results-title">
              Kết quả tìm kiếm
              <Chip label={`${searchResults.length} sản phẩm`} className="results-count" />
            </Typography>
            
            <ImageList cols={3} gap={24} className="results-grid">
              {searchResults.map((item) => (
                <ImageListItem 
                  key={item.id} 
                  className="result-item"
                  onClick={() => handleImageClick(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                  />
                  <ImageListItemBar
                    title={item.title}
                    subtitle={
                      <Box className="item-details">
                        <Typography variant="body2">{item.price}</Typography>
                        <Box className="item-stats">
                          <Chip 
                            icon={<FavoriteBorder />}
                            label={item.likes}
                            size="small"
                            className="stat-chip"
                          />
                          <Chip 
                            icon={<Info />}
                            label={`${item.views} lượt xem`}
                            size="small"
                            className="stat-chip"
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* Dialog xem chi tiết ảnh */}
        <Dialog
          open={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedImage && (
            <>
              <DialogTitle>
                {selectedImage.title}
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.title}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box className="image-details">
                      <Typography variant="h6" gutterBottom>
                        {selectedImage.price}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedImage.description}
                      </Typography>
                      <Box className="action-buttons">
                        <Button startIcon={<Favorite />}>
                          Thích ({selectedImage.likes})
                        </Button>
                        <Button startIcon={<Share />}>
                          Chia sẻ
                        </Button>
                        <Button startIcon={<GetApp />}>
                          Tải xuống
                        </Button>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Bình luận
                      </Typography>
                      <Box className="comment-section">
                        <List>
                          {comments.map((comment) => (
                            <ListItem key={comment.id} alignItems="flex-start">
                              <ListItemAvatar>
                                <Avatar src={comment.avatar} />
                              </ListItemAvatar>
                              <ListItemText
                                primary={comment.user}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2">
                                      {comment.text}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      {comment.timestamp}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                        <Box className="comment-input">
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Thêm bình luận..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                          <IconButton 
                            color="primary"
                            onClick={handleCommentSubmit}
                            disabled={!comment.trim()}
                          >
                            <Send />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedImage(null)}>
                  Đóng
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}

export default ImageSearch;