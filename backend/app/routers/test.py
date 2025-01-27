from fastapi import APIRouter, UploadFile, File, Form
from app.utils.cloudinary_helper import upload_multiple_images
from typing import List


test_router = APIRouter()

@test_router.post("/test-upload")
async def test_upload(files: List[UploadFile] = File(...), company_id: str = Form(...)):
    try:
        urls = await upload_multiple_images(files, company_id)
        return {"urls": urls}
    except Exception as e:
        return {"error": str(e)} 