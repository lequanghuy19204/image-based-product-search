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
                    "let": {"companyIdStr": "$company_id"},  # Lấy company_id (string) từ user
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", { "$toObjectId": "$$companyIdStr" }]
                                }
                            }
                        }
                    ],
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
                    "_id": 1,
                    "username": 1,
                    "email": 1,
                    "role": 1,
                    "status": 1,
                    # Giữ company_id dưới dạng string (đã có trong dữ liệu)
                    "company_id": 1,
                    "created_at": { "$toString": "$created_at" },
                    "updated_at": { "$toString": "$updated_at" },
                    "company_name": { "$ifNull": ["$company.company_name", None] },
                    "company_code": { "$ifNull": ["$company.company_code", None] }
                }
            }
        ]
        
        user = await users_collection.aggregate(pipeline).to_list(1)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        # Chuyển đổi _id thành id trong response
        user_data = user[0]
        user_data["id"] = str(user_data.pop("_id"))
        
        return user_data
        
    except Exception as e:
        print(f"Error in get_user_profile: {str(e)}")  # Thêm log để debug
        raise HTTPException(status_code=500, detail=str(e))

