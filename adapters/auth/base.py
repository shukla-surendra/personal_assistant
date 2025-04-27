from abc import ABC, abstractmethod
from typing import Dict, Optional

class AuthAdapter(ABC):
    @abstractmethod
    def register_user(self, email: str, password: str, attributes: Dict) -> str:
        pass

    @abstractmethod
    def authenticate(self, email: str, password: str) -> Dict:
        pass

    @abstractmethod
    def verify_token(self, token: str) -> Dict:
        pass 