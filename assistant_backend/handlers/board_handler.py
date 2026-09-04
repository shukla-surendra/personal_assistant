from typing import Optional
from uuid import UUID
from adapters.orm.models.pg_models import Board, BoardItem
from adapters.orm.models.database import SessionLocal
from commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand, BoardItemCommand, BoardItemUpdateCommand, BoardItemDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class BoardHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_board(self, command: BoardCommand) -> Board:
        try:
            board = Board(
                workspace_id=UUID(command.workspace_id),
                name=command.name,
                description=command.description,
                properties=command.properties
            )
            self.db.add(board)
            self.db.commit()
            self.db.refresh(board)
            return board
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create board")

    def list_boards(self, workspace_id: str) -> list[Board]:
        try:
            return self.db.query(Board).filter(Board.workspace_id == UUID(workspace_id)).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing boards: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list boards")

    def update_board(self, command: BoardUpdateCommand) -> Board:
        try:
            board = self.db.query(Board).filter(Board.board_id == UUID(command.board_id)).first()
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            if command.name is not None:
                board.name = command.name
            if command.description is not None:
                board.description = command.description
            if command.properties is not None:
                board.properties = command.properties

            self.db.commit()
            self.db.refresh(board)
            return board
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update board")

    def delete_board(self, command: BoardDeleteCommand) -> bool:
        try:
            board = self.db.query(Board).filter(
                Board.board_id == UUID(command.board_id),
                Board.workspace_id == UUID(command.workspace_id)
            ).first()
            if not board:
                raise HTTPException(status_code=404, detail="Board not found")

            self.db.delete(board)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete board")

    def create_board_item(self, command: BoardItemCommand) -> BoardItem:
        try:
            item = BoardItem(
                board_id=UUID(command.board_id),
                title=command.title,
                description=command.description,
                status=command.status,
                assignee_id=UUID(command.assignee_id) if command.assignee_id else None,
                due_date=command.due_date,
                properties=command.properties,
                order=command.order
            )
            self.db.add(item)
            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating board item: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create board item")

    def update_board_item(self, command: BoardItemUpdateCommand) -> BoardItem:
        try:
            item = self.db.query(BoardItem).filter(BoardItem.item_id == UUID(command.item_id)).first()
            if not item:
                raise HTTPException(status_code=404, detail="Board item not found")

            if command.title is not None:
                item.title = command.title
            if command.description is not None:
                item.description = command.description
            if command.status is not None:
                item.status = command.status
            if command.assignee_id is not None:
                item.assignee_id = UUID(command.assignee_id)
            if command.due_date is not None:
                item.due_date = command.due_date
            if command.properties is not None:
                item.properties = command.properties
            if command.order is not None:
                item.order = command.order

            self.db.commit()
            self.db.refresh(item)
            return item
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating board item: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update board item")

    def delete_board_item(self, command: BoardItemDeleteCommand) -> bool:
        try:
            item = self.db.query(BoardItem).filter(
                BoardItem.item_id == UUID(command.item_id),
                BoardItem.board_id == UUID(command.board_id)
            ).first()
            if not item:
                raise HTTPException(status_code=404, detail="Board item not found")

            self.db.delete(item)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting board item: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete board item")

    def __del__(self):
        self.db.close()