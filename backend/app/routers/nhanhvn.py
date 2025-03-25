from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
from app.middleware.auth_middleware import verify_token
import json
from typing import Optional

nhanhvn_router = APIRouter()

class NhanhOrderSourceRequest(BaseModel):
    version: str
    appId: str
    businessId: str
    accessToken: str

class LocationRequest(BaseModel):
    version: str
    appId: str 
    businessId: str
    accessToken: str
    type: str
    parentId: Optional[int] = None

@nhanhvn_router.post("/order-sources")
async def get_order_sources(request_data: NhanhOrderSourceRequest, current_user: dict = Depends(verify_token)):
    try:
        # Thêm log để debug
        print(f"Request data: {request_data}")
        
        # Chuẩn bị FormData để gửi đến Nhanh.vn
        form_data = {
            'version': request_data.version,
            'appId': request_data.appId,
            'businessId': request_data.businessId, 
            'accessToken': request_data.accessToken
        }
        
        # Gọi API Nhanh.vn từ backend với timeout dài hơn
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    'https://open.nhanh.vn/api/order/source',
                    data=form_data
                )
                
                # Thêm log để debug
                print(f"Response status: {response.status_code}")
                print(f"Response text: {response.text}")
                
                data = response.json()
                
                if data.get('code') != 1:
                    error_message = data.get('messages') or 'Lỗi khi lấy nguồn đơn hàng'
                    print(f"API Error: {error_message}")
                    raise HTTPException(status_code=400, detail=error_message)
                    
                return data
            except httpx.RequestError as e:
                print(f"Request error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Lỗi kết nối: {str(e)}")
                
    except Exception as e:
        print(f"Exception: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")

@nhanhvn_router.post("/locations")
async def get_locations(request_data: LocationRequest, current_user: dict = Depends(verify_token)):
    try:
        form_data = {
            'version': request_data.version,
            'appId': request_data.appId,
            'businessId': request_data.businessId,
            'accessToken': request_data.accessToken,
            'data': json.dumps({
                'type': request_data.type,
                'parentId': request_data.parentId
            }) if request_data.parentId else json.dumps({'type': request_data.type})
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                'https://open.nhanh.vn/api/shipping/location',
                data=form_data
            )
            
            data = response.json()
            if data.get('code') != 1:
                raise HTTPException(
                    status_code=400, 
                    detail=data.get('messages') or 'Lỗi từ API Nhanh.vn'
                )
            
            # Đảm bảo trả về đúng format    
            return {
                'code': 1,
                'data': data.get('data', [])
            }
            
    except Exception as e:
        print(f"Error in get_locations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
