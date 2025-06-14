""" database connection """
from sqlalchemy import create_engine, text
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

    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def init_db():
        """Initialize the database by creating all tables"""
        from .base import Base
        # Import models in the correct order to ensure proper table creation
        from .pg_models import (
            User,
            UserSettings,
            Workspace,
            Board,
            BoardItem,
            Task,
            Reminder,
            Notification,
            Comment,
            Tag,
            Page,
            Block,
            Database,
            DatabaseEntry,
            Template,
            Activity,
            Integration,
            Contact,
            Deal,
            ContactActivity,
            DealActivity,
            Chat,
            ChatMessage
        )
        
        # Drop all tables first to ensure clean state
        Base.metadata.drop_all(bind=engine)
        
        # Create tables in the correct order
        with engine.begin() as conn:
            # Create tables without foreign keys first
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id UUID PRIMARY KEY,
                    first_name VARCHAR NOT NULL,
                    last_name VARCHAR NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    password_hash VARCHAR NOT NULL,
                    country_code VARCHAR,
                    mobile_number VARCHAR,
                    google_id VARCHAR,
                    status VARCHAR NOT NULL DEFAULT 'ACTIVE',
                    role VARCHAR NOT NULL DEFAULT 'USER',
                    user_type VARCHAR NOT NULL DEFAULT 'FREE',
                    preferences JSONB DEFAULT '{}',
                    is_deleted BOOLEAN DEFAULT FALSE,
                    is_email_verified BOOLEAN DEFAULT FALSE,
                    is_phone_verified BOOLEAN DEFAULT FALSE,
                    verification_token VARCHAR,
                    otp VARCHAR,
                    otp_time TIMESTAMP,
                    default_workspace_id UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS workspaces (
                    workspace_id UUID PRIMARY KEY,
                    owner_id UUID NOT NULL,
                    name VARCHAR NOT NULL,
                    description VARCHAR,
                    icon VARCHAR,
                    cover VARCHAR,
                    properties JSONB,
                    members JSONB,
                    settings JSONB,
                    is_public BOOLEAN DEFAULT FALSE,
                    is_default BOOLEAN DEFAULT FALSE,
                    is_template BOOLEAN DEFAULT FALSE,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES users(user_id)
                );

                CREATE TABLE IF NOT EXISTS boards (
                    board_id UUID PRIMARY KEY,
                    workspace_id UUID NOT NULL,
                    name VARCHAR NOT NULL,
                    description VARCHAR,
                    properties JSONB,
                    views JSONB,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS tasks (
                    task_id UUID PRIMARY KEY,
                    workspace_id UUID NOT NULL,
                    board_id UUID,
                    user_id UUID NOT NULL,
                    title VARCHAR NOT NULL,
                    description VARCHAR,
                    priority VARCHAR NOT NULL,
                    task_type VARCHAR NOT NULL,
                    status VARCHAR NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    due_on TIMESTAMP,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    assignee_id UUID,
                    reporter_id UUID,
                    watchers JSONB,
                    labels JSONB,
                    meta_data JSONB,
                    settings JSONB,
                    public_access BOOLEAN DEFAULT FALSE,
                    slug VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id),
                    FOREIGN KEY (board_id) REFERENCES boards(board_id) ON DELETE SET NULL,
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (assignee_id) REFERENCES users(user_id),
                    FOREIGN KEY (reporter_id) REFERENCES users(user_id)
                );
            """))
        
        logger.info("Database tables created successfully")

except Exception as e:
    logger.error(f"Failed to initialize database connection: {str(e)}")
    raise
