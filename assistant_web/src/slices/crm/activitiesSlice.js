import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../../services/crmService';

export const fetchActivities = createAsyncThunk(
    'activities/fetchActivities',
    async (workspaceId) => {
        const response = await getActivities(workspaceId);
        return response;
    }
);

export const addActivity = createAsyncThunk(
    'activities/addActivity',
    async ({ workspaceId, activityData }) => {
        const response = await createActivity(workspaceId, activityData);
        return response;
    }
);

export const editActivity = createAsyncThunk(
    'activities/editActivity',
    async ({ activityId, activityData }) => {
        const response = await updateActivity(activityId, activityData);
        return response;
    }
);

export const removeActivity = createAsyncThunk(
    'activities/removeActivity',
    async (activityId) => {
        await deleteActivity(activityId);
        return activityId;
    }
);

const activitiesSlice = createSlice({
    name: 'activities',
    initialState: {
        activities: [],
        loading: false,
        error: null,
        filters: {
            type: '',
            dateRange: null,
            tags: []
        },
        sort: {
            field: 'date',
            direction: 'desc'
        }
    },
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setSort: (state, action) => {
            state.sort = action.payload;
        },
        clearFilters: (state) => {
            state.filters = {
                type: '',
                dateRange: null,
                tags: []
            };
        },
        setActivities: (state, action) => {
            state.activities = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchActivities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActivities.fulfilled, (state, action) => {
                state.loading = false;
                state.activities = action.payload;
            })
            .addCase(fetchActivities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(addActivity.fulfilled, (state, action) => {
                state.activities.push(action.payload);
            })
            .addCase(editActivity.fulfilled, (state, action) => {
                const index = state.activities.findIndex(a => a.activity_id === action.payload.activity_id);
                if (index !== -1) {
                    state.activities[index] = action.payload;
                }
            })
            .addCase(removeActivity.fulfilled, (state, action) => {
                state.activities = state.activities.filter(a => a.activity_id !== action.payload);
            });
    }
});

export const { setFilters, setSort, clearFilters, setActivities } = activitiesSlice.actions;
export default activitiesSlice.reducer; 