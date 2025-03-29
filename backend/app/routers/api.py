from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth_middleware import verify_token
from app.config.mongodb_config import users_collection, companies_collection
from bson import ObjectId

router = APIRouter(tags=["api"])

@router.get("/users/profile", tags=["users"])
async def get_user_profile(token: dict = Depends(verify_token)):
    try:
        # Pipeline để join với companies collection
        pipeline = [
            {"$match": {"_id": ObjectId(token["sub"]) }},
            {
                "$lookup": {
                    "from": "companies",
                    "localField": "company_id",  # Sử dụng trường company_id trực tiếp
                    "foreignField": "_id",
                    "as": "company"
                }
            },
            {
                "$unwind": {
                    "path": "$company",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": { "$toString": "$_id" },
                    "username": 1,
                    "email": 1,
                    "role": 1,
                    "status": 1,
                    "staff_code": 1,
                    "company_id": { "$toString": "$company_id" },
                    "created_at": { "$toString": "$created_at" },
                    "updated_at": { "$toString": "$updated_at" },
                    "company_name": "$company.company_name",
                    "company_code": "$company.company_code"
                }
            }
        ]
        
        user = await users_collection.aggregate(pipeline).to_list(1)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        return user[0]
        
    except Exception as e:
        print(f"Error in get_user_profile: {str(e)}")  # Thêm log để debug
        raise HTTPException(status_code=500, detail=str(e))

