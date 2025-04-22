from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from application.routes import user_routes, workspace_routes, board_routes, task_routes
from application.common.auth import api_key_header
from config import get_config, logger

config = get_config()

app = FastAPI(
    title="Task Service API",
    description="API for managing tasks, boards, and workspaces",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Task Service API",
        version="1.0.0",
        description="API for managing tasks, boards, and workspaces",
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
            "description": "Enter your JWT token in the format: Bearer <token>"
        }
    }
    
    # Add security requirement
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Include routers
app.include_router(user_routes.router, prefix="/api/v1/users", tags=["users"])
app.include_router(workspace_routes.router, prefix="/api/v1/workspaces", tags=["workspaces"])
app.include_router(board_routes.router, prefix="/api/v1/boards", tags=["boards"])
app.include_router(task_routes.router, prefix="/api/v1/tasks", tags=["tasks"])

@app.get("/")
async def root():
    return {"message": "Task Service API is running"} 