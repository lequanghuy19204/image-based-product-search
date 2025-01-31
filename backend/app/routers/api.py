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

