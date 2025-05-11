from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    social_media: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    status: str = "active"
    source: Optional[str] = None
    notes: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class ContactCreate(ContactBase):
    workspace_id: UUID

class ContactUpdate(ContactBase):
    pass

class ContactResponse(ContactBase):
    contact_id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DealBase(BaseModel):
    title: str
    value: Optional[int] = None
    currency: str = "USD"
    stage: str
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str = "active"
    properties: Optional[Dict[str, Any]] = None

class DealCreate(DealBase):
    workspace_id: UUID
    contact_id: UUID

class DealUpdate(DealBase):
    pass

class DealResponse(DealBase):
    deal_id: UUID
    workspace_id: UUID
    contact_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContactActivityBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"
    properties: Optional[Dict[str, Any]] = None

class ContactActivityCreate(ContactActivityBase):
    workspace_id: UUID
    contact_id: UUID
    user_id: UUID

class ContactActivityUpdate(ContactActivityBase):
    pass

class ContactActivityResponse(ContactActivityBase):
    activity_id: UUID
    workspace_id: UUID
    contact_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DealActivityBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    old_stage: Optional[str] = None
    new_stage: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class DealActivityCreate(DealActivityBase):
    workspace_id: UUID
    deal_id: UUID
    user_id: UUID

class DealActivityUpdate(DealActivityBase):
    pass

class DealActivityResponse(DealActivityBase):
    activity_id: UUID
    workspace_id: UUID
    deal_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 