import cloudinary
import cloudinary.uploader
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List
from fastapi import UploadFile

async def upload_image(file: UploadFile, company_id: str) -> str:
    try:
        # Đọc nội dung file
        contents = await file.read()
        
        # Upload lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            contents,
            folder=f"products/{company_id}",
            resource_type="auto",
            quality="auto:good",
            fetch_format="auto",
            transformation=[
                {'width': 2000, 'height': 2000, 'crop': 'limit'}
            ]
        )
        
        return upload_result['secure_url']
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        raise e

async def upload_multiple_images(files: List[UploadFile], company_id: str) -> List[str]:
    if not files:
        raise ValueError("Không có file nào được gửi lên")
        
    # Tạo executor để xử lý upload song song
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Chuẩn bị tasks
        upload_tasks = []
        for file in files:
            # Đọc file một lần và lưu vào memory
            contents = await file.read()
            task = asyncio.get_event_loop().run_in_executor(
                executor,
                upload_single_image,
                contents,
                company_id
            )
            upload_tasks.append(task)
        
        # Chạy tất cả tasks song song
        image_urls = await asyncio.gather(*upload_tasks)
        return image_urls

def upload_single_image(contents, company_id):
    try:
        # Cấu hình upload để tối ưu
        upload_options = {
            'folder': f'products/{company_id}',
            'quality': 'auto:good', # Tự động tối ưu chất lượng
            'fetch_format': 'auto', # Tự động chọn format tốt nhất
            'transformation': [
                {'width': 2000, 'height': 2000, 'crop': 'limit'} # Giới hạn kích thước
            ]
        }
        
        # Upload trực tiếp từ memory
        result = cloudinary.uploader.upload(contents, **upload_options)
        return result['secure_url']
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        raise e

async def delete_image(public_id: str):
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        print(f"Error deleting from Cloudinary: {str(e)}")
        raise e 