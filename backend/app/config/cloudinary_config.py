import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from dotenv import load_dotenv

def initialize_cloudinary():
    # Tải biến môi trường
    load_dotenv()
    
    # Cấu hình Cloudinary
    cloudinary.config( 
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key = os.getenv('CLOUDINARY_API_KEY'), 
        api_secret = os.getenv('CLOUDINARY_API_SECRET'),
        secure = True
    ) 