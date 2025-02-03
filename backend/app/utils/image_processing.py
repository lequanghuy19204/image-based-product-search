from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
import imagehash
from PIL import Image
import requests
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import logging
import efficientnet.tfkeras as efn

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Khởi tạo model là biến global để tái sử dụng
model = None
executor = ThreadPoolExecutor(max_workers=3)  # Giới hạn số worker để tránh quá tải

def get_model():
    """Lazy loading cho model"""
    global model
    if model is None:
        model = efn.EfficientNetLiteB0(
            weights='imagenet', 
            include_top=False, 
            pooling='avg'
        )
    return model

def download_image(url):
    """Tải ảnh với timeout và xử lý lỗi"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {str(e)}")
        return None

def preprocess_image(img):
    """Tiền xử lý ảnh"""
    try:
        # Chuyển đổi ảnh RGBA sang RGB nếu cần
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            
        # Resize với chất lượng thấp hơn để tăng tốc độ
        img = img.resize((224, 224), Image.NEAREST)
        
        # Chuyển thành array
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return efn.preprocess_input(img_array)
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return None

def extract_features(image_url):
    """Trích xuất đặc trưng từ ảnh"""
    try:
        img = download_image(image_url)
        if img is None:
            return None
            
        processed_img = preprocess_image(img)
        if processed_img is None:
            return None

        # Lấy model và predict
        features = get_model().predict(processed_img, verbose=0)
        return features[0].tolist()
    except Exception as e:
        logger.error(f"Error extracting features: {str(e)}")
        return None

def calculate_hash(image_url):
    """Tính hash của ảnh"""
    try:
        img = download_image(image_url)
        if img is None:
            return None
            
        # Resize ảnh nhỏ hơn trước khi tính hash để tăng tốc độ
        img = img.resize((32, 32), Image.NEAREST)
        return str(imagehash.average_hash(img))
    except Exception as e:
        logger.error(f"Error calculating hash: {str(e)}")
        return None

def process_image(image_url):
    """Xử lý song song việc trích xuất đặc trưng và tính hash"""
    try:
        # Submit các task vào thread pool
        feature_future = executor.submit(extract_features, image_url)
        hash_future = executor.submit(calculate_hash, image_url)
        
        # Lấy kết quả với timeout
        features = feature_future.result(timeout=30)
        image_hash = hash_future.result(timeout=30)
        
        return features, image_hash
    except Exception as e:
        logger.error(f"Error processing image {image_url}: {str(e)}")
        return None, None 