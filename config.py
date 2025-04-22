from pydantic_settings import BaseSettings
from functools import lru_cache
import os
import logging

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
    secret_key: str = "xyzhello"
    
    # Database settings
    user_name: str = "productifyuser"
    password: str = "LJv8MCgLhL8bOiHe"
    app_name: str = "Cluster0"
    host_name: str = "cluster0.aljvnng.mongodb.net"
    storage_type: str = "postgresql"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/productify"
    
    # Auth settings
    auth_type: str = "jwt"
    jwt_secret: str = "your-secret-key"
    app_client_name: str = "productify_user_pool"
    client_id: str = "7pj10osqhuc3ifjv06oah22rdg"
    user_pool_id: str = "ap-south-1_sB1Gu0QIx"
    client_secret: str = "5h7v9pjpg20hurgb4sd05bjfbi7ucohfuhtkn1oslj0o6h9gemj"
    cognito_region: str = "ap-south-1"
    
    # AWS settings
    aws_region: str = "ap-south-1"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_config():
    return Settings() 