from typing import Dict, List, Optional
from datetime import datetime
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from .base import StorageAdapter
from config import get_config
from passlib.hash import pbkdf2_sha256
import logging
import datetime
import uuid
from fastapi import HTTPException

logger = logging.getLogger(__name__)


logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)


def make_json_serializable(data: dict):
    def convert(value):
        if isinstance(value, datetime.datetime):
            return value.isoformat()
        elif isinstance(value, datetime.date):
            return value.isoformat()
        elif isinstance(value, uuid.UUID):
            return str(value)
        elif isinstance(value, list):
            return [convert(v) for v in value]
        elif isinstance(value, dict):
            return {k: convert(v) for k, v in value.items()}
        else:
            return value  # Leave strings and all other JSON-safe types as-is

    return {k: convert(v) for k, v in data.items()}


class PostgreSQLAdapter(StorageAdapter):
    def __init__(self):
        self.config = get_config()
        self.engine = create_engine(self.config.database_url)
        self.Session = sessionmaker(bind=self.engine)

    def create_user(self, user_data: Dict) -> Dict:
        try:
            # Check if user already exists
            existing_user = self.get_user_by_email(user_data['email'])
            if existing_user:
                logger.warning(f"User with email {user_data['email']} already exists, user_id: {existing_user.get('user_id')}")
                raise HTTPException(
                    status_code=409,
                    detail="User with this email already exists"
                )

            # Set default values for required fields
            user_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            user_data.setdefault('user_id', user_id)
            user_data.setdefault('country_code', None)
            user_data.setdefault('mobile_number', None)
            user_data.setdefault('google_id', None)
            user_data.setdefault('preferences', {})
            user_data.setdefault('is_deleted', False)
            user_data.setdefault('is_email_verified', False)
            user_data.setdefault('is_phone_verified', False)
            user_data.setdefault('verification_token', None)
            user_data.setdefault('otp', None)
            user_data.setdefault('otp_time', None)
            user_data.setdefault('created_at', now)
            user_data.setdefault('updated_at', now)

            # Hash password if provided
            if 'password' in user_data:
                user_data['password_hash'] = pbkdf2_sha256.hash(user_data.pop('password'))

            # Convert preferences to JSON string
            if isinstance(user_data['preferences'], dict):
                user_data['preferences'] = json.dumps(user_data['preferences'])

            # Create user
            query = text("""
                INSERT INTO users (
                    user_id, email, password_hash, first_name, last_name,
                    country_code, mobile_number, google_id, status, role,
                    user_type, preferences, is_deleted, is_email_verified,
                    is_phone_verified, verification_token, otp, otp_time,
                    created_at, updated_at
                ) VALUES (
                    :user_id, :email, :password_hash, :first_name,
                    :last_name, :country_code, :mobile_number,
                    :google_id, :status, :role, :user_type,
                    :preferences, :is_deleted, :is_email_verified,
                    :is_phone_verified, :verification_token, :otp,
                    :otp_time, :created_at, :updated_at
                ) RETURNING *
            """)
            
            with self.Session() as session:
                result = session.execute(query, user_data).fetchone()
                session.commit()
                
                if result:
                    return {
                        'user_id': str(result.user_id),
                        'email': result.email,
                        'first_name': result.first_name,
                        'last_name': result.last_name,
                        'status': result.status,
                        'role': result.role,
                        'user_type': result.user_type,
                        'created_at': result.created_at,
                        'updated_at': result.updated_at
                    }
                else:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to create user"
                    )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error while creating user"
            )

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        with self.Session() as session:
            query = text("SELECT * FROM users WHERE user_id = :user_id AND NOT is_deleted")
            result = session.execute(query, {"user_id": user_id}).fetchone()
            if result:
                # If result is already a dictionary, return it directly
                if isinstance(result, dict):
                    return result
                # Otherwise convert the row to a dictionary
                return {
                    'user_id': str(result.user_id),  # Convert UUID to string
                    'email': result.email,
                    'password_hash': result.password_hash,
                    'first_name': result.first_name,
                    'last_name': result.last_name,
                    'country_code': result.country_code,
                    'mobile_number': result.mobile_number,
                    'google_id': result.google_id,
                    'last_login': result.last_login,
                    'status': result.status,
                    'role': result.role,
                    'user_type': result.user_type,
                    'preferences': result.preferences,
                    'is_deleted': result.is_deleted,
                    'is_email_verified': result.is_email_verified,
                    'is_phone_verified': result.is_phone_verified,
                    'verification_token': result.verification_token,
                    'otp': result.otp,
                    'otp_time': result.otp_time,
                    'created_at': result.created_at,
                    'updated_at': result.updated_at
                }
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        try:
            query = text("""
                SELECT user_id, email, password_hash, first_name, last_name, status, role, user_type
                FROM users 
                WHERE email = :email AND is_deleted = FALSE
            """)
            
            with self.Session() as session:
                result = session.execute(query, {"email": email}).fetchone()
                
                if result:
                    return {
                        'user_id': str(result.user_id),
                        'email': result.email,
                        'password_hash': result.password_hash,
                        'first_name': result.first_name,
                        'last_name': result.last_name,
                        'status': result.status,
                        'role': result.role,
                        'user_type': result.user_type
                    }
                return None

        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            raise

    def update_user(self, user_id: str, update_data: Dict) -> Dict:
        with self.Session() as session:
            # Hash password if provided
            if 'password' in update_data:
                update_data['password_hash'] = pbkdf2_sha256.hash(update_data.pop('password'))
            
            # Build the update query dynamically
            update_fields = []
            params = {"user_id": user_id}
            for key, value in update_data.items():
                if key != "user_id":  # Don't allow updating user_id
                    update_fields.append(f"{key} = :{key}")
                    params[key] = value
            
            if not update_fields:
                raise ValueError("No valid fields to update")
            
            query = text(f"""
                UPDATE users 
                SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id AND NOT is_deleted
                RETURNING *
            """)
            result = session.execute(query, params).fetchone()
            if not result:
                raise ValueError(f"User with ID {user_id} not found")
            
            session.commit()
            return dict(result)

    def delete_user(self, user_id: str) -> bool:
        with self.Session() as session:
            query = text("""
                UPDATE users 
                SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id AND NOT is_deleted
                RETURNING user_id
            """)
            result = session.execute(query, {"user_id": user_id}).fetchone()
            session.commit()
            return bool(result)

    def verify_password(self, stored_password_hash: str, password: str) -> bool:
        return pbkdf2_sha256.verify(password, stored_password_hash)

    def create_workspace(self, workspace_data: Dict) -> Dict:
        with self.Session() as session:
            workspace_data['workspace_id'] = str(uuid.uuid4())
            query = text("""
                INSERT INTO workspaces (
                    workspace_id, workspace_name, description, owner_id,
                    settings, system_default, is_default
                )
                VALUES (
                    :workspace_id, :workspace_name, :description, :owner_id,
                    :settings, :system_default, :is_default
                )
                RETURNING *
            """)
            result = session.execute(query, workspace_data).fetchone()
            
            # Add owner to workspace_users
            user_query = text("""
                INSERT INTO workspace_users (workspace_id, user_id, role)
                VALUES (:workspace_id, :user_id, 'owner')
            """)
            session.execute(user_query, {
                "workspace_id": result.workspace_id,
                "user_id": workspace_data['owner_id']
            })
            
            session.commit()
            return dict(result)

    def get_workspace_by_id(self, workspace_id: str) -> Optional[Dict]:
        with self.Session() as session:
            query = text("""
                SELECT w.*, array_agg(wu.user_id) as users
                FROM workspaces w
                LEFT JOIN workspace_users wu ON w.workspace_id = wu.workspace_id
                WHERE w.workspace_id = :workspace_id
                GROUP BY w.workspace_id
            """)
            result = session.execute(query, {"workspace_id": workspace_id}).fetchone()
            return dict(result) if result else None

    def get_user_workspaces(self, user_id: str) -> List[Dict]:
        with self.Session() as session:
            query = text("""
                SELECT w.*, array_agg(wu.user_id) as users
                FROM workspaces w
                JOIN workspace_users wu ON w.workspace_id = wu.workspace_id
                WHERE wu.user_id = :user_id
                GROUP BY w.workspace_id
            """)
            results = session.execute(query, {"user_id": user_id}).fetchall()
            return [make_json_serializable(dict(row._mapping)) for row in results]

    def create_board(self, board_data: Dict) -> Dict:
        with self.Session() as session:
            board_data['board_id'] = str(uuid.uuid4())
            # Convert labels and users to JSON string if they are lists
            if isinstance(board_data.get('labels'), list):
                board_data['labels'] = json.dumps(board_data['labels'])
            if isinstance(board_data.get('users'), list):
                board_data['users'] = json.dumps(board_data['users'])
            
            query = text("""
                INSERT INTO boards (
                    board_id, workspace_id, name, description,
                    owner_id, labels, status, users, settings, meta_data
                )
                VALUES (
                    :board_id, :workspace_id, :name, :description,
                    :owner_id, :labels, :status, :users, :settings, :meta_data
                )
                RETURNING *
            """)
            result = session.execute(query, board_data).fetchone()
            
            # Add owner to board_users
            user_query = text("""
                INSERT INTO board_users (board_id, user_id, role)
                VALUES (:board_id, :user_id, 'owner')
            """)
            session.execute(user_query, {
                "board_id": result.board_id,
                "user_id": board_data['owner_id']
            })
            
            session.commit()
            row_dict = dict(result._mapping)
            return make_json_serializable(row_dict)

    def create_task(self, task_data: Dict) -> Dict:
        with self.Session() as session:
            task_data['task_id'] = str(uuid.uuid4())
            query = text("""
                INSERT INTO tasks (
                    task_id, workspace_id, board_id, user_id,
                    title, description, priority, slug,
                    task_type, status, due_on, start_time,
                    end_time, assignee, labels
                )
                VALUES (
                    :task_id, :workspace_id, :board_id, :user_id,
                    :title, :description, :priority, :slug,
                    :task_type, :status, :due_on, :start_time,
                    :end_time, :assignee, :labels
                )
                RETURNING *
            """)
            result = session.execute(query, task_data).fetchone()
            session.commit()
            return dict(result)

    def list_boards_by_workspace(self, workspace_id: str, user_id: str) -> List[Dict]:
        """List all boards in a workspace that the user has access to"""
        with self.Session() as session:
            query = text("""
                SELECT 
                    b.board_id,
                    b.workspace_id,
                    b.name,
                    b.description,
                    b.owner_id,
                    b.labels,
                    b.users,
                    b.settings,
                    b.meta_data,
                    b.status,
                    b.is_deleted,
                    b.created_at,
                    b.updated_at,
                    array_agg(bu.user_id) as board_users
                FROM boards b
                LEFT JOIN board_users bu ON b.board_id = bu.board_id
                WHERE b.workspace_id = :workspace_id 
                AND (b.owner_id = :user_id OR bu.user_id = :user_id)
                AND b.is_deleted = FALSE
                GROUP BY 
                    b.board_id,
                    b.workspace_id,
                    b.name,
                    b.description,
                    b.owner_id,
                    b.labels,
                    b.users,
                    b.settings,
                    b.meta_data,
                    b.status,
                    b.is_deleted,
                    b.created_at,
                    b.updated_at
            """)
            results = session.execute(query, {
                "workspace_id": workspace_id,
                "user_id": user_id
            }).fetchall()
            return [make_json_serializable(dict(row._mapping)) for row in results]
