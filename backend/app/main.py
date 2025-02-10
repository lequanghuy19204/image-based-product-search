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

app = FastAPI(title="Search Images API")

@app.get("/")
async def root():
    return {"status": "Welcome to Search Images API"}

@app.head("/")
async def health_check():
    return {"status": "OK"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):


    print(f"Global error: {str(exc)}")  # Log lỗi
    return JSONResponse(
        status_code=500,
        content={"detail": f"Lỗi server: {str(exc)}"}
    )

# Cấu hình CORS chi tiết hơn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Thêm domain của frontend
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các methods
    allow_headers=["*"],  # Cho phép tất cả các headers
    expose_headers=["*"],  # Cho phép frontend truy cập tất cả headers
    max_age=3600  # Thêm max age để cache preflight requests
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

