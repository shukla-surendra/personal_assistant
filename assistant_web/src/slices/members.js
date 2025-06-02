import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BACKEND_URL } from '../http-common';

// Async thunks
export const fetchMembers = createAsyncThunk(
  'members/fetchMembers',
  async (workspaceId) => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/workspaces/${workspaceId}/members`);
    return response.data;
  }
);

export const addMember = createAsyncThunk(
  'members/addMember',
  async ({ workspaceId, email, role }) => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/workspaces/${workspaceId}/members`, {
      email,
      role
    });
    return response.data;
  }
);

export const removeMember = createAsyncThunk(
  'members/removeMember',
  async ({ workspaceId, memberId }) => {
    await axios.delete(`${BACKEND_URL}/api/v1/workspaces/${workspaceId}/members/${memberId}`);
    return memberId;
  }
);

export const updateMemberRole = createAsyncThunk(
  'members/updateMemberRole',
  async ({ workspaceId, memberId, role }) => {
    const response = await axios.patch(`${BACKEND_URL}/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
      role
    });
    return response.data;
  }
);

const memberSlice = createSlice({
  name: 'members',
  initialState: {
    members: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch members
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
        state.error = null;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add member
      .addCase(addMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members.push(action.payload);
        state.error = null;
      })
      .addCase(addMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Remove member
      .addCase(removeMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members = state.members.filter((m) => m.id !== action.payload);
        state.error = null;
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Update member role
      .addCase(updateMemberRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.members.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearError } = memberSlice.actions;
export default memberSlice.reducer; 