import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import requests
from io import BytesIO
from tqdm import tqdm
import time
import cv2
import numpy as np
import concurrent.futures

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load biến môi trường
load_dotenv()

# Kết nối MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://lequanghuy19204:uvyCB5P7sKrgdK7r@images-search.fmyki.mongodb.net/?retryWrites=true&w=majority&appName=images-search")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.images_search
images_collection = db.images

async def download_image(url):
    """Tải ảnh với timeout và xử lý lỗi"""
    try:
        for attempt in range(3):  # Thử lại tối đa 3 lần
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                return response.content
            except (requests.exceptions.RequestException, IOError) as e:
                logger.warning(f"Attempt {attempt+1} failed for {url}: {str(e)}")
                if attempt == 2:  # Nếu lần thử cuối cùng
                    raise
                time.sleep(1)  # Chờ 1 giây trước khi thử lại
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {str(e)}")
        return None

async def calculate_orb_features(image_bytes):
    """Tính ORB feature vector và mã hóa thành binary data"""
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
            
        # Lấy 64 descriptors đầu tiên hoặc padding nếu thiếu
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
        logger.error(f"Error calculating ORB features: {str(e)}")
        return None

async def update_images_range(start_index, end_index):
    try:
        logger.info(f"Xử lý luồng từ {start_index} đến {end_index}")
        
        # Lấy các bản ghi ảnh trong phạm vi chỉ định
        cursor = images_collection.find({}).skip(start_index).limit(end_index - start_index)
        
        count_updated = 0
        count_failed = 0
        count_unchanged = 0
        
        # Tạo progress bar cho luồng này
        progress_bar = tqdm(total=end_index - start_index, 
                           desc=f"Luồng {start_index}-{end_index}", 
                           position=start_index // (end_index - start_index))
        
        async for image in cursor:
            image_url = image.get('image_url')
            image_id = image.get('_id')
            old_hash = image.get('image_hash')
            
            if not image_url:
                logger.warning(f"Không tìm thấy URL ảnh cho bản ghi {image_id}")
                count_failed += 1
                progress_bar.update(1)
                continue
            
            # Tải ảnh
            image_bytes = await download_image(image_url)
            
            if not image_bytes:
                logger.error(f"Không thể tải ảnh {image_url} - ID: {image_id}")
                count_failed += 1
                progress_bar.update(1)
                continue
            
            # Tính toán ORB features
            orb_features = await calculate_orb_features(image_bytes)
            
            if orb_features:
                # Kiểm tra xem hash mới có khác với hash cũ không
                if old_hash != orb_features:
                    # Cập nhật features mới vào cơ sở dữ liệu
                    result = await images_collection.update_one(
                        {"_id": image_id},
                        {"$set": {"image_hash": orb_features}}
                    )
                    
                    if result.modified_count > 0:
                        count_updated += 1
                        logger.info(f"Đã cập nhật hash cho ảnh {image_id}: hash cũ ({len(old_hash) if old_hash else 'None'} bytes) -> hash mới ({len(orb_features)} bytes)")
                    else:
                        count_unchanged += 1
                        logger.info(f"Không thể cập nhật hash cho ảnh {image_id} mặc dù hash đã thay đổi")
                else:
                    count_unchanged += 1
                    logger.info(f"Không cần cập nhật hash cho ảnh {image_id}: hash không thay đổi ({len(old_hash) if old_hash else 'None'} bytes)")
            else:
                logger.error(f"Không thể tính toán ORB features cho ảnh {image_url} - ID: {image_id}")
                count_failed += 1
            
            progress_bar.update(1)
        
        progress_bar.close()
        
        logger.info(f"Luồng {start_index}-{end_index}: {count_updated} cập nhật thành công, "
                   f"{count_failed} thất bại, {count_unchanged} không thay đổi")
                   
        return count_updated, count_failed, count_unchanged
    
    except Exception as e:
        logger.error(f"Lỗi trong luồng {start_index}-{end_index}: {str(e)}")
        return 0, 0, 0

async def update_all_image_hashes_multi_thread(num_threads):
    try:
        # Đếm tổng số ảnh cần cập nhật
        total_images = await images_collection.count_documents({})
        logger.info(f"Tổng số ảnh cần cập nhật: {total_images}")
        
        # Tính số lượng ảnh cho mỗi luồng
        chunk_size = total_images // num_threads
        if total_images % num_threads > 0:
            chunk_size += 1
            
        # Tạo danh sách công việc cho các luồng
        tasks = []
        for i in range(num_threads):
            start_idx = i * chunk_size
            end_idx = min((i + 1) * chunk_size, total_images)
            if start_idx < total_images:
                tasks.append(update_images_range(start_idx, end_idx))
        
        # Chạy tất cả các công việc đồng thời
        results = await asyncio.gather(*tasks)
        
        # Tổng hợp kết quả
        total_updated = sum(r[0] for r in results)
        total_failed = sum(r[1] for r in results)
        total_unchanged = sum(r[2] for r in results)
        
        logger.info(f"Hoàn thành cập nhật: {total_updated} ảnh đã cập nhật thành công, "
                   f"{total_failed} ảnh thất bại, {total_unchanged} ảnh không thay đổi")
    
    except Exception as e:
        logger.error(f"Lỗi trong quá trình cập nhật đa luồng: {str(e)}")

async def main():
    logger.info("Bắt đầu quá trình cập nhật từ whash sang ORB features...")
    
    # Hỏi người dùng số luồng muốn sử dụng
    try:
        num_threads = int(input("Nhập số luồng muốn sử dụng (mặc định: 4): ") or "4")
        if num_threads < 1:
            num_threads = 4
            logger.warning("Số luồng không hợp lệ, sử dụng giá trị mặc định: 4")
    except ValueError:
        num_threads = 4
        logger.warning("Số luồng không hợp lệ, sử dụng giá trị mặc định: 4")
    
    logger.info(f"Đang chạy với {num_threads} luồng")
    
    start_time = time.time()
    await update_all_image_hashes_multi_thread(num_threads)
    end_time = time.time()
    
    execution_time = end_time - start_time
    logger.info(f"Quá trình cập nhật hoàn tất trong {execution_time:.2f} giây")

if __name__ == "__main__":
    asyncio.run(main())