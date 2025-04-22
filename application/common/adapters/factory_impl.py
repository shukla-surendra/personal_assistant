from .storage.dynamodb_adapter import DynamoDBAdapter
from .storage.postgresql_adapter import PostgreSQLAdapter
from .auth.cognito_adapter import CognitoAdapter
from .auth.jwt_adapter import JWTAdapter
from .types import StorageType, AuthType
from .base_factory import BaseAdapterFactory

class AdapterFactory(BaseAdapterFactory):
    def __init__(self):
        self._jwt_adapter = JWTAdapter(self)
        self._cognito_adapter = CognitoAdapter(self)

    def get_storage_adapter(self, storage_type: StorageType):
        if storage_type == StorageType.DYNAMODB:
            return DynamoDBAdapter()
        elif storage_type == StorageType.POSTGRESQL:
            return PostgreSQLAdapter()
        raise ValueError(f"Unknown storage type: {storage_type}")

    def get_auth_adapter(self, auth_type: AuthType):
        if auth_type == AuthType.COGNITO:
            return self._cognito_adapter
        elif auth_type == AuthType.JWT:
            return self._jwt_adapter
        raise ValueError(f"Unknown auth type: {auth_type}") 