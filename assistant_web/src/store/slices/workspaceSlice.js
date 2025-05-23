import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Async thunks
export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchWorkspaces',
  async () => {
    const response = await axios.get(`${API_URL}/workspaces`);
    return response.data;
  }
);

export const createWorkspace = createAsyncThunk(
  'workspaces/createWorkspace',
  async (workspaceData) => {
    const response = await axios.post(`${API_URL}/workspaces`, workspaceData);
    return response.data;
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspaces/updateWorkspace',
  async ({ id, ...workspaceData }) => {
    const response = await axios.put(`${API_URL}/workspaces/${id}`, workspaceData);
    return response.data;
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspaces/deleteWorkspace',
  async (id) => {
    await axios.delete(`${API_URL}/workspaces/${id}`);
    return id;
  }
);

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState: {
    workspaces: [],
    selectedWorkspace: null,
    loading: false,
    error: null,
  },
  reducers: {
    selectWorkspace: (state, action) => {
      console.log('selectWorkspace reducer called with:', action.payload);
      // Ensure we're creating a new object to trigger state update
      state.selectedWorkspace = { ...action.payload };
      console.log('Updated state:', state);
    },
    clearSelectedWorkspace: (state) => {
      state.selectedWorkspace = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch workspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create workspace
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.push(action.payload);
      })
      // Update workspace
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const index = state.workspaces.findIndex((w) => w.workspace_id === action.payload.workspace_id);
        if (index !== -1) {
          state.workspaces[index] = action.payload;
          // Update selected workspace if it was the one being updated
          if (state.selectedWorkspace?.workspace_id === action.payload.workspace_id) {
            state.selectedWorkspace = action.payload;
          }
        }
      })
      // Delete workspace
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w.workspace_id !== action.payload);
        // Clear selected workspace if it was deleted
        if (state.selectedWorkspace?.workspace_id === action.payload) {
          state.selectedWorkspace = null;
        }
      });
  },
});

export const { selectWorkspace, clearSelectedWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer; 