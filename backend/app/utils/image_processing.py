from PIL import Image
import requests
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import logging
import cv2
import numpy as np
import faiss

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

executor = ThreadPoolExecutor(max_workers=3)  # Giới hạn số worker để tránh quá tải

def download_image(url):
    """Tải ảnh với timeout và xử lý lỗi"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {str(e)}")
        return None

def calculate_orb_hash(image_bytes):
    """Tính ORB feature vector và mã hóa thành 64-bit hash"""
    try:
        # Chuyển bytes thành ảnh OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return None
            
        # Resize ảnh để đảm bảo tính nhất quán
        img = cv2.resize(img, (256, 256))
        
        # Khởi tạo ORB detector với số lượng features giới hạn
        orb = cv2.ORB_create(nfeatures=32)
        
        # Tính toán các keypoints và descriptors
        keypoints, descriptors = orb.detectAndCompute(img, None)
        
        if descriptors is None or len(descriptors) == 0:
            logger.warning("No ORB descriptors found in image")
            return None
            
        # Nếu số lượng features quá nhỏ, thì không đủ đặc trưng cho so sánh
        if len(descriptors) < 10:
            logger.warning(f"Only {len(descriptors)} ORB descriptors found - not enough for matching")
            return None
            
        # Lấy 32 descriptors đầu tiên hoặc padding nếu thiếu
        if len(descriptors) < 32:
            # Padding nếu có ít hơn 32 descriptors
            padding = np.zeros((32 - len(descriptors), 32), dtype=np.uint8)
            descriptors = np.vstack([descriptors, padding])
        else:
            # Lấy 32 descriptors
            descriptors = descriptors[:32]
            
        # Chuyển đổi numpy array thành binary string để lưu vào database
        binary_descriptors = descriptors.tobytes()
        
        return binary_descriptors
    except Exception as e:
        logger.error(f"Error calculating ORB hash: {str(e)}")
        return None

def process_image(image_url):
    """Xử lý ảnh và tính ORB feature hash"""
    try:
        # Tải ảnh
        image_bytes = download_image(image_url)
        if image_bytes is None:
            return None, None
            
        # Tính ORB features hash
        orb_hash = calculate_orb_hash(image_bytes)
        
        return None, orb_hash
    except Exception as e:
        logger.error(f"Error processing image {image_url}: {str(e)}")
        return None, None 