import { configureStore } from '@reduxjs/toolkit'
import taskReducer from './slices/tasks';
import userReducer from './slices/users';
import workspaceReducer from './slices/workspaces';
import authReducer from './slices/auth';
import settingsReducer from './slices/settings';
import contactsReducer from './slices/crm/contactsSlice';
import dealsReducer from './slices/crm/dealsSlice';
import activitiesReducer from './slices/crm/activitiesSlice';
import memberReducer from './slices/members';
import chatReducer from './slices/chatSlice';
import boardsReducer from './slices/boards';
import pagesReducer from './slices/pages';
import remindersReducer from './slices/reminders';
import databasesReducer from './slices/databases';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
    users: userReducer,
    workspaces: workspaceReducer,
    auth: authReducer,
    settings: settingsReducer,
    contacts: contactsReducer,
    deals: dealsReducer,
    activities: activitiesReducer,
    members: memberReducer,
    chat: chatReducer,
    boards: boardsReducer,
    pages: pagesReducer,
    reminders: remindersReducer,
    databases: databasesReducer
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;