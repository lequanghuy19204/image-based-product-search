from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api
from app.routers.auth import auth_router
from app.routers.admin import admin_router
from app.middleware.auth_middleware import verify_token, verify_admin
from app.routers.user import user_router

app = FastAPI(title="Search Images API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
