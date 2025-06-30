# N8N Docker Scripts

## 🚀 Cách sử dụng:

### 1. Khởi động N8N:
```bash
chmod +x run-n8n.sh
./run-n8n.sh
```

### 2. Dừng N8N:
```bash
chmod +x stop-n8n.sh
./stop-n8n.sh
```

### 3. Xem logs:
```bash
docker logs search-images-n8n -f
```

## 🌐 Truy cập:
- URL: http://localhost:5678
- Username: admin
- Password: admin123

## 📝 Commands hữu ích:
```bash
# Xem container đang chạy
docker ps

# Restart container
docker restart search-images-n8n

# Vào shell container
docker exec -it search-images-n8n sh

# Xem data volume
docker volume inspect n8n_data
```

## 🗑️ Xóa hoàn toàn (bao gồm data):
```bash
./stop-n8n.sh
docker volume rm n8n_data
``` 