import { configureStore } from '@reduxjs/toolkit'
import taskReducer from './slices/tasks';
import userReducer from './slices/users';
import workspaceReducer from './slices/workspaces'
import authReducer from './slices/auth';
import settingsReducer from './slices/settings';

const reducer = {
  tasks: taskReducer,
  users: userReducer,
  workspaces: workspaceReducer,
  auth: authReducer,
  settings: settingsReducer
}

const store = configureStore({
  reducer: reducer,
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export default store;