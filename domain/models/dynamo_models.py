from datetime import datetime
import uuid
from boto3.dynamodb.conditions import Key, Attr
import boto3
from constants import UserStatus, UserRoles, UserType, TaskStatus, TaskType
from decimal import Decimal
import json


# Helper class for DynamoDB serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)


# Base entity class
class DynamoEntity:
    table_name = None

    @classmethod
    def get_table(cls):
        """Get the DynamoDB table for this entity"""
        dynamodb = boto3.resource('dynamodb', region_name="ap-south-1")
        return dynamodb.Table(cls.table_name)

    def to_dict(self):
        """Convert entity to dictionary for DynamoDB"""
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

    def save(self):
        """Save entity to DynamoDB"""
        table = self.get_table()
        print(table)
        table.put_item(Item=self.to_dict())
        return self

    @classmethod
    def get_by_id(cls, id_value, id_field='id'):
        """Get entity by primary key"""
        table = cls.get_table()
        response = table.get_item(Key={id_field: id_value})
        if 'Item' in response:
            return response['Item']
        return None

    @classmethod
    def query(cls, index_name, key_condition):
        """Query items using a secondary index"""
        table = cls.get_table()
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=key_condition
        )
        return response.get('Items', [])

    @classmethod
    def scan(cls, filter_expression=None):
        """Scan the table with optional filtering"""
        table = cls.get_table()
        params = {}
        if filter_expression:
            params['FilterExpression'] = filter_expression

        response = table.scan(**params)
        return response.get('Items', [])

    @classmethod
    def update(cls, key, update_expression, expression_values):
        """Update an item in the table"""
        table = cls.get_table()
        response = table.update_item(
            Key=key,
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="UPDATED_NEW"
        )
        return response.get('Attributes', {})

    @classmethod
    def delete(cls, key):
        """Delete an item from the table"""
        table = cls.get_table()
        return table.delete_item(Key=key)


class User(DynamoEntity):
    table_name = "users"

    def __init__(self, user_id, email, first_name, last_name=None, country_code=None,
                 mobile_number=None, google_id=None, password=None,
                 status=UserStatus.ACTIVE, role=UserRoles.USER,
                 user_type=UserType.FREE):
        # Generate a new UUID for the user_id if not provided
        self.user_id = user_id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.country_code = country_code
        self.mobile_number = mobile_number
        self.google_id = google_id
        self.last_login = datetime.utcnow().isoformat()
        self.password = password
        self.tasks = []  # List of task IDs
        self.status = status.value
        self.role = role.value
        self.user_type = user_type.value
        self.is_deleted = False
        self.is_email_verified = False
        self.is_phone_verified = False
        self.verification_token = None
        self.otp = None
        self.otp_time = None
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()
        self.default_workspace = {}

    @classmethod
    def get_by_email(cls, email):
        """Get user by email using a secondary index"""
        return cls.query('EmailIndex', Key('email').eq(email))

    @classmethod
    def get_active_users(cls):
        """Get all active users"""
        return cls.scan(Attr('status').eq(UserStatus.ACTIVE.value) &
                        Attr('is_deleted').eq(False))

    @classmethod
    def verify_email(cls, user_id):
        """Mark a user's email as verified"""
        return cls.update(
            key={'user_id': user_id},
            update_expression="SET is_email_verified = :val, updated_at = :updated",
            expression_values={
                ':val': True,
                ':updated': datetime.utcnow().isoformat()
            }
        )

    @classmethod
    def add_task(cls, user_id, task_id):
        """Add a task to the user's task list"""
        return cls.update(
            key={'user_id': user_id},
            update_expression="SET tasks = list_append(if_not_exists(tasks, :empty_list), :task), updated_at = :updated",
            expression_values={
                ':task': [task_id],
                ':empty_list': [],
                ':updated': datetime.utcnow().isoformat()
            }
        )


class Workspace(DynamoEntity):
    table_name = "workspaces"

    def __init__(self, workspace_name, description, owner_id, users=None, settings=None,
                 system_default=False, default=False):

        self.workspace_id = str(uuid.uuid4())
        self.workspace_name = workspace_name
        self.description = description
        self.owner_id = owner_id
        self.users = users or [owner_id]  # List of user IDs
        self.settings = settings or {}
        self.system_default = system_default
        self.default = default
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()

    @classmethod
    def get_by_owner(cls, owner_id):
        """Get workspaces by owner ID using a secondary index"""
        return cls.query('OwnerIndex', Key('owner_id').eq(owner_id))

    @classmethod
    def get_by_user(cls, user_id):
        """Get workspaces that a user belongs to"""
        # This is a more complex query in DynamoDB that requires a scan with a filter
        return cls.scan(Attr('users').contains(user_id))

    def add_user(self, user_id):
        """Add a user to the workspace."""
        return self.__class__.update(
            key={'workspace_id': self.workspace_id},
            update_expression="SET users = list_append(if_not_exists(users, :empty_list), :user), updated_at = :updated",
            expression_values={
                ':user': [user_id],
                ':empty_list': [],
                ':updated': datetime.utcnow().isoformat()
            }
        )

    def remove_user(self, user_id):
        """Remove a user from the workspace."""
        # This is more complex in DynamoDB and may require getting the current state,
        # modifying it, and then putting it back
        table = self.get_table()
        response = table.get_item(Key={'workspace_id': self.workspace_id})
        if 'Item' in response:
            item = response['Item']
            if user_id in item.get('users', []):
                item['users'].remove(user_id)
                item['updated_at'] = datetime.utcnow().isoformat()
                table.put_item(Item=item)

    def update_settings(self, new_settings):
        """Update the workspace settings."""
        return self.__class__.update(
            key={'workspace_id': self.workspace_id},
            update_expression="SET settings = :settings, updated_at = :updated",
            expression_values={
                ':settings': new_settings,
                ':updated': datetime.utcnow().isoformat()
            }
        )


class Board(DynamoEntity):
    table_name = "boards"

    def __init__(self, workspace_id, name, description=None, users=None,
                 owner_id=None, labels=None, status=UserStatus.ACTIVE):
        self.board_id = str(uuid.uuid4())
        self.workspace_id = workspace_id
        self.name = name
        self.description = description or ""
        self.users = users or []
        self.owner_id = owner_id
        self.labels = labels or []
        self.status = status.value
        self.is_deleted = False
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()

    @classmethod
    def get_by_workspace(cls, workspace_id):
        """Get boards by workspace ID using a secondary index"""
        return cls.query('WorkspaceIndex', Key('workspace_id').eq(workspace_id))

    @classmethod
    def get_by_user(cls, user_id):
        """Get boards that a user belongs to"""
        return cls.scan(Attr('users').contains(user_id) &
                        Attr('is_deleted').eq(False))

    @classmethod
    def get_board_with_tasks(cls, user_id, board_id):
        """Get a board and its tasks"""
        board = cls.get_by_id(board_id)
        if not board or user_id not in board.get('users', []) or board.get('is_deleted', False):
            return None, []

        # Get tasks with labels that match the board's labels
        tasks = Task.scan(
            Attr('user_id').eq(user_id) &
            Attr('is_deleted').eq(False) &
            Attr('board_id').eq(board_id)
        )

        return board, tasks


class Task(DynamoEntity):
    table_name = "tasks"

    def __init__(self, workspace_id, user_id, title, description=None, priority=None,
                 task_type=TaskType.TODO, status=TaskStatus.TODO, due_on=None,
                 start_time=None, end_time=None, assignee=None, labels=None,
                 board_id=None):
        self.task_id = str(uuid.uuid4())
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.title = title
        self.description = description or ""
        self.priority = priority
        self.slug = self._generate_slug(title)
        self.task_type = task_type.value
        self.status = status.value
        self.completed = False
        self.is_deleted = False
        self.due_on = due_on.isoformat() if due_on else None
        self.start_time = start_time.isoformat() if start_time else None
        self.end_time = end_time.isoformat() if end_time else None
        self.assignee = assignee
        self.published = False
        self.public = False
        self.labels = labels or []
        self.board_id = board_id
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()

    def _generate_slug(self, title):
        """Generate a slug from the title"""
        # Simple slug generation - could be improved
        return "-".join(title.lower().split())

    @classmethod
    def get_by_workspace_user(cls, workspace_id, user_id):
        """Get tasks by workspace and user"""
        return cls.query(
            'WorkspaceUserIndex',
            Key('workspace_id').eq(workspace_id) & Key('user_id').eq(user_id)
        )

    @classmethod
    def get_by_assignee(cls, workspace_id, assignee):
        """Get tasks by assignee"""
        return cls.query(
            'WorkspaceAssigneeIndex',
            Key('workspace_id').eq(workspace_id) & Key('assignee').eq(assignee)
        )

    @classmethod
    def get_by_due_date(cls, user_id, start_date, end_date):
        """Get tasks due between dates"""
        return cls.scan(
            Attr('user_id').eq(user_id) &
            Attr('is_deleted').eq(False) &
            Attr('due_on').between(start_date.isoformat(), end_date.isoformat())
        )

    @classmethod
    def move_task(cls, task_id, new_status):
        """Move a task to a new status"""
        return cls.update(
            key={'task_id': task_id},
            update_expression="SET #status = :status, updated_at = :updated",
            expression_values={
                ':status': new_status.value,
                ':updated': datetime.utcnow().isoformat()
            }
        )

    @classmethod
    def update_slug(cls, task_id, slug):
        """Update a task's slug"""
        return cls.update(
            key={'task_id': task_id},
            update_expression="SET slug = :slug, updated_at = :updated",
            expression_values={
                ':slug': slug,
                ':updated': datetime.utcnow().isoformat()
            }
        )

    @classmethod
    def create_board_task(cls, board_id, user_id, title, **kwargs):
        """Create a task and add it to a board"""
        board = Board.get_by_id(board_id)
        if not board or user_id not in board.get('users', []):
            return None

        task = Task(
            workspace_id=board['workspace_id'],
            user_id=user_id,
            title=title,
            board_id=board_id,
            labels=board.get('labels', []),
            **kwargs
        )

        return task.save()


# DynamoDB Table Creation Functions
def create_tables():
    """Create all DynamoDB tables needed for the application"""
    dynamodb = boto3.resource('dynamodb')

    # Organizations table
    dynamodb.create_table(
        TableName='organizations',
        KeySchema=[
            {'AttributeName': 'org_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'org_id', 'AttributeType': 'S'},
            {'AttributeName': 'slug', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'SlugIndex',
                'KeySchema': [
                    {'AttributeName': 'slug', 'KeyType': 'HASH'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Users table
    dynamodb.create_table(
        TableName='users',
        KeySchema=[
            {'AttributeName': 'user_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'email', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'EmailIndex',
                'KeySchema': [
                    {'AttributeName': 'email', 'KeyType': 'HASH'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Organization Users table
    dynamodb.create_table(
        TableName='organization_users',
        KeySchema=[
            {'AttributeName': 'org_id', 'KeyType': 'HASH'},
            {'AttributeName': 'user_id', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'org_id', 'AttributeType': 'S'},
            {'AttributeName': 'user_id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Workspaces table
    dynamodb.create_table(
        TableName='workspaces',
        KeySchema=[
            {'AttributeName': 'workspace_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'workspace_id', 'AttributeType': 'S'},
            {'AttributeName': 'org_id', 'AttributeType': 'S'},
            {'AttributeName': 'slug', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'OrgIndex',
                'KeySchema': [
                    {'AttributeName': 'org_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'slug', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Boards table
    dynamodb.create_table(
        TableName='boards',
        KeySchema=[
            {'AttributeName': 'board_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'board_id', 'AttributeType': 'S'},
            {'AttributeName': 'workspace_id', 'AttributeType': 'S'},
            {'AttributeName': 'slug', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'WorkspaceIndex',
                'KeySchema': [
                    {'AttributeName': 'workspace_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'slug', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Tasks table
    dynamodb.create_table(
        TableName='tasks',
        KeySchema=[
            {'AttributeName': 'task_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'task_id', 'AttributeType': 'S'},
            {'AttributeName': 'workspace_id', 'AttributeType': 'S'},
            {'AttributeName': 'board_id', 'AttributeType': 'S'},
            {'AttributeName': 'slug', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'WorkspaceIndex',
                'KeySchema': [
                    {'AttributeName': 'workspace_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'slug', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'BoardIndex',
                'KeySchema': [
                    {'AttributeName': 'board_id', 'KeyType': 'HASH'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    # Activity Logs table
    dynamodb.create_table(
        TableName='activity_logs',
        KeySchema=[
            {'AttributeName': 'log_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'log_id', 'AttributeType': 'S'},
            {'AttributeName': 'org_id', 'AttributeType': 'S'},
            {'AttributeName': 'entity_id', 'AttributeType': 'S'},
            {'AttributeName': 'created_at', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'OrgTimeIndex',
                'KeySchema': [
                    {'AttributeName': 'org_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'EntityIndex',
                'KeySchema': [
                    {'AttributeName': 'entity_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

    return True


if __name__ == "__main__":
    # create_tables()
    user = User(
        email="surendra.shukla29@gmail.com",
        first_name="Surendra",
        last_name="Shukla"
    )

    # You can use the Cognito sub as an external ID if needed
    user.user_id = "xyz-id676-76s5d6svd-s7d8sbd78"

    # No need to store password as Cognito handles authentication
    # No need to set verification tokens as Cognito handles verification

    # Save user to DynamoDB
    user.save()
    # # Create default workspace for the user
    # default_workspace = Workspace(
    #     workspace_name=f"Surendra's Workspace",
    #     description="Default workspace",
    #     owner_id=user.cognito_id,
    #     users=[user.cognito_id],
    #     default=True,
    #     system_default=True
    # )
    # default_workspace.save()
    #
    # # Update user with default workspace
    # user.default_workspace = {
    #     "workspace_id": default_workspace.workspace_id,
    #     "workspace_name": default_workspace.workspace_name
    # }
    # user.save()
    pass
