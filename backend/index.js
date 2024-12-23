const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const app = express();
const port = 5000;

app.use(express.json());

// Middleware xác thực đơn giản
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer test-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh!'));
  }
});

app.use('/uploads', express.static('uploads'));

// API đăng nhập đơn giản
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.json({ token: 'test-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// API tải lên hình ảnh với tối ưu hóa
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Vui lòng chọn file để tải lên' });
  }

  const filename = `${Date.now()}-${req.file.originalname}`;
  const filepath = path.join('uploads', filename);

  try {
    // Tối ưu hóa hình ảnh trước khi lưu
    await sharp(req.file.buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toFile(filepath);

    res.json({
      success: true,
      filePath: `/uploads/${filename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xử lý hình ảnh' });
  }
});

// API lấy danh sách hình ảnh
app.get('/api/images', authMiddleware, (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Không thể đọc thư mục uploads' });
    }
    
    const images = files.map(file => ({
      name: file,
      url: `/uploads/${file}`
    }));
    
    res.json(images);
  });
});

// API xóa hình ảnh
app.delete('/api/images/:filename', authMiddleware, (req, res) => {
  const filepath = path.join('uploads', req.params.filename);
  
  fs.unlink(filepath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Không thể xóa file' });
    }
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
