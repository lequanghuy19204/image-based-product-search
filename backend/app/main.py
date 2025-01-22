from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api
from app.routers.auth import auth_router
from app.middleware.auth_middleware import verify_token

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