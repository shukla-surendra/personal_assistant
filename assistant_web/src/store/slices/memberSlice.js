import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Async thunks
export const fetchMembers = createAsyncThunk(
  'members/fetchMembers',
  async () => {
    const response = await axios.get(`${API_URL}/members`);
    return response.data;
  }
);

export const addMember = createAsyncThunk(
  'members/addMember',
  async ({ workspaceId, email, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/workspaces/${workspaceId}/members`, {
        email,
        role,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add member');
    }
  }
);

export const removeMember = createAsyncThunk(
  'members/removeMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/members/${memberId}`);
      return memberId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to remove member');
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'members/updateMemberRole',
  async ({ memberId, role }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/members/${memberId}`, { role });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update member role');
    }
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
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError } = memberSlice.actions;
export default memberSlice.reducer; 