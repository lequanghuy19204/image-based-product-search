from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
import imagehash
from PIL import Image
import requests
from io import BytesIO

# Khởi tạo model
model = EfficientNetB0(weights='imagenet', include_top=False, pooling='avg')

def download_image(url):
    response = requests.get(url)
    return Image.open(BytesIO(response.content))

def extract_features(image_url):
    try:
        # Tải ảnh từ URL
        img = download_image(image_url)
        img = img.resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        
        # Trích xuất đặc trưng
        features = model.predict(img_array)
        return features[0].tolist()
    except Exception as e:
        print(f"Error extracting features: {str(e)}")
        return None

def calculate_hash(image_url):
    try:
        img = download_image(image_url)
        return str(imagehash.average_hash(img))
    except Exception as e:
        print(f"Error calculating hash: {str(e)}")
        return None

def process_image(image_url):
    features = extract_features(image_url)
    image_hash = calculate_hash(image_url)
    return features, image_hash 