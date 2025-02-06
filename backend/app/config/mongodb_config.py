import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# Load biến môi trường
load_dotenv()

# Lấy MongoDB URI từ biến môi trường hoặc sử dụng URI mặc định
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://lequanghuy19204:uvyCB5P7sKrgdK7r@images-search.fmyki.mongodb.net/?retryWrites=true&w=majority&appName=images-search")

# Khởi tạo client MongoDB bất đồng bộ
client = AsyncIOMotorClient(MONGODB_URI)
db = client.images_search  # Tên database


# Collections
users_collection = db.users
companies_collection = db.companies
products_collection = db.products
images_collection = db.images 