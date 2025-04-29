// src/slices/workspaces.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import WorkspaceService from "../services/WorkspaceService";

const initialState = { workspaces: [{ workspace_id: "demo_id", workspace_name: 'Initial Workspace'}] };

export const retrieveWorkspaces = createAsyncThunk(
  "workspaces/retrieve",
  async () => {
    const [memberRes, ownRes] = await Promise.all([
      WorkspaceService.getAll(),
      WorkspaceService.getOwn()
    ]);
    // Combine and deduplicate by workspace_id
    const all = [...memberRes.data, ...ownRes.data];
    const unique = Array.from(new Map(all.map(ws => [ws.workspace_id, ws])).values());
    return unique;
  }
);

const workspaceSlice = createSlice({
  name: "workspaces",
  initialState,
  extraReducers: {
    [retrieveWorkspaces.fulfilled]: (state, action) => {
      state.workspaces = [...action.payload];
    }
  },
});

const { reducer } = workspaceSlice;
export default reducer;