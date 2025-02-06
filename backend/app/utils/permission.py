from fastapi import HTTPException
from bson import ObjectId

async def check_user_permission(current_user: dict, company_id: str) -> bool:
    """
    Kiểm tra quyền của user với company
    """
    # Kiểm tra nếu user là admin
    if current_user.get("role") == "Admin":
        return True
        
    # Kiểm tra nếu user thuộc company
    user_company_id = str(current_user.get("company_id"))
    if user_company_id != str(company_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to perform this action"
        )
        
    return True 