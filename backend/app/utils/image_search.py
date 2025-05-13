import imagehash
from PIL import Image
import requests
from io import BytesIO
import logging
from typing import List, Dict, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class ImageSearchEngine:
    def __init__(self):
        self.image_data = []  # Lưu thông tin về ảnh

    def calculate_hash_from_bytes(self, image_bytes: bytes) -> str:
        try:
            img = Image.open(BytesIO(image_bytes))
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            img = img.resize((32, 32), Image.NEAREST)
            return str(imagehash.phash(img))
        except Exception as e:
            logger.error(f"Error calculating hash from bytes: {str(e)}")
            return None

    def build_index(self, images_data: List[Dict]) -> None:
        try:
            if not images_data:
                return

            valid_images = []
            for img_data in images_data:
                if 'image_hash' in img_data:
                    valid_images.append(img_data)

            self.image_data = valid_images

        except Exception as e:
            logger.error(f"Error building index: {str(e)}")
            raise

    def find_similar_images_from_bytes(
        self, 
        image_bytes: bytes, 
        top_k: int = 5
    ) -> List[Dict]:
        try:
            # Tính phash của ảnh query
            query_hash = self.calculate_hash_from_bytes(image_bytes)
            if query_hash is None:
                return []

            if not self.image_data:
                return []

            # Tính độ tương đồng dựa trên khoảng cách hamming của hash
            results = []
            for img in self.image_data:
                try:
                    # Chuyển hash từ string sang decimal
                    query_hash_int = int(query_hash, 16)
                    img_hash_int = int(img['image_hash'], 16)
                    
                    # Tính khoảng cách Hamming (số bit khác nhau)
                    # Khoảng cách = 0 => giống hoàn toàn, khoảng cách max = 64 (size of hash)
                    hamming_distance = bin(query_hash_int ^ img_hash_int).count('1')
                    
                    # Chuyển khoảng cách thành độ tương đồng (100% = giống hoàn toàn)
                    similarity = 100 * (1 - hamming_distance / 64)

                    results.append({
                        'product_id': str(img['product_id']),
                        'image_url': img['image_url'],
                        'similarity': float(similarity),
                        'company_id': str(img['company_id']),
                        'created_at': img['created_at'].isoformat() if isinstance(img['created_at'], datetime) else img['created_at']
                    })
                except Exception as e:
                    logger.error(f"Error processing image hash {img.get('image_hash')}: {str(e)}")
                    continue

            # Sắp xếp theo độ tương đồng
            results.sort(key=lambda x: -x['similarity'])
            return results[:top_k]

        except Exception as e:
            logger.error(f"Error searching similar images: {str(e)}")
            return [] 