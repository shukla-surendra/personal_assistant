from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

class StorageAdapter(ABC):
    @abstractmethod
    def create_user(self, user_data: Dict) -> Dict:
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def update_user(self, user_id: str, update_data: Dict) -> Dict:
        pass

    @abstractmethod
    def delete_user(self, user_id: str) -> bool:
        pass

    # Similar methods for Workspace, Board, and Task
    # ... other abstract methods 