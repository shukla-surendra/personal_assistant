import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './slices/workspaceSlice';
import memberReducer from './slices/memberSlice';

const store = configureStore({
  reducer: {
    workspaces: workspaceReducer,
    members: memberReducer,
  },
});

export default store; 