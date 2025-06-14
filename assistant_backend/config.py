from pydantic_settings import BaseSettings
from pydantic import model_validator, computed_field
from functools import lru_cache
import logging
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    environment: str = os.getenv("ENVIRONMENT", "development")  # Added for backward compatibility
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Assistant API"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS Settings
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:8000"  # Default development origins
    )
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@db:5432/productify"
    )
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Sentry
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Common settings
    frontend_site_url: str = "http://127.0.0.1:3000/"
    secret_key: str = "productify+secret"
    
    # Database settings
    db_host: str = "db"  # Changed from assistant_backend-db-1 to localhostalhost
    db_port: str = "5432"
    db_name: str = "productify"
    db_user: str = "postgres"
    db_password: str = "postgres"
    
    # Storage settings
    storage_type: str = "postgresql"  # Must match StorageType enum values
    
    @computed_field
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Auth settings
    auth_type: str = "jwt"
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    jwt_secret: str = "your-secret-key"  # Added for backward compatibility
    
    # OpenAI settings
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"  # Allow extra fields

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# Validate critical settings
if settings.ENVIRONMENT == "production":
    if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key-here":
        raise ValueError("SECRET_KEY must be set in production environment")
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY must be set in production environment")
    if not settings.ALLOWED_ORIGINS:
        raise ValueError("ALLOWED_ORIGINS must be set in production environment")

def get_config():
    return settings