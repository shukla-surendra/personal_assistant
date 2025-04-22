from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from fastapi import FastAPI
import uvicorn
from controllers.tasks_controller import router as task_routers
from controllers.users_controller import router as user_routers
from controllers.workspace_controller import router as workspace_routers
from controllers.board_controller import router as board_routers
from database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="User/Task Service API", description="handle user and tasks")

app.include_router(user_routers)
app.include_router(workspace_routers)
app.include_router(task_routers)
app.include_router(board_routers)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

handler = Mangum(app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
