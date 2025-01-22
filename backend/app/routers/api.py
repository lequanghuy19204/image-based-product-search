from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import firestore
from app.config.firebase_config import db
from app.models.user import UserCreate, UserLogin, UserResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token, verify_token
from datetime import datetime, timedelta
from app.utils.company_code import get_unique_company_code

router = APIRouter(
    tags=["api"]
)

@router.get("/images")
async def get_images():
    try:
        # Lấy collection 'images' từ Firestore
        images_ref = db.collection('images')
        docs = images_ref.stream()
        
        images = []
        for doc in docs:
            images.append({
                "id": doc.id,
                **doc.to_dict()
            })
        
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images")
async def create_image(image_data: dict):
    try:
        # Thêm document mới vào collection 'images'
        doc_ref = db.collection('images').document()
        doc_ref.set(image_data)
        
        return {
            "message": "Image created successfully",
            "id": doc_ref.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/profile", tags=["users"])
async def get_user_profile(token: str = Depends(verify_token)):
    try:
        user_id = token["sub"]
        print(f"Fetching profile for user_id: {user_id}")
        
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_data = user_doc.to_dict()
        
        company_data = {}
        if user_data.get('company_id'):
            company_doc = db.collection('companies').document(user_data['company_id']).get()
            if company_doc.exists:
                company_data = company_doc.to_dict()
        
        if 'password_hash' in user_data:
            del user_data['password_hash']
            
        response_data = {
            "id": user_doc.id,
            **user_data,
            "company_name": company_data.get('company_name'),
            "company_code": company_data.get('company_code')
        }
        
        return response_data
        
    except Exception as e:
        print(f"Error in get_user_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    