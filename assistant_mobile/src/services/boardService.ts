import api from './api';

export interface BoardItem {
  item_id: string;
  board_id: string;
  title: string;
  description?: string;
  status?: string;
  assignee_id?: string;
  due_date?: string;
  properties?: Record<string, any>;
  order?: number;
}

export interface Board {
  board_id: string;
  workspace_id: string;
  title: string;
  description?: string;
  properties?: Record<string, any>;
  views?: Record<string, any>[];
  is_template: boolean;
  is_public: boolean;
  items?: BoardItem[];
}

export const getBoards = async (workspaceId: string): Promise<Board[]> => {
  const res = await api.get(`/api/v1/workspaces/${workspaceId}/boards`);
  return res.data;
};

export const getBoard = async (workspaceId: string, boardId: string): Promise<Board> => {
  const res = await api.get(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`);
  return res.data;
};

export const createBoard = async (workspaceId: string, board: Partial<Board>): Promise<Board> => {
  const res = await api.post(`/api/v1/workspaces/${workspaceId}/boards`, board);
  return res.data;
};

export const updateBoard = async (workspaceId: string, boardId: string, board: Partial<Board>): Promise<Board> => {
  const res = await api.put(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, board);
  return res.data;
};

export const deleteBoard = async (workspaceId: string, boardId: string): Promise<void> => {
  await api.delete(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`);
};

export const getBoardItems = async (workspaceId: string, boardId: string): Promise<BoardItem[]> => {
  const res = await api.get(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/items`);
  return res.data;
};

export const createBoardItem = async (workspaceId: string, boardId: string, item: Partial<BoardItem>): Promise<BoardItem> => {
  const res = await api.post(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/items`, item);
  return res.data;
};

export const updateBoardItem = async (workspaceId: string, boardId: string, itemId: string, item: Partial<BoardItem>): Promise<BoardItem> => {
  const res = await api.put(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`, item);
  return res.data;
};

export const deleteBoardItem = async (workspaceId: string, boardId: string, itemId: string): Promise<void> => {
  await api.delete(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`);
}; 