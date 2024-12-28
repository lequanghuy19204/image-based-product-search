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
  Tooltip,
  Zoom
} from '@mui/material';
import {
  CloudUpload,
  Search,
  Delete,
  ImageSearch as ImageSearchIcon,
  Info
} from '@mui/icons-material';
import '../styles/ImageSearch.css';

function ImageSearch() {
  const [images, setImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (imageList) => {
    setImages(imageList);
  };

  const handleSearch = async () => {
    if (images.length === 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Giả lập kết quả tìm kiếm
      setSearchResults([
        {
          id: 1,
          imageUrl: 'https://picsum.photos/400/300',
          title: 'Áo thun nam',
          price: '199.000đ',
          similarity: '98%'
        },
        {
          id: 2,
          imageUrl: 'https://picsum.photos/400/301',
          title: 'Áo polo',
          price: '299.000đ',
          similarity: '95%'
        },
        {
          id: 3,
          imageUrl: 'https://picsum.photos/400/302',
          title: 'Áo sơ mi',
          price: '399.000đ',
          similarity: '90%'
        }
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" className="search-container">
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
              <ImageListItem key={item.id} className="result-item">
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
                      <Chip 
                        label={`Độ tương đồng: ${item.similarity}`}
                        size="small"
                        color="primary"
                        className="similarity-chip"
                      />
                    </Box>
                  }
                  actionIcon={
                    <Tooltip title="Xem chi tiết" TransitionComponent={Zoom}>
                      <IconButton className="view-button">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </Container>
  );
}

export default ImageSearch;