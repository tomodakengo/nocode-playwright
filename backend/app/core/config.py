from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "NoCode Playwright"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS設定
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # FastAPI backend
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/nocode_playwright"
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
