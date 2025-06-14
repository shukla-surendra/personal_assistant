from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
import logging
from config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.engine = create_engine(
            settings.DATABASE_URL,
            poolclass=QueuePool,
            pool_size=20,  # Maximum number of connections to keep
            max_overflow=10,  # Maximum number of connections that can be created beyond pool_size
            pool_timeout=30,  # Seconds to wait before giving up on getting a connection from the pool
            pool_recycle=1800,  # Recycle connections after 30 minutes
            pool_pre_ping=True,  # Enable connection health checks
            echo=settings.ENVIRONMENT == "development"  # Log SQL queries in development
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

    @contextmanager
    def get_db(self) -> Generator[Session, None, None]:
        """Get a database session from the pool."""
        db = self.SessionLocal()
        try:
            yield db
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Database error: {str(e)}")
            raise
        finally:
            db.close()

    def init_db(self):
        """Initialize the database (create tables, etc.)."""
        from models.base import Base
        Base.metadata.create_all(bind=self.engine)

    def close(self):
        """Close all database connections."""
        self.engine.dispose()

# Create global database manager instance
db_manager = DatabaseManager()

# Dependency for FastAPI endpoints
def get_db():
    with db_manager.get_db() as db:
        yield db 