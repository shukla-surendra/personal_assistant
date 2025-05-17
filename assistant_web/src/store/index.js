import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import workspaceReducer from '../slices/workspaceSlice';
import contactsReducer from '../slices/crm/contactsSlice';
import dealsReducer from '../slices/crm/dealsSlice';
import activitiesReducer from '../slices/crm/activitiesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        workspaces: workspaceReducer,
        contacts: contactsReducer,
        deals: dealsReducer,
        activities: activitiesReducer
    }
});

export default store; 