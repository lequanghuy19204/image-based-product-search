from PIL import Image
import imagehash
import requests
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

executor = ThreadPoolExecutor(max_workers=3)  # Giới hạn số worker để tránh quá tải

def download_image(url):
    """Tải ảnh với timeout và xử lý lỗi"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {str(e)}")
        return None

def calculate_hash(image_url):
    """Tính phash của ảnh"""
    try:
        img = download_image(image_url)
        if img is None:
            return None
            
        # Chuyển đổi ảnh RGBA sang RGB nếu cần
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            
        # Resize ảnh nhỏ hơn trước khi tính hash để tăng tốc độ
        img = img.resize((32, 32), Image.NEAREST)
        return str(imagehash.phash(img))
    except Exception as e:
        logger.error(f"Error calculating hash: {str(e)}")
        return None

def process_image(image_url):
    """Xử lý ảnh và tính phash"""
    try:
        # Chỉ tính hash của ảnh
        image_hash = calculate_hash(image_url)
        
        return None, image_hash
    except Exception as e:
        logger.error(f"Error processing image {image_url}: {str(e)}")
        return None, None 