from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import app_configs_collection
import httpx
from datetime import datetime
import os

order_router = APIRouter()

@order_router.post("/create-from-conversation")
async def create_order_from_conversation(request_data: dict, current_user: dict = Depends(verify_token)):
    try:
        # Lấy dữ liệu từ request
        conversation_link = request_data.get("conversation_link")
        
        if not conversation_link:
            raise HTTPException(status_code=400, detail="Thiếu thông tin link hội thoại")
        
        # Lấy access_token từ database
        company_id = current_user.get("company_id")
        
        if not company_id:
            raise HTTPException(status_code=400, detail="Không tìm thấy thông tin công ty của người dùng")
        
        app_config = await app_configs_collection.find_one({"company_id": company_id})
        
        if not app_config or not app_config.get("access_token"):
            raise HTTPException(status_code=404, detail="Không tìm thấy access token trong cấu hình")
        
        access_token = app_config.get("access_token")
        
        # Lấy URL webhook từ biến môi trường
        webhook_url = os.getenv("WEBHOOK_URL")
        webhook_data = [{
            "conversation_link": conversation_link,
            "access_token": access_token
        }]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=webhook_data)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, 
                                  detail="Lỗi khi gọi đến webhook")
                
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
