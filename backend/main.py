from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import api_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=get_settings().PROJECT_NAME,
    version=get_settings().VERSION,
    openapi_url=f"{get_settings().API_V1_STR}/openapi.json"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=get_settings().API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to NoCode Playwright API"}
