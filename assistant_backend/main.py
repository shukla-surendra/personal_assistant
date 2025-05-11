import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import uvicorn

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    # Import routers after logging is configured
    from controllers.tasks_controller import router as task_routers
    from controllers.users_controller import router as user_routers
    from controllers.workspace_controller import router as workspace_routers
    from controllers.board_controller import router as board_routers
    from controllers import timeblock_controller
    from controllers.settings_controller import router as settings_router
    from controllers.page_controller import router as page_router
    from controllers.database_controller import router as database_router
    from controllers.template_controller import router as template_router
    from controllers.comment_controller import router as comment_router
    from controllers.reminder_controller import router as reminder_router
    from controllers.notification_controller import router as notification_router
    from controllers.activity_controller import router as activity_router
    from controllers.public_controller import router as public_router
    from controllers.crm_controller import router as crm_router

    # Import database configuration
    from adapters.orm.models.database import engine, Base

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    app = FastAPI(
        title="Assistant Backend API",
        description="Backend API for the Assistant application",
        version="1.0.0"
    )

    # Include routers
    app.include_router(user_routers)
    app.include_router(workspace_routers)
    app.include_router(task_routers)
    app.include_router(board_routers)
    app.include_router(timeblock_controller.router, prefix="/api/v1", tags=["timeblocks"])
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
