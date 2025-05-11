from adapters.orm.models.database import SessionLocal
from fastapi import HTTPException
from typing import List
from uuid import UUID
import logging

from adapters.orm.models.pg_models import Contact, Deal, ContactActivity, DealActivity
from commands.crm_cmd import (
    ContactCreate, ContactUpdate, DealCreate, DealUpdate,
    ContactActivityCreate, DealActivityCreate
)

logger = logging.getLogger(__name__)

class CRMHandler:
    def __init__(self):
        self.db = SessionLocal()

    # Contact methods
    def create_contact(self, contact: ContactCreate) -> Contact:
        try:
            db_contact = Contact(**contact.model_dump())
            self.db.add(db_contact)
            self.db.commit()
            self.db.refresh(db_contact)
            return db_contact
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating contact: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create contact")

    def get_contact(self, contact_id: UUID) -> Contact:
        contact = self.db.query(Contact).filter(
            Contact.contact_id == contact_id,
            Contact.is_deleted == False
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return contact

    def get_workspace_contacts(self, workspace_id: UUID) -> List[Contact]:
        return self.db.query(Contact).filter(
            Contact.workspace_id == workspace_id,
            Contact.is_deleted == False
        ).all()

    def update_contact(self, contact_id: UUID, contact: ContactUpdate) -> Contact:
        db_contact = self.get_contact(contact_id)
        try:
            for key, value in contact.model_dump(exclude_unset=True).items():
                setattr(db_contact, key, value)
            self.db.commit()
            self.db.refresh(db_contact)
            return db_contact
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating contact: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update contact")

    def delete_contact(self, contact_id: UUID) -> bool:
        db_contact = self.get_contact(contact_id)
        try:
            db_contact.is_deleted = True
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting contact: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete contact")

    # Deal methods
    def create_deal(self, deal: DealCreate) -> Deal:
        try:
            db_deal = Deal(**deal.model_dump())
            self.db.add(db_deal)
            self.db.commit()
            self.db.refresh(db_deal)
            return db_deal
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating deal: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create deal")

    def get_deal(self, deal_id: UUID) -> Deal:
        deal = self.db.query(Deal).filter(
            Deal.deal_id == deal_id,
            Deal.is_deleted == False
        ).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        return deal

    def get_workspace_deals(self, workspace_id: UUID) -> List[Deal]:
        return self.db.query(Deal).filter(
            Deal.workspace_id == workspace_id,
            Deal.is_deleted == False
        ).all()

    def get_contact_deals(self, contact_id: UUID) -> List[Deal]:
        return self.db.query(Deal).filter(
            Deal.contact_id == contact_id,
            Deal.is_deleted == False
        ).all()

    def update_deal(self, deal_id: UUID, deal: DealUpdate) -> Deal:
        db_deal = self.get_deal(deal_id)
        try:
            for key, value in deal.model_dump(exclude_unset=True).items():
                setattr(db_deal, key, value)
            self.db.commit()
            self.db.refresh(db_deal)
            return db_deal
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating deal: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update deal")

    def delete_deal(self, deal_id: UUID) -> bool:
        db_deal = self.get_deal(deal_id)
        try:
            db_deal.is_deleted = True
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting deal: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete deal")

    # Activity methods
    def create_contact_activity(self, activity: ContactActivityCreate) -> ContactActivity:
        try:
            db_activity = ContactActivity(**activity.model_dump())
            self.db.add(db_activity)
            self.db.commit()
            self.db.refresh(db_activity)
            return db_activity
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating contact activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create contact activity")

    def get_contact_activities(self, contact_id: UUID) -> List[ContactActivity]:
        return self.db.query(ContactActivity).filter(
            ContactActivity.contact_id == contact_id
        ).order_by(ContactActivity.created_at.desc()).all()

    def create_deal_activity(self, activity: DealActivityCreate) -> DealActivity:
        try:
            db_activity = DealActivity(**activity.model_dump())
            self.db.add(db_activity)
            self.db.commit()
            self.db.refresh(db_activity)
            return db_activity
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating deal activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create deal activity")

    def get_deal_activities(self, deal_id: UUID) -> List[DealActivity]:
        return self.db.query(DealActivity).filter(
            DealActivity.deal_id == deal_id
        ).order_by(DealActivity.created_at.desc()).all() 