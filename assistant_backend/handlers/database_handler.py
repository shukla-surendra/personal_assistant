from uuid import UUID
from adapters.orm.models.pg_models import Database, DatabaseEntry
from adapters.orm.models.database import SessionLocal
from commands.database_cmd import DatabaseCommand, DatabaseUpdateCommand, DatabaseDeleteCommand, DatabaseEntryCommand, DatabaseEntryUpdateCommand, DatabaseEntryDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class DatabaseHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_database(self, command: DatabaseCommand) -> Database:
        try:
            database = Database(
                workspace_id=UUID(command.workspace_id),
                title=command.title,
                description=command.description,
                properties=command.properties
            )
            self.db.add(database)
            self.db.commit()
            self.db.refresh(database)
            return database
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create database")

    def get_database(self, database_id: str) -> Database:
        try:
            database = self.db.query(Database).filter(
                Database.database_id == UUID(database_id),
                Database.is_deleted == False
            ).first()
            if not database:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found")
            return database
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Error getting database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get database")

    def list_databases(self, workspace_id: str) -> list[Database]:
        try:
            return self.db.query(Database).filter(
                Database.workspace_id == UUID(workspace_id),
                Database.is_deleted == False
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing databases: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list databases")

    def update_database(self, command: DatabaseUpdateCommand) -> Database:
        try:
            database = self.get_database(command.database_id)

            if command.title is not None:
                database.title = command.title
            if command.description is not None:
                database.description = command.description
            if command.properties is not None:
                database.properties = command.properties

            self.db.commit()
            self.db.refresh(database)
            return database
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update database")

    def delete_database(self, command: DatabaseDeleteCommand) -> bool:
        try:
            database = self.db.query(Database).filter(
                Database.database_id == UUID(command.database_id),
                Database.workspace_id == UUID(command.workspace_id),
                Database.is_deleted == False
            ).first()
            if not database:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found")

            database.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete database")

    def create_database_entry(self, command: DatabaseEntryCommand) -> DatabaseEntry:
        try:
            entry = DatabaseEntry(
                database_id=UUID(command.database_id),
                title=command.title,
                content=command.content,
                properties=command.properties
            )
            self.db.add(entry)
            self.db.commit()
            self.db.refresh(entry)
            return entry
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating database entry: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create database entry")

    def update_database_entry(self, command: DatabaseEntryUpdateCommand) -> DatabaseEntry:
        try:
            entry = self.db.query(DatabaseEntry).filter(
                DatabaseEntry.entry_id == UUID(command.entry_id),
                DatabaseEntry.is_deleted == False
            ).first()
            if not entry:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database entry not found")

            if command.title is not None:
                entry.title = command.title
            if command.content is not None:
                entry.content = command.content
            if command.properties is not None:
                entry.properties = command.properties

            self.db.commit()
            self.db.refresh(entry)
            return entry
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating database entry: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update database entry")

    def delete_database_entry(self, command: DatabaseEntryDeleteCommand) -> bool:
        try:
            entry = self.db.query(DatabaseEntry).filter(
                DatabaseEntry.entry_id == UUID(command.entry_id),
                DatabaseEntry.database_id == UUID(command.database_id),
                DatabaseEntry.is_deleted == False
            ).first()
            if not entry:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database entry not found")

            entry.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting database entry: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete database entry")

    def list_database_entries(self, database_id: str) -> list[DatabaseEntry]:
        try:
            return self.db.query(DatabaseEntry).filter(
                DatabaseEntry.database_id == UUID(database_id),
                DatabaseEntry.is_deleted == False
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing database entries: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list database entries")

    def __del__(self):
        self.db.close()
