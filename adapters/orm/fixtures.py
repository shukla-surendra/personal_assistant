import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models.pg_models import (
    User, UserSettings, Task, Workspace, Board, TimeBlock, 
    Comment, Tag, workspace_users, board_users, task_tags
)
from constants import TaskStatus, TaskType, UserStatus, UserRoles, UserType

def create_fixtures(db: Session):
    """Create test fixtures for the database"""
    
    # Create users
    users = [
        User(
            user_id=uuid.uuid4(),
            email="admin@example.com",
            password_hash="$pbkdf2-sha256$29000$2DtnDKE0ZowxhpDSmvPeGw$x7NkPbetGBbrxtZNKz1ZURKeCCRplVZlncQEd1tOmH8",  # password: Admin@123
            first_name="Admin",
            last_name="User",
            status=UserStatus.ACTIVE,
            role=UserRoles.ADMIN,
            user_type=UserType.PREMIUM,
            is_email_verified=True
        ),
        User(
            user_id=uuid.uuid4(),
            email="member@example.com",
            password_hash="$pbkdf2-sha256$29000$2DtnDKE0ZowxhpDSmvPeGw$x7NkPbetGBbrxtZNKz1ZURKeCCRplVZlncQEd1tOmH8",  # password: Admin@123
            first_name="Member",
            last_name="User",
            status=UserStatus.ACTIVE,
            role=UserRoles.USER,
            user_type=UserType.FREE,
            is_email_verified=True
        )
    ]
    
    # Add users and commit
    db.add_all(users)
    db.commit()
    
    # Create user settings
    user_settings = [
        UserSettings(
            user_id=users[0].user_id,
            theme="dark",
            language="en",
            timezone="UTC"
        ),
        UserSettings(
            user_id=users[1].user_id,
            theme="light",
            language="en",
            timezone="UTC"
        )
    ]
    
    # Add user settings and commit
    db.add_all(user_settings)
    db.commit()
    
    # Create workspace
    workspace = Workspace(
        workspace_id=uuid.uuid4(),
        name="Test Workspace",
        description="A test workspace for testing",
        owner_id=users[0].user_id,
        is_default=True
    )
    
    # Add workspace and commit
    db.add(workspace)
    db.commit()
    
    # Create workspace user associations
    workspace_user_associations = [
        workspace_users.insert().values(
            workspace_id=workspace.workspace_id,
            user_id=users[0].user_id,
            role='admin'
        ),
        workspace_users.insert().values(
            workspace_id=workspace.workspace_id,
            user_id=users[1].user_id,
            role='member'
        )
    ]
    
    # Execute workspace user associations
    for stmt in workspace_user_associations:
        db.execute(stmt)
    db.commit()
    
    # Create board
    board = Board(
        board_id=uuid.uuid4(),
        workspace_id=workspace.workspace_id,
        name="Test Board",
        description="A test board for testing",
        owner_id=users[0].user_id
    )
    
    # Add board and commit
    db.add(board)
    db.commit()
    
    # Create board user associations
    board_user_associations = [
        board_users.insert().values(
            board_id=board.board_id,
            user_id=users[0].user_id,
            role='admin',
            permissions={'can_edit': True, 'can_delete': True}
        ),
        board_users.insert().values(
            board_id=board.board_id,
            user_id=users[1].user_id,
            role='member',
            permissions={'can_edit': True, 'can_delete': False}
        )
    ]
    
    # Execute board user associations
    for stmt in board_user_associations:
        db.execute(stmt)
    db.commit()
    
    # Create tasks
    tasks = [
        Task(
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            user_id=users[0].user_id,
            title="Test Task 1",
            description="This is a test task",
            priority=2,
            task_type=TaskType.TODO,
            status=TaskStatus.TODO,
            due_on=datetime.utcnow() + timedelta(days=7)
        ),
        Task(
            task_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            board_id=board.board_id,
            user_id=users[1].user_id,
            title="Test Task 2",
            description="This is another test task",
            priority=1,
            task_type=TaskType.TODO,
            status=TaskStatus.IN_PROGRESS,
            due_on=datetime.utcnow() + timedelta(days=3)
        )
    ]
    
    # Add tasks and commit
    db.add_all(tasks)
    db.commit()
    
    # Create time blocks
    time_blocks = [
        TimeBlock(
            id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=users[0].user_id,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(hours=2),
            description="Test time block",
            status="active"
        )
    ]
    
    # Add time blocks and commit
    db.add_all(time_blocks)
    db.commit()
    
    # Create comments
    comments = [
        Comment(
            id=uuid.uuid4(),
            task_id=tasks[0].task_id,
            user_id=users[0].user_id,
            content="This is a test comment"
        )
    ]
    
    # Add comments and commit
    db.add_all(comments)
    db.commit()
    
    # Create tags
    tags = [
        Tag(
            id=uuid.uuid4(),
            name="Test Tag",
            color="#FF0000",
            description="A test tag"
        )
    ]
    
    # Add tags and commit
    db.add_all(tags)
    db.commit()
    
    # Create task-tag associations
    task_tag_associations = [
        task_tags.insert().values(
            task_id=tasks[0].task_id,
            tag_id=tags[0].id
        )
    ]
    
    # Execute task-tag associations
    for stmt in task_tag_associations:
        db.execute(stmt)
    db.commit()
    
    return {
        'users': users,
        'user_settings': user_settings,
        'workspace': workspace,
        'board': board,
        'tasks': tasks,
        'time_blocks': time_blocks,
        'comments': comments,
        'tags': tags
    } 