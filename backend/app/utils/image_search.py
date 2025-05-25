import logging
from typing import List, Dict
from datetime import datetime
import numpy as np
import cv2
import faiss
from io import BytesIO

logger = logging.getLogger(__name__)

class ImageSearchEngine:
    def __init__(self):
        self.image_data = []  # Lưu thông tin về ảnh
        self.faiss_index = None  # FAISS index
        self.id_map = {}  # Ánh xạ từ index đến dữ liệu ảnh

    def calculate_orb_from_bytes(self, image_bytes: bytes):
        """Tính ORB features từ bytes của ảnh"""
        try:
            # Chuyển bytes thành ảnh OpenCV
            np_arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is None:
                return None
                
            # Resize ảnh để đảm bảo tính nhất quán
            img = cv2.resize(img, (256, 256))
            
            # Khởi tạo ORB detector
            orb = cv2.ORB_create(nfeatures=32)
            
            # Tính toán các keypoints và descriptors
            keypoints, descriptors = orb.detectAndCompute(img, None)
            
            if descriptors is None or len(descriptors) == 0:
                logger.warning("No ORB descriptors found in image")
                return None
                
            # Đảm bảo có đủ 32 descriptors
            if len(descriptors) < 32:
                # Padding nếu có ít hơn 32 descriptors
                padding = np.zeros((32 - len(descriptors), 32), dtype=np.uint8)
                descriptors = np.vstack([descriptors, padding])
            else:
                # Lấy 32 descriptors
                descriptors = descriptors[:32]
                
            return descriptors.astype(np.uint8)
        except Exception as e:
            logger.error(f"Error calculating ORB features from bytes: {str(e)}")
            return None

    def build_index(self, images_data: List[Dict]) -> None:
        """Xây dựng FAISS index từ dữ liệu ảnh"""
        try:
            if not images_data:
                return

            valid_images = []
            descriptors_list = []
            
            # Tạo danh sách các ảnh có hash hợp lệ
            for i, img_data in enumerate(images_data):
                if 'image_hash' in img_data and img_data['image_hash']:
                    try:
                        # Chuyển binary_string từ DB thành numpy array
                        binary_data = img_data['image_hash']
                        descriptors = np.frombuffer(binary_data, dtype=np.uint8).reshape(32, 32)
                        
                        descriptors_list.append(descriptors)
                        valid_images.append(img_data)
                        self.id_map[len(valid_images)-1] = img_data
                    except Exception as e:
                        logger.error(f"Error parsing image hash: {str(e)}")
                        continue

            self.image_data = valid_images
            
            if not descriptors_list:
                logger.warning("No valid descriptor data found for building index")
                return
                
            # Ghép tất cả descriptors thành một ma trận lớn
            all_descriptors = np.vstack(descriptors_list)
            
            # Tạo FAISS binary index
            dimension = 32 * 32 * 8  # 32 descriptors x 32 bytes x 8 bits
            self.faiss_index = faiss.IndexBinaryFlat(dimension)
            
            # Đưa dữ liệu vào index
            binary_data = all_descriptors.reshape(-1, dimension // 8)
            self.faiss_index.add(binary_data)

        except Exception as e:
            logger.error(f"Error building FAISS index: {str(e)}")
            raise

    def find_similar_images_from_bytes(
        self, 
        image_bytes: bytes, 
        top_k: int = 5
    ) -> List[Dict]:
        """Tìm ảnh tương tự dựa trên ORB features và FAISS"""
        try:
            # Tính ORB features cho ảnh truy vấn
            query_descriptors = self.calculate_orb_from_bytes(image_bytes)
            
            if query_descriptors is None:
                logger.warning("Could not calculate ORB features for query image")
                return []

            if not self.image_data or self.faiss_index is None:
                logger.warning("No image data or FAISS index available")
                return []

            # Chuẩn bị dữ liệu truy vấn cho FAISS binary index
            dimension = 32 * 32 * 8  # 32 descriptors x 32 bytes x 8 bits
            query_binary = query_descriptors.reshape(1, dimension // 8)
            
            # Thực hiện tìm kiếm top_k ảnh gần nhất
            distances, indices = self.faiss_index.search(query_binary, min(top_k, len(self.image_data)))
            
            # Lấy kết quả
            results = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                if idx < 0 or idx >= len(self.image_data):
                    continue
                    
                img = self.id_map[idx]
                
                # Hamming distance trong FAISS là số bit khác nhau
                # Giá trị càng thấp càng giống nhau
                results.append({
                    'product_id': str(img['product_id']),
                    'image_url': img['image_url'],
                    'hamming_distance': float(distance),  # Khoảng cách hamming
                    'company_id': str(img['company_id']),
                    'created_at': img['created_at'].isoformat() if isinstance(img['created_at'], datetime) else img['created_at']
                })

            # Sắp xếp theo khoảng cách tăng dần (gần nhất lên đầu)
            results.sort(key=lambda x: x['hamming_distance'])
            return results[:top_k]

        except Exception as e:
            logger.error(f"Error searching similar images: {str(e)}")
            return [] 