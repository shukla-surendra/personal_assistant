from pydantic_settings import BaseSettings
from pydantic import model_validator, computed_field
from functools import lru_cache
import logging
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Common settings
    environment: str = "development"
    frontend_site_url: str = "http://127.0.0.1:3000/"
    secret_key: str = "productify+secret"
    
    # Database settings
    db_host: str = "db"  # Changed from assistant_backend-db-1 to localhostalhost
    db_port: str = "5432"
    db_name: str = "productify"
    db_user: str = "postgres"
    db_password: str = "postgres"
    # database_url: str = ""
    
    # Storage settings
    storage_type: str = "postgresql"  # Must match StorageType enum values
    
    @computed_field
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Auth settings
    auth_type: str = "jwt"
    jwt_secret: str = "productify+secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120
    
    # AWS settings
    aws_region: str = "ap-south-1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields

@lru_cache()
def get_config():
    return Settings()

settings = get_config()