from pydantic import BaseModel
from typing import Optional


class UserCommand(BaseModel):
    first_name: str
    last_name: Optional[str]
    email: str
    password: str

class UserDeleteCommand(BaseModel):
    user_id: Optional[str]

class UserUpdateCommand(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    password: Optional[str]

class LoginCommand(BaseModel):
    email: str
    password: str


class OtpLoginCommand(BaseModel):
    email: str
    otp: int


class OtpRequestLoginCommand(BaseModel):
    email: str
    verification_otp_token: str

class TokenCreateRequest(BaseModel):
    email: str

class EmailVerificationRequest(BaseModel):
    verification_otp_token: str
    email: str
