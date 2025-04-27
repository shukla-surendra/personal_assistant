from starlette import status
from fastapi import HTTPException
from application.commands.board_cmd import BoardCommand, BoardUpdateCommand, BoardDeleteCommand
from application.dto.task_dto import BoardDtoMapper
from config import logger, get_config
from application.adapters.factory import AdapterFactory, StorageType

config = get_config()

class BoardHandler:
    def __init__(self):
        self.factory = AdapterFactory()
        self.storage = self.factory.get_storage_adapter(StorageType(config.storage_type))

    def create_board(self, board_cmd: BoardCommand):
        """Create a new board"""
        try:
            board_data = {
                'workspace_id': board_cmd.workspace_id,
                'name': board_cmd.name,
                'description': board_cmd.description,
                'users': board_cmd.users or [],
                'owner_id': board_cmd.owner,
                'labels': board_cmd.labels or [],
                'status': 'active',
                'is_deleted': False
            }
            
            board = self.storage.create_board(board_data)
            if not board:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create board"
                )
            
            # Convert tuple to dictionary if needed
            if isinstance(board, tuple):
                board_dict = {
                    'board_id': board[0],
                    'workspace_id': board[1],
                    'name': board[2],
                    'description': board[3],
                    'owner_id': board[4],
                    'labels': board[5],
                    'users': board[6],
                    'status': board[7],
                    'is_deleted': board[8],
                    'created_at': board[9],
                    'updated_at': board[10]
                }
                board = board_dict
                
            return BoardDtoMapper.map_to_board_dto_mapper(board)
        except Exception as e:
            logger.error(f"Error creating board: {e}")
            raise HTTPException(status_code=500, detail="Failed to create board")

    def update_board(self, board_cmd: BoardUpdateCommand):
        """Update an existing board"""
        try:
            # Get existing board
            board = self.storage.get_board_by_id(board_cmd.board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

            # Prepare update data
            update_data = {}
            if board_cmd.name:
                update_data['name'] = board_cmd.name
            if board_cmd.description:
                update_data['description'] = board_cmd.description
            if board_cmd.users is not None:
                update_data['users'] = board_cmd.users
            if board_cmd.labels is not None:
                update_data['labels'] = board_cmd.labels

            if update_data:
                updated_board = self.storage.update_board(board_cmd.board_id, update_data)
                if not updated_board:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to update board"
                    )
                return BoardDtoMapper.map_to_board_dto_mapper(updated_board)
            return BoardDtoMapper.map_to_board_dto_mapper(board)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error updating board: {e}")
            raise HTTPException(status_code=500, detail="Failed to update board")

    def delete_board(self, board_cmd: BoardDeleteCommand):
        """Soft delete a board"""
        try:
            # Check if board exists and user is owner
            board = self.storage.get_board_by_id(board_cmd.board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            if board.get('owner_id') != board_cmd.owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this board"
                )

            success = self.storage.delete_board(board_cmd.board_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to delete board"
                )
            return BoardDtoMapper.map_to_board_dto_mapper(board)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error deleting board: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete board")

    def get_board(self, board_id: str, user_id: str):
        """Get a board by ID"""
        try:
            board = self.storage.get_board_by_id(board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            # Check if user has access to the board
            if user_id not in board.get('users', []) and board.get('owner_id') != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this board"
                )
            
            return BoardDtoMapper.map_to_board_dto_mapper(board)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting board: {e}")
            raise HTTPException(status_code=500, detail="Failed to get board")

    def list_boards(self, workspace_id: str, user_id: str):
        """List all boards in a workspace that the user has access to"""
        try:
            boards = self.storage.list_boards_by_workspace(workspace_id, user_id)
            return [BoardDtoMapper.map_to_board_dto_mapper(board) for board in boards]
        except Exception as e:
            logger.error(f"Error listing boards: {e}")
            raise HTTPException(status_code=500, detail="Failed to list boards")

    def get_board_with_tasks(self, board_id: str, user_id: str):
        """Get a board and its tasks"""
        try:
            board = self.storage.get_board_by_id(board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            if user_id not in board.get('users', []) and board.get('owner_id') != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this board"
                )

            tasks = self.storage.get_board_tasks(board_id)
            return (
                BoardDtoMapper.map_to_board_dto_mapper(board),
                tasks
            )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error getting board with tasks: {e}")
            raise HTTPException(status_code=500, detail="Failed to get board with tasks")

    def add_user_to_board(self, board_id: str, owner_id: str, user_id: str):
        """Add a user to a board"""
        try:
            board = self.storage.get_board_by_id(board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            if board.get('owner_id') != owner_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this board"
                )

            success = self.storage.add_user_to_board(board_id, user_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to add user to board"
                )
            
            updated_board = self.storage.get_board_by_id(board_id)
            return BoardDtoMapper.map_to_board_dto_mapper(updated_board)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error adding user to board: {e}")
            raise HTTPException(status_code=500, detail="Failed to add user to board")

    def remove_user_from_board(self, board_id: str, owner_id: str, user_id: str):
        """Remove a user from a board"""
        try:
            board = self.storage.get_board_by_id(board_id)
            if not board:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
            
            if board.get('owner_id') != owner_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this board"
                )

            success = self.storage.remove_user_from_board(board_id, user_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to remove user from board"
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error removing user from board: {e}")
            raise HTTPException(status_code=500, detail="Failed to remove user from board")