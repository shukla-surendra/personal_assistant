from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from authorization.auth import get_auth_details
from handlers.crm_handler import CRMHandler
from commands.crm_cmd import (
    ContactCreate, ContactUpdate, ContactResponse,
    DealCreate, DealUpdate, DealResponse,
    ContactActivityCreate, ContactActivityUpdate, ContactActivityResponse,
    DealActivityCreate, DealActivityUpdate, DealActivityResponse
)

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/crm", tags=["crm"])

# Contact routes
@router.post("/contacts", response_model=ContactResponse)
def create_contact(workspace_id: str, contact: ContactCreate, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.create_contact(contact)

@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(workspace_id: str, contact_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_contact(contact_id)

@router.get("/contacts", response_model=List[ContactResponse])
def get_workspace_contacts(workspace_id: str, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_workspace_contacts(workspace_id)

@router.put("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(workspace_id: str, contact_id: UUID, contact: ContactUpdate, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.update_contact(contact_id, contact)

@router.delete("/contacts/{contact_id}")
def delete_contact(workspace_id: str,contact_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.delete_contact(contact_id)

# Deal routes
@router.post("/deals", response_model=DealResponse)
def create_deal(workspace_id: str, deal: DealCreate, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.create_deal(deal)

@router.get("/deals/{deal_id}", response_model=DealResponse)
def get_deal(workspace_id: str, deal_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_deal(deal_id)

@router.get("/deals", response_model=List[DealResponse])
def get_workspace_deals(workspace_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_workspace_deals(workspace_id)

@router.get("/contacts/{contact_id}/deals", response_model=List[DealResponse])
def get_contact_deals(workspace_id: str, contact_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_contact_deals(contact_id)

@router.put("/deals/{deal_id}", response_model=DealResponse)
def update_deal(workspace_id: str, deal_id: UUID, deal: DealUpdate, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.update_deal(deal_id, deal)

@router.delete("/deals/{deal_id}")
def delete_deal(workspace_id: str, deal_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.delete_deal(deal_id)

# Activity routes
@router.post("/contacts/{contact_id}/activities", response_model=ContactActivityResponse)
def create_contact_activity(
    workspace_id: str,
    contact_id: UUID,
    activity: ContactActivityCreate,
    user: dict = Depends(get_auth_details)
):
    handler = CRMHandler()
    activity.contact_id = contact_id
    return handler.create_contact_activity(activity)

@router.get("/contacts/{contact_id}/activities", response_model=List[ContactActivityResponse])
def get_contact_activities(workspace_id: str, contact_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_contact_activities(contact_id)

@router.put("/contacts/{contact_id}/activities/{activity_id}", response_model=ContactActivityResponse)
def update_contact_activity(
    workspace_id: str, contact_id: UUID, activity_id: UUID,
    activity: ContactActivityUpdate, user: dict = Depends(get_auth_details)
):
    handler = CRMHandler()
    return handler.update_contact_activity(activity_id, activity)

@router.delete("/contacts/{contact_id}/activities/{activity_id}")
def delete_contact_activity(workspace_id: str, contact_id: UUID, activity_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.delete_contact_activity(activity_id)

@router.post("/deals/{deal_id}/activities", response_model=DealActivityResponse)
def create_deal_activity(
    workspace_id: str,
    deal_id: UUID,
    activity: DealActivityCreate,
    user: dict = Depends(get_auth_details)
):
    handler = CRMHandler()
    activity.deal_id = deal_id
    return handler.create_deal_activity(activity)

@router.get("/deals/{deal_id}/activities", response_model=List[DealActivityResponse])
def get_deal_activities(workspace_id: str, deal_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.get_deal_activities(deal_id)

@router.put("/deals/{deal_id}/activities/{activity_id}", response_model=DealActivityResponse)
def update_deal_activity(
    workspace_id: str, deal_id: UUID, activity_id: UUID,
    activity: DealActivityUpdate, user: dict = Depends(get_auth_details)
):
    handler = CRMHandler()
    return handler.update_deal_activity(activity_id, activity)

@router.delete("/deals/{deal_id}/activities/{activity_id}")
def delete_deal_activity(workspace_id: str, deal_id: UUID, activity_id: UUID, user: dict = Depends(get_auth_details)):
    handler = CRMHandler()
    return handler.delete_deal_activity(activity_id)

crm_router = router 