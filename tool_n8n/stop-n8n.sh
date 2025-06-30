#!/bin/bash

# Stop N8N Script
echo "⏹Stopping N8N container..."

docker stop search-images-n8n
docker rm search-images-n8n

echo "N8N container stopped and removed!"
echo "Data is preserved in Docker volume 'n8n_data'" 