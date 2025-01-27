import cloudinary
import cloudinary.uploader
from typing import List
from fastapi import UploadFile

async def upload_image(file: UploadFile, company_id: str) -> str:
    try:
        # Đọc file
        contents = await file.read()
        
        # Upload lên Cloudinary với folder structure
        upload_result = cloudinary.uploader.upload(
            contents,
            folder=f"products/{company_id}",  # Thêm company_id vào folder path
            resource_type="auto"
        )
        
        # Trả về URL
        return upload_result['secure_url']
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        raise e

async def upload_multiple_images(files: List[UploadFile], company_id: str) -> List[str]:
    if not files:
        raise ValueError("Không có file nào được gửi lên")
        
    urls = []
    for file in files:
        if not file.filename:  # Kiểm tra file có tên không
            continue
            
        try:
            url = await upload_image(file, company_id)
            urls.append(url)
        except Exception as e:
            print(f"Error uploading file {file.filename}: {str(e)}")
            raise e
            
    if not urls:  # Kiểm tra sau khi upload có url nào không
        raise ValueError("Không có file nào được upload thành công")
        
    return urls

async def delete_image(public_id: str):
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        print(f"Error deleting from Cloudinary: {str(e)}")
        raise e 