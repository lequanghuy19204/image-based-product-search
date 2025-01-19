import random
import string
from firebase_admin import firestore

db = firestore.client()

def generate_company_code(length=6):
    """Tạo mã công ty ngẫu nhiên với độ dài mặc định là 6 ký tự"""
    chars = string.ascii_uppercase + string.digits  # Chỉ dùng chữ hoa và số
    return ''.join(random.choice(chars) for _ in range(length))

async def get_unique_company_code():
    """Tạo và kiểm tra mã công ty cho đến khi tìm được mã chưa tồn tại"""
    max_attempts = 10  # Giới hạn số lần thử để tránh vòng lặp vô hạn
    attempts = 0
    
    while attempts < max_attempts:
        company_code = generate_company_code()
        
        # Kiểm tra mã trong database
        companies_ref = db.collection('companies')
        existing_company = companies_ref.where('company_code', '==', company_code).get()
        
        if not list(existing_company):
            return company_code
            
        attempts += 1
    
    # Nếu không tìm được mã unique sau max_attempts lần thử
    raise Exception("Không thể tạo mã công ty duy nhất. Vui lòng thử lại sau.") 