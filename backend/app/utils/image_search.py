from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
import imagehash
from PIL import Image
import faiss
import requests
from io import BytesIO
import logging
from typing import List, Dict, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class ImageSearchEngine:
    def __init__(self):
        self.model = None
        self.index = None
        self.image_data = []  # Lưu thông tin về ảnh

    def get_model(self):
        if self.model is None:
            self.model = EfficientNetB0(
                weights='imagenet', 
                include_top=False, 
                pooling='avg'
            )
        return self.model

    def extract_features(self, img_url: str) -> np.ndarray:
        try:
            # Tải ảnh từ URL
            response = requests.get(img_url, timeout=10)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))

            # Tiền xử lý ảnh
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            img = img.resize((224, 224), Image.NEAREST)
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)

            # Trích xuất đặc trưng
            features = self.get_model().predict(x, verbose=0)
            return features[0]
        except Exception as e:
            logger.error(f"Error extracting features from {img_url}: {str(e)}")
            return None

    def extract_features_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        try:
            # Đọc ảnh từ bytes
            img = Image.open(BytesIO(image_bytes))

            # Tiền xử lý ảnh
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            img = img.resize((224, 224), Image.NEAREST)
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)

            # Trích xuất đặc trưng
            features = self.get_model().predict(x, verbose=0)
            return features[0]
        except Exception as e:
            logger.error(f"Error extracting features from bytes: {str(e)}")
            return None

    def build_index(self, images_data: List[Dict]) -> None:
        try:
            if not images_data:
                return

            # Lấy features từ tất cả ảnh
            features_list = []
            valid_images = []

            for img_data in images_data:
                if 'features' in img_data:
                    features = np.array(img_data['features'], dtype='float32')
                    features_list.append(features)
                    valid_images.append(img_data)

            if not features_list:
                return

            # Tạo FAISS index
            features_array = np.array(features_list)
            dimension = features_array.shape[1]
            
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(features_array.astype('float32'))
            self.image_data = valid_images

        except Exception as e:
            logger.error(f"Error building index: {str(e)}")
            raise

    def find_similar_images(
        self, 
        query_url: str, 
        top_k: int = 5
    ) -> List[Dict]:
        try:
            # Trích xuất đặc trưng từ ảnh query
            query_features = self.extract_features(query_url)
            if query_features is None:
                return []

            if self.index is None or not self.image_data:
                return []

            # Tìm kiếm ảnh tương tự
            distances, indices = self.index.search(
                query_features.reshape(1, -1).astype('float32'),
                min(top_k, len(self.image_data))
            )

            # Tính toán độ tương đồng
            max_distance = np.max(distances)
            if max_distance == 0:
                max_distance = 1
            similarities = 1 - (distances / max_distance)

            # Tạo kết quả
            results = []
            for idx, sim in zip(indices[0], similarities[0]):
                if idx < len(self.image_data):
                    image_info = self.image_data[idx]
                    results.append({
                        'product_id': image_info['product_id'],
                        'image_url': image_info['image_url'],
                        'similarity': float(sim * 100),  # Chuyển thành phần trăm
                        'company_id': image_info['company_id'],
                        'created_at': image_info['created_at']
                    })

            # Sắp xếp theo độ tương đồng
            results.sort(key=lambda x: -x['similarity'])
            return results

        except Exception as e:
            logger.error(f"Error searching similar images: {str(e)}")
            return []

    def find_similar_images_from_bytes(
        self, 
        image_bytes: bytes, 
        top_k: int = 5
    ) -> List[Dict]:
        try:
            # Trích xuất đặc trưng từ ảnh query
            query_features = self.extract_features_from_bytes(image_bytes)
            if query_features is None:
                return []

            if self.index is None or not self.image_data:
                return []

            # Tìm kiếm ảnh tương tự
            distances, indices = self.index.search(
                query_features.reshape(1, -1).astype('float32'),
                min(top_k, len(self.image_data))
            )

            # Tính toán độ tương đồng
            max_distance = np.max(distances)
            if max_distance == 0:
                max_distance = 1
            similarities = 1 - (distances / max_distance)

            # Tạo kết quả
            results = []
            for idx, sim in zip(indices[0], similarities[0]):
                if idx < len(self.image_data):
                    image_info = self.image_data[idx]
                    results.append({
                        'product_id': str(image_info['product_id']),  # Chuyển ObjectId thành string
                        'image_url': image_info['image_url'],
                        'similarity': float(sim * 100),
                        'company_id': str(image_info['company_id']),  # Chuyển ObjectId thành string
                        'created_at': image_info['created_at'].isoformat() if isinstance(image_info['created_at'], datetime) else image_info['created_at']  # Chuyển datetime thành string
                    })

            # Sắp xếp theo độ tương đồng
            results.sort(key=lambda x: -x['similarity'])
            return results

        except Exception as e:
            logger.error(f"Error searching similar images: {str(e)}")
            return []

    def find_similar_images_combined(self, image_bytes: bytes, images_data: List[Dict], top_k: int = 10) -> List[Dict]:
        try:
            # Trích xuất đặc trưng từ ảnh đầu vào
            query_features = self.extract_features_from_bytes(image_bytes)
            if query_features is None:
                return []

            # Tính toán image hash cho ảnh đầu vào
            query_image = Image.open(BytesIO(image_bytes))
            query_hash = str(imagehash.average_hash(query_image))

            # Tính toán điểm tương đồng cho tất cả ảnh
            similarities = []
            for img in images_data:
                try:
                    # Tính điểm tương đồng đặc trưng
                    img_features = np.array(img['features'])
                    feature_sim = float(np.dot(query_features, img_features) / 
                                      (np.linalg.norm(query_features) * np.linalg.norm(img_features)))

                    # Tính điểm tương đồng hash
                    hash_sim = 1 - (abs(int(query_hash, 16) - int(img['image_hash'], 16)) / 64)

                    # Tính điểm tổng hợp (trọng số 0.7 cho đặc trưng và 0.3 cho hash)
                    combined_sim = 0.7 * feature_sim + 0.3 * hash_sim

                    similarities.append({
                        'product_id': str(img['product_id']),  # Chuyển ObjectId thành string
                        'image_url': img['image_url'],
                        'similarity': float(combined_sim * 100),  # Chuyển thành phần trăm
                        'feature_similarity': float(feature_sim * 100),
                        'hash_similarity': float(hash_sim * 100)
                    })
                except Exception as e:
                    logger.error(f"Error processing image {img.get('image_url')}: {str(e)}")
                    continue

            # Sắp xếp theo độ tương đồng và lấy top_k kết quả
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            return similarities[:top_k]

        except Exception as e:
            logger.error(f"Error in find_similar_images_combined: {str(e)}")
            return [] 