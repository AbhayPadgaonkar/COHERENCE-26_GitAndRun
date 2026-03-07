"""Application Configuration"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings and environment variables"""
    
    PROJECT_NAME: str = "Loknidhi"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "National Budget Flow Intelligence & Leakage Detection Platform"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Server Configuration
    DEBUG: bool = True
    RELOAD: bool = True
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    DISABLE_FIREBASE_WARNINGS: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
