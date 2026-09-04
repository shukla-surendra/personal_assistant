import logging
import uvicorn
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from mangum import Mangum
import openai
from sqlalchemy.orm import Session

from config import settings
from utils.error_handlers import (
    APIError,
    validation_exception_handler,
    api_error_handler,
    sqlalchemy_error_handler,
    general_exception_handler
)
from docs.api_docs import custom_openapi
from middleware.rate_limit import RateLimitMiddleware
from adapters.orm.models.database import engine, get_db
from controllers import (
    tasks_router,
    board_router,
    timeblock_router,
    settings_router,
    page_router,
    database_router,
    template_router,
    comment_router,
    reminder_router,
    notification_router,
    activity_router,
    public_router,
    crm_router,
    chat_router,
    assistant_router,
    workspace_router,
    users_router
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Initialize OpenAI
    openai.api_key = settings.OPENAI_API_KEY

    # Create FastAPI app
    app = FastAPI(
        title="Personal Assistant API",
        description="A JARVIS-like personal assistant API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )

    # Set custom OpenAPI schema
    app.openapi = lambda: custom_openapi(app)

    # Register exception handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Add rate limiting middleware
    app.add_middleware(RateLimitMiddleware)

    # Include routers
    app.include_router(tasks_router)
    app.include_router(board_router)
    app.include_router(timeblock_router)
    app.include_router(settings_router)
    app.include_router(page_router)
    app.include_router(database_router)
    app.include_router(template_router)
    app.include_router(comment_router)
    app.include_router(reminder_router)
    app.include_router(notification_router)
    app.include_router(activity_router)
    app.include_router(public_router)
    app.include_router(crm_router)
    app.include_router(chat_router)
    app.include_router(assistant_router)
    app.include_router(workspace_router)
    app.include_router(users_router)

    # Configure CORS with environment-based settings
    allowed_origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else []
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    allowed_headers = ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=allowed_methods,
        allow_headers=allowed_headers,
        expose_headers=["Content-Range", "X-Content-Range"],
        max_age=600,  # Cache preflight requests for 10 minutes
    )

    # Create AWS Lambda handler
    handler = Mangum(app)

    @app.get("/")
    async def root():
        return {"message": "Welcome to the Assistant Backend API"}

    @app.get("/health")
    async def health_check(db: Session = Depends(get_db)):
        try:
            # Check database connection
            db.execute(text("SELECT 1"))
            db_status = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            db_status = "unhealthy"

        return {
            "status": "healthy",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "database": db_status
        }

    @app.on_event("startup")
    async def startup_event():
        """Log that the app is up. Schema creation/changes are Alembic's job
        now (`alembic upgrade head`), run before the app starts -- not here.
        Rebuilding the schema on every app boot was destroying real data on
        every restart, which is fatal once this runs somewhere pods restart
        routinely (crash-loops, rolling updates, autoscaling)."""
        logger.info("Application startup")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Cleanup on shutdown."""
        # Close database connections
        engine.dispose()
        logger.info("Database connections closed")

except Exception as e:
    logger.error(f"Failed to initialize application: {str(e)}")
    raise

if __name__ == "__main__":
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=True
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise
