from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from adapters.orm.database import get_db
from handlers.crm_handler import CRMHandler
from commands.crm_cmd import (
    ContactCreate, ContactUpdate, ContactResponse,
    DealCreate, DealUpdate, DealResponse,
    ContactActivityCreate, ContactActivityResponse,
    DealActivityCreate, DealActivityResponse
)

router = APIRouter(prefix="/api/v1/crm", tags=["crm"])

# Contact routes
@router.post("/contacts", response_model=ContactResponse)
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.create_contact(contact)

@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_contact(contact_id)

@router.get("/workspaces/{workspace_id}/contacts", response_model=List[ContactResponse])
def get_workspace_contacts(workspace_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_workspace_contacts(workspace_id)

@router.put("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: UUID, contact: ContactUpdate, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.update_contact(contact_id, contact)

@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.delete_contact(contact_id)

# Deal routes
@router.post("/deals", response_model=DealResponse)
def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.create_deal(deal)

@router.get("/deals/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_deal(deal_id)

@router.get("/workspaces/{workspace_id}/deals", response_model=List[DealResponse])
def get_workspace_deals(workspace_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_workspace_deals(workspace_id)

@router.get("/contacts/{contact_id}/deals", response_model=List[DealResponse])
def get_contact_deals(contact_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_contact_deals(contact_id)

@router.put("/deals/{deal_id}", response_model=DealResponse)
def update_deal(deal_id: UUID, deal: DealUpdate, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.update_deal(deal_id, deal)

@router.delete("/deals/{deal_id}")
def delete_deal(deal_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.delete_deal(deal_id)

# Activity routes
@router.post("/contacts/{contact_id}/activities", response_model=ContactActivityResponse)
def create_contact_activity(
    contact_id: UUID,
    activity: ContactActivityCreate,
    db: Session = Depends(get_db)
):
    handler = CRMHandler(db)
    activity.contact_id = contact_id
    return handler.create_contact_activity(activity)

@router.get("/contacts/{contact_id}/activities", response_model=List[ContactActivityResponse])
def get_contact_activities(contact_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_contact_activities(contact_id)

@router.post("/deals/{deal_id}/activities", response_model=DealActivityResponse)
def create_deal_activity(
    deal_id: UUID,
    activity: DealActivityCreate,
    db: Session = Depends(get_db)
):
    handler = CRMHandler(db)
    activity.deal_id = deal_id
    return handler.create_deal_activity(activity)

@router.get("/deals/{deal_id}/activities", response_model=List[DealActivityResponse])
def get_deal_activities(deal_id: UUID, db: Session = Depends(get_db)):
    handler = CRMHandler(db)
    return handler.get_deal_activities(deal_id) 