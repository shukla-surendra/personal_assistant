import { configureStore } from '@reduxjs/toolkit'
import taskReducer from './slices/tasks';
import userReducer from './slices/users';
import workspaceReducer from './slices/workspaces';
import authReducer from './slices/auth';
import settingsReducer from './slices/settings';
import contactsReducer from './slices/crm/contactsSlice';
import dealsReducer from './slices/crm/dealsSlice';
import activitiesReducer from './slices/crm/activitiesSlice';
import chatReducer from './slices/chatSlice';
import boardsReducer from './slices/boards';
import pagesReducer from './slices/pages';
import remindersReducer from './slices/reminders';
import databasesReducer from './slices/databases';
import reportsReducer from './slices/reports';
import notificationsReducer from './slices/notifications';
import epicsReducer from './slices/epics';
import sprintsReducer from './slices/sprints';

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
    chat: chatReducer,
    boards: boardsReducer,
    pages: pagesReducer,
    reminders: remindersReducer,
    databases: databasesReducer,
    reports: reportsReducer,
    notifications: notificationsReducer,
    epics: epicsReducer,
    sprints: sprintsReducer
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;