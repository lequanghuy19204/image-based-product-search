from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api
from app.routers.auth import auth_router
from app.routers.admin import admin_router
from app.middleware.auth_middleware import verify_token, verify_admin
from app.routers.user import user_router
from app.config.cloudinary_config import initialize_cloudinary
from app.routers.test import test_router
from app.routers.product import product_router

app = FastAPI(title="Search Images API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    initialize_cloudinary()

# Route không cần xác thực
@app.get("/")
async def root():
    return {"message": "Welcome to Search Images API"}

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

# Thêm test router
app.include_router(
    test_router,
    prefix="/api/test",
    tags=["Test"]
)

# Thêm product router với middleware xác thực
app.include_router(
    product_router,
    prefix="/api/products",
    tags=["Products"],
    dependencies=[Depends(verify_token)]
)
