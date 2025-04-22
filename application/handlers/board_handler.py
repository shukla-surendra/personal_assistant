""" board handler """
from starlette import status
from fastapi import HTTPException
from application.commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand
from application.dto.task_dto import BoardDtoMapper
from domain.models.dynamo_models import Board
from config import logger
from datetime import datetime

class BoardHandler:
    @staticmethod
    def create_board(board_cmd: BoardCommand):
        """ Create a new board in DynamoDB """
        try:
            board = Board(
                workspace_id=board_cmd.workspace_id,
                name=board_cmd.name,
                description=board_cmd.description,
                users=board_cmd.users,
                owner_id=board_cmd.owner,
                labels=board_cmd.labels
            )
            board.save()
            return BoardDtoMapper.map_to_board_dto_mapper(board.to_dict())
        except Exception as e:
            logger.error(f"Error creating board: {e}")
            raise HTTPException(status_code=500, detail="Failed to create board")

    @staticmethod
    def update_board(board_cmd: BoardUpdateCommand):
        """ Update an existing board in DynamoDB """
        try:
            # Get existing board
            board = Board.get_by_id(board_cmd.board_id, 'board_id')
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

            # Prepare update attributes
            update_attrs = {}
            update_expressions = []

            if board_cmd.name:
                update_attrs[':name'] = board_cmd.name
                update_expressions.append('name = :name')
            
            if board_cmd.users:
                update_attrs[':users'] = board_cmd.users
                update_expressions.append('users = :users')
            
            if board_cmd.labels:
                update_attrs[':labels'] = board_cmd.labels
                update_expressions.append('labels = :labels')

            if update_expressions:
                # Add updated_at timestamp
                update_attrs[':updated_at'] = datetime.utcnow().isoformat()
                update_expressions.append('updated_at = :updated_at')

                # Perform update
                Board.update(
                    key={'board_id': board_cmd.board_id},
                    update_expression="SET " + ", ".join(update_expressions),
                    expression_values=update_attrs
                )

                # Get updated board
                updated_board = Board.get_by_id(board_cmd.board_id, 'board_id')
                return BoardDtoMapper.map_to_board_dto_mapper(updated_board)
            
            return BoardDtoMapper.map_to_board_dto_mapper(board)

        except Exception as e:
            logger.error(f"Error updating board: {e}")
            raise HTTPException(status_code=500, detail="Failed to update board")

    @staticmethod
    def delete_board(board_cmd: BoardDeleteCommand):
        """ Soft delete a board in DynamoDB """
        try:
            # Check if board exists and user is owner
            board = Board.get_by_id(board_cmd.board_id, 'board_id')
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            if board.get('owner_id') != board_cmd.owner:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this board")

            # Perform soft delete
            Board.update(
                key={'board_id': board_cmd.board_id},
                update_expression="SET is_deleted = :val, updated_at = :updated_at",
                expression_values={
                    ':val': True,
                    ':updated_at': datetime.utcnow().isoformat()
                }
            )

            return BoardDtoMapper.map_to_board_dto_mapper(board)

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error deleting board: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete board")

    @staticmethod
    def get_board(board_id: str, user_id: str):
        """ Get a board by ID """
        try:
            board = Board.get_by_id(board_id, 'board_id')
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            # Check if user has access to the board
            if user_id not in board.get('users', []) and board.get('owner_id') != user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this board")
            
            return BoardDtoMapper.map_to_board_dto_mapper(board)

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting board: {e}")
            raise HTTPException(status_code=500, detail="Failed to get board")

    @staticmethod
    def list_boards(workspace_id: str, user_id: str):
        """ List all boards in a workspace that the user has access to """
        try:
            # Get boards by workspace
            boards = Board.get_by_workspace(workspace_id)
            
            # Filter boards by user access and not deleted
            accessible_boards = [
                board for board in boards
                if (user_id in board.get('users', []) or board.get('owner_id') == user_id)
                and not board.get('is_deleted', False)
            ]
            
            return [BoardDtoMapper.map_to_board_dto_mapper(board) for board in accessible_boards]

        except Exception as e:
            logger.error(f"Error listing boards: {e}")
            raise HTTPException(status_code=500, detail="Failed to list boards")
