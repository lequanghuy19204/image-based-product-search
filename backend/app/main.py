from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import api
from app.routers.auth import auth_router
from app.routers.admin import admin_router
from app.routers.image_search import image_search_router
from app.middleware.auth_middleware import verify_token, verify_admin
from app.routers.user import user_router
from app.routers.product import product_router
from app.routers.app_config import app_config_router
from app.routers.nhanhvn import nhanhvn_router
import os

app = FastAPI(title="Search Images API")


# Add CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Search Images API"}

@app.head("/")
async def health_check():
    return {"status": "OK"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Lỗi server: {str(exc)}"}
    )

# Route xác thực (login/register) không cần token
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

# Các route cần xác thực
app.include_router(
    api.router,
    prefix="/api",
    dependencies=[Depends(verify_token)],
    responses={401: {"description": "Unauthorized"}}
)

# Thêm user router
app.include_router(
    user_router,
    prefix="/api/users",
    dependencies=[Depends(verify_token)],
    tags=["Users"]
)

# Các route cần quyền admin
app.include_router(
    admin_router,
    prefix="/api/admin",
    dependencies=[Depends(verify_admin)],
    tags=["Admin"]
)

# Thêm product router với middleware xác thực
app.include_router(
    product_router,
    prefix="/api/products",
    tags=["Products"],
    dependencies=[Depends(verify_token)]
)

# Thêm image search router
app.include_router(
    image_search_router,
    prefix="/api/images",
    tags=["Image Search"],
    dependencies=[Depends(verify_token)]
)

# Thêm app config router
app.include_router(
    app_config_router,
    prefix="/api/app-configs",
    tags=["App Configs"],
    dependencies=[Depends(verify_token)]
)

# Thêm nhanhvn router
app.include_router(
    nhanhvn_router,
    prefix="/api/nhanh",
    tags=["Nhanh.vn"],
    dependencies=[Depends(verify_token)]
)

