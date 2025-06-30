#!/bin/bash

# N8N Docker Run Script
echo "Starting N8N with Docker Run..."

# Stop existing container if running
echo "Stopping existing N8N container..."
docker stop search-images-n8n 2>/dev/null || true
docker rm search-images-n8n 2>/dev/null || true

# Run N8N container
echo "Starting N8N container..."
docker run -d \
  --name search-images-n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=admin123 \
  -e N8N_HOST=0.0.0.0 \
  -e N8N_PORT=5678 \
  -e N8N_RUNNERS_ENABLED=true \
  -v n8n_data:/home/node/.n8n \
  --restart unless-stopped \
  n8nio/n8n:latest

# Check status
echo "Waiting for N8N to start..."
sleep 10

# Show container status
echo "Container Status:"
docker ps | grep search-images-n8n

# Show logs
echo "Recent logs:"
docker logs search-images-n8n --tail 10

echo ""
echo "N8N is running!"
echo "Access: http://localhost:5678"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Commands:"
echo "  Stop:  docker stop search-images-n8n"
echo "  Logs:  docker logs search-images-n8n -f"
echo "  Shell: docker exec -it search-images-n8n sh" 