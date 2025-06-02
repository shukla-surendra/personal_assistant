""" database connection """
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from config import get_config
import logging
import time
import sys

logger = logging.getLogger(__name__)
config = get_config()

def create_db_engine():
    """Create database engine with retry logic"""
    max_retries = 5
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            SQLALCHEMY_DATABASE_URL = config.database_url
            logger.info(f"Attempting to connect to database "
                        f"at {config.db_host}:{config.db_port} (attempt {attempt + 1}/{max_retries})")

            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_size=20,
                max_overflow=30,
                pool_timeout=60,
                pool_recycle=1800,
                pool_pre_ping=True,
                echo=config.environment == "development"
            )
            
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
            
            logger.info("Successfully connected to database")
            return engine
            
        except SQLAlchemyError as e:
            logger.error(f"Database connection attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Max retries reached. Could not connect to database.")
                sys.exit(1)

try:
    engine = create_db_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

except Exception as e:
    logger.error(f"Failed to initialize database connection: {str(e)}")
    raise
