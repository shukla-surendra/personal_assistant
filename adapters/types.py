from enum import Enum

class StorageType(Enum):
    DYNAMODB = "dynamodb"
    POSTGRESQL = "postgresql"

class AuthType(Enum):
    COGNITO = "cognito"
    JWT = "jwt" 