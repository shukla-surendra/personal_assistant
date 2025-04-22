from abc import ABC, abstractmethod
from .types import StorageType, AuthType

class BaseAdapterFactory(ABC):
    @abstractmethod
    def get_storage_adapter(self, storage_type: StorageType):
        pass

    @abstractmethod
    def get_auth_adapter(self, auth_type: AuthType):
        pass 