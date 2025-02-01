from pydantic_settings import BaseSettings
from typing import Any, Dict, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NoCode Playwright"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "nocode_playwright"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    DB_ECHO: bool = False
    
    class Config:
        case_sensitive = True
        
    def __init__(self, **values: Any):
        super().__init__(**values)
        if not self.SQLALCHEMY_DATABASE_URI:
            self.SQLALCHEMY_DATABASE_URI = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )

settings = Settings()
