import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import openai

from config import settings
from controllers import (
    task_routers,
    board_routers,
    timeblock_routers,
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
    chat_router
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Initialize OpenAI
    openai.api_key = settings.OPENAI_API_KEY

    # Create FastAPI app
    app = FastAPI(
        title="Assistant API",
        description="Backend API for the Assistant application",
        version="1.0.0"
    )

    # Include routers
    app.include_router(task_routers)
    app.include_router(board_routers)
    app.include_router(timeblock_routers)
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

    # Configure CORS
    origins = ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create AWS Lambda handler
    handler = Mangum(app)

    @app.get("/")
    async def root():
        return {"message": "Welcome to the Assistant Backend API"}

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

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
