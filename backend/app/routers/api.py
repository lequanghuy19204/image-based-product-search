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
            {"$match": {"_id": ObjectId(token["sub"])}},
            {
                "$lookup": {
                    "from": "companies",
                    "localField": "company_id",
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
                    "password_hash": 0,
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
        raise HTTPException(status_code=500, detail=str(e))

