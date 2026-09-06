from typing import Optional, List
from uuid import UUID
from adapters.orm.models.pg_models import Activity
from adapters.orm.models.database import SessionLocal
from commands.activity_cmd import ActivityCommand, ActivityUpdateCommand, ActivityDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class ActivityHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_activity(self, command: ActivityCommand) -> Activity:
        try:
            activity = Activity(
                workspace_id=UUID(command.workspace_id),
                action=command.action,
                entity_id=UUID(command.entity_id),
                entity_type=command.entity_type,
                user_id=UUID(command.user_id),
                properties=command.properties
            )
            self.db.add(activity)
            self.db.commit()
            self.db.refresh(activity)
            return activity
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create activity")

    def update_activity(self, command: ActivityUpdateCommand) -> Activity:
        try:
            activity = self.db.query(Activity).filter(Activity.activity_id == UUID(command.activity_id)).first()
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found")

            if command.action is not None:
                activity.action = command.action
            if command.properties is not None:
                activity.properties = command.properties

            self.db.commit()
            self.db.refresh(activity)
            return activity
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update activity")

    def delete_activity(self, command: ActivityDeleteCommand) -> bool:
        try:
            activity = self.db.query(Activity).filter(
                Activity.activity_id == UUID(command.activity_id),
                Activity.workspace_id == UUID(command.workspace_id)
            ).first()
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found")

            self.db.delete(activity)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete activity")

    def get_activity(self, activity_id: str, workspace_id: str) -> Activity:
        try:
            activity = self.db.query(Activity).filter(
                Activity.activity_id == UUID(activity_id),
                Activity.workspace_id == UUID(workspace_id)
            ).first()
            if not activity:
                raise HTTPException(status_code=404, detail="Activity not found")
            return activity
        except SQLAlchemyError as e:
            logger.error(f"Error getting activity: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get activity")

    def list_activities(self, workspace_id: str, entity_id: Optional[str] = None, entity_type: Optional[str] = None) -> List[Activity]:
        try:
            query = self.db.query(Activity).filter(Activity.workspace_id == UUID(workspace_id))
            
            if entity_id:
                query = query.filter(Activity.entity_id == UUID(entity_id))
            if entity_type:
                query = query.filter(Activity.entity_type == entity_type)
            
            return query.order_by(Activity.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing activities: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list activities")

    def __del__(self):
        self.db.close() 