from uuid import UUID
from adapters.orm.models.pg_models import Board
from adapters.orm.models.database import SessionLocal
from commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

# Default Kanban columns for a board that hasn't customized its own --
# stored per-board in Board.properties["columns"] (existing JSONB field,
# no schema change) so a board can later override this without new schema.
DEFAULT_BOARD_COLUMNS = ["todo", "in_progress", "review", "done"]

class BoardHandler:
    def __init__(self):
        self.db = SessionLocal()

    def create_board(self, command: BoardCommand) -> Board:
        try:
            properties = command.properties or {}
            properties.setdefault("columns", DEFAULT_BOARD_COLUMNS)
            board = Board(
                workspace_id=UUID(command.workspace_id),
                name=command.name,
                description=command.description,
                properties=properties
            )
            self.db.add(board)
            self.db.commit()
            self.db.refresh(board)
            return board
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create board")

    def get_board(self, board_id: str) -> Board:
        try:
            board = self.db.query(Board).filter(
                Board.board_id == UUID(board_id),
                Board.is_deleted == False
            ).first()
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            return board
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Error getting board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get board")

    def list_boards(self, workspace_id: str) -> list[Board]:
        try:
            return self.db.query(Board).filter(
                Board.workspace_id == UUID(workspace_id),
                Board.is_deleted == False
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Error listing boards: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list boards")

    def update_board(self, command: BoardUpdateCommand) -> Board:
        try:
            board = self.get_board(command.board_id)

            if command.name is not None:
                board.name = command.name
            if command.description is not None:
                board.description = command.description
            if command.properties is not None:
                board.properties = command.properties

            self.db.commit()
            self.db.refresh(board)
            return board
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update board")

    def delete_board(self, command: BoardDeleteCommand) -> bool:
        try:
            board = self.db.query(Board).filter(
                Board.board_id == UUID(command.board_id),
                Board.workspace_id == UUID(command.workspace_id),
                Board.is_deleted == False
            ).first()
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

            # Soft delete -- same pattern Task uses (is_deleted flag, not a
            # real DELETE), so a board's tasks (Task.board_id, ON DELETE
            # SET NULL) aren't affected and the board can be recovered.
            board.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting board: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete board")

    def __del__(self):
        self.db.close()
